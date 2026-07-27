import { Icon } from "./Icon";

interface SearchBarProps {
  placeholder?: string;
}

export function SearchBar({ placeholder = "Search..." }: SearchBarProps) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-border bg-white px-4 py-3">
      <Icon className="text-text-secondary" name="search" />
      <input
        className="w-full border-none bg-transparent text-sm text-text-primary outline-none"
        placeholder={placeholder}
      />
    </div>
  );
}

