import { uploadDirectory } from "./setup";
import assert from "node:assert/strict";
import { once } from "node:events";
import { readdirSync, unlinkSync, rmdirSync } from "node:fs";
import type { Server } from "node:http";
import path from "node:path";
import { before, after, test } from "node:test";
import app from "../app";
import { conn } from "../config/database";
import type { CustomerPostRequest } from "../models/customer.model";
import type { OrderPostRequest } from "../models/order.model";
import { verifyToken } from "../utils/jwt";

let server: Server;
let baseUrl: string;

before(async () => {
  server = app.listen(0, "127.0.0.1");
  await once(server, "listening");
  const address = server.address();
  assert.ok(address && typeof address !== "string");
  baseUrl = `http://127.0.0.1:${address.port}`;
});

after(async () => {
  if (server) {
    await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  }
  await conn.end();
  for (const filename of readdirSync(uploadDirectory)) {
    unlinkSync(path.join(uploadDirectory, filename));
  }
  rmdirSync(uploadDirectory);
});

async function request(url: string, method = "GET", body?: unknown) {
  return fetch(`${baseUrl}${url}`, {
    method,
    ...(body === undefined ? {} : {
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),
  });
}

const customer: CustomerPostRequest = {
  first_name: "Somchai", last_name: "Test", phone_number: "0800000000",
  latitude: 16.18, longitude: 103.3, address_detail: "MSU",
};

test("customer list and search keep response rows and parameterized search", async (t) => {
  const rows = [{ customer_id: 7, ...customer }];
  const query = t.mock.method(conn, "query", async () => [rows, []]);
  let response = await request("/api/customers");
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), rows);
  response = await request("/api/customers?search=Somchai");
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), rows);
  assert.deepEqual(query.mock.calls[1]!.arguments[1], ["%Somchai%", "%Somchai%"]);
});

type MutationCase = [
  name: string,
  url: string,
  method: string,
  body: CustomerPostRequest | Partial<OrderPostRequest> | undefined,
  status: number,
  expected: { affected_row: number; last_idx?: number; message?: string },
  parameters: unknown[] | undefined,
];

const mutations: MutationCase[] = [
  ["create customer", "/api/customers", "POST", customer, 201,
    { affected_row: 1, last_idx: 17 }, Object.values(customer)],
  ["update customer", "/api/customers/7", "PUT", customer, 200,
    { affected_row: 1 }, [...Object.values(customer), "7"]],
  ["delete customer", "/api/customers/7", "DELETE", undefined, 200,
    { affected_row: 1 }, ["7"]],
  ["create order with default status", "/api/orders", "POST", { quantity: 2, customer_id: 7 }, 201,
    { affected_row: 1, last_idx: 17 }, [2, "pending", 7]],
  ["create order with explicit status", "/api/orders", "POST", { quantity: 2, customer_id: 7, order_status: "delivered" }, 201,
    { affected_row: 1, last_idx: 17 }, [2, "delivered", 7]],
  ["update order without changing status", "/api/orders/9", "PUT", { quantity: 3 }, 200,
    { affected_row: 1 }, [3, undefined, "9"]],
  ["delete order", "/api/orders/9", "DELETE", undefined, 200,
    { affected_row: 1 }, ["9"]],
  ["clear orders", "/api/orders", "DELETE", undefined, 200,
    { affected_row: 1, message: "All orders cleared" }, undefined],
];

for (const [name, url, method, body, status, expected, parameters] of mutations) {
  test(name, async (t) => {
    const query = t.mock.method(conn, "query", async () => [{ affectedRows: 1, insertId: 17 }, []]);
    const response = await request(url, method, body);
    assert.equal(response.status, status);
    assert.deepEqual(await response.json(), expected);
    assert.equal(query.mock.callCount(), 1);
    assert.deepEqual(query.mock.calls[0]!.arguments[1], parameters);
  });
}

test("order list returns customer data in the existing shape", async (t) => {
  const rows = [{ order_id: 9, quantity: 2, order_status: "pending", customer_id: 7, ...customer }];
  const query = t.mock.method(conn, "query", async () => [rows, []]);
  const response = await request("/api/orders");
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), rows);
  const sql: unknown = query.mock.calls[0]!.arguments[0];
  assert.ok(typeof sql === "string");
  assert.match(sql, /JOIN `customers`/);
});

const nearbyCases: Array<[string, number]> = [["customers", 1], ["orders", 2]];
for (const [resource, defaultRadius] of nearbyCases) {
  test(`${resource} nearby uses coordinates, default radius and explicit radius`, async (t) => {
    const rows = [{ distance_km: 0.5 }];
    const query = t.mock.method(conn, "query", async () => [rows, []]);
    let response = await request(`/api/${resource}/nearby?lat=16.18&lng=103.3`);
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), rows);
    assert.deepEqual(query.mock.calls[0]!.arguments[1], [16.18, 103.3, 16.18, defaultRadius]);
    response = await request(`/api/${resource}/nearby?lat=16.18&lng=103.3&radius=5`);
    assert.equal(response.status, 200);
    assert.deepEqual(query.mock.calls[1]!.arguments[1], [16.18, 103.3, 16.18, 5]);
  });

  test(`${resource} nearby rejects missing coordinates without querying the database`, async (t) => {
    const query = t.mock.method(conn, "query", async () => { throw new Error("Unexpected database query"); });
    const response = await request(`/api/${resource}/nearby?lat=invalid`);
    assert.equal(response.status, 400);
    assert.deepEqual(await response.json(), { error: "Missing required query params: lat, lng" });
    assert.equal(query.mock.callCount(), 0);
  });
}

test("seed rejects an empty customer list", async (t) => {
  const query = t.mock.method(conn, "query", async () => [[], []]);
  const response = await request("/api/orders/seed", "POST", {});
  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), { error: "No customers found in database" });
  assert.equal(query.mock.callCount(), 1);
});

test("seed creates 20-30 pending orders for existing customers", async (t) => {
  const query = t.mock.method(conn, "query", async (sql: string, params?: [Array<[number, string, number]>]) => {
    if (sql.startsWith("SELECT")) return [[{ customer_id: 7 }, { customer_id: 8 }], []];
    assert.ok(params);
    return [{ affectedRows: params[0].length }, []];
  });
  const response = await request("/api/orders/seed", "POST", {});
  assert.equal(response.status, 201);
  const result = await response.json() as { affected_row: number; message: string };
  assert.ok(result.affected_row >= 20 && result.affected_row <= 30);
  assert.equal(result.message, `Successfully seeded ${result.affected_row} orders`);
  const parameters: unknown = query.mock.calls[1]!.arguments[1];
  assert.ok(Array.isArray(parameters));
  const rows = parameters[0] as Array<[number, string, number]>;
  assert.equal(rows.length, result.affected_row);
  for (const [quantity, status, customerId] of rows) {
    assert.ok(quantity >= 1 && quantity <= 3);
    assert.equal(status, "pending");
    assert.ok([7, 8].includes(customerId));
  }
});

test("database rejection reaches the error middleware", async (t) => {
  t.mock.method(conn, "query", async () => { throw new Error("Private database failure"); });
  const response = await request("/api/customers");
  assert.equal(response.status, 500);
  assert.deepEqual(await response.json(), { error: "Internal server error" });
});

test("upload rejects a request without a file", async () => {
  const response = await request("/upload", "POST");
  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), { error: "No file uploaded" });
});

test("uploaded files can be viewed, downloaded and accessed through /uploads", async () => {
  const form = new FormData();
  form.append("file", new Blob(["MVC upload test"], { type: "text/plain" }), "test.txt");
  let response = await fetch(`${baseUrl}/upload`, { method: "POST", body: form });
  assert.equal(response.status, 200);
  const { filename } = await response.json() as { filename: string };
  assert.match(filename, /^[0-9a-f-]{36}\.txt$/);
  for (const url of [`/upload/${filename}`, `/uploads/${filename}`, `/upload/${filename}?download=true`]) {
    response = await request(url);
    assert.equal(response.status, 200);
    assert.equal(await response.text(), "MVC upload test");
    if (url.includes("download=true")) {
      assert.match((response.headers.get("content-disposition") ?? ""), /^attachment;/);
    }
  }
});

test("file paths cannot escape the uploads directory", async () => {
  const response = await request("/upload/..%5Cpackage.json");
  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), { error: "Invalid filename" });
});

test("a missing upload returns 404", async () => {
  const response = await request("/upload/missing.txt");
  assert.equal(response.status, 404);
});

test("test token retains its payload, signature, issuer and lifetime", async () => {
  const response = await request("/testtoken");
  assert.equal(response.status, 200);
  const { token } = await response.json() as { token: string };
  assert.ok(process.env.JWT_SECRET);
  const result = verifyToken(token, process.env.JWT_SECRET);
  assert.equal(result.valid, true);
  assert.ok(result.decoded && typeof result.decoded !== "string");
  assert.equal(result.decoded.username, "Aj.M");
  assert.equal(result.decoded.iss, "CS-MSU");
  assert.ok(typeof result.decoded.exp === "number" && typeof result.decoded.iat === "number");
  assert.equal(result.decoded.exp - result.decoded.iat, 30 * 24 * 60 * 60);
});

test("JWT errors keep their existing response shape", async () => {
  const response = await request("/unknown");
  assert.equal(response.status, 401);
  assert.deepEqual(await response.json(), { message: "No authorization token was found" });
});

test("CORS allows the Angular origin and handles preflight", async () => {
  const response = await fetch(`${baseUrl}/api/customers`, {
    method: "OPTIONS",
    headers: { Origin: "http://localhost:4200", "Access-Control-Request-Method": "POST" },
  });
  assert.equal(response.status, 204);
  assert.equal(response.headers.get("access-control-allow-origin"), "http://localhost:4200");
  assert.match((response.headers.get("access-control-allow-methods") ?? ""), /POST/);
});
