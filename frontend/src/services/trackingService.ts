import { api } from "./api";
import type { 
  ShipmentRecord, 
  TrackingHistoryItem, 
  TrackingRecord, 
  TrackingStatusUpdatePayload 
} from "../types/tracking";

export const trackingService = {
  getTracking: async (trackId: string): Promise<TrackingRecord> => {
    const response = await api.get(`/tracking/${trackId}`);
    return response.data;
  },

  getTrackingHistory: async (trackId: string): Promise<TrackingHistoryItem[]> => {
    const response = await api.get(`/tracking/${trackId}/history`);
    return response.data;
  },

  updateTrackingEvent: async (
    trackId: string, 
    payload: TrackingStatusUpdatePayload
  ): Promise<TrackingRecord> => {
    const response = await api.post(`/tracking/${trackId}/events`, payload);
    return response.data;
  },

  getShipment: async (shipmentId: number): Promise<ShipmentRecord> => {
    const response = await api.get(`/tracking/shipments/${shipmentId}`);
    return response.data;
  },

  getShipmentByOrder: async (orderId: string): Promise<ShipmentRecord> => {
    const response = await api.get(`/tracking/orders/${orderId}`);
    return response.data;
  },
};
