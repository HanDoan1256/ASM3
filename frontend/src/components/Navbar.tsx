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

  const [userName, setUserName] = useState("Guest");
  const [userEmail, setUserEmail] = useState("");
  const [userRole, setUserRole] = useState("");

  const isLoggedIn = !!localStorage.getItem("smartfm_access_token");

  useEffect(() => {
    const principalId = localStorage.getItem("smartfm_principal_id");
    const principalType = localStorage.getItem("smartfm_principal_type");
    const principalRole = localStorage.getItem("smartfm_principal_role");

    setUserRole(principalRole || "");

    if (!principalId) {
        setUserName("Guest");
        return;
    }

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
        setUserName(`Staff (${principalRole})`);
    }
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("smartfm_principal_id");
    localStorage.removeItem("smartfm_principal_type");
    localStorage.removeItem("smartfm_principal_role");
    localStorage.removeItem("smartfm_access_token");
    window.location.href = "/login";
  };

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between rounded-[28px] border border-border bg-white px-4 shadow-sm lg:px-6">
      <div className="flex items-center gap-4">
        <button
          type="button"
          className="flex items-center justify-center rounded-xl p-2 text-text-secondary transition hover:bg-brand-50 hover:text-brand-600 lg:hidden"
          onClick={onMenuToggle}
        >
          <Icon name="menu" className="text-[24px]" />
        </button>
        <div className="hidden md:block">
          <SearchBar placeholder="Search orders, shipments..." />
        </div>
      </div>

      <div className="flex items-center gap-3 md:gap-4">
        <Button variant="ghost" className="hidden md:flex h-10 w-10 items-center justify-center rounded-full p-0">
          <Icon name="notifications" className="text-[22px]" />
        </Button>
        
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            className="flex items-center gap-2 rounded-full bg-brand-50 py-1 pl-1 pr-3 transition hover:bg-brand-100"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <div className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold text-white shadow-sm ${isLoggedIn ? "bg-brand-500" : "bg-gray-400"}`}>
              {userName.charAt(0).toUpperCase()}
            </div>
            <span className="hidden text-sm font-semibold text-brand-700 sm:block">
              {userName.split(" ")[0]}
            </span>
            <Icon name="expand_more" className={`text-brand-500 transition-transform ${isMenuOpen ? "rotate-180" : ""}`} />
          </button>

          {isMenuOpen && (
            <div className="absolute right-0 mt-2 w-56 origin-top-right rounded-2xl bg-white p-2 shadow-panel z-50 border border-border">
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
                {isLoggedIn ? (
                  <>
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
                  </>
                ) : (
                  <button
                    className="flex items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-medium text-brand-600 transition hover:bg-brand-50"
                    onClick={() => {
                      setIsMenuOpen(false);
                      navigate("/login");
                    }}
                    type="button"
                  >
                    <Icon name="login" className="text-[18px]" />
                    Sign In / Register
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}