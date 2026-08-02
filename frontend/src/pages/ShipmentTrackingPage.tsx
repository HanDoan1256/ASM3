import { useEffect, useMemo, useState } from "react";

import { Card } from "../components/Card";
import { MapCard } from "../components/MapCard";
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

const TRACKING_STATUS_OPTIONS = ["Created", "Assigned", "Picked Up", "In Transit", "Delivered"];

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
  const [eventStatus, setEventStatus] = useState<string>(TRACKING_STATUS_OPTIONS[0]);
  const [eventLocation, setEventLocation] = useState<string>("");
  const [eventNextLocation, setEventNextLocation] = useState<string>("");
  const [eventSubmitting, setEventSubmitting] = useState<boolean>(false);
  const [eventError, setEventError] = useState<string | null>(null);
  const isStaff = localStorage.getItem("smartfm_principal_type") === "staff";

  // Initial load: Fetch default allocation if no manual search code is active
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

  // Fetch tracking and history whenever activeTrackId changes
  useEffect(() => {
    if (!activeTrackId) {
      setTracking(null);
      setHistory([]);
      return;
    }

    setLoading(true);
    setError(null);

    trackingService
      .getTracking(activeTrackId)
      .then((data) => {
        setTracking(data);
        return trackingService.getTrackingHistory(activeTrackId);
      })
      .then((historyData) => setHistory(historyData))
      .catch((err: any) => {
        setError(err.response?.data?.detail || "Shipment tracking number not found.");
        setTracking(null);
        setHistory([]);
      })
      .finally(() => setLoading(false));
  }, [activeTrackId]);

  // Fetch linked order/shipment details if allocation exists
  useEffect(() => {
    if (!allocation || !isStaff) return;

    trackingService.getShipment(allocation.shipment_id).then(setShipment).catch(() => setShipment(null));
    orderService.getOrderById(allocation.order_id).then(setOrderDetails).catch(() => setOrderDetails(null));
  }, [allocation, isStaff]);

  // Handle manual tracking lookup
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = searchCode.trim();
    if (!trimmed) return;

    setActiveTrackId(trimmed);
  };

  // Staff-only: post a new tracking event for the active track ID.
  const handleAddEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTrackId || !eventLocation.trim()) return;

    setEventSubmitting(true);
    setEventError(null);
    try {
      const updated = await trackingService.updateTrackingEvent(activeTrackId, {
        status: eventStatus,
        current_location: eventLocation.trim(),
        next_location: eventNextLocation.trim() || undefined,
      });
      setTracking(updated);
      const historyData = await trackingService.getTrackingHistory(activeTrackId);
      setHistory(historyData);
      setEventLocation("");
      setEventNextLocation("");
    } catch (err: any) {
      setEventError(err.response?.data?.detail || "Failed to add tracking event.");
    } finally {
      setEventSubmitting(false);
    }
  };

  const timelineItems = useMemo(
    () =>
      history.length > 0
        ? history.map((item, index) => ({
            active: index === 0,
            description: item.next_location
              ? `Shipment progressed from ${item.current_location} toward ${item.next_location}.`
              : `Shipment recorded at ${item.current_location}.`,
            time: new Date(item.recorded_at).toLocaleString(),
            title: item.status ?? "Tracking Update",
          }))
        : [
            {
              active: true,
              description: "No tracking history is currently available for the selected shipment.",
              time: "-",
              title: "No Updates",
            },
          ],
    [history, tracking?.status]
  );

  return (
    <PageContainer>
      <PageHeader
        eyebrow="Shipment Tracking"
        description="Track freight progress through timeline events, current delivery state, and a route map placeholder aligned with the provided logistics tracking inspiration."
        title="SmartFM Tracking"
      />

      {/* Manual Search Bar */}
      <Card className="mb-6 p-4">
        <form onSubmit={handleSearchSubmit} className="flex gap-3">
          <input
            type="text"
            className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="Enter Tracking Number (e.g., TRK-100234)..."
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

      <div className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="space-y-4">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-text-secondary">Tracking Number</p>
                <h3 className="mt-2 text-2xl font-semibold text-text-primary">
                  {tracking?.track_id ?? activeTrackId ?? "Not assigned"}
                </h3>
              </div>
              <StatusBadge status={tracking?.status ?? shipment?.shipment_status ?? "Pending"} />
            </div>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-sm text-text-secondary">Current Status</p>
                <p className="mt-1 font-semibold text-text-primary">
                  {tracking?.current_location ?? "Tracking unavailable"}
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

          <Card className="p-6">
            <h3 className="text-lg font-semibold text-text-primary">Shipment Details</h3>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-sm text-text-secondary">Origin</p>
                <p className="mt-1 text-sm leading-6 text-text-primary">
                  {[orderDetails?.sender_address?.street, orderDetails?.sender_address?.city]
                    .filter(Boolean)
                    .join(", ") || "-"}
                </p>
              </div>
              <div>
                <p className="text-sm text-text-secondary">Destination</p>
                <p className="mt-1 text-sm leading-6 text-text-primary">
                  {[orderDetails?.receiver_address?.street, orderDetails?.receiver_address?.city]
                    .filter(Boolean)
                    .join(", ") || "-"}
                </p>
              </div>
              <div>
                <p className="text-sm text-text-secondary">Service Type</p>
                <p className="mt-1 text-sm font-semibold text-text-primary">
                  {orderDetails?.service_option?.service_name ?? "-"}
                </p>
              </div>
              <div>
                <p className="text-sm text-text-secondary">Vehicle</p>
                <p className="mt-1 text-sm font-semibold text-text-primary">
                  {shipment?.vehicle_id ?? allocation?.vehicle_id ?? "-"}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold text-text-primary">Tracking History</h3>
            <div className="mt-5">
              <Timeline items={timelineItems} />
            </div>
          </Card>

          {isStaff && activeTrackId && (
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-text-primary">Add Tracking Event</h3>
              <p className="mt-1 text-sm text-text-secondary">Post a new status update for {activeTrackId}.</p>
              <form onSubmit={handleAddEvent} className="mt-4 grid gap-3 sm:grid-cols-2">
                <select
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  value={eventStatus}
                  onChange={(e) => setEventStatus(e.target.value)}
                >
                  {TRACKING_STATUS_OPTIONS.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="Current location"
                  value={eventLocation}
                  onChange={(e) => setEventLocation(e.target.value)}
                  required
                />
                <input
                  type="text"
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:col-span-2"
                  placeholder="Next location (optional)"
                  value={eventNextLocation}
                  onChange={(e) => setEventNextLocation(e.target.value)}
                />
                <button
                  type="submit"
                  disabled={eventSubmitting}
                  className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:opacity-50 sm:col-span-2"
                >
                  {eventSubmitting ? "Submitting..." : "Add Event"}
                </button>
              </form>
              {eventError && <p className="mt-2 text-xs font-medium text-red-600">{eventError}</p>}
            </Card>
          )}
        </div>

        <MapCard title="Route Overview" />
      </div>
    </PageContainer>
  );
}
