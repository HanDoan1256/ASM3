import { useEffect, useMemo, useState } from "react";

import { Card } from "../components/Card";
import { PageContainer } from "../components/PageContainer";
import { PageHeader } from "../components/PageHeader";
import { StatusBadge } from "../components/StatusBadge";
import { Timeline } from "../components/Timeline";
import { fleetService } from "../services/fleetService";
import { orderService } from "../services/orderService";
import { trackingService } from "../services/trackingService";
import type { Allocation } from "../types/fleet";
import type { OrderDetailResponse } from "../types/order";
import type { ShipmentRecord, TrackingHistoryItem, TrackingRecord } from "../types/tracking";

export function ShipmentTrackingPage() {
  const [searchCode, setSearchCode] = useState<string>("");
  const [activeTrackId, setActiveTrackId] = useState<string | null>(null);
  const [allocation, setAllocation] = useState<Allocation | null>(null);
  const [tracking, setTracking] = useState<TrackingRecord | null>(null);
  const [shipment, setShipment] = useState<ShipmentRecord | null>(null);
  const [history, setHistory] = useState<TrackingHistoryItem[]>([]);
  const [orderDetails, setOrderDetails] = useState<OrderDetailResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isPendingOrder, setIsPendingOrder] = useState<boolean>(false);
  const isStaff = localStorage.getItem("smartfm_principal_type") === "staff";

  // Initial load: Fetch active shipment or fleet allocation
  useEffect(() => {
    if (!isStaff) {
      orderService
        .listOrders()
        .then(async (orders) => {
          for (const order of orders) {
            try {
              const shipmentData = await trackingService.getShipmentByOrder(order.order_id);
              if (shipmentData.track_id) {
                setShipment(shipmentData);
                setOrderDetails(await orderService.getOrderById(order.order_id));
                setActiveTrackId(shipmentData.track_id);
                return;
              }
            } catch {
              continue;
            }
          }
        })
        .catch(() => setShipment(null));
      return;
    }

    fleetService
      .listAllocations()
      .then((allocations) => {
        const firstTracked = allocations.find((item) => item.track_id) ?? allocations[0] ?? null;
        setAllocation(firstTracked);
        if (firstTracked?.track_id) {
          setActiveTrackId(firstTracked.track_id);
        }
      })
      .catch(() => setAllocation(null));
  }, [isStaff]);

  // Fetch tracking metadata and historical checkpoints whenever activeTrackId changes
  useEffect(() => {
    if (!activeTrackId) {
      setTracking(null);
      setHistory([]);
      return;
    }

    setLoading(true);
    setError(null);
    setIsPendingOrder(false);

    trackingService
      .getTracking(activeTrackId)
      .then((data) => {
        setTracking(data);
        return trackingService.getTrackingHistory(activeTrackId);
      })
      .then((historyData) => setHistory(historyData))
      .catch((err: any) => {
        if (err?.response?.status === 404 && isPendingOrder) {
          setTracking(null);
          setHistory([]);
        } else {
          setError(err.response?.data?.detail || "Shipment tracking number not found.");
          setTracking(null);
          setHistory([]);
        }
      })
      .finally(() => setLoading(false));
  }, [activeTrackId, isPendingOrder]);

  // Handle manual tracking code or Order ID lookup
  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = searchCode.trim();
    if (!trimmed) return;

    setLoading(true);
    setError(null);
    setIsPendingOrder(false);
    setTracking(null);
    setHistory([]);
    setShipment(null);
    setOrderDetails(null);

    let resolvedTrackId = trimmed;

    try {
      // If user inputs an Order ID (starting with ORD-)
      if (trimmed.toUpperCase().startsWith("ORD-")) {
        try {
          const detail = await orderService.getOrderById(trimmed);
          setOrderDetails(detail);
        } catch {
          // Ignore
        }

        try {
          const shipmentData = await trackingService.getShipmentByOrder(trimmed);
          if (shipmentData?.track_id) {
            resolvedTrackId = shipmentData.track_id;
            setShipment(shipmentData);
            setActiveTrackId(resolvedTrackId);
            return;
          }
        } catch {
          // If no shipment/tracking is found, the order is still pending approval/allocation
          setIsPendingOrder(true);
          setActiveTrackId(null);
          setLoading(false);
          return;
        }
      }

      setActiveTrackId(resolvedTrackId);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to resolve shipment tracking details.");
    } finally {
      setLoading(false);
    }
  };

  const timelineItems = useMemo(
    () =>
      isPendingOrder
        ? [
            {
              active: true,
              description: "This order is currently pending staff review, approval, and vehicle resource allocation.",
              time: "Awaiting Processing",
              title: "Order Awaiting Approval",
            },
          ]
        : history.length > 0
        ? history.map((item, index) => ({
            active: index === 0,
            description: item.next_location
              ? `Origin / Current Location: ${item.current_location} → Processing Hub: ${item.next_location}`
              : `Current Location: ${item.current_location}`,
            time: new Date(item.recorded_at).toLocaleString(),
            title: item.status ?? "Tracking Event",
          }))
        : [
            {
              active: true,
              description: "No tracking history is currently recorded for this shipment.",
              time: "-",
              title: "No Updates",
            },
          ],
    [history, isPendingOrder]
  );

  const senderFullAddress = useMemo(() => {
    return (
      [orderDetails?.sender_address?.street, orderDetails?.sender_address?.district, orderDetails?.sender_address?.city]
        .filter(Boolean)
        .join(", ") || "-"
    );
  }, [orderDetails]);

  const receiverFullAddress = useMemo(() => {
    return (
      [orderDetails?.receiver_address?.street, orderDetails?.receiver_address?.district, orderDetails?.receiver_address?.city]
        .filter(Boolean)
        .join(", ") || "-"
    );
  }, [orderDetails]);

  return (
    <PageContainer>
      <PageHeader
        eyebrow="Shipment Tracking"
        description="Monitor automated package transit milestones and delivery checkpoints updated via fleet allocation."
        title="SmartFM Tracking"
      />

      {/* Manual Search Bar */}
      <Card className="mb-6 p-4">
        <form onSubmit={handleSearchSubmit} className="flex gap-3">
          <input
            type="text"
            className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="Enter Tracking Number (e.g., TRK-...) or Order ID (e.g., ORD-...)"
            value={searchCode}
            onChange={(e) => setSearchCode(e.target.value)}
          />
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Searching..." : "Track Package"}
          </button>
        </form>
        {error && <p className="mt-2 text-xs font-medium text-red-600">{error}</p>}
      </Card>

      {(activeTrackId || isPendingOrder || orderDetails) && (
        <div className="space-y-6">
          {/* Active Status Card */}
          <Card className="p-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-sm text-text-secondary">Tracking Number / Status</p>
                <h3 className="mt-1 text-2xl font-semibold text-text-primary">
                  {isPendingOrder ? "Order Awaiting Processing" : (tracking?.track_id ?? activeTrackId ?? "Not assigned")}
                </h3>
              </div>
              <StatusBadge status={isPendingOrder ? "Pending Approval" : (tracking?.status ?? shipment?.shipment_status ?? orderDetails?.order.order_status ?? "Pending")} />
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-sm text-text-secondary">Current Location / Status</p>
                <p className="mt-1 font-semibold text-text-primary">
                  {isPendingOrder ? "Awaiting staff review and vehicle allocation" : (tracking?.current_location ?? senderFullAddress)}
                </p>
              </div>
              <div>
                <p className="text-sm text-text-secondary">Estimated Delivery</p>
                <p className="mt-1 font-semibold text-text-primary">
                  {orderDetails?.service_option?.estimated_days !== undefined && orderDetails.order.created_at
                    ? new Date(
                        new Date(orderDetails.order.created_at).setDate(
                          new Date(orderDetails.order.created_at).getDate() + orderDetails.service_option.estimated_days
                        )
                      )
                        .toISOString()
                        .slice(0, 10)
                    : "-"}
                </p>
              </div>
            </div>
          </Card>

          {/* Shipment Metadata Details */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-text-primary">Shipment Details</h3>
            <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <p className="text-sm text-text-secondary">Sender Location (Origin)</p>
                <p className="mt-1 text-sm font-medium text-text-primary">{senderFullAddress}</p>
              </div>
              <div>
                <p className="text-sm text-text-secondary">Receiver Location (Destination)</p>
                <p className="mt-1 text-sm font-medium text-text-primary">{receiverFullAddress}</p>
              </div>
              <div>
                <p className="text-sm text-text-secondary">Service Option</p>
                <p className="mt-1 text-sm font-semibold text-text-primary">
                  {orderDetails?.service_option?.service_name ?? "-"}
                </p>
              </div>
              <div>
                <p className="text-sm text-text-secondary">Assigned Fleet Vehicle</p>
                <p className="mt-1 text-sm font-semibold text-text-primary">
                  {shipment?.vehicle_id ?? allocation?.vehicle_id ?? "Not Assigned Yet"}
                </p>
              </div>
            </div>
          </Card>

          {/* Tracking Timeline */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-text-primary">Automated Tracking History</h3>
            <div className="mt-5">
              <Timeline items={timelineItems} />
            </div>
          </Card>
        </div>
      )}
    </PageContainer>
  );
}