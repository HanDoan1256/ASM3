import type { PropsWithChildren } from "react";

interface PageContainerProps {
  className?: string;
}

export function PageContainer({ children, className = "" }: PropsWithChildren<PageContainerProps>) {
  return <div className={`space-y-8 ${className}`}>{children}</div>;
}

