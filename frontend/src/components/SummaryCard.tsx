import { Card } from "./Card";

interface SummaryCardProps {
  label: string;
  value: string;
  trend: string;
}

export function SummaryCard({ label, trend, value }: SummaryCardProps) {
  return (
    <Card className="interactive-lift p-6">
      <p className="text-sm text-text-secondary">{label}</p>
      <p className="mt-3 text-[32px] font-bold leading-none text-text-primary">{value}</p>
      <p className="mt-3 text-sm font-medium text-success">{trend}</p>
    </Card>
  );
}

