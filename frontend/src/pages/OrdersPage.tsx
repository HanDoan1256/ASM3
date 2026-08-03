import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { EmptyState } from "../components/EmptyState";
import { PageContainer } from "../components/PageContainer";
import { PageHeader } from "../components/PageHeader";
import { Pagination } from "../components/Pagination";
import { SearchBar } from "../components/SearchBar";
import { StatusBadge } from "../components/StatusBadge";
import { Table } from "../components/Table";
import { orderService } from "../services/orderService";
import type { OrderSummary } from "../types/order";

export function OrdersPage() {
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  
  // Kiểm tra xem tài khoản đang đăng nhập có phải là staff hay không (nếu vẫn cần dùng ở chỗ khác)
  const isStaff = localStorage.getItem("smartfm_principal_type") === "staff";

  useEffect(() => {
    orderService.listOrders().then(setOrders).catch(() => setOrders([]));
  }, []);

  return (
    <PageContainer>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <PageHeader
          eyebrow="Orders"
          description="Manage freight orders in a structured operational table with shipment status, customer references, and direct access to order details."
          title="Orders"
        />
        
        {/* CẢ CUSTOMER VÀ STAFF ĐỀU THẤY NÚT NÀY */}
        <Link
          className="inline-flex shrink-0 items-center gap-2 rounded-2xl bg-brand-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-600"
          to="/orders/create"
        >
          Create New Order
        </Link>
      </div>

      {orders.length > 0 ? (
        <>
          <Table
            columns={[
              {
                header: "Order ID",
                render: (order) => (
                  <div>
                    <p className="font-semibold text-text-primary">{order.order_id}</p>
                    <p className="mt-1 text-text-secondary">Customer #{order.customer_id}</p>
                  </div>
                ),
              },
              { header: "Customer", render: (order) => order.customer_name },
              { header: "Destination", render: (order) => order.destination ?? "-" },
              { header: "Service", render: (order) => order.service_name ?? "-" },
              { header: "Created", render: (order) => new Date(order.created_at).toISOString().slice(0, 10) },
              { header: "Status", render: (order) => <StatusBadge status={order.order_status} /> },
              {
                header: "View",
                render: (order) => (
                  <Link className="font-semibold text-brand-500" to={`/orders/${order.order_id}`}>
                    Open
                  </Link>
                ),
              },
            ]}
            data={orders}
          />
          <Pagination currentPage={1} totalPages={3} />
        </>
      ) : (
        <EmptyState
          actionLabel="Create Order"
          actionTo="/orders/create"
          description="Once orders are submitted through the create order flow, they will appear here for review and follow-up."
          title="No orders available"
        />
      )}
    </PageContainer>
  );
}