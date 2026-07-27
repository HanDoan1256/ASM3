import { Button } from "./Button";
import { Icon } from "./Icon";
import { SearchBar } from "./SearchBar";

interface NavbarProps {
  onMenuToggle: () => void;
}

export function Navbar({ onMenuToggle }: NavbarProps) {
  return (
    <header className="glass-surface flex items-center justify-between gap-4 px-5 py-4">
      <div className="flex items-center gap-3">
        <button
          className="inline-flex rounded-2xl border border-border bg-white p-3 text-text-primary lg:hidden"
          onClick={onMenuToggle}
          type="button"
        >
          <Icon name="menu" />
        </button>
        <div>
          <p className="text-sm text-text-secondary">SmartFM</p>
          <h1 className="text-lg font-semibold text-text-primary">Smart Freight Management Platform</h1>
        </div>
      </div>

      <div className="hidden max-w-md flex-1 lg:block">
        <SearchBar placeholder="Search orders, tracking numbers, drivers..." />
      </div>

      <div className="flex items-center gap-3">
        <Button icon={<Icon name="notifications" />} variant="ghost">
          Alerts
        </Button>
        <Button icon={<Icon name="settings" />} variant="ghost">
          Settings
        </Button>
        <div className="hidden rounded-2xl border border-border bg-white px-4 py-3 sm:block">
          <p className="text-sm font-semibold text-text-primary">Operations Manager</p>
          <p className="text-sm text-text-secondary">smartfm.ops@company.com</p>
        </div>
      </div>
    </header>
  );
}

