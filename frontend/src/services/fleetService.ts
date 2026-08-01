import { api } from "./api";
import type { Allocation, Branch, Driver, Vehicle } from "../types/fleet";

export const fleetService = {
  listBranches: async (): Promise<Branch[]> => {
    const response = await api.get("/fleet/branches");
    return response.data;
  },
  listVehicles: async (): Promise<Vehicle[]> => {
    const response = await api.get("/fleet/vehicles");
    return response.data;
  },
  listDrivers: async (): Promise<Driver[]> => {
    const response = await api.get("/fleet/drivers");
    return response.data;
  },
  listAllocations: async (): Promise<Allocation[]> => {
    const response = await api.get("/fleet/allocations");
    return response.data;
  },
  updateVehicle: async (vehicleId: string, payload: Partial<Vehicle>): Promise<Vehicle> => {
    const response = await api.put(`/fleet/vehicles/${vehicleId}`, payload);
    return response.data;
  },
  allocateOrder: async (orderId: string): Promise<{ message: string }> => {
    const response = await api.post(`/fleet/orders/${orderId}/allocate`);
    return response.data;
  },
};

