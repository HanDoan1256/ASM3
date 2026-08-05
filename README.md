# SmartFM

SmartFM is a web-based freight management system for creating delivery orders, coordinating shipment execution, recording payments, tracking shipments, and producing operational reports. It is implemented for **SWE30003 – Software Architectures and Design, Assignment 3**.

---

## 1. Project Overview

SmartFM supports two application users:

- **Customers** register, authenticate, manage their account and addresses, create orders, view invoices, confirm payments, and track their shipments.
- **Staff** review and approve orders, manage fleet resources, allocate vehicles and drivers, update tracking events, and generate reports.

The repository implements a layered client-server application. The backend is a modular FastAPI application rather than a set of microservices.

## 2. Implemented Business Areas

### Authentication and Account Management

- Customer registration and login.
- Staff login using provisioned staff records.
- JWT bearer authentication.
- bcrypt password hashing, including transparent upgrade of legacy SHA-256 hashes after successful login.
- Customer profile updates, soft deletion, saved addresses, and account history.
- Customer ownership checks for account and address operations.

Deleted customers are retained with status `Deleted` and cannot authenticate.

### Order Management

- Public service-option listing and price estimation.
- Customer order creation with new or saved sender and receiver addresses.
- Package details including weight, dimensions, type, fragility, sealing, inspection policy, security level, and declared value.
- Server-side enforcement of the authenticated customer identity.
- Staff-only order approval.
- Invoice creation as part of order creation.

The current pricing calculation is weight-based and uses the selected service's base price. It does not yet calculate distance, route, zone, or surcharge pricing.

### Fleet and Shipment Management

- Staff-only branch, vehicle, driver, and allocation views.
- Vehicle and driver creation and update.
- Allocation of the smallest available vehicle with sufficient capacity and the first available driver.
- Shipment creation when a pending order is approved.
- Resource availability transitions during shipment processing.

Allocation is availability- and capacity-based. Branch proximity and route optimization are not implemented.

### Tracking

- Tracking record creation during fleet allocation.
- Tracking ID lookup.
- Shipment lookup by order or shipment ID.
- Staff tracking status/location events.
- Persistent tracking history.
- Customer ownership checks when retrieving tracking information.

The application does not currently connect to live GPS or a map provider.

### Payment and Invoice Management

- Invoice creation for each order.
- Customer invoice lookup by order.
- Staff invoice and payment listing.
- Payment confirmation for `SENDER_COD`, `RECEIVER_COD`, and `SENDER_TRANSFER`.
- Exact payment amount validation.
- Duplicate completed-payment prevention.
- Invoice and payment status transitions.

No external payment gateway is integrated; payment confirmation is recorded through the API.

### Reporting

Staff can view a dashboard overview and generate persisted reports for:

- `order_summary`
- `shipment_status`
- `revenue`
- `fleet_utilization`

Reports are computed from database records rather than frontend sample arrays.

## 3. Main System Workflow

```text
Customer registration
  -> Customer login
  -> Service and price estimate
  -> Order creation
  -> Pending order and Pending invoice
  -> Staff approval
  -> Approved order and Created shipment
  -> Vehicle and driver allocation
  -> Assigned shipment and tracking record
  -> Staff tracking events
  -> Payment confirmation where applicable
  -> Customer tracking and staff reporting
```

### Main state transitions

```text
Order:    Pending -> Approved -> In Transit -> Delivered
                         \-> Cancelled

Shipment: Created -> Assigned -> Picked Up -> In Transit -> Delivered

Payment:  Pending -> Completed
                  \-> Failed or Cancelled

Resource: Available -> Assigned -> In Transit -> Available
```

Order approval is staff-only and cannot be repeated. Fleet allocation requires an approved order. Tracking transitions synchronize related shipment, order, vehicle, and driver states where a mapping exists.

## 4. User Roles and Access Control

### Customer

Customers can:

- Manage their own profile and addresses.
- Create and list their own orders.
- View their own order details and invoices.
- Confirm payments for their own invoices.
- Retrieve tracking information for their own shipments.

### Staff

Staff can:

- View all orders.
- Approve orders.
- View and manage fleet resources.
- Allocate vehicles and drivers.
- Update tracking events.
- View invoices and payments.
- View dashboards and generate reports.

The JWT contains a staff `role`, but the current authorization dependency authorizes staff by `principal_type == "staff"`; it does not implement separate manager, finance, counter, or fleet permissions.

Verified authorization behaviour includes:

- Unauthenticated protected requests return `401`.
- Customers cannot approve orders.
- Customers cannot allocate fleet resources.
- Customers cannot access another customer's orders or tracking.
- Customer-supplied order `customer_id` values are replaced with the authenticated customer ID.
- Customers cannot use another customer's saved address.
- Deleted customers cannot log in.

## 5. Technology Stack

| Area | Technologies | Source |
| --- | --- | --- |
| Frontend | React 18, TypeScript, Vite | `frontend/package.json` |
| Frontend routing | React Router 6 | `frontend/package.json` |
| Frontend HTTP | Axios | `frontend/package.json` |
| Frontend styling | TailwindCSS, PostCSS, Autoprefixer | `frontend/package.json` |
| Vietnam address selector | `sub-vn` | `frontend/package.json` |
| Backend API | FastAPI, Uvicorn | `backend/requirements.txt` |
| Validation | Pydantic | `backend/requirements.txt` |
| Persistence | SQLAlchemy 2 | `backend/requirements.txt` |
| Authentication | PyJWT, bcrypt | `backend/requirements.txt` |
| Migrations | Alembic | `backend/requirements.txt` |
| Testing | Pytest, HTTPX | `backend/requirements.txt` |
| Database target | PostgreSQL/Supabase through `DATABASE_URL` | `backend/app/core/config.py` |
| Local/test database | SQLite fallback and isolated SQLite test database | `backend/app/core/config.py`, `backend/tests/conftest.py` |

## 6. System Architecture

```text
React UI
    |
    v
Frontend service layer using Axios
    |
    v
FastAPI API routers and dependencies
    |
    v
Backend business service layer
    |
    v
Repository layer
    |
    v
SQLAlchemy ORM models and sessions
    |
    v
PostgreSQL/Supabase or SQLite
```

Responsibilities are separated as follows:

- **React pages/components:** presentation, form state, navigation, and user interaction.
- **Frontend services:** API calls and frontend DTO handling.
- **FastAPI routers:** HTTP routing, dependency injection, authorization boundaries, and response mapping.
- **Backend services:** business rules, status transitions, ownership validation, pricing, allocation, payment, tracking, and reporting logic.
- **Repositories:** reusable database access operations.
- **SQLAlchemy models:** relational persistence mapping.
- **Database session:** engine and request-scoped session creation.

The architecture is a layered client-server system with a layered monolithic backend. It is not a microservice architecture.

## 7. Project Structure

```text
SmartFM/
├── README.md
├── backend/
│   ├── alembic/
│   │   └── versions/
│   ├── app/
│   │   ├── api/
│   │   │   └── v1/
│   │   ├── core/
│   │   ├── database/
│   │   ├── models/
│   │   ├── repositories/
│   │   ├── schemas/
│   │   ├── services/
│   │   ├── utils/
│   │   └── main.py
│   ├── tests/
│   ├── alembic.ini
│   ├── pytest.ini
│   ├── requirements.txt
│   └── seed_data.py
└── frontend/
    ├── src/
    │   ├── components/
    │   ├── hooks/
    │   ├── layouts/
    │   ├── pages/
    │   ├── router/
    │   ├── services/
    │   └── types/
    ├── .env.example
    ├── package.json
    ├── tailwind.config.js
    └── vite.config.ts
```

`backend/app/api/v1/` contains business routers. `services/` contains application rules, `repositories/` contains database access helpers, `models/` contains SQLAlchemy entities, and `schemas/` contains Pydantic request/response models. Frontend pages are under `frontend/src/pages/`, with shared UI in `components/` and API clients in `services/`.

## 8. Database Design

| Entity | Purpose |
| --- | --- |
| `Customer` | Customer identity, contact data, password hash, and account status |
| `Staff` | Staff identity, credentials, role, status, and branch reference |
| `Address` | Sender/receiver address data and default-address flag |
| `AccountHistory` | Customer profile-change history |
| `Branch` | Operational branch information |
| `ServiceOption` | Delivery service, base price, and estimated days |
| `PackageDetails` | Weight, dimensions, handling, security, and declared value |
| `ShipmentOrder` | Customer order, addresses, package, price, and order status |
| `Shipment` | Operational shipment and assigned resources |
| `Vehicle` | Vehicle capacity, status, plate, and branch |
| `Driver` | Driver identity, licence, status, and branch |
| `Route` | Origin, destination, distance, and estimated time |
| `Tracking` | Current tracking location, status, and timestamp |
| `TrackingHistory` | Historical tracking checkpoints |
| `Invoice` | One invoice for an order and its payment status |
| `Payment` | Payment amount, method, date, status, and transaction code |
| `Report` | Generated report type, author, timestamp, and JSON content |

The primary relationships are customer-to-orders and addresses, order-to-package/invoice/shipment, invoice-to-payment, shipment-to-vehicle/driver/route/tracking, and tracking-to-history. SQLAlchemy models and Alembic migration files are under `backend/app/models/` and `backend/alembic/`.

Province, district, and ward values are currently represented through address text fields. The frontend provides cascading Vietnam address selection, but the database does not contain normalized province/district/ward tables or administrative codes.

## 9. API Overview

All API routes are mounted under `/api`.

| Area | Example endpoints | Access |
| --- | --- | --- |
| Authentication | `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/logout` | Public/login or authenticated logout |
| Accounts | `GET/PUT/DELETE /api/accounts/customers/{customer_id}`, address and history routes | Owner or staff |
| Orders | `GET /api/service-options`, `POST /api/orders/estimate`, `GET/POST /api/orders` | Estimate/options public; order operations authenticated |
| Order approval | `POST /api/orders/{order_id}/approve` | Staff only |
| Fleet | `/api/fleet/branches`, `/api/fleet/vehicles`, `/api/fleet/drivers`, `/api/fleet/allocations` | Staff only |
| Fleet allocation | `POST /api/fleet/orders/{order_id}/allocate` | Staff only |
| Tracking | `/api/tracking/{track_id}`, `/api/tracking/orders/{order_id}`, `/api/tracking/{track_id}/history` | Authenticated with ownership checks |
| Tracking events | `POST /api/tracking/{track_id}/events` | Staff only |
| Payments | `/api/payments/invoices`, `/api/payments/orders/{order_id}/invoice`, `POST /api/payments` | Owner or staff, according to route |
| Reports | `/api/reports/dashboard`, `/api/reports/{report_type}`, `GET /api/reports` | Staff only |

When the backend is running locally, FastAPI documentation is available at:

- Swagger UI: `http://127.0.0.1:8000/docs`
- ReDoc: `http://127.0.0.1:8000/redoc`
- Health check: `http://127.0.0.1:8000/health`

## 10. Frontend Pages

| Page | Current responsibility |
| --- | --- |
| Login/Register | Customer registration and customer/staff login |
| Dashboard | Customer order overview or staff operational overview |
| Orders | Order listing and order navigation |
| Create Order | Service selection, Vietnamese address selection, package entry, estimate, and order creation |
| Order Detail | Order, package, invoice, approval, allocation, and payment actions according to user type |
| Shipment Tracking | Search by order/tracking information and display shipment history |
| Fleet | Staff vehicle, driver, and allocation views with vehicle status updates |
| Payment | Invoice/payment information and customer payment confirmation |
| Reports | Staff dashboard report generation and report display |
| Account | Customer profile, addresses, account history, and account deletion |

The UI includes a map placeholder rather than a live map. Search and pagination controls are limited in some views, and staff tracking-event entry is primarily exposed through the backend API rather than a complete frontend form.


## 11. Setup and Execution

For complete installation, environment configuration, database setup,
execution, testing, and build instructions, see:

**[SETUP_AND_EXECUTION.md](SETUP_AND_EXECUTION.md)**

### Quick Start

Backend:

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements.txt
uvicorn app.main:app --reload
```



## 12. Input Validation and Security

Implemented controls include:

- Pydantic validation for request payloads, email values, package dimensions, weight, and non-negative declared values.
- JWT signature and expiry validation.
- bcrypt password hashing.
- Customer and staff authorization dependencies.
- Customer ownership checks for orders, addresses, invoices, payments, and tracking.
- Server-side customer identity enforcement during order creation.
- Exact payment amount validation.
- Duplicate completed-payment rejection.
- Soft deletion of customers and login prevention for deleted accounts.

The system should not be described as production-secure. Logout is stateless, token revocation is not implemented, staff roles are not granularly enforced, and the frontend stores the access token in browser local storage.

## 13. Key Business Rules

- New orders start in `Pending`.
- New invoices start in `Pending`.
- Only staff can approve orders.
- An order must be approved before fleet allocation.
- Re-approving an order returns a conflict response.
- Fleet allocation selects an available vehicle with sufficient capacity and an available driver.
- Allocation creates or links shipment tracking data.
- Tracking events are staff-only and update persisted history.
- Customers can access only their own protected resources.
- The server ignores a client-supplied customer ID when creating an order.
- Payment amounts must equal the invoice total.
- A completed invoice cannot receive another completed payment.
- Deleted customer accounts cannot authenticate.

## 14. Known Limitations

- No external payment gateway or banking reconciliation.
- No live GPS, geocoding, or map integration; the frontend map card is a placeholder.
- Pricing is simplified and primarily weight/base-price based.
- Province, district, and ward data is not normalized into database entities.
- Fleet allocation does not use branch proximity, route distance, or optimization.
- Staff role values are not mapped to separate permissions.
- Frontend authentication guards do not protect every application route uniformly.
- Some frontend search, filter, pagination, and tracking-management controls are limited or incomplete.
- The frontend exposes a staff-update service call, but the backend currently provides staff retrieval rather than a matching staff update route.
- Alembic migrations do not provide a complete initial-schema bootstrap for a fresh PostgreSQL/Supabase database.
- No production deployment or observability configuration is included.

These limitations are appropriate boundaries for the current academic implementation but should be addressed before production use.

## 15. Assignment Context

SmartFM was developed for **SWE30003 – Software Architectures and Design, Assignment 3 – Object Design Implementation and Reflection**. The implementation translates the earlier object-oriented design into a working layered frontend/backend system with authentication, order processing, fleet operations, tracking, payments, and reporting.

## 16. Contributors

Repository history identifies the following contributors:

- Doan Gia Han
- Luong My An
- Ngo Quynh Nhu

Individual contribution percentages and task allocations are not specified in the repository.

## 17. Final Verification

The README was audited against the current source code, tests, configuration, and build output on the `main` branch. No application source code, tests, or migrations were changed as part of the documentation update.

The current verified state is:

- Backend tests: `9 passed`.
- Frontend production build: successful, with a Vite bundle-size warning.
- Database default: local SQLite when `DATABASE_URL` is absent.
- Database target: PostgreSQL/Supabase when `DATABASE_URL` is configured.
- API base URL: `VITE_API_URL`, defaulting to `http://127.0.0.1:8000/api`.
