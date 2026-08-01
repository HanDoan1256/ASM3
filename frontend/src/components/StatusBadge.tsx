interface StatusBadgeProps {
  status: string;
}

const statusClasses: Record<string, string> = {
  delivered: "bg-success/10 text-success",
  active: "bg-brand-50 text-brand-700",
  pending: "bg-warning/10 text-warning",
  approved: "bg-sky-100 text-sky-700",
  cancelled: "bg-danger/10 text-danger",
  paid: "bg-success/10 text-success",
  completed: "bg-success/10 text-success",
  failed: "bg-danger/10 text-danger",
  unpaid: "bg-danger/10 text-danger",
  processing: "bg-brand-50 text-brand-700",
  available: "bg-success/10 text-success",
  created: "bg-slate-100 text-slate-700",
  assigned: "bg-warning/10 text-warning",
  picked_up: "bg-amber-100 text-amber-700",
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
