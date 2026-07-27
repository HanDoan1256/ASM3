export interface DashboardOverview {
  total_orders: number;
  active_shipments: number;
  fleet_available: number;
  revenue: number;
  recent_order_ids: string[];
}

export interface ReportRecord {
  report_id: number;
  generated_by?: string | null;
  report_type: string;
  generated_at: string;
  content?: string | null;
}

