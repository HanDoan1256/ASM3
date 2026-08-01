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
  { icon: "airport_shuttle", label: "Fleet", to: "/fleet" },
  { icon: "payments", label: "Payment", to: "/payment" },
  { icon: "bar_chart", label: "Reports", to: "/reports" },
  { icon: "person", label: "Account", to: "/account" },
  { icon: "logout", label: "Logout", to: "/login" },
];

export function Sidebar({ isOpen, onClose }: SidebarProps) {
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
          {navigation.map((item) => (
            <NavLink
              key={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition ${
                  isActive ? "bg-brand-50 text-brand-700" : "text-text-secondary hover:bg-brand-50 hover:text-text-primary"
                }`
              }
              onClick={onClose}
              to={item.to}
            >
              <Icon className="text-[20px]" name={item.icon} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </aside>
    </>
  );
}