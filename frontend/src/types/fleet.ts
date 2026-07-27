export interface Branch {
  branch_id: string;
  branch_name: string;
  address: string;
  phone?: string | null;
}

export interface Vehicle {
  vehicle_id: string;
  plate_number: string;
  vehicle_type?: string | null;
  capacity: number;
  status?: string | null;
  branch_id?: string | null;
}

export interface Driver {
  driver_id: string;
  full_name: string;
  phone: string;
  license_number: string;
  status?: string | null;
  branch_id?: string | null;
}

export interface Allocation {
  shipment_id: number;
  order_id: string;
  vehicle_id?: string | null;
  driver_id?: string | null;
  route_id?: number | null;
  track_id?: string | null;
  shipment_status: string;
}

