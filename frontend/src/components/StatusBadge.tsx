interface StatusBadgeProps {
  status: string;
}

const statusClasses: Record<string, string> = {
  delivered: "bg-success/10 text-success",
  active: "bg-brand-50 text-brand-700",
  pending: "bg-warning/10 text-warning",
  cancelled: "bg-danger/10 text-danger",
  paid: "bg-success/10 text-success",
  unpaid: "bg-danger/10 text-danger",
  processing: "bg-brand-50 text-brand-700",
  available: "bg-success/10 text-success",
  assigned: "bg-warning/10 text-warning",
  in_transit: "bg-brand-50 text-brand-700",
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const normalized = status.toLowerCase().replace(/\s+/g, "_");
  const className = statusClasses[normalized] ?? "bg-slate-100 text-slate-700";

  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${className}`}>
      {status}
    </span>
  );
}

