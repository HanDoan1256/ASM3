import { useEffect, useMemo, useState } from "react";

import { Card } from "../components/Card";
import { InfoCard } from "../components/InfoCard";
import { PageContainer } from "../components/PageContainer";
import { PageHeader } from "../components/PageHeader";
import { StatusBadge } from "../components/StatusBadge";
import { paymentService } from "../services/paymentService";
import type { Invoice, Payment } from "../types/payment";

export function PaymentPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);

  useEffect(() => {
    paymentService.listInvoices().then(setInvoices).catch(() => setInvoices([]));
    paymentService.listPayments().then(setPayments).catch(() => setPayments([]));
  }, []);

  const invoice = invoices[0] ?? null;
  const payment = useMemo(
    () => payments.find((item) => item.invoice_id === invoice?.invoice_id) ?? payments[0] ?? null,
    [invoice, payments],
  );

  return (
    <PageContainer>
      <PageHeader
        eyebrow="Payment"
        description="Review invoice, payment state, method, amount, and receipt information through a clean and simple billing interface."
        title="Payment"
      />

      <div className="grid gap-4 xl:grid-cols-[1fr_1fr]">
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-text-primary">Invoice Card</h3>
          <div className="mt-5 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-text-secondary">Invoice ID</span>
              <span className="text-sm font-semibold text-text-primary">{invoice?.invoice_id ?? "-"}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-text-secondary">Payment Status</span>
              <StatusBadge status={payment?.status ?? invoice?.status ?? "Pending"} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-text-secondary">Payment Method</span>
              <span className="text-sm font-semibold text-text-primary">{payment?.payment_method ?? "-"}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-text-secondary">Amount</span>
              <span className="text-sm font-semibold text-text-primary">${(payment?.amount ?? invoice?.total ?? 0).toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-text-secondary">Receipt</span>
              <span className="text-sm font-semibold text-brand-500">{payment?.transaction_code ?? "Not available"}</span>
            </div>
          </div>
        </Card>

        <div className="grid gap-4">
          <InfoCard
            helper="Accounts receivable status from the latest payment record."
            icon="payments"
            label="Payment Status"
            value={payment?.status ?? invoice?.status ?? "Pending"}
          />
          <InfoCard
            helper="Recorded payment method for the selected invoice."
            icon="account_balance"
            label="Payment Method"
            value={payment?.payment_method ?? "-"}
          />
          <InfoCard
            helper="Transaction reference returned by the payment record."
            icon="receipt"
            label="Receipt"
            value={payment?.transaction_code ?? "Not available"}
          />
        </div>
      </div>
    </PageContainer>
  );
}
