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
    const principalEmail = localStorage.getItem("smartfm_principal_email");

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
          setUserName("User Account");
        });
    } else {
      // Xử lý cho Staff / Manager
      setUserName(principalRole ? principalRole.toUpperCase() : "Staff Member");
      
      // Nếu có sẵn email trong localStorage thì dùng, nếu không thì gọi API lấy thông tin staff hoặc gán giá trị mặc định đẹp hơn
      if (principalEmail) {
        setUserEmail(principalEmail);
      } else {
        // Cố gắng gọi API getStaff nếu service hỗ trợ, hoặc hiển thị email dựa trên role/ID
        accountService
          .getStaff?.(principalId)
          .then((staff: any) => {
            if (staff?.email) {
              setUserEmail(staff.email);
              localStorage.setItem("smartfm_principal_email", staff.email);
            }
            if (staff?.full_name || staff?.name) {
              setUserName(staff.full_name || staff.name);
            }
          })
          .catch(() => {
            setUserEmail(`${principalRole || "staff"}@smartfm.internal`);
          });
      }
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("smartfm_access_token");
    localStorage.removeItem("smartfm_principal_id");
    localStorage.removeItem("smartfm_principal_type");
    localStorage.removeItem("smartfm_principal_role");
    localStorage.removeItem("smartfm_principal_email");
    setIsMenuOpen(false);
    navigate("/login");
  };

  return (
    <header className="sticky top-0 z-35 flex h-20 items-center justify-between border-b border-border bg-white/85 px-4 sm:px-8 backdrop-blur-md">
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuToggle}
          className="flex h-11 w-11 items-center justify-center rounded-2xl border border-border text-text-primary transition hover:bg-gray-50 lg:hidden"
          type="button"
        >
          <Icon name="menu" className="text-xl" />
        </button>

        <Link to="/" className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-500 text-white shadow-md shadow-brand-500/20">
            <Icon name="local_shipping" className="text-2xl" />
          </div>
          <div className="hidden sm:block">
            <span className="text-lg font-bold tracking-tight text-text-primary">SmartFM</span>
            <span className="block text-xs font-medium text-text-secondary">Fleet & Logistics</span>
          </div>
        </Link>
      </div>

      <div className="hidden md:block w-72 lg:w-96">
        <SearchBar />
      </div>

      <div className="flex items-center gap-3">
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="flex items-center gap-3 rounded-2xl border border-border p-1.5 sm:pr-4 transition hover:bg-gray-50"
            type="button"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-100 text-brand-700 font-bold">
              {userName.charAt(0).toUpperCase()}
            </div>
            <div className="hidden text-left sm:block">
              <p className="text-xs font-semibold text-text-primary truncate max-w-[120px]">{userName}</p>
              <p className="text-[10px] text-text-secondary capitalize">{userRole || (isLoggedIn ? "Active" : "Guest")}</p>
            </div>
            <Icon name="expand_more" className="text-text-secondary text-base hidden sm:block" />
          </button>

          {isMenuOpen && (
            <div className="absolute right-0 mt-2 w-64 rounded-2xl border border-border bg-white p-2 shadow-xl animate-in fade-in zoom-in-95 duration-150">
              <div className="px-3 py-2 border-b border-border">
                <p className="text-sm font-bold text-text-primary truncate">{userName}</p>
                <p className="text-xs text-text-secondary truncate">{userEmail || "No email provided"}</p>
              </div>

              <div className="py-1">
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
                      className="flex items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-medium text-danger transition hover:bg-danger/10 w-full"
                      onClick={handleLogout}
                      type="button"
                    >
                      <Icon name="logout" className="text-[18px]" />
                      Log Out
                    </button>
                  </>
                ) : (
                  <button
                    className="flex items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-medium text-brand-600 transition hover:bg-brand-50 w-full"
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