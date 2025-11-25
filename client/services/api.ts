import axios from "axios";

const api = axios.create({
  baseURL: "/api", // Proxy in Vite or relative path if served from same origin
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;

// Reports API
export const reportsApi = {
  getAnalytics: (timeRange: string = "30days") =>
    api.get(`/reports/analytics?timeRange=${timeRange}`),

  exportCSV: (timeRange: string = "30days") => {
    const token = localStorage.getItem("token");
    window.open(
      `/api/reports/export?timeRange=${timeRange}&token=${token}`,
      "_blank"
    );
  },
};
