interface TimelineItem {
  title: string;
  description: string;
  time: string;
  active?: boolean;
}

interface TimelineProps {
  items: TimelineItem[];
}

export function Timeline({ items }: TimelineProps) {
  return (
    <div className="space-y-5">
      {items.map((item, index) => (
        <div key={`${item.title}-${index}`} className="flex gap-4">
          <div className="flex flex-col items-center">
            <div className={`mt-1 h-3 w-3 rounded-full ${item.active ? "bg-brand-500" : "bg-border"}`} />
            {index < items.length - 1 && <div className="mt-2 h-full w-px flex-1 bg-border" />}
          </div>
          <div className="pb-5">
            <div className="flex flex-wrap items-center gap-3">
              <p className="text-sm font-semibold text-text-primary">{item.title}</p>
              <span className="text-sm text-text-secondary">{item.time}</span>
            </div>
            <p className="mt-1 text-sm text-text-secondary">{item.description}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

