import { api } from "./api";
import type { DashboardOverview, ReportRecord } from "../types/report";

export const reportService = {
  getDashboardOverview: async (): Promise<DashboardOverview> => {
    const response = await api.get("/reports/dashboard");
    return response.data;
  },
  listReports: async (): Promise<ReportRecord[]> => {
    const response = await api.get("/reports");
    return response.data;
  },
};
