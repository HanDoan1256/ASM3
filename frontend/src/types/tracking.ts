export interface TrackingHistoryItem {
  track_history_id: number;
  track_id: string;
  current_location: string;
  next_location?: string | null;
  status?: string | null;
  recorded_at: string;
}

export interface TrackingRecord {
  track_id: string;
  current_location: string;
  last_updated?: string | null;
  status?: string | null;
  history?: TrackingHistoryItem[]; // Added for timeline rendering
}

export interface TrackingStatusUpdatePayload {
  status: string;
  current_location: string;
  next_location?: string | null;
}

export interface ShipmentRecord {
  shipment_id: number;
  order_id: string;
  vehicle_id?: string | null;
  driver_id?: string | null;
  route_id?: number | null;
  track_id?: string | null;
  departure_time?: string | null;
  arrival_time?: string | null;
  shipment_status: string;
}
