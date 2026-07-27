import type { InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
}

export function Input({ className = "", hint, label, ...props }: InputProps) {
  return (
    <label className="grid gap-2 text-sm font-medium text-text-primary">
      {label && <span>{label}</span>}
      <input
        className={`w-full rounded-2xl border border-border bg-white px-4 py-3 text-base text-text-primary outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-100 ${className}`}
        {...props}
      />
      {hint && <span className="text-sm text-text-secondary">{hint}</span>}
    </label>
  );
}

