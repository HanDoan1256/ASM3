import axios from "axios";

// Trỏ đúng đến cổng 8000 và tiền tố /api/accounts của backend FastAPI
const API_BASE_URL = "http://localhost:8000/api/accounts/customers";

export const accountService = {
  getCustomer: async (id: string) => {
    const response = await axios.get(`${API_BASE_URL}/${id}`);
    return response.data;
  },

  updateCustomer: async (id: string, payload: any) => {
    const response = await axios.put(`${API_BASE_URL}/${id}`, payload);
    return response.data;
  },

  deleteCustomer: async (id: string) => {
    const response = await axios.delete(`${API_BASE_URL}/${id}`);
    return response;
  },

  getAddresses: async (id: string) => {
    const response = await axios.get(`${API_BASE_URL}/${id}/addresses`);
    return response.data;
  },

  getHistory: async (id: string) => {
    const response = await axios.get(`${API_BASE_URL}/${id}/history`);
    return response.data;
  }
};