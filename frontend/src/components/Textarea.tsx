import type { TextareaHTMLAttributes } from "react";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
}

export function Textarea({ className = "", label, rows = 4, ...props }: TextareaProps) {
  return (
    <label className="grid gap-2 text-sm font-medium text-text-primary">
      {label && <span>{label}</span>}
      <textarea
        className={`w-full rounded-2xl border border-border bg-white px-4 py-3 text-base text-text-primary outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-100 ${className}`}
        rows={rows}
        {...props}
      />
    </label>
  );
}

