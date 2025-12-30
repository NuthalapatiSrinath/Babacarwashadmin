import api from "./axiosInstance";

export const paymentService = {
  // 1. List Payments (Main Table)
  list: async (page = 1, limit = 10, search = "", filters = {}) => {
    const params = {
      pageNo: page - 1,
      pageSize: limit,
      search: search || "",
      ...filters,
    };
    const response = await api.get("/payments", { params });
    return response.data;
  },

  // 2. Export Data (General Export)
  exportData: async (filters = {}) => {
    const response = await api.get("/payments/export/list", {
      params: filters,
      responseType: "blob",
    });
    return response.data;
  },

  // 3. Update Payment (Generic Update for Mode/Amount/Notes)
  // Uses PUT /payments/:id to allow updating payment_mode
  updatePayment: async (id, data) => {
    const response = await api.put(`/payments/${id}`, data);
    return response.data;
  },

  // 4. Collect Payment (Specific Logic for collecting cash/card)
  collect: async (id, amount, mode, date) => {
    const payload = {
      amount: Number(amount),
      payment_mode: mode,
      payment_date: date,
    };
    const response = await api.put(`/payments/${id}/collect`, payload);
    return response.data;
  },

  // 5. Download Collection Sheet (Monthly Statement for Residence)
  downloadCollectionSheet: async ({
    serviceType,
    year,
    month,
    building,
    worker,
  }) => {
    // Backend expects 0-indexed month (0=Jan, 11=Dec)
    // Frontend sends 1-indexed (1=Jan), so subtract 1
    const adjustedMonth = parseInt(month, 10) - 1;

    const response = await api.get("/payments/export/statement/monthly", {
      params: {
        service_type: serviceType,
        year: year,
        month: adjustedMonth,
        building: building || "all",
        worker: worker || "all",
      },
      responseType: "blob", // Critical for file download
    });
    return response.data;
  },
};
