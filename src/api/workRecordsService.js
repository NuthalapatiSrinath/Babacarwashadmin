import api from "./axiosInstance";

export const workRecordsService = {
  // 1. Standard Excel Download (Blob)
  downloadStatement: async (serviceType, month, year) => {
    const baseUrl = serviceType === "onewash" ? "/onewash" : "/jobs";
    // Frontend (1-12) to Backend (0-11)
    const adjustedMonth = parseInt(month, 10) - 1;

    const response = await api.get(`${baseUrl}/export/statement/monthly`, {
      params: {
        service_type: serviceType,
        year: year,
        month: adjustedMonth,
      },
      responseType: "blob", // Forces response to be a file
    });

    return response.data;
  },

  // 2. JSON Data Fetch for Rich PDF (Corrected Route)
  getStatementData: async (year, month, serviceType) => {
    const baseUrl = serviceType === "onewash" ? "/onewash" : "/jobs";
    const adjustedMonth = parseInt(month, 10) - 1;

    // Hits the SAME endpoint but asks for JSON format
    const response = await api.get(`${baseUrl}/export/statement/monthly`, {
      params: {
        year: year,
        month: adjustedMonth,
        service_type: serviceType,
        format: "json", // ✅ Triggers JSON response from backend
      },
    });
    return response.data;
  },
};
