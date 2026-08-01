import { api } from "./api";
import type {
  Address,
  AddressCreatePayload,
  AddressUpdatePayload,
  Customer,
  CustomerUpdatePayload,
} from "../types/account";

export const accountService = {
  getCustomer: async (customerId: string): Promise<Customer> => {
    const response = await api.get(`/accounts/customers/${customerId}`);
    return response.data;
  },

  updateCustomer: async (customerId: string, payload: CustomerUpdatePayload): Promise<Customer> => {
    const response = await api.put(`/accounts/customers/${customerId}`, payload);
    return response.data;
  },

  deleteCustomer: async (customerId: string): Promise<void> => {
    await api.delete(`/accounts/customers/${customerId}`);
  },

  listAddresses: async (customerId: string): Promise<Address[]> => {
    const response = await api.get(`/accounts/customers/${customerId}/addresses`);
    return response.data;
  },

  createAddress: async (customerId: string, payload: AddressCreatePayload): Promise<Address> => {
    const response = await api.post(`/accounts/customers/${customerId}/addresses`, payload);
    return response.data;
  },

  updateAddress: async (addressId: number, payload: AddressUpdatePayload): Promise<Address> => {
    const response = await api.put(`/accounts/addresses/${addressId}`, payload);
    return response.data;
  },

  deleteAddress: async (addressId: number): Promise<void> => {
    await api.delete(`/accounts/addresses/${addressId}`);
  },

  getHistory: async (customerId: string): Promise<any[]> => {
    const response = await api.get(`/accounts/customers/${customerId}/history`);
    return response.data;
  },
};
