import { Card } from "./Card";
import { Icon } from "./Icon";

interface StatCardProps {
  icon: string;
  label: string;
  value: string;
  note: string;
}

export function StatCard({ icon, label, note, value }: StatCardProps) {
  return (
    <Card className="interactive-lift p-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-text-secondary">{label}</p>
        <div className="rounded-2xl bg-brand-50 p-3 text-brand-500">
          <Icon name={icon} />
        </div>
      </div>
      <p className="mt-6 text-[32px] font-bold leading-none text-text-primary">{value}</p>
      <p className="mt-3 text-sm text-text-secondary">{note}</p>
    </Card>
  );
}

