import { createPool } from "mysql2/promise";
import { env } from "./env";

export const conn = createPool(env.database);
