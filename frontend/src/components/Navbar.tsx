import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "./Button";
import { Icon } from "./Icon";
import { SearchBar } from "./SearchBar";
import { accountService } from "../services/accountService";

interface NavbarProps {
  onMenuToggle: () => void;
}

export function Navbar({ onMenuToggle }: NavbarProps) {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const [userName, setUserName] = useState("User Account");
  const [userEmail, setUserEmail] = useState("");
  const [userRole, setUserRole] = useState("");

  useEffect(() => {
    const principalId = localStorage.getItem("smartfm_principal_id");
    const principalType = localStorage.getItem("smartfm_principal_type");
    const principalRole = localStorage.getItem("smartfm_principal_role");

    setUserRole(principalRole || "");

    if (!principalId) return;

    if (principalType === "customer") {
      accountService
        .getCustomer(principalId)
        .then((customer) => {
          setUserName(customer.full_name || "User Account");
          setUserEmail(customer.email || "");
        })
        .catch(() => {
          setUserName(principalRole ? `${principalRole} (offline)` : "User Account");
        });
    } else {
      setUserName(principalRole || "Staff");
    }
  }, []);

  // Close the dropdown when clicking outside it
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("smartfm_principal_id");
    localStorage.removeItem("smartfm_principal_type");
    localStorage.removeItem("smartfm_principal_role");
    localStorage.removeItem("smartfm_access_token");
    navigate("/login");
  };

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

      <div className="relative flex items-center gap-3" ref={menuRef}>
        <Button
          icon={<Icon name="settings" />}
          variant="ghost"
          onClick={() => setIsMenuOpen((open) => !open)}
        >
          Settings
        </Button>

        {isMenuOpen && (
          <div className="absolute right-0 top-[calc(100%+8px)] w-72 rounded-2xl border border-border bg-white p-2 shadow-panel z-50">
            {/* User summary */}
            <div className="rounded-xl bg-brand-50 p-3">
              <p className="text-sm font-semibold text-text-primary">{userName}</p>
              {userEmail && <p className="text-xs text-text-secondary">{userEmail}</p>}
              {userRole && (
                <span className="mt-1 inline-block rounded-full bg-white px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-brand-500">
                  {userRole}
                </span>
              )}
            </div>

            <div className="mt-2 flex flex-col">
              <Link
                to="/account"
                className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-text-primary transition hover:bg-gray-50"
                onClick={() => setIsMenuOpen(false)}
              >
                <Icon name="person" className="text-[18px]" />
                Account Settings
              </Link>

              <hr className="my-1 border-border" />

              <button
                className="flex items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-medium text-danger transition hover:bg-danger/10"
                onClick={handleLogout}
                type="button"
              >
                <Icon name="logout" className="text-[18px]" />
                Log Out
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
