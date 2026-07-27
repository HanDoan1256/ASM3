import { api } from "./api";
import type { Invoice, Payment } from "../types/payment";

export const paymentService = {
  listInvoices: async (): Promise<Invoice[]> => {
    const response = await api.get("/payments/invoices");
    return response.data;
  },
  listPayments: async (): Promise<Payment[]> => {
    const response = await api.get("/payments");
    return response.data;
  },
  getInvoiceByOrder: async (orderId: string): Promise<Invoice> => {
    const response = await api.get(`/payments/orders/${orderId}/invoice`);
    return response.data;
  },
};

