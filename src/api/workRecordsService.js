import api from "./axiosInstance";

export const workRecordsService = {
  downloadStatement: async (serviceType, month, year) => {
    // 1. Determine Endpoint based on Service Type
    // - OneWash uses the '/onewash' route
    // - Residence uses the '/jobs' route (based on the code you provided)
    const baseUrl = serviceType === "onewash" ? "/onewash" : "/jobs";

    // 2. Fix Date Index
    // Frontend sends 1 for Jan, but Backend 'new Date()' expects 0 for Jan.
    // We must subtract 1.
    const adjustedMonth = parseInt(month, 10) - 1;

    const response = await api.get(`${baseUrl}/export/statement/monthly`, {
      params: {
        service_type: serviceType,
        year: year,
        month: adjustedMonth,
      },
      responseType: "blob", // CRITICAL: Forces response to be a file
    });

    return response.data;
  },
};
