from fastapi import APIRouter

from app.api.v1 import accounts, auth, fleet, orders, payments, reports, tracking

router = APIRouter()
router.include_router(auth.router, prefix="/auth", tags=["Auth"])
router.include_router(accounts.router, prefix="/accounts", tags=["Accounts"])
router.include_router(orders.router, tags=["Orders"])
router.include_router(fleet.router, prefix="/fleet", tags=["Fleet"])
router.include_router(tracking.router, prefix="/tracking", tags=["Tracking"])
router.include_router(payments.router, prefix="/payments", tags=["Payments"])
router.include_router(reports.router, prefix="/reports", tags=["Reports"])
