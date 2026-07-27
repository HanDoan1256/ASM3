import { Card } from "./Card";
import { Icon } from "./Icon";

interface MapCardProps {
  title?: string;
}

export function MapCard({ title = "Route map" }: MapCardProps) {
  return (
    <Card className="overflow-hidden">
      <div className="flex items-center justify-between border-b border-border px-6 py-5">
        <h3 className="text-lg font-semibold text-text-primary">{title}</h3>
        <Icon className="text-brand-500" name="map" />
      </div>
      <div className="flex h-[280px] items-center justify-center bg-[linear-gradient(135deg,#eef5ff_0%,#f8f9ff_100%)]">
        <div className="rounded-[28px] border border-dashed border-brand-100 bg-white/80 px-6 py-5 text-center">
          <p className="text-sm font-semibold text-text-primary">Map Placeholder</p>
          <p className="mt-2 max-w-xs text-sm leading-6 text-text-secondary">
            Integrate Google Maps or Mapbox here in the final assignment to display live driver and shipment position.
          </p>
        </div>
      </div>
    </Card>
  );
}
