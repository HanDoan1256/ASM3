import type { PropsWithChildren } from "react";

import { Card } from "./Card";

interface FormSectionProps {
  title: string;
  description?: string;
}

export function FormSection({ children, description, title }: PropsWithChildren<FormSectionProps>) {
  return (
    <Card className="p-6">
      <div className="mb-5">
        <h3 className="text-lg font-semibold text-text-primary">{title}</h3>
        {description && <p className="mt-1 text-sm text-text-secondary">{description}</p>}
      </div>
      <div className="grid gap-4 md:grid-cols-2">{children}</div>
    </Card>
  );
}

