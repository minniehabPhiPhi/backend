export interface CustomerPostRequest {
  first_name: string;
  last_name: string;
  phone_number: string;
  latitude: number;
  longitude: number;
  address_detail: string;
}

export interface CustomerRow {
  customer_id: number;
  first_name: string;
  last_name: string;
  phone_number: string;
  latitude: number | string;
  longitude: number | string;
  address_detail: string;
  distance_km?: number;
}

export interface CustomerId {
  customer_id: number;
}
