import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { EmptyState } from "../components/EmptyState";
import { Icon } from "../components/Icon";
import { Modal } from "../components/Modal";
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
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const isStaff = localStorage.getItem("smartfm_principal_type") === "staff";

  const navigate = useNavigate();
  const [isGuestModalOpen, setIsGuestModalOpen] = useState(false);
  const isLoggedIn = !!localStorage.getItem("smartfm_access_token");

  const handleProtectedAction = (callback?: () => void) => {
    if (!isLoggedIn) {
      setIsGuestModalOpen(true);
    } else if (callback) {
      callback();
    }
  };

  useEffect(() => {
    if (!isLoggedIn) return;

    orderService.listOrders().then(setOrders).catch(() => setOrders([]));
    if (isStaff) {
      reportService.getDashboardOverview().then(setOverview).catch(() => setOverview(null));
    }
  }, [isStaff, isLoggedIn]);

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
        actions={
          isStaff
            ? []
            : [
                { icon: "add", label: "Create Order", onClick: () => handleProtectedAction(() => navigate("/orders/create")), variant: "primary" },
                { icon: "pin_drop", label: "Track Shipment", onClick: () => handleProtectedAction(() => navigate("/shipments/tracking")), variant: "secondary" },
                { icon: "assignment_ind", label: "Assign Vehicle", onClick: () => handleProtectedAction(() => navigate("/fleet")), variant: "secondary" },
              ]
        }
        eyebrow="Operations Overview"
        description="Monitor logistics performance, shipment movement, and fleet activity from a clean enterprise dashboard designed for operational teams."
        title="Dashboard"
      />

      {/* 4 Cards chính với hiệu ứng Hover hiển thị nút bấm tùy biến theo Role */}
      <div className={`grid gap-4 grid-cols-1 sm:grid-cols-2 ${isStaff ? "xl:grid-cols-4" : "xl:grid-cols-3"}`}>
        
        {/* 1. Orders Processing (Staff) / Total Orders (Customer) */}
        <div className="group relative overflow-hidden rounded-3xl transition-all duration-300">
          <StatCard 
            icon="receipt_long" 
            label={isStaff ? "Orders Processing" : "Total Orders"} 
            note="Orders visible to this account" 
            value={String(displayedOverview?.total_orders ?? 0)} 
          />
          <div className="absolute inset-x-0 bottom-0 translate-y-full transform bg-gradient-to-t from-brand-600/95 to-brand-500/90 p-3 backdrop-blur-md transition-transform duration-300 group-hover:translate-y-0 flex justify-center">
            <button
              onClick={() => handleProtectedAction(() => navigate(isStaff ? "/orders" : "/orders/create"))}
              className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-xs font-bold text-brand-600 shadow-md transition hover:bg-gray-100"
            >
              {isStaff ? "Approve Order" : "Create Order"}
            </button>
          </div>
        </div>

        {/* 2. Active Shipments */}
        <div className="group relative overflow-hidden rounded-3xl transition-all duration-300">
          <StatCard
            icon="local_shipping"
            label="Active Shipments"
            note="Shipments currently moving"
            value={String(displayedOverview?.active_shipments ?? 0)}
          />
          <div className="absolute inset-x-0 bottom-0 translate-y-full transform bg-gradient-to-t from-brand-600/95 to-brand-500/90 p-3 backdrop-blur-md transition-transform duration-300 group-hover:translate-y-0 flex justify-center">
            <button
              onClick={() => handleProtectedAction(() => navigate(isStaff ? "/shipments" : "/shipments/tracking"))}
              className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-xs font-bold text-brand-600 shadow-md transition hover:bg-gray-100"
            >
              Track Shipment
            </button>
          </div>
        </div>

        {/* 3. Fleet Available (Chỉ hiện khi là Staff) */}
        {isStaff && (
          <div className="group relative overflow-hidden rounded-3xl transition-all duration-300">
            <StatCard
              icon="airport_shuttle"
              label="Fleet Availability"
              note="Vehicles ready for assignment"
              value={String(displayedOverview?.fleet_available ?? 0)}
            />
            <div className="absolute inset-x-0 bottom-0 translate-y-full transform bg-gradient-to-t from-brand-600/95 to-brand-500/90 p-3 backdrop-blur-md transition-transform duration-300 group-hover:translate-y-0 flex justify-center">
              <button
                onClick={() => handleProtectedAction(() => navigate("/fleet"))}
                className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-xs font-bold text-brand-600 shadow-md transition hover:bg-gray-100"
              >
                Assign Vehicle
              </button>
            </div>
          </div>
        )}

        {/* 4. Revenue */}
        <div className="group relative overflow-hidden rounded-3xl transition-all duration-300">
          <StatCard
            icon="payments"
            label="Revenue"
            note="Recognized payment total"
            value={`₫${(displayedOverview?.revenue ?? 0).toLocaleString("vi-VN")}`}
          />
          <div className="absolute inset-x-0 bottom-0 translate-y-full transform bg-gradient-to-t from-brand-600/95 to-brand-500/90 p-3 backdrop-blur-md transition-transform duration-300 group-hover:translate-y-0 flex justify-center">
            <button
              onClick={() => handleProtectedAction(() => navigate(isStaff ? "/payments" : "/payments"))}
              className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-xs font-bold text-brand-600 shadow-md transition hover:bg-gray-100"
            >
              Payment
            </button>
          </div>
        </div>

      </div>

      <div className="grid gap-6 grid-cols-1 xl:grid-cols-[1.2fr_0.8fr] mt-6">
        <Card className="p-6 overflow-hidden">
          <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <h3 className="text-xl sm:text-2xl font-semibold text-text-primary">Monthly Orders</h3>
              <p className="mt-1 text-sm text-text-secondary">Order volume over the last six months</p>
            </div>
            <Button variant="ghost" onClick={() => handleProtectedAction(() => setIsReportModalOpen(true))}>
              View Report
            </Button>
          </div>

          <div className="flex h-[250px] items-end gap-2 sm:gap-4 overflow-x-auto pb-2">
            {monthlyOrders.map((bucket, index) => (
              <div key={index} className="flex flex-1 flex-col items-center gap-3 min-w-[36px]">
                <div className="w-full rounded-t-3xl bg-brand-100 p-1 flex justify-center">
                  <div
                    className="w-full rounded-t-3xl bg-brand-500 transition hover:bg-brand-700"
                    style={{ height: `${Math.max(bucket.value * 20, 4)}px` }}
                  />
                </div>
                <span className="text-xs sm:text-sm text-text-secondary whitespace-nowrap">{bucket.label}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-xl sm:text-2xl font-semibold text-text-primary">Shipment Status</h3>
          <p className="mt-1 text-sm text-text-secondary">Current operational distribution</p>
          <div className="mt-8 grid gap-4">
            {statusSplit.length > 0 ? (
              statusSplit.map((item) => (
                <div key={item.label} className="flex items-center justify-between rounded-2xl bg-brand-50 px-4 py-4">
                  <div className="flex items-center gap-3">
                    <div className="h-3 w-3 rounded-full bg-brand-500 shrink-0" />
                    <span className="text-sm font-medium text-text-primary truncate">{item.label}</span>
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

      <div className="grid gap-6 grid-cols-1 xl:grid-cols-[1.15fr_0.85fr] mt-6">
        <div className="overflow-x-auto">
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
            <div onClick={() => !isLoggedIn && handleProtectedAction()}>
              <EmptyState
                actionLabel="Create First Order"
                actionTo={isLoggedIn ? "/orders/create" : undefined}
                description="Start by creating an order to see recent operational activity reflected in the dashboard."
                title="No recent orders"
              />
            </div>
          )}
        </div>

        <Card className="p-6">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h3 className="text-xl sm:text-2xl font-semibold text-text-primary">Recent Shipment Activity</h3>
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

      {/* ĐÃ XÓA HOÀN TOÀN KHỐI 3 Ô INFO CARD Ở DƯỚI CÙNG CHO CẢ CUSTOMER LẪN STAFF */}

      {/* Modal Popup View Report */}
      <Modal isOpen={isReportModalOpen} onClose={() => setIsReportModalOpen(false)} title="Monthly Orders Report">
        <div className="space-y-4">
          <p className="text-sm text-text-secondary">
            Danh sách số lượng đơn hàng chi tiết theo từng tháng:
          </p>
          <div className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-gray-50">
            {monthlyOrders.map((bucket, index) => (
              <div key={index} className="flex items-center justify-between px-5 py-3.5">
                <span className="text-sm font-medium text-text-primary">Tháng {bucket.label}</span>
                <span className="rounded-xl bg-brand-100 px-3 py-1 text-sm font-bold text-brand-700">
                  {bucket.value} đơn hàng
                </span>
              </div>
            ))}
          </div>
          <div className="flex justify-end pt-2">
            <Button onClick={() => setIsReportModalOpen(false)}>Đóng</Button>
          </div>
        </div>
      </Modal>

      {/* POPUP YÊU CẦU ĐĂNG NHẬP / GUEST MODAL */}
      <Modal
        isOpen={isGuestModalOpen}
        onClose={() => setIsGuestModalOpen(false)}
        title="Authentication Required"
      >
        <div className="py-4 text-center space-y-5">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 shadow-inner">
            <Icon className="text-3xl" name="lock" />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-bold text-text-primary">Sign in required</h3>
            <p className="text-sm text-text-secondary max-w-xs mx-auto leading-relaxed">
              Please sign in or register an account to perform actions and view live data.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 pt-3">
            <Button variant="secondary" onClick={() => setIsGuestModalOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                setIsGuestModalOpen(false);
                navigate("/login");
              }}
            >
              Go to Login
            </Button>
          </div>
        </div>
      </Modal>

    </PageContainer>
  );
}