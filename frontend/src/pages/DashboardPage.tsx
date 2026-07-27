import { useEffect, useState } from "react";

import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { EmptyState } from "../components/EmptyState";
import { Icon } from "../components/Icon";
import { InfoCard } from "../components/InfoCard";
import { PageContainer } from "../components/PageContainer";
import { PageHeader } from "../components/PageHeader";
import { StatCard } from "../components/StatCard";
import { StatusBadge } from "../components/StatusBadge";
import { Table } from "../components/Table";
import { Timeline } from "../components/Timeline";
import { orderService } from "../services/orderService";
import { reportService } from "../services/reportService";
import type { OrderSummary } from "../types/order";
import type { DashboardOverview } from "../types/report";

const monthlyOrders = [42, 55, 49, 68, 74, 88];
const statusSplit = [
  { label: "In Transit", value: "44%" },
  { label: "Pending", value: "28%" },
  { label: "Delivered", value: "21%" },
  { label: "Cancelled", value: "7%" },
];

export function DashboardPage() {
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [overview, setOverview] = useState<DashboardOverview | null>(null);

  useEffect(() => {
    orderService.listOrders().then(setOrders).catch(() => setOrders([]));
    reportService.getDashboardOverview().then(setOverview).catch(() => setOverview(null));
  }, []);

  return (
    <PageContainer>
      <PageHeader
        actions={[
          { icon: "add", label: "Create Order", to: "/orders/create", variant: "primary" },
          { icon: "pin_drop", label: "Track Shipment", to: "/shipments/tracking", variant: "secondary" },
          { icon: "assignment_ind", label: "Assign Vehicle", to: "/fleet", variant: "secondary" },
        ]}
        eyebrow="Operations Overview"
        description="Monitor logistics performance, shipment movement, and fleet activity from a clean enterprise dashboard designed for operational teams."
        title="Dashboard"
      />

      <div className="grid gap-4 xl:grid-cols-4">
        <StatCard icon="receipt_long" label="Total Orders" note="Current orders in the system" value={String(overview?.total_orders ?? 0)} />
        <StatCard
          icon="local_shipping"
          label="Active Shipments"
          note="Shipments currently moving"
          value={String(overview?.active_shipments ?? 0)}
        />
        <StatCard
          icon="airport_shuttle"
          label="Fleet Available"
          note="Vehicles ready for assignment"
          value={String(overview?.fleet_available ?? 0)}
        />
        <StatCard
          icon="payments"
          label="Revenue"
          note="Recognized payment total"
          value={`$${(overview?.revenue ?? 0).toFixed(2)}`}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <Card className="p-6">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-semibold text-text-primary">Monthly Orders</h3>
              <p className="mt-1 text-sm text-text-secondary">Order volume over the last six months</p>
            </div>
            <Button variant="ghost">View Report</Button>
          </div>

          <div className="flex h-[250px] items-end gap-4">
            {monthlyOrders.map((value, index) => (
              <div key={index} className="flex flex-1 flex-col items-center gap-3">
                <div className="w-full rounded-t-3xl bg-brand-100 p-1">
                  <div className="rounded-t-3xl bg-brand-500 transition hover:bg-brand-700" style={{ height: `${value * 2}px` }} />
                </div>
                <span className="text-sm text-text-secondary">M{index + 1}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-2xl font-semibold text-text-primary">Shipment Status</h3>
          <p className="mt-1 text-sm text-text-secondary">Current operational distribution</p>
          <div className="mt-8 grid gap-4">
            {statusSplit.map((item) => (
              <div key={item.label} className="flex items-center justify-between rounded-2xl bg-brand-50 px-4 py-4">
                <div className="flex items-center gap-3">
                  <div className="h-3 w-3 rounded-full bg-brand-500" />
                  <span className="text-sm font-medium text-text-primary">{item.label}</span>
                </div>
                <span className="text-sm font-semibold text-text-primary">{item.value}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        {orders.length > 0 ? (
          <Table
            columns={[
              { header: "Order", render: (order) => order.order_id },
              { header: "Customer", render: (order) => order.customer_name },
              { header: "Receiver", render: (order) => order.receiver_name ?? "-" },
              { header: "Service", render: (order) => order.service_name ?? "-" },
              { header: "Status", render: (order) => <StatusBadge status={order.order_status} /> },
            ]}
            data={orders.slice(0, 5)}
            emptyMessage="No recent orders available."
          />
        ) : (
          <EmptyState
            actionLabel="Create First Order"
            actionTo="/orders/create"
            description="Start by creating an order to see recent operational activity reflected in the dashboard."
            title="No recent orders"
          />
        )}

        <Card className="p-6">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-semibold text-text-primary">Recent Shipment Activity</h3>
              <p className="mt-1 text-sm text-text-secondary">Status updates from the fulfillment chain</p>
            </div>
            <Icon className="text-brand-500" name="history" />
          </div>
          <Timeline
            items={[
              {
                active: true,
                description: "Shipment SFM-20260726-4821 left the regional sorting hub.",
                time: "Jul 26, 2026 08:40",
                title: "In Transit",
              },
              {
                description: "Vehicle V-204 and driver assignment confirmed.",
                time: "Jul 26, 2026 07:15",
                title: "Vehicle Assigned",
              },
              {
                description: "Payment verified and warehouse pick-up prepared.",
                time: "Jul 25, 2026 17:25",
                title: "Order Confirmed",
              },
            ]}
          />
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <InfoCard helper="Start a new freight request from intake to quote." icon="add_box" label="Quick Action" value="Create Order" />
        <InfoCard helper="Review milestones, ETA, and fulfillment progress." icon="pin_drop" label="Quick Action" value="Track Shipment" />
        <InfoCard helper="Match available vehicles and drivers to delivery demand." icon="assignment_ind" label="Quick Action" value="Assign Vehicle" />
      </div>
    </PageContainer>
  );
}
