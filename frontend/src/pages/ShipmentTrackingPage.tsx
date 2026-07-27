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

export function ShipmentTrackingPage() {
  const [allocation, setAllocation] = useState<Allocation | null>(null);
  const [tracking, setTracking] = useState<TrackingRecord | null>(null);
  const [shipment, setShipment] = useState<ShipmentRecord | null>(null);
  const [history, setHistory] = useState<TrackingHistoryItem[]>([]);
  const [orderDetails, setOrderDetails] = useState<OrderDetailResponse | null>(null);

  useEffect(() => {
    fleetService
      .listAllocations()
      .then((allocations) => {
        const firstTracked = allocations.find((item) => item.track_id) ?? allocations[0] ?? null;
        setAllocation(firstTracked);
      })
      .catch(() => setAllocation(null));
  }, []);

  useEffect(() => {
    if (!allocation) {
      return;
    }

    if (allocation.track_id) {
      trackingService.getTracking(allocation.track_id).then(setTracking).catch(() => setTracking(null));
      trackingService.getTrackingHistory(allocation.track_id).then(setHistory).catch(() => setHistory([]));
    } else {
      setTracking(null);
      setHistory([]);
    }

    trackingService.getShipment(allocation.shipment_id).then(setShipment).catch(() => setShipment(null));
    orderService.getOrderById(allocation.order_id).then(setOrderDetails).catch(() => setOrderDetails(null));
  }, [allocation]);

  const timelineItems = useMemo(
    () =>
      history.length > 0
        ? history.map((item, index) => ({
            active: index === 0,
            description: item.next_location
              ? `Shipment progressed from ${item.current_location} toward ${item.next_location}.`
              : `Shipment recorded at ${item.current_location}.`,
            time: new Date(item.recorded_at).toLocaleString(),
            title: tracking?.status ?? "Tracking Update",
          }))
        : [
            {
              active: true,
              description: "No tracking history is currently available for the selected shipment.",
              time: "-",
              title: "No Updates",
            },
          ],
    [history, tracking?.status],
  );

  return (
    <PageContainer>
      <PageHeader
        eyebrow="Shipment Tracking"
        description="Track freight progress through timeline events, current delivery state, and a route map placeholder aligned with the provided logistics tracking inspiration."
        title="SmartFM Tracking"
      />

      <div className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="space-y-4">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-text-secondary">Tracking Number</p>
                <h3 className="mt-2 text-2xl font-semibold text-text-primary">{allocation?.track_id ?? "Not assigned"}</h3>
              </div>
              <StatusBadge status={tracking?.status ?? shipment?.shipment_status ?? "Pending"} />
            </div>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-sm text-text-secondary">Current Status</p>
                <p className="mt-1 font-semibold text-text-primary">{tracking?.current_location ?? "Tracking unavailable"}</p>
              </div>
              <div>
                <p className="text-sm text-text-secondary">Estimated Delivery</p>
                <p className="mt-1 font-semibold text-text-primary">
                  {orderDetails?.service_option?.estimated_days !== undefined && orderDetails.order.created_at
                    ? new Date(
                        new Date(orderDetails.order.created_at).setDate(
                          new Date(orderDetails.order.created_at).getDate() + orderDetails.service_option.estimated_days,
                        ),
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
                  {[orderDetails?.sender_address?.street, orderDetails?.sender_address?.city].filter(Boolean).join(", ") || "-"}
                </p>
              </div>
              <div>
                <p className="text-sm text-text-secondary">Destination</p>
                <p className="mt-1 text-sm leading-6 text-text-primary">
                  {[orderDetails?.receiver_address?.street, orderDetails?.receiver_address?.city].filter(Boolean).join(", ") || "-"}
                </p>
              </div>
              <div>
                <p className="text-sm text-text-secondary">Service Type</p>
                <p className="mt-1 text-sm font-semibold text-text-primary">{orderDetails?.service_option?.service_name ?? "-"}</p>
              </div>
              <div>
                <p className="text-sm text-text-secondary">Vehicle</p>
                <p className="mt-1 text-sm font-semibold text-text-primary">{shipment?.vehicle_id ?? allocation?.vehicle_id ?? "-"}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold text-text-primary">Tracking History</h3>
            <div className="mt-5">
              <Timeline items={timelineItems} />
            </div>
          </Card>
        </div>

        <MapCard title="Route Overview" />
      </div>
    </PageContainer>
  );
}
