// Schema เดิมของโปรเจคนี้ (ไม่ใช่ schema ของตัวอย่าง)
// orders(order_id, quantity, order_status, created_at, customer_id)
export interface OrderModel {
    order_id: number;
    customer_id: number;
    quantity: number;
    order_status: string;
    created_at: string;
}

export interface CreateOrderModel {
    customer_id: number;
    quantity: number;
    order_status?: string;
}

export interface UpdateOrderModel {
    customer_id?: number;
    quantity?: number;
    order_status?: string;
}
