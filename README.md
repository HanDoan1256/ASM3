# Smart Freight Management System (SmartFM)

SmartFM is a university freight and logistics management system built as a layered monolith:

```text
React UI
  -> Axios service layer
  -> FastAPI routers
  -> Service layer
  -> Repository layer
  -> SQLAlchemy ORM
  -> PostgreSQL (Supabase) or local SQLite fallback
```

The current codebase is an Assignment 3 implementation baseline that has already been refactored away from the earlier prototype shipment-only design. It now follows the Assignment 2 business module structure more closely while preserving the existing React and FastAPI project shape.

## Current Scope

The project currently covers these business modules:

- Account Management
- Order Management
- Shipment and Fleet Management
- Payment
- Reporting

Implemented architecture now includes:

- React + Vite + TypeScript frontend
- FastAPI backend
- Service layer
- Repository pattern
- SQLAlchemy ORM models mapped to the current database schema
- REST API endpoints grouped by business module
- Shared frontend domain services and shared TypeScript types

## Technology Stack

| Layer | Stack |
| --- | --- |
| Frontend | React 18, Vite, TypeScript, TailwindCSS, React Router, Axios |
| Backend | FastAPI, SQLAlchemy 2, Pydantic 2, Uvicorn |
| Database | Supabase PostgreSQL target, SQLite local fallback |
| Migration Scaffold | Alembic |

## Project Structure

```text
.
├── README.md
├── backend/
│   ├── alembic/
│   ├── alembic.ini
│   ├── app/
│   │   ├── api/
│   │   ├── core/
│   │   ├── database/
│   │   ├── models/
│   │   ├── repositories/
│   │   ├── schemas/
│   │   ├── services/
│   │   ├── utils/
│   │   └── main.py
│   ├── app.db
│   └── requirements.txt
└── frontend/
    ├── .env.example
    ├── index.html
    ├── package.json
    ├── postcss.config.js
    ├── src/
    │   ├── components/
    │   ├── hooks/
    │   ├── layouts/
    │   ├── pages/
    │   ├── router/
    │   ├── services/
    │   ├── types/
    │   ├── App.tsx
    │   ├── index.css
    │   ├── main.tsx
    │   └── vite-env.d.ts
    ├── tailwind.config.js
    ├── tsconfig.app.json
    ├── tsconfig.json
    ├── tsconfig.node.json
    └── vite.config.ts
```

## Backend Structure

### `backend/app/main.py`

Backend entrypoint. It:

- creates the FastAPI app
- configures CORS
- registers all API routers under `/api`
- imports ORM model modules
- creates tables only when the app is using the local SQLite fallback

### `backend/app/core/`

- `config.py`: central settings object, including `DATABASE_URL` and allowed frontend origins

### `backend/app/database/`

- `session.py`: SQLAlchemy engine, session factory, and declarative base

### `backend/app/api/`

HTTP layer only. Routers should not contain business logic.

- `deps.py`: shared FastAPI dependencies
- `routes.py`: mounts all business routers
- `v1/auth.py`: authentication endpoints
- `v1/accounts.py`: customer profile and address endpoints
- `v1/orders.py`: service options and shipment order endpoints
- `v1/fleet.py`: branch, driver, vehicle, and allocation endpoints
- `v1/tracking.py`: tracking record, tracking history, and shipment lookup endpoints
- `v1/payments.py`: invoice and payment endpoints
- `v1/reports.py`: report listing and dashboard summary endpoints

### `backend/app/models/`

SQLAlchemy ORM models mapped to the current database tables:

- `branch.py`
- `customer.py`
- `staff.py`
- `address.py`
- `service_option.py`
- `package_details.py`
- `shipment_order.py`
- `shipment.py`
- `tracking.py`
- `tracking_history.py`
- `route.py`
- `vehicle.py`
- `driver.py`
- `invoice.py`
- `payment.py`
- `report.py`

### `backend/app/repositories/`

Persistence layer. Repositories handle database access only.

- `base.py`: generic CRUD repository
- entity repositories for each business table

Notable custom queries include:

- lookup customer by email
- lookup staff by email
- list addresses by customer
- list service options in sorted order
- list recent orders
- list shipment allocations
- list tracking history by track id
- lookup invoice by order id
- list recent payments
- list recent reports

### `backend/app/services/`

Business logic layer. Current services:

- `AuthService`
- `AccountService`
- `OrderService`
- `PricingService`
- `FleetAllocationService`
- `TrackingService`
- `PaymentService`
- `ReportService`

These services correspond to the Assignment 2 coordinator responsibilities.

### `backend/app/schemas/`

Pydantic request and response schemas grouped by business domain:

- `auth.py`
- `account.py`
- `branch.py`
- `service_option.py`
- `order.py`
- `shipment.py`
- `fleet.py`
- `tracking.py`
- `payment.py`
- `report.py`
- `common.py`

### `backend/app/utils/`

- `security.py`: password hashing and verification
- `identifiers.py`: generated identifiers such as customer and order IDs

## Frontend Structure

### `frontend/src/main.tsx`

Frontend bootstrap entrypoint.

### `frontend/src/App.tsx`

Mounts the router.

### `frontend/src/router/`

- `index.tsx`: defines all routes

Current routes:

- `/login`
- `/`
- `/orders`
- `/orders/create`
- `/orders/:orderId`
- `/shipments/tracking`
- `/fleet`
- `/payment`
- `/reports`
- `/account`

### `frontend/src/layouts/`

- `AppLayout.tsx`: shared application shell with navbar, sidebar, and nested page outlet

### `frontend/src/services/`

Frontend API client layer built on Axios:

- `api.ts`: shared Axios instance
- `authService.ts`
- `accountService.ts`
- `orderService.ts`
- `fleetService.ts`
- `trackingService.ts`
- `paymentService.ts`
- `reportService.ts`

These files are the only layer pages should use for API communication.

### `frontend/src/types/`

Shared TypeScript domain types:

- `auth.ts`
- `account.ts`
- `order.ts`
- `fleet.ts`
- `tracking.ts`
- `payment.ts`
- `report.ts`

### `frontend/src/hooks/`

- `useShipmentForm.ts`: create-order form state hook

The hook name is legacy, but it now uses the new order form type and the current order creation flow.

### `frontend/src/pages/`

Route-level screens:

- `LoginPage.tsx`
- `DashboardPage.tsx`
- `OrdersPage.tsx`
- `CreateOrderPage.tsx`
- `OrderDetailPage.tsx`
- `ShipmentTrackingPage.tsx`
- `FleetPage.tsx`
- `PaymentPage.tsx`
- `ReportsPage.tsx`
- `AccountPage.tsx`

### `frontend/src/components/`

Reusable UI building blocks such as:

- buttons
- cards
- forms
- tables
- badges
- page headers
- layout helpers
- dialogs
- timeline
- map placeholder

## Current API Surface

All backend endpoints are mounted under `/api`.

### Auth

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`

### Accounts

- `GET /api/accounts/customers/{customer_id}`
- `PUT /api/accounts/customers/{customer_id}`
- `GET /api/accounts/customers/{customer_id}/addresses`
- `POST /api/accounts/customers/{customer_id}/addresses`
- `PUT /api/accounts/addresses/{address_id}`
- `DELETE /api/accounts/addresses/{address_id}`

### Orders

- `GET /api/service-options`
- `GET /api/orders`
- `POST /api/orders`
- `GET /api/orders/{order_id}`
- `PUT /api/orders/{order_id}`

### Fleet

- `GET /api/fleet/branches`
- `GET /api/fleet/vehicles`
- `POST /api/fleet/vehicles`
- `PUT /api/fleet/vehicles/{vehicle_id}`
- `GET /api/fleet/drivers`
- `POST /api/fleet/drivers`
- `PUT /api/fleet/drivers/{driver_id}`
- `GET /api/fleet/allocations`
- `POST /api/fleet/orders/{order_id}/allocate`

### Tracking

- `GET /api/tracking/{track_id}`
- `GET /api/tracking/{track_id}/history`
- `GET /api/tracking/shipments/{shipment_id}`

### Payments

- `GET /api/payments/invoices`
- `GET /api/payments/invoices/{invoice_id}`
- `GET /api/payments/orders/{order_id}/invoice`
- `GET /api/payments`
- `POST /api/payments`

### Reports

- `GET /api/reports`
- `GET /api/reports/dashboard`
- `GET /api/reports/{report_type}`

## Running the Project

### Backend

Create and activate a virtual environment, then install dependencies:

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

Run the API:

```bash
uvicorn app.main:app --reload
```

By default, the backend uses:

- `sqlite:///./app.db` if `DATABASE_URL` is not set
- the configured PostgreSQL database if `DATABASE_URL` is provided

Example:

```bash
export DATABASE_URL="postgresql+psycopg://USER:PASSWORD@HOST:PORT/DATABASE"
```

### Frontend

Install dependencies:

```bash
cd frontend
npm install
```

Create an environment file if needed:

```bash
cp .env.example .env
```

Default frontend API target:

```text
VITE_API_URL=http://127.0.0.1:8000/api
```

Run the frontend:

```bash
npm run dev
```

Build the frontend:

```bash
npm run build
```

## Current Architecture Rules

The project follows these conventions:

- frontend pages handle presentation only
- frontend services handle HTTP calls
- routers handle HTTP request and response concerns only
- services contain business logic
- repositories contain database access only
- SQLAlchemy models map to the current database schema
- the frontend must not communicate directly with Supabase

## Current Status

The current baseline is structurally aligned with the layered architecture and business module split, but some areas are still incomplete.

Working areas:

- authentication endpoints
- customer registration and login
- order listing
- order creation
- order detail retrieval
- fleet list retrieval
- tracking lookup retrieval
- invoice and payment retrieval
- dashboard and report listing retrieval

Still partial or incomplete:

- account page is still mostly static on the frontend
- fleet allocation workflow is not fully implemented
- tracking update workflow is not implemented
- report generation workflow is not implemented
- some pages still rely on minimal aggregation or fallback display rather than full operational workflows

## Notes

- `backend/app.db` is a local development fallback, not the target production database
- `frontend/node_modules/` and `backend/.venv/` are dependency folders, not source
- Alembic is present as scaffolding, but the current implementation is designed to adapt to the existing database schema rather than redesign it

