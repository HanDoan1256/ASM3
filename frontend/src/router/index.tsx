import { createBrowserRouter } from "react-router-dom";

import { AppLayout } from "../layouts/AppLayout";
import { AccountPage } from "../pages/AccountPage";
import { CreateOrderPage } from "../pages/CreateOrderPage";
import { DashboardPage } from "../pages/DashboardPage";
import { FleetPage } from "../pages/FleetPage";
import { LoginPage } from "../pages/LoginPage";
import { OrderDetailPage } from "../pages/OrderDetailPage";
import { OrdersPage } from "../pages/OrdersPage";
import { PaymentPage } from "../pages/PaymentPage";
import { ReportsPage } from "../pages/ReportsPage";
import { ShipmentTrackingPage } from "../pages/ShipmentTrackingPage";

export const router = createBrowserRouter([
  {
    path: "/login",
    element: <LoginPage />,
  },
  {
    path: "/",
    element: <AppLayout />,
    children: [
      {
        index: true,
        element: <DashboardPage />,
      },
      {
        path: "orders",
        element: <OrdersPage />,
      },
      {
        path: "orders/create",
        element: <CreateOrderPage />,
      },
      {
        path: "orders/:orderId",
        element: <OrderDetailPage />,
      },
      {
        path: "shipments/tracking",
        element: <ShipmentTrackingPage />,
      },
      {
        path: "fleet",
        element: <FleetPage />,
      },
      {
        path: "payment",
        element: <PaymentPage />,
      },
      {
        path: "reports",
        element: <ReportsPage />,
      },
      {
        path: "account",
        element: <AccountPage />,
      },
    ],
  },
]);
