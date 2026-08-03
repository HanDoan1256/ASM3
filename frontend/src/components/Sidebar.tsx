import { NavLink } from "react-router-dom";
import { Icon } from "./Icon";
import logo from "./logo.png";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const navigation = [
  { icon: "space_dashboard", label: "Dashboard", to: "/" },
  { icon: "receipt_long", label: "Orders", to: "/orders" },
  { icon: "local_shipping", label: "Shipment", to: "/shipments/tracking" },
  { icon: "payments", label: "Payment", to: "/payment" },
  { icon: "person", label: "Account", to: "/account" },
  { icon: "airport_shuttle", label: "Fleet", to: "/fleet", staffOnly: true },
  { icon: "bar_chart", label: "Reports", to: "/reports", staffOnly: true },
  { icon: "logout", label: "Logout", isLogout: true },
];

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const isStaff = localStorage.getItem("smartfm_principal_type") === "staff";
  const isLoggedIn = !!localStorage.getItem("smartfm_access_token");

  const handleLogout = () => {
    localStorage.removeItem("smartfm_principal_id");
    localStorage.removeItem("smartfm_principal_type");
    localStorage.removeItem("smartfm_principal_role");
    localStorage.removeItem("smartfm_access_token");
    window.location.href = "/login"; // Hard reload để xóa memory
  };

  return (
    <>
      {isOpen && <div className="fixed inset-0 z-30 bg-slate-900/30 lg:hidden" onClick={onClose} />}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-[290px] transform border-r border-border bg-white p-5 transition duration-200 lg:static lg:translate-x-0 lg:rounded-[28px] lg:border lg:shadow-panel ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="overflow-hidden rounded-[28px]">
          <img src={logo} alt="SmartFM" className="w-full h-auto object-cover" />
        </div>

        <nav className="mt-6 space-y-2">
          {navigation
            .filter((item) => !item.staffOnly || isStaff)
            .map((item) => {
              if (item.isLogout) {
                // Giấu nút Logout nếu là Guest
                if (!isLoggedIn) return null;
                
                return (
                  <button
                    key={item.label}
                    onClick={handleLogout}
                    className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium text-text-secondary transition hover:bg-danger/10 hover:text-danger"
                  >
                    <Icon name={item.icon} className="text-[20px]" />
                    {item.label}
                  </button>
                );
              }

              return (
                <NavLink
                  key={item.label}
                  to={item.to!}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition ${
                      isActive
                        ? "bg-brand-50 text-brand-700"
                        : "text-text-secondary hover:bg-brand-50 hover:text-brand-600"
                    }`
                  }
                >
                  <Icon name={item.icon} className="text-[20px]" />
                  {item.label}
                </NavLink>
              );
            })}
        </nav>
      </aside>
    </>
  );
}