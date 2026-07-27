import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import { Card } from "../components/Card";
import { InfoCard } from "../components/InfoCard";
import { PageContainer } from "../components/PageContainer";
import { PageHeader } from "../components/PageHeader";
import { StatusBadge } from "../components/StatusBadge";
import { Timeline } from "../components/Timeline";
import { fleetService } from "../services/fleetService";
import { orderService } from "../services/orderService";
import { paymentService } from "../services/paymentService";
import type { Allocation } from "../types/fleet";
import type { OrderDetailResponse } from "../types/order";
import type { Invoice } from "../types/payment";

function formatAddress(value?: {
  street: string;
  district: string;
  city: string;
  postal_code?: string | null;
} | null) {
  if (!value) {
    return "-";
  }
  return [value.street, value.district, value.city, value.postal_code].filter(Boolean).join(", ");
}

function formatEstimatedDelivery(createdAt?: string, estimatedDays?: number) {
  if (!createdAt || estimatedDays === undefined) {
    return "-";
  }
  const date = new Date(createdAt);
  date.setDate(date.getDate() + estimatedDays);
  return date.toISOString().slice(0, 10);
}

export function OrderDetailPage() {
  const { orderId = "" } = useParams();
  const [orderDetails, setOrderDetails] = useState<OrderDetailResponse | null>(null);
  const [allocation, setAllocation] = useState<Allocation | null>(null);
  const [invoice, setInvoice] = useState<Invoice | null>(null);

  useEffect(() => {
    if (!orderId) {
      return;
    }
    orderService.getOrderById(orderId).then(setOrderDetails).catch(() => setOrderDetails(null));
    paymentService.getInvoiceByOrder(orderId).then(setInvoice).catch(() => setInvoice(null));
    fleetService
      .listAllocations()
      .then((allocations) => setAllocation(allocations.find((item) => item.order_id === orderId) ?? null))
      .catch(() => setAllocation(null));
  }, [orderId]);

  const order = orderDetails?.order;
  const packageDetails = orderDetails?.package_details;
  const serviceOption = orderDetails?.service_option;

  return (
    <PageContainer>
      <PageHeader
        eyebrow="Order Detail"
        description="Review customer, package, billing, and status information through a structured internal order layout."
        title={`Order ${orderId}`}
      />

      <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-4">
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-text-primary">Order Information</h3>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <InfoCard helper="System generated" icon="qr_code_2" label="Tracking Number" value={allocation?.track_id ?? orderId} />
              <InfoCard helper="Current workflow phase" icon="local_shipping" label="Shipment Status" value={allocation?.shipment_status ?? order?.order_status ?? "Not Found"} />
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold text-text-primary">Customer Information</h3>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-sm text-text-secondary">Sender</p>
                <p className="mt-1 font-semibold text-text-primary">{orderDetails?.sender_address?.receiver_name ?? "-"}</p>
              </div>
              <div>
                <p className="text-sm text-text-secondary">Receiver</p>
                <p className="mt-1 font-semibold text-text-primary">{orderDetails?.receiver_address?.receiver_name ?? "-"}</p>
              </div>
              <div>
                <p className="text-sm text-text-secondary">Pickup Address</p>
                <p className="mt-1 text-sm leading-6 text-text-primary">{formatAddress(orderDetails?.sender_address)}</p>
              </div>
              <div>
                <p className="text-sm text-text-secondary">Delivery Address</p>
                <p className="mt-1 text-sm leading-6 text-text-primary">{formatAddress(orderDetails?.receiver_address)}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold text-text-primary">Package Information</h3>
            <div className="mt-5 grid gap-4 md:grid-cols-3">
              <div>
                <p className="text-sm text-text-secondary">Weight</p>
                <p className="mt-1 font-semibold text-text-primary">{packageDetails?.weight ?? "-"} kg</p>
              </div>
              <div>
                <p className="text-sm text-text-secondary">Dimensions</p>
                <p className="mt-1 font-semibold text-text-primary">
                  {packageDetails ? `${packageDetails.length} x ${packageDetails.width} x ${packageDetails.height}` : "-"}
                </p>
              </div>
              <div>
                <p className="text-sm text-text-secondary">Service Type</p>
                <p className="mt-1 font-semibold text-text-primary">{serviceOption?.service_name ?? "-"}</p>
              </div>
            </div>
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-text-primary">Invoice Summary</h3>
            <div className="mt-5 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-text-secondary">Estimated Shipping Cost</span>
                <span className="text-sm font-semibold text-text-primary">${(invoice?.total ?? order?.total_price ?? 0).toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-text-secondary">Estimated Delivery</span>
                <span className="text-sm font-semibold text-text-primary">
                  {formatEstimatedDelivery(order?.created_at, serviceOption?.estimated_days)}
                </span>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-text-primary">Shipment Status</h3>
              <StatusBadge status={allocation?.shipment_status ?? order?.order_status ?? "Pending"} />
            </div>
            <div className="mt-5">
              <Timeline
                items={[
                  {
                    active: true,
                    description: "Order created and acknowledged by SmartFM.",
                    time: "Jul 26, 2026 09:00",
                    title: "Order Received",
                  },
                  {
                    description: "Shipment prepared for dispatch assignment.",
                    time: "Jul 26, 2026 10:30",
                    title: "Planning",
                  },
                  {
                    description: "Vehicle routing and dispatch confirmation pending.",
                    time: "Jul 26, 2026 12:00",
                    title: "Dispatch Queue",
                  },
                ]}
              />
            </div>
          </Card>
        </div>
      </div>
    </PageContainer>
  );
}
