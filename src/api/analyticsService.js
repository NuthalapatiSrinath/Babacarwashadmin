import api from "./axiosInstance";

export const analyticsService = {
  // Get Summary Counts (Cards)
  getAdminStats: async (filters = {}) => {
    // Hits controller.admin -> service.admin
    const response = await api.post(
      "/analytics/admin",
      {},
      { params: filters }
    );
    return response.data;
  },

  // Get Chart Data (Graphs)
  getCharts: async (filters = {}) => {
    // Hits controller.charts -> service.charts
    const response = await api.post(
      "/analytics/admin/charts",
      {},
      { params: filters }
    );
    return response.data;
  },
};
