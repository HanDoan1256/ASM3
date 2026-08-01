export interface Invoice {
  invoice_id: number;
  order_id: string;
  subtotal: number;
  tax: number;
  total: number;
  invoice_date: string;
  status: string;
  payment_method?: string | null;
}

export interface Payment {
  payment_id: number;
  invoice_id: number;
  payment_method: string;
  payment_date: string;
  amount: number;
  status: string;
  transaction_code?: string | null;
}

export interface PaymentConfirmPayload {
  invoice_id: number;
  payment_method: string;
  payment_date: string;
  amount: number;
  status: string;
  transaction_code?: string | null;
}

