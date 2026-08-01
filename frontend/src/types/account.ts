export interface Customer {
  customer_id: string;
  full_name: string;
  email: string;
  phone?: string | null;
  status: string;
  created_at?: string | null;
}

export interface CustomerUpdatePayload {
  full_name?: string;
  phone?: string;
  status?: string;
}

export interface Address {
  address_id: number;
  customer_id?: string | null;
  receiver_name: string;
  receiver_phone: string;
  street: string;
  district: string;
  city: string;
  postal_code?: string | null;
  is_default?: boolean | null;
}

export interface AddressCreatePayload {
  receiver_name: string;
  receiver_phone: string;
  street: string;
  district: string;
  city: string;
  postal_code?: string;
  is_default?: boolean;
}

export interface AddressUpdatePayload {
  receiver_name?: string;
  receiver_phone?: string;
  street?: string;
  district?: string;
  city?: string;
  postal_code?: string;
  is_default?: boolean;
}
