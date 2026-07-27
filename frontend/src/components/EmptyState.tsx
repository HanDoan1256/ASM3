import { Link } from "react-router-dom";

import { Button } from "./Button";
import { Card } from "./Card";
import { Icon } from "./Icon";

interface EmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  actionTo?: string;
}

export function EmptyState({ actionLabel, actionTo, description, title }: EmptyStateProps) {
  return (
    <Card className="p-8 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-brand-50 text-brand-500">
        <Icon className="text-[28px]" name="inventory_2" />
      </div>
      <h3 className="mt-5 text-xl font-semibold text-text-primary">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-text-secondary">{description}</p>
      {actionLabel && (
        <div className="mt-5">
          {actionTo ? (
            <Link to={actionTo}>
              <Button>{actionLabel}</Button>
            </Link>
          ) : (
            <Button>{actionLabel}</Button>
          )}
        </div>
      )}
    </Card>
  );
}
