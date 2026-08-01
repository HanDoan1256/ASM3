import { Link } from "react-router-dom";

import { Button } from "./Button";
import { Icon } from "./Icon";

interface HeaderAction {
  icon?: string;
  label: string;
  to?: string;
  variant?: "primary" | "secondary" | "ghost" | "danger";
}

interface PageHeaderProps {
  title: string;
  description: string;
  eyebrow?: string;
  actions?: HeaderAction[];
}

export function PageHeader({ actions = [], description, eyebrow, title }: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
      <div className="space-y-2">
        {eyebrow && <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-500">{eyebrow}</p>}
        <h1 className="text-[32px] font-bold leading-tight text-text-primary">{title}</h1>
        <p className="max-w-3xl text-base leading-7 text-text-secondary">{description}</p>
      </div>

      {actions.length > 0 && (
        <div className="flex flex-nowrap gap-3 overflow-x-auto xl:shrink-0">
          {actions.map((action) => (
            action.to ? (
              <Link key={action.label} className="shrink-0" to={action.to}>
                <Button icon={action.icon ? <Icon name={action.icon} /> : undefined} variant={action.variant ?? "secondary"}>
                  <span className="whitespace-nowrap">{action.label}</span>
                </Button>
              </Link>
            ) : (
              <Button
                key={action.label}
                className="shrink-0"
                icon={action.icon ? <Icon name={action.icon} /> : undefined}
                variant={action.variant ?? "secondary"}
              >
                <span className="whitespace-nowrap">{action.label}</span>
              </Button>
            )
          ))}
        </div>
      )}
    </div>
  );
}