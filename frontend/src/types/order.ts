import type { Address, AddressCreatePayload } from "./account";

export interface ServiceOption {
  service_id: number;
  service_name: string;
  description?: string | null;
  base_price: number;
  estimated_days: number;
}

export interface PackageDetails {
  package_id: number;
  weight: number;
  height: number;
  length: number;
  width: number;
  package_type: string;
  fragile?: boolean | null;
  is_sealed?: boolean | null;
  inspection_policy?: string | null;
  security_level?: string | null;
  declared_value?: number | null;
}

export interface PackageDetailsCreatePayload {
  weight: number;
  height: number;
  length: number;
  width: number;
  package_type: string;
  fragile?: boolean;
  is_sealed?: boolean;
  inspection_policy?: string;
  security_level?: string;
  declared_value?: number;
}

export interface OrderSummary {
  order_id: string;
  customer_id: string;
  customer_name: string;
  service_name?: string | null;
  receiver_name?: string | null;
  destination?: string | null;
  total_price: number;
  order_status: string;
  created_at: string;
}

export interface ShipmentOrder {
  order_id: string;
  customer_id: string;
  service_id?: number | null;
  sender_address_id?: number | null;
  receiver_address_id?: number | null;
  package_id?: number | null;
  approved_by?: string | null;
  total_price: number;
  order_status: string;
  created_at: string;
  notes?: string | null;
}

export interface OrderDetailResponse {
  order: ShipmentOrder;
  service_option?: ServiceOption | null;
  sender_address?: Address | null;
  receiver_address?: Address | null;
  package_details?: PackageDetails | null;
}

export interface OrderFormState {
  sender_name: string;
  sender_phone: string;
  pickup_street: string;
  pickup_district: string;
  pickup_city: string;
  pickup_postal_code: string;
  receiver_name: string;
  receiver_phone: string;
  delivery_street: string;
  delivery_district: string;
  delivery_city: string;
  delivery_postal_code: string;
  weight: number;
  dimensions: string;
  package_type: string;
  declared_value: number;
  service_id: number;
  notes: string;
}

export interface OrderCreatePayload {
  customer_id: string;
  service_id: number;
  sender_address: AddressCreatePayload;
  receiver_address: AddressCreatePayload;
  package_details: PackageDetailsCreatePayload;
  notes?: string;
}

