import { useEffect, useMemo, useState } from "react";

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

export function DashboardPage() {
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [overview, setOverview] = useState<DashboardOverview | null>(null);
  const isStaff = localStorage.getItem("smartfm_principal_type") === "staff";

  useEffect(() => {
    orderService.listOrders().then(setOrders).catch(() => setOrders([]));
    if (isStaff) {
      reportService.getDashboardOverview().then(setOverview).catch(() => setOverview(null));
    }
  }, [isStaff]);

  const customerOverview = useMemo<DashboardOverview>(() => {
    const finalStatuses = new Set(["Delivered", "Cancelled"]);
    return {
      total_orders: orders.length,
      active_shipments: orders.filter((order) => !finalStatuses.has(order.order_status)).length,
      fleet_available: 0,
      revenue: orders.reduce((total, order) => total + order.total_price, 0),
      recent_order_ids: orders.slice(0, 5).map((order) => order.order_id),
    };
  }, [orders]);

  const displayedOverview = isStaff ? overview : customerOverview;

  // Derived from real order data rather than hardcoded sample values.
  const monthlyOrders = useMemo(() => {
    const now = new Date();
    const buckets: { label: string; value: number }[] = [];
    for (let i = 5; i >= 0; i -= 1) {
      const month = new Date(now.getFullYear(), now.getMonth() - i, 1);
      buckets.push({ label: `${month.getMonth() + 1}/${month.getFullYear().toString().slice(2)}`, value: 0 });
    }
    orders.forEach((order) => {
      const created = new Date(order.created_at);
      const monthsAgo =
        (now.getFullYear() - created.getFullYear()) * 12 + (now.getMonth() - created.getMonth());
      if (monthsAgo >= 0 && monthsAgo <= 5) {
        buckets[5 - monthsAgo].value += 1;
      }
    });
    return buckets;
  }, [orders]);

  const statusSplit = useMemo(() => {
    if (orders.length === 0) {
      return [];
    }
    const counts = new Map<string, number>();
    orders.forEach((order) => counts.set(order.order_status, (counts.get(order.order_status) ?? 0) + 1));
    return Array.from(counts.entries()).map(([label, count]) => ({
      label,
      value: `${Math.round((count / orders.length) * 100)}%`,
    }));
  }, [orders]);

  const recentActivity = useMemo(
    () =>
      orders.slice(0, 3).map((order) => ({
        active: true,
        description: `${order.customer_name} - ${order.service_name ?? "Service"} - ₫${order.total_price.toLocaleString("vi-VN")}`,
        time: new Date(order.created_at).toLocaleString(),
        title: `Order ${order.order_id}: ${order.order_status}`,
      })),
    [orders],
  );

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
        <StatCard icon="receipt_long" label="Total Orders" note="Orders visible to this account" value={String(displayedOverview?.total_orders ?? 0)} />
        <StatCard
          icon="local_shipping"
          label="Active Shipments"
          note="Shipments currently moving"
          value={String(displayedOverview?.active_shipments ?? 0)}
        />
        <StatCard
          icon="airport_shuttle"
          label="Fleet Available"
          note="Vehicles ready for assignment"
          value={isStaff ? String(displayedOverview?.fleet_available ?? 0) : "-"}
        />
        <StatCard
          icon="payments"
          label="Revenue"
          note="Recognized payment total"
          value={`₫${(displayedOverview?.revenue ?? 0).toLocaleString("vi-VN")}`}
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
            {monthlyOrders.map((bucket, index) => (
              <div key={index} className="flex flex-1 flex-col items-center gap-3">
                <div className="w-full rounded-t-3xl bg-brand-100 p-1">
                  <div
                    className="rounded-t-3xl bg-brand-500 transition hover:bg-brand-700"
                    style={{ height: `${Math.max(bucket.value * 20, 4)}px` }}
                  />
                </div>
                <span className="text-sm text-text-secondary">{bucket.label}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-2xl font-semibold text-text-primary">Shipment Status</h3>
          <p className="mt-1 text-sm text-text-secondary">Current operational distribution</p>
          <div className="mt-8 grid gap-4">
            {statusSplit.length > 0 ? (
              statusSplit.map((item) => (
                <div key={item.label} className="flex items-center justify-between rounded-2xl bg-brand-50 px-4 py-4">
                  <div className="flex items-center gap-3">
                    <div className="h-3 w-3 rounded-full bg-brand-500" />
                    <span className="text-sm font-medium text-text-primary">{item.label}</span>
                  </div>
                  <span className="text-sm font-semibold text-text-primary">{item.value}</span>
                </div>
              ))
            ) : (
              <p className="text-sm text-text-secondary">No orders yet.</p>
            )}
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
          {recentActivity.length > 0 ? (
            <Timeline items={recentActivity} />
          ) : (
            <p className="text-sm text-text-secondary">No recent activity yet.</p>
          )}
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
