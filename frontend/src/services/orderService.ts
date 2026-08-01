import { api } from "./api";
import type {
  OrderCreatePayload,
  OrderDetailResponse,
  OrderEstimatePayload,
  OrderEstimateResponse,
  OrderSummary,
  ServiceOption,
  ShipmentOrder,
} from "../types/order";

export const orderService = {
  listServiceOptions: async (): Promise<ServiceOption[]> => {
    const response = await api.get("/service-options");
    return response.data;
  },
  listOrders: async (): Promise<OrderSummary[]> => {
    const response = await api.get("/orders");
    return response.data;
  },
  estimateOrder: async (payload: OrderEstimatePayload): Promise<OrderEstimateResponse> => {
    const response = await api.post("/orders/estimate", payload);
    return response.data;
  },
  createOrder: async (payload: OrderCreatePayload): Promise<ShipmentOrder> => {
    const response = await api.post("/orders", payload);
    return response.data;
  },
  getOrderById: async (orderId: string): Promise<OrderDetailResponse> => {
    const response = await api.get(`/orders/${orderId}`);
    return response.data;
  },
  approveOrder: async (orderId: string): Promise<{ order: ShipmentOrder; shipment_id: number }> => {
    const response = await api.post(`/orders/${orderId}/approve`);
    return response.data;
  },
};
