import { Card } from "./Card";
import { Icon } from "./Icon";

interface InfoCardProps {
  icon: string;
  label: string;
  value: string;
  helper?: string;
}

export function InfoCard({ helper, icon, label, value }: InfoCardProps) {
  return (
    <Card className="interactive-lift p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-text-secondary">{label}</p>
          <p className="mt-2 text-lg font-semibold text-text-primary">{value}</p>
          {helper && <p className="mt-1 text-sm text-text-secondary">{helper}</p>}
        </div>
        <div className="rounded-2xl bg-brand-50 p-3 text-brand-500">
          <Icon className="text-[22px]" name={icon} />
        </div>
      </div>
    </Card>
  );
}

