import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "./Button";
import { Icon } from "./Icon";
import { SearchBar } from "./SearchBar";
import { accountService } from "../services/accountService";

interface NavbarProps {
  onMenuToggle: () => void;
}

export function Navbar({ onMenuToggle }: NavbarProps) {
  const [userName, setUserName] = useState("User Account");
  const [userEmail, setUserEmail] = useState("");

  useEffect(() => {
    const principalId = localStorage.getItem("smartfm_principal_id");
    const principalType = localStorage.getItem("smartfm_principal_type");
    const principalRole = localStorage.getItem("smartfm_principal_role");

    if (!principalId) return;

    if (principalType === "customer") {
      accountService
        .getCustomer(principalId)
        .then((customer) => {
          setUserName(customer.full_name || "User Account");
          setUserEmail(customer.email || "");
        })
        .catch(() => {
          // fall back to role label if the fetch fails, don't leave it blank
          setUserName(principalRole ? `${principalRole} (offline)` : "User Account");
        });
    } else {
      // staff accounts: no /accounts/customers endpoint applies to them,
      // fall back to showing their role until there's a staff profile endpoint
      setUserName(principalRole || "Staff");
    }
  }, []);

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

        <Link
          to="/account"
          className="hidden rounded-2xl border border-border bg-white px-4 py-3 transition hover:bg-brand-50 sm:block"
          title="Go to Account Settings"
        >
          <p className="text-sm font-semibold text-text-primary">{userName}</p>
          {userEmail && <p className="text-sm text-text-secondary">{userEmail}</p>}
        </Link>
      </div>
    </header>
  );
}