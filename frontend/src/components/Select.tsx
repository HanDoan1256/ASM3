import type { SelectHTMLAttributes } from "react";

interface SelectOption {
  label: string;
  value: string;
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: SelectOption[];
}

export function Select({ className = "", label, options, ...props }: SelectProps) {
  return (
    <label className="grid gap-2 text-sm font-medium text-text-primary">
      {label && <span>{label}</span>}
      <select
        className={`w-full rounded-2xl border border-border bg-white px-4 py-3 text-base text-text-primary outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-100 ${className}`}
        {...props}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

