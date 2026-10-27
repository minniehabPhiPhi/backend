import type { CustomerRow } from "./customer.model";

export interface OrderPostRequest {
  quantity: number;
  customer_id: number;
  order_status?: string;
}

export interface OrderRow extends CustomerRow {
  order_id: number;
  quantity: number;
  order_status: string;
  created_at: Date;
}
