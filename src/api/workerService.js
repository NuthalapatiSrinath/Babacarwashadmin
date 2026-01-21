import api from "./axiosInstance";

export const workerService = {
  // ==========================================
  // 🟢 EXISTING WORKER METHODS (PRESERVED)
  // ==========================================

  // List
  list: async (page = 1, limit = 10, search = "", status = 1) => {
    console.log(
      `👷 [WorkerService] Fetching list: page=${page}, limit=${limit}, search="${search}", status=${status}`,
    );
    try {
      // Backend expects 'pageNo' (starts at 0) and 'pageSize'
      const params = {
        pageNo: page - 1, // Convert 1-based UI page to 0-based backend page
        pageSize: limit,
        search,
        status,
      };
      const response = await api.get("/workers", { params });
      console.log("✅ [WorkerService] List success:", response.data);
      return response.data;
    } catch (error) {
      console.error("❌ [WorkerService] List error:", error);
      throw error;
    }
  },

  // Create
  create: async (data) => {
    console.log("➕ [WorkerService] Creating worker:", data);
    try {
      const response = await api.post("/workers", data);
      console.log("✅ [WorkerService] Create success:", response.data);
      return response.data;
    } catch (error) {
      console.error("❌ [WorkerService] Create error:", error);
      throw error;
    }
  },

  // Update
  update: async (id, data) => {
    console.log(`✏️ [WorkerService] Updating worker ${id}:`, data);
    try {
      const response = await api.put(`/workers/${id}`, data);
      console.log("✅ [WorkerService] Update success:", response.data);
      return response.data;
    } catch (error) {
      console.error("❌ [WorkerService] Update error:", error);
      throw error;
    }
  },

  // Delete
  delete: async (id) => {
    console.log(`🗑️ [WorkerService] Deleting worker ${id}`);
    try {
      const response = await api.delete(`/workers/${id}`);
      console.log("✅ [WorkerService] Delete success:", response.data);
      return response.data;
    } catch (error) {
      console.error("❌ [WorkerService] Delete error:", error);
      throw error;
    }
  },

  // Info
  info: async (id) => {
    console.log(`📋 [WorkerService] Fetching worker info for ${id}`);
    try {
      const response = await api.get(`/workers/${id}`);
      console.log("✅ [WorkerService] Info success:", response.data);
      return response.data;
    } catch (error) {
      console.error("❌ [WorkerService] Info error:", error);
      throw error;
    }
  },

  // Deactivate
  deactivate: async (id, payload) => {
    console.log(`⏸️ [WorkerService] Deactivating worker ${id}:`, payload);
    try {
      const response = await api.put(`/workers/${id}/deactivate`, payload);
      console.log("✅ [WorkerService] Deactivate success:", response.data);
      return response.data;
    } catch (error) {
      console.error("❌ [WorkerService] Deactivate error:", error);
      throw error;
    }
  },

  // Activate
  activate: async (id) => {
    console.log(`✅ [WorkerService] Activating worker ${id}`);
    try {
      const response = await api.put(`/workers/${id}/activate`);
      console.log("✅ [WorkerService] Activate success:", response.data);
      return response.data;
    } catch (error) {
      console.error("❌ [WorkerService] Activate error:", error);
      throw error;
    }
  },

  // Undo Delete
  undoDelete: async (id) => {
    console.log(`♻️ [WorkerService] Undoing delete for worker ${id}`);
    try {
      const response = await api.delete(`/workers/${id}/undo`);
      console.log("✅ [WorkerService] Undo delete success:", response.data);
      return response.data;
    } catch (error) {
      console.error("❌ [WorkerService] Undo delete error:", error);
      throw error;
    }
  },

  // Customers List
  customers: async (id) => {
    console.log(`👥 [WorkerService] Fetching customers for worker ${id}`);
    try {
      const response = await api.get(`/workers/${id}/customers`);
      console.log("✅ [WorkerService] Customers success:", response.data);
      return response.data;
    } catch (error) {
      console.error("❌ [WorkerService] Customers error:", error);
      throw error;
    }
  },

  // Payment History (Washes List)
  payments: async (id, params = {}) => {
    console.log(
      `💰 [WorkerService] Fetching payments for worker ${id}:`,
      params,
    );
    try {
      const response = await api.get(`/workers/${id}/history`, { params });
      console.log("✅ [WorkerService] Payments success:", response.data);
      return response.data;
    } catch (error) {
      console.error("❌ [WorkerService] Payments error:", error);
      throw error;
    }
  },

  // ==========================================
  // 🔵 NEW METHODS (MERGED FROM STAFF)
  // ==========================================

  // Upload Document
  uploadDocument: async (id, file, documentType) => {
    console.log(
      `📄 [WorkerService] Uploading ${documentType} for worker ${id}`,
    );
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("documentType", documentType);

      const response = await api.post(
        `/workers/${id}/upload-document`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } },
      );
      console.log("✅ [WorkerService] Document upload success");
      return response.data;
    } catch (error) {
      console.error("❌ [WorkerService] Document upload error:", error);
      throw error;
    }
  },

  // Upload Profile Image
  uploadProfileImage: async (id, file) => {
    console.log(`📸 [WorkerService] Uploading profile image for worker ${id}`);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await api.post(
        `/workers/${id}/profile-image`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } },
      );
      console.log("✅ [WorkerService] Profile image success");
      return response.data;
    } catch (error) {
      console.error("❌ [WorkerService] Profile image error:", error);
      throw error;
    }
  },

  // Delete Document
  deleteDocument: async (id, documentType) => {
    console.log(`🗑️ [WorkerService] Deleting ${documentType} for worker ${id}`);
    try {
      const response = await api.delete(`/workers/${id}/document`, {
        data: { documentType },
      });
      console.log("✅ [WorkerService] Document delete success");
      return response.data;
    } catch (error) {
      console.error("❌ [WorkerService] Document delete error:", error);
      throw error;
    }
  },

  // Export Data (Excel)
  // Export Data (Excel)
  exportData: async (status) => {
    // ✅ Accept status param
    console.log(
      `📥 [WorkerService] Exporting worker data for status: ${status}...`,
    );
    try {
      const response = await api.get("/workers/export", {
        params: { status }, // ✅ Send as query param
        responseType: "blob",
      });
      console.log("✅ [WorkerService] Export success");
      return response.data;
    } catch (error) {
      console.error("❌ [WorkerService] Export error:", error);
      throw error;
    }
  },
  // Generate Template
  generateTemplate: async () => {
    console.log(`📋 [WorkerService] Generating import template...`);
    try {
      const response = await api.get("/workers/template", {
        responseType: "blob",
      });
      console.log("✅ [WorkerService] Template success");
      return response.data;
    } catch (error) {
      console.error("❌ [WorkerService] Template error:", error);
      throw error;
    }
  },

  // Import Data (Excel)
  importData: async (formData) => {
    console.log(`📤 [WorkerService] Importing worker data...`);
    try {
      const response = await api.post("/workers/import", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      console.log("✅ [WorkerService] Import success:", response.data);
      return response.data;
    } catch (error) {
      console.error("❌ [WorkerService] Import error:", error);
      throw error;
    }
  },

  // Get Expiring Documents
  getExpiringDocuments: async () => {
    console.log(`⚠️ [WorkerService] Fetching expiring documents...`);
    try {
      const response = await api.get("/workers/expiring");
      console.log("✅ [WorkerService] Expiring docs success:", response.data);
      return response.data;
    } catch (error) {
      console.error("❌ [WorkerService] Expiring docs error:", error);
      throw error;
    }
  },
};
