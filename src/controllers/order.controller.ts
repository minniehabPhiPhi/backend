import type { Request, Response } from "express";
import { CustomerRepository } from "../repositories/customer.repository";
import { OrderRepository } from "../repositories/order.repository";
import type { OrderPostRequest } from "../models/order.model";

export async function getOrders(_req: Request, res: Response) {
  res.status(200).json(await OrderRepository.findAll());
}

export async function getNearbyOrders(req: Request, res: Response) {
  const lat = parseFloat(req.query.lat as string);
  const lng = parseFloat(req.query.lng as string);
  const radius = parseFloat((req.query.radius as string) || "2");
  if (isNaN(lat) || isNaN(lng)) {
    res.status(400).json({ error: "Missing required query params: lat, lng" });
    return;
  }
  res.status(200).json(await OrderRepository.findNearby(lat, lng, radius));
}

export async function seedOrders(_req: Request, res: Response) {
  const customers = await CustomerRepository.findIds();
  if (customers.length === 0) {
    res.status(400).json({ error: "No customers found in database" });
    return;
  }
  const totalOrders = Math.floor(Math.random() * 11) + 20;
  const values: Array<[number, string, number]> = [];
  for (let i = 0; i < totalOrders; i++) {
    const customer = customers[Math.floor(Math.random() * customers.length)]!;
    const quantity = Math.floor(Math.random() * 3) + 1;
    values.push([quantity, "pending", customer.customer_id]);
  }
  const result = await OrderRepository.createMany(values);
  res.status(201).json({
    affected_row: result.affectedRows,
    message: `Successfully seeded ${totalOrders} orders`,
  });
}

export async function createOrder(req: Request<{}, unknown, OrderPostRequest>, res: Response) {
  const result = await OrderRepository.create(req.body);
  res.status(201).json({ affected_row: result.affectedRows, last_idx: result.insertId });
}

export async function updateOrder(req: Request<{ id: string }, unknown, OrderPostRequest>, res: Response) {
  const result = await OrderRepository.update(req.params.id, req.body);
  res.status(200).json({ affected_row: result.affectedRows });
}

export async function deleteOrder(req: Request<{ id: string }>, res: Response) {
  const result = await OrderRepository.delete(req.params.id);
  res.status(200).json({ affected_row: result.affectedRows });
}

export async function clearOrders(_req: Request, res: Response) {
  const result = await OrderRepository.deleteAll();
  res.status(200).json({ affected_row: result.affectedRows, message: "All orders cleared" });
}
