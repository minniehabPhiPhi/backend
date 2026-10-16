// Schema เดิมของโปรเจคนี้ (ไม่ใช่ schema ของตัวอย่าง)
export interface CustomerModel {
    customer_id: number;
    first_name: string;
    last_name: string;
    phone_number: string;
    latitude: string | number;
    longitude: string | number;
    address_detail: string;
}

export interface CreateCustomerModel {
    first_name: string;
    last_name: string;
    phone_number: string;
    latitude: number | string;
    longitude: number | string;
    address_detail: string;
}

export interface UpdateCustomerModel {
    first_name: string;
    last_name: string;
    phone_number: string;
    latitude: number | string;
    longitude: number | string;
    address_detail: string;
}
