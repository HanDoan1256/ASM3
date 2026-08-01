import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { InfoCard } from "../components/InfoCard";
import { PageContainer } from "../components/PageContainer";
import { PageHeader } from "../components/PageHeader";
import { StatusBadge } from "../components/StatusBadge";
import { Timeline } from "../components/Timeline";
import { fleetService } from "../services/fleetService";
import { orderService } from "../services/orderService";
import { paymentService } from "../services/paymentService";
import { trackingService } from "../services/trackingService";
import type { Allocation } from "../types/fleet";
import type { OrderDetailResponse } from "../types/order";
import type { Invoice } from "../types/payment";
import type { TrackingHistoryItem } from "../types/tracking";

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
  const [history, setHistory] = useState<TrackingHistoryItem[]>([]);
  const [actionMessage, setActionMessage] = useState("");
  const [actionPending, setActionPending] = useState(false);
  const principalType = localStorage.getItem("smartfm_principal_type");
  const isStaff = principalType === "staff";

  const refresh = () => {
    if (!orderId) {
      return;
    }
    orderService.getOrderById(orderId).then(setOrderDetails).catch(() => setOrderDetails(null));
    paymentService.getInvoiceByOrder(orderId).then(setInvoice).catch(() => setInvoice(null));
    fleetService
      .listAllocations()
      .then((allocations) => {
        const found = allocations.find((item) => item.order_id === orderId) ?? null;
        setAllocation(found);
        if (found?.track_id) {
          trackingService.getTrackingHistory(found.track_id).then(setHistory).catch(() => setHistory([]));
        }
      })
      .catch(() => setAllocation(null));
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  const order = orderDetails?.order;
  const packageDetails = orderDetails?.package_details;
  const serviceOption = orderDetails?.service_option;

  const handleApprove = async () => {
    setActionPending(true);
    setActionMessage("");
    try {
      await orderService.approveOrder(orderId);
      setActionMessage("Order approved.");
      refresh();
    } catch (error) {
      const detail =
        (error as { response?: { data?: { detail?: string } } })?.response?.data?.detail ?? "Approval failed.";
      setActionMessage(detail);
    } finally {
      setActionPending(false);
    }
  };

  const handleAllocate = async () => {
    setActionPending(true);
    setActionMessage("");
    try {
      await fleetService.allocateOrder(orderId);
      setActionMessage("Vehicle and driver allocated.");
      refresh();
    } catch (error) {
      const detail =
        (error as { response?: { data?: { detail?: string } } })?.response?.data?.detail ?? "Allocation failed.";
      setActionMessage(detail);
    } finally {
      setActionPending(false);
    }
  };

  const handleRetryPayment = async () => {
    if (!invoice) return;
    setActionPending(true);
    setActionMessage("");
    try {
      await paymentService.confirmPayment({
        invoice_id: invoice.invoice_id,
        payment_method: invoice.payment_method ?? "SENDER_TRANSFER",
        payment_date: new Date().toISOString(),
        amount: invoice.total,
        status: "Completed",
      });
      setActionMessage("Payment confirmed.");
      refresh();
    } catch (error) {
      const detail =
        (error as { response?: { data?: { detail?: string } } })?.response?.data?.detail ?? "Payment confirmation failed.";
      setActionMessage(detail);
    } finally {
      setActionPending(false);
    }
  };

  const timelineItems =
    history.length > 0
      ? history
          .slice()
          .reverse()
          .map((item) => ({
            active: true,
            description: item.next_location ? `Heading to ${item.next_location}` : "Checkpoint recorded",
            time: new Date(item.recorded_at).toLocaleString(),
            title: item.current_location,
          }))
      : [
          {
            active: true,
            description: "Order created and acknowledged by SmartFM.",
            time: order?.created_at ? new Date(order.created_at).toLocaleString() : "-",
            title: "Order Received",
          },
        ];

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
            {isStaff && (
              <div className="mt-5 flex flex-wrap gap-2">
                {order?.order_status === "Pending" && (
                  <Button disabled={actionPending} onClick={handleApprove}>
                    Approve Order
                  </Button>
                )}
                {order?.order_status === "Approved" && !allocation?.vehicle_id && (
                  <Button disabled={actionPending} onClick={handleAllocate}>
                    Allocate Vehicle & Driver
                  </Button>
                )}
                {actionMessage && <span className="self-center text-sm text-text-secondary">{actionMessage}</span>}
              </div>
            )}
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
                <span className="text-sm text-text-secondary">Total</span>
                <span className="text-sm font-semibold text-text-primary">
                  ₫{(invoice?.total ?? order?.total_price ?? 0).toLocaleString("vi-VN")}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-text-secondary">Payment Method</span>
                <span className="text-sm font-semibold text-text-primary">{invoice?.payment_method ?? "-"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-text-secondary">Payment Status</span>
                <StatusBadge status={invoice?.status ?? "Pending"} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-text-secondary">Estimated Delivery</span>
                <span className="text-sm font-semibold text-text-primary">
                  {formatEstimatedDelivery(order?.created_at, serviceOption?.estimated_days)}
                </span>
              </div>
              {invoice?.status === "Pending" && invoice?.payment_method === "SENDER_TRANSFER" && (
                <Button disabled={actionPending} onClick={handleRetryPayment}>
                  Confirm Bank Transfer Payment
                </Button>
              )}
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-text-primary">Shipment Status</h3>
              <StatusBadge status={allocation?.shipment_status ?? order?.order_status ?? "Pending"} />
            </div>
            <div className="mt-5">
              <Timeline items={timelineItems} />
            </div>
          </Card>
        </div>
      </div>
    </PageContainer>
  );
}
