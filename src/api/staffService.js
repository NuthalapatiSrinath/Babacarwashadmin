import api from "./axiosInstance";

export const staffService = {
  list: async (page = 1, limit = 10, search = "") => {
    console.log(
      `[StaffService] List Request -> Page: ${page}, Limit: ${limit}, Search: "${search}"`
    );
    try {
      const response = await api.get("/admin/staff", {
        params: { page, limit, search },
      });
      console.log("[StaffService] List Success ->", response.data);
      return response.data;
    } catch (error) {
      console.error("[StaffService] List Error:", error);
      throw error;
    }
  },

  create: async (data) => {
    console.log("[StaffService] Create Request ->", data);
    try {
      const response = await api.post("/admin/staff", data);
      console.log("[StaffService] Create Success ->", response.data);
      return response.data;
    } catch (error) {
      console.error("[StaffService] Create Error:", error);
      throw error;
    }
  },

  update: async (id, data) => {
    console.log(`[StaffService] Update Request -> ID: ${id}`, data);
    try {
      const response = await api.put(`/admin/staff/${id}`, data);
      console.log("[StaffService] Update Success ->", response.data);
      return response.data;
    } catch (error) {
      console.error("[StaffService] Update Error:", error);
      throw error;
    }
  },

  delete: async (id, reason = "") => {
    console.log(
      `[StaffService] Delete Request -> ID: ${id}, Reason: "${reason}"`
    );
    try {
      const response = await api.delete(`/admin/staff/${id}`, {
        data: { reason },
      });
      console.log("[StaffService] Delete Success ->", response.data);
      return response.data;
    } catch (error) {
      console.error(
        "[StaffService] Delete Error:",
        error.response?.data || error.message
      );
      throw error;
    }
  },

  uploadDocument: async (id, file, documentType) => {
    console.log(
      `[StaffService] Upload Document Request -> ID: ${id}, Type: ${documentType}, File: ${file.name}`
    );
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("documentType", documentType);

      const response = await api.post(
        `/admin/staff/${id}/upload-document`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      console.log("[StaffService] Upload Document Success ->", response.data);
      return response.data;
    } catch (error) {
      console.error("[StaffService] Upload Document Error:", error);
      throw error;
    }
  },

  deleteDocument: async (id, documentType) => {
    console.log(
      `[StaffService] Delete Document Request -> ID: ${id}, Type: ${documentType}`
    );
    try {
      const response = await api.delete(`/admin/staff/${id}/document`, {
        data: { documentType },
      });
      console.log("[StaffService] Delete Document Success ->", response.data);
      return response.data;
    } catch (error) {
      console.error("[StaffService] Delete Document Error:", error);
      throw error;
    }
  },

  // ✅ GET DOCUMENT URL (Clean & Fixed)
  getDocumentUrl: (id, documentType) => {
    const token = localStorage.getItem("token") || "";
    let baseUrl = api.defaults.baseURL || "http://localhost:3002";

    // Normalize Base URL (Remove /api and trailing slashes)
    baseUrl = baseUrl.replace(/\/api\/?$/, "").replace(/\/$/, "");

    // Construct URL always with exactly one '/api'
    const finalUrl = `${baseUrl}/api/admin/staff/${id}/document/${documentType}?token=${token}`;
    console.log(`[StaffService] Generated Document URL -> ${finalUrl}`);
    return finalUrl;
  },

  exportData: async () => {
    console.log("[StaffService] Export Data Request");
    try {
      const response = await api.get("/admin/staff/export", {
        responseType: "blob",
      });
      console.log("[StaffService] Export Data Success");
      return response.data;
    } catch (error) {
      console.error("[StaffService] Export Data Error:", error);
      throw error;
    }
  },

  importData: async (formData) => {
    console.log("[StaffService] Import Data Request");
    try {
      const response = await api.post("/admin/staff/import", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      console.log("[StaffService] Import Data Success ->", response.data);
      return response.data;
    } catch (error) {
      console.error("[StaffService] Import Data Error:", error);
      throw error;
    }
  },

  getExpiringDocuments: async () => {
    console.log("[StaffService] Get Expiring Request");
    try {
      const response = await api.get("/admin/staff/expiring");
      console.log("[StaffService] Get Expiring Success ->", response.data);
      return response.data;
    } catch (error) {
      console.error("[StaffService] Get Expiring Error:", error);
      throw error;
    }
  },

  // ✅ UPLOAD PROFILE IMAGE
  uploadProfileImage: async (id, file) => {
    console.log(`[StaffService] Uploading Profile Image -> ID: ${id}`);
    try {
      const formData = new FormData();
      formData.append("file", file); // Backend expects 'file'

      const response = await api.post(
        `/admin/staff/${id}/profile-image`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      console.log("[StaffService] Profile Image Success ->", response.data);
      return response.data;
    } catch (error) {
      console.error("[StaffService] Profile Image Error:", error);
      throw error;
    }
  },
};
