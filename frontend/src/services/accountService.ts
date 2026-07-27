import { api } from "./api";
import type { Address, AddressCreatePayload, Customer, CustomerUpdatePayload } from "../types/account";

export const accountService = {
  getCustomer: async (customerId: string): Promise<Customer> => {
    const response = await api.get(`/accounts/customers/${customerId}`);
    return response.data;
  },
  updateCustomer: async (customerId: string, payload: CustomerUpdatePayload): Promise<Customer> => {
    const response = await api.put(`/accounts/customers/${customerId}`, payload);
    return response.data;
  },
  listAddresses: async (customerId: string): Promise<Address[]> => {
    const response = await api.get(`/accounts/customers/${customerId}/addresses`);
    return response.data;
  },
  createAddress: async (customerId: string, payload: AddressCreatePayload): Promise<Address> => {
    const response = await api.post(`/accounts/customers/${customerId}/addresses`, payload);
    return response.data;
  },
};

