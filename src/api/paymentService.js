import api from "./axiosInstance";

export const paymentService = {
  // --- EXISTING METHODS ---

  // List Payments
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

  // Export Data
  exportData: async (filters = {}) => {
    const response = await api.get("/payments/export/list", {
      params: filters,
      responseType: "blob",
    });
    return response.data;
  },

  // Update Payment (Generic)
  updatePayment: async (id, data) => {
    console.log("🔵 [API] Calling PUT /payments/:id", {
      id,
      data,
      url: `/payments/${id}`,
    });
    const response = await api.put(`/payments/${id}`, data);
    console.log("✅ [API] PUT /payments/:id Response:", response.data);
    return response.data;
  },

  // Collect Payment
  collect: async (id, amount, mode, date) => {
    const payload = {
      amount: Number(amount),
      payment_mode: mode,
      payment_date: date,
    };
    const response = await api.put(`/payments/${id}/collect`, payload);
    return response.data;
  },

  // Settle Payment
  settlePayment: async (payload) => {
    const response = await api.put("/payments/collect/settle", payload);
    return response.data;
  },

  // Delete Payment
  deletePayment: async (id) => {
    console.log("🔵 [API] Calling DELETE /payments/:id", {
      id,
      url: `/payments/${id}`,
    });
    const response = await api.delete(`/payments/${id}`);
    console.log("✅ [API] DELETE /payments/:id Response:", response.data);
    return response.data;
  },

  // Download Collection Sheet
  downloadCollectionSheet: async ({
    serviceType,
    year,
    month,
    building,
    worker,
  }) => {
    const adjustedMonth = parseInt(month, 10) - 1;
    const response = await api.get("/payments/export/statement/monthly", {
      params: {
        service_type: serviceType,
        year: year,
        month: adjustedMonth,
        building: building || "all",
        worker: worker || "all",
      },
      responseType: "blob",
    });
    return response.data;
  },

  // --- NEW: SETTLEMENTS API ---

  // 1. Get List of Settlements
  // Hits: GET /payments/settlements/list
  // 1. Get List of Settlements
  // --- NEW: SETTLEMENTS API ---

  // 1. Get List of Settlements
  getSettlements: async (page = 1, limit = 10) => {
    // Backend uses 0-based pagination: page 1 should send pageNo: 0
    const params = {
      pageNo: page - 1,
      pageSize: limit,
    };
    const response = await api.get("/payments/settlements/list", { params });
    return response.data;
  },

  bulkStatus: async (ids, status) => {
    const response = await api.put("/payments/bulk/status", { ids, status });
    return response.data;
  },

  // 2. Approve/Update Settlement
  updateSettlement: async (id) => {
    const response = await api.put(`/payments/settlements/${id}`, {});
    return response.data;
  },
};
