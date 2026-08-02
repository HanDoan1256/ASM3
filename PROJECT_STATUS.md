# PROJECT_STATUS.md

This document records the state of the SmartFM implementation after completing the full end-to-end order-to-delivery business workflow (JWT auth hardening, transactional order creation, payment/invoice workflow, fleet allocation, tracking, and reporting). It is a snapshot for the next contributor/agent picking up this codebase — not a replacement for `README.md`, which documents the stable architecture and API surface.

## 1. Current Architecture

```text
React (Vite/TS) UI
  -> Axios frontend service layer (src/services/*.ts)
  -> FastAPI routers (app/api/v1/*.py) — auth/role checks only
  -> Service layer (app/services/*.py) — business logic, transactions
  -> Repository layer (app/repositories/*.py) — persistence only
  -> SQLAlchemy ORM models (app/models/*.py)
  -> PostgreSQL/Supabase in production, SQLite fallback for local dev
```

No architectural layers were removed or bypassed. All new logic was added at the correct layer (auth dependencies in `app/api/deps.py`, business rules in services, persistence in repositories).

## 2. Completed Features (this phase)

- **JWT authentication**: `POST /api/auth/login` returns a bearer `access_token`; all protected endpoints require `Authorization: Bearer <token>`. Legacy SHA-256 password hashes are detected and transparently upgraded to bcrypt on next successful login (no forced password reset for existing accounts).
- **Route protection / ownership checks**: every account, order, payment, fleet, tracking, and report endpoint now enforces staff-only or owner-or-staff access via `app/api/deps.py` (`require_customer`, `require_staff`, `require_self_customer`).
- **Customer identity spoofing protection**: `POST /api/orders` and related customer-scoped calls always use the JWT-derived principal id, ignoring any client-supplied `customer_id`.
- **Atomic order creation**: `OrderService.create_order()` builds the shipment order, package details, sender/receiver addresses (new or by existing address id), and a Pending invoice in one DB transaction (single `commit()`), replacing the previous non-atomic, partially-applied writes.
- **Order approval workflow**: `POST /api/orders/{order_id}/approve` (staff only) transitions `Pending -> Approved` and creates the shipment record. Re-approving an already-approved order returns `409 Conflict` instead of silently succeeding.
- **Fleet allocation implemented**: `FleetAllocationService.allocate_resources()` replaced a `NotImplementedError` stub. It validates the order is Approved, the shipment isn't already allocated, then assigns the smallest available vehicle with sufficient capacity and the first available driver, creating a tracking record if missing and advancing statuses.
- **Payment/invoice workflow**: `PaymentService.create_payment()` validates the invoice exists, the payment method is recognized, the amount matches the invoice total exactly, and explicitly rejects a second "Completed" confirmation against an already-Completed invoice (`400`).
- **Tracking bug fix**: `TrackingHistoryRepository.create()` was being called with raw kwargs instead of a model instance in `tracking_service.py`, which would have raised at runtime the first time it was exercised; fixed and covered by manual + automated testing.
- **Report generation implemented**: `ReportService.generate_report()` replaced a `NotImplementedError` stub with 4 real, database-backed report types: `order_summary`, `shipment_status`, `revenue`, `fleet_utilization`.
- **Frontend removals of mock/placeholder logic**:
  - `CreateOrderPage.tsx` — removed a hardcoded `CUST-001` customer id fallback; now requires login and uses real payment-method enum values (`SENDER_COD`/`RECEIVER_COD`/`SENDER_TRANSFER`), with a genuine order-creation → payment-confirmation flow for bank transfers instead of an immediately-faked "Completed" status.
  - `FleetPage.tsx` — removed a placeholder "Manage" dialog that did nothing; replaced with a working vehicle-status toggle and an "Allocate Order" action wired to the real allocation endpoint.
  - `OrderDetailPage.tsx` — replaced a static hardcoded timeline with the real tracking-history API; added staff approve/allocate actions and invoice/payment display with a bank-transfer payment-confirmation retry button.
  - `DashboardPage.tsx` — replaced hardcoded `monthlyOrders`/`statusSplit` sample arrays and a hardcoded activity timeline with values derived from live order data.
  - `ReportsPage.tsx` — replaced hardcoded bar/pie chart sample data with real "Generate Report" actions against the 4 live report types, and a table of previously generated reports including their content.
  - `ShipmentTrackingPage.tsx` — added a staff-only "Add Tracking Event" form wired to the real tracking-event endpoint (this page was already using live data for the timeline/shipment details; only the missing staff write-path was added).

## 3. End-to-End Business Workflow (verified)

1. Customer registers (`POST /api/auth/register`) and logs in (`POST /api/auth/login`), receiving a JWT.
2. Customer creates an order (`POST /api/orders`) with a payment method; an Invoice (Pending) is created atomically alongside the order.
3. Staff views and approves the order (`POST /api/orders/{id}/approve`); a Shipment record is created.
4. Staff allocates fleet resources (`POST /api/fleet/orders/{id}/allocate`); vehicle/driver assigned, tracking record ensured, statuses advanced.
5. Payment is confirmed (`POST /api/payments`) — COD flows record collection at delivery time (out of scope for this phase beyond invoice/payment plumbing); SENDER_TRANSFER flows are confirmed explicitly by the customer/staff via the frontend "Confirm Payment" action.
6. Staff posts tracking events (`POST /api/tracking/{track_id}/events`); customers/staff can retrieve tracking history and shipment status.
7. Dashboard/report endpoints (`GET /api/reports/dashboard`, `GET /api/reports/{type}`) reflect the live state of orders, shipments, fleet, and revenue.

This flow was validated twice: once via manual `curl`-based end-to-end testing against a live local server, and again via the automated `backend/tests/test_workflow.py` suite (5 tests, all passing) that now guards it against regression.

## 4. API Endpoints

See `README.md` → "Current API Surface" for the full, current endpoint list with auth requirements. That section was updated as part of this phase to reflect actual behavior (auth requirements, status codes, transaction semantics) rather than the prior high-level listing.

## 5. Database / Model Changes

- `app/models/invoice.py` — added `payment_method` column (nullable text) to record which of the three payment methods the customer selected at order time.
- `app/models/__init__.py` / `app/main.py` — registered the previously-unregistered `AccountHistory` model so its table is created and the model is importable/usable.
- `app/core/statuses.py` — added `PAYMENT_METHOD_SENDER_COD` / `PAYMENT_METHOD_RECEIVER_COD` / `PAYMENT_METHOD_SENDER_TRANSFER`, `PAYMENT_METHODS`, and `INVOICE_STATUSES` vocabulary. No existing status constants were removed or renamed.
- No destructive schema changes were made. No existing tables/columns were dropped or renamed.

## 6. Files Changed

**Backend:** `requirements.txt`, `core/config.py`, `core/statuses.py`, `models/invoice.py`, `models/__init__.py`, `main.py`, `alembic/env.py`, `services/tracking_service.py`, `utils/security.py`, `schemas/auth.py`, `services/auth_service.py`, `api/deps.py` (new), `api/v1/accounts.py`, `services/account_service.py`, `schemas/order.py`, `schemas/payment.py`, `services/order_service.py`, `api/v1/orders.py`, `repositories/shipment_repository.py`, `services/fleet_allocation_service.py`, `api/v1/fleet.py`, `services/payment_service.py`, `api/v1/payments.py`, `services/report_service.py`, `api/v1/reports.py`, `api/v1/tracking.py`, `tests/conftest.py` (new), `tests/test_workflow.py` (new), `pytest.ini` (new).

**Frontend:** `services/api.ts`, `types/auth.ts`, `pages/LoginPage.tsx`, `components/Navbar.tsx`, `types/payment.ts`, `services/paymentService.ts`, `types/order.ts`, `pages/CreateOrderPage.tsx`, `services/orderService.ts`, `services/fleetService.ts`, `pages/FleetPage.tsx`, `pages/OrderDetailPage.tsx`, `pages/DashboardPage.tsx`, `pages/ReportsPage.tsx`, `services/reportService.ts`, `pages/ShipmentTrackingPage.tsx`.

**Docs:** `README.md` (API surface + status sections updated), `PROJECT_STATUS.md` (this file, new).

## 7. Important Design Decisions

- **Idempotence is intentionally bypassed for approve/pay actions.** The codebase's general `can_transition()` helper treats same-status transitions as no-ops, but re-approving an order or re-confirming an already-completed payment must fail loudly (`409`/`400`) rather than silently succeed, since they represent duplicate real-world actions (e.g. double-clicking "Approve" or "Confirm Payment"). This is handled by explicit pre-checks in `OrderService.approve_order()` and `PaymentService.create_payment()` before the general transition logic runs.
- **Invoices are created eagerly, Payments are not.** An Invoice (status=Pending) is created at order-creation time so the customer always has something to view/pay against. A Payment row is only created once an actual payment event is confirmed via `POST /api/payments` — this avoids fabricating a fake "Completed" invoice for COD orders that haven't actually been collected yet.
- **No fake distance/route data for fleet allocation.** The spec explicitly prohibited fabricating business data. Since no reliable Branch/Route linkage exists in the current schema to support real distance-based matching, allocation is capacity- and availability-based only (documented as a known limitation, not silently hidden).
- **bcrypt used directly, not via passlib.** `passlib==1.7.4` is incompatible with `bcrypt>=4.1` at runtime (missing `bcrypt.__about__`). Rather than pinning an old, unmaintained `bcrypt` version, `utils/security.py` calls `bcrypt.hashpw`/`bcrypt.checkpw` directly and manually truncates to 72 bytes, and `passlib` was removed from the dependency tree entirely.

## 8. Known Limitations

- Fleet allocation has no branch/route-based proximity matching (see above) — first-available/smallest-sufficient-capacity only.
- Alembic migration scaffolding exists (and its broken `env.py` import was fixed) but has not been exercised against a real migration in this phase; SQLite local dev still relies on `Base.metadata.create_all()`.
- Backend test coverage is intentionally focused/minimal (5 tests covering the critical paths: auth, spoofing protection, order lifecycle, payment validation, reporting) rather than exhaustive, per the project's explicit "minimal focused tests" guidance.
- No frontend automated tests were added in this phase; frontend correctness was verified via `tsc -b` (clean) and `vite build` (successful) after every page rewrite.

## 9. Tests Performed

- **Automated:** `backend/tests/test_workflow.py` — 5 tests, all passing (`pytest`): registration/login, customer-id spoofing protection on order creation, full order lifecycle (create → 401 unauthenticated → 403 customer-approve-forbidden → staff approve → 409 duplicate approve → fleet allocate → 403 customer-allocate-forbidden), payment amount validation + duplicate rejection, report generation + unknown-report-type rejection.
- **Manual (pre-automation):** a full `curl`-based walkthrough of the entire workflow against a live local server — register, login (customer + staff), create order (verified spoofing protection), fetch order detail with invoice, verify 401/403 auth enforcement, staff approval + 409 on re-approval, fleet allocation, payment confirmation (wrong-amount rejection, correct-amount success, duplicate rejection), tracking event posting + history retrieval, dashboard overview, report generation (and rejection of an unknown report type).
- **Frontend:** `npx tsc -b` (clean, no errors) and `npx vite build` (successful production build) run after all page rewrites in this phase.

## 10. Remaining TODOs

- Consider adding frontend component/integration tests if a test runner (e.g. Vitest) is introduced in a future phase.
- Consider exercising Alembic migrations against a real Postgres/Supabase target before production deployment.
- Consider branch/route-aware fleet allocation if/when reliable branch-route linkage data becomes available in the schema.

## 11. Authorization and Ownership Corrections

- Customer order lists are filtered to the authenticated customer; staff can list and retrieve all orders.
- Customer order, shipment, and tracking access is ownership-checked; staff retains operational access.
- Fleet branches, vehicles, drivers, allocations, and mutations are staff-only.
- New sender addresses are assigned to the authenticated customer, and referenced saved addresses are ownership-validated.
- Customer account deletion is now a soft delete (`status="Deleted"`) that preserves historical relationships and prevents future login.
- Dashboard active-shipment counts exclude delivered shipments and orders cancelled at the order level.
- Tracking history records now preserve the status associated with each event so timelines do not repeat the current master status.
