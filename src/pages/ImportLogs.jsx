import React, { useState, useEffect, useMemo } from "react";
import { FileText, Eye, AlertCircle, CheckCircle, Copy, X } from "lucide-react";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";

// Components
import DataTable from "../components/DataTable";

// API
import { importLogsService } from "../api/importLogsService";

const ImportLogs = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);

  // Pagination State
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 1,
  });

  // Modal State
  const [selectedLog, setSelectedLog] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // --- Fetch Data ---
  const fetchData = async (page = 1, limit = 50) => {
    setLoading(true);
    try {
      const response = await importLogsService.list(page, limit);
      const records = response.data || [];
      const totalRecords = response.total || 0;

      setData(records);
      setPagination({
        page,
        limit,
        total: totalRecords,
        totalPages: Math.ceil(totalRecords / limit) || 1,
      });
    } catch (error) {
      toast.error("Failed to load import logs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(pagination.page, pagination.limit);
  }, []);

  // --- Handlers ---
  const handleView = (log) => {
    setSelectedLog(log);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    // Slight delay to clear data so it doesn't flash empty during exit animation
    setTimeout(() => setSelectedLog(null), 300);
  };

  // --- OPTIMIZATION: Limit Displayed Errors ---
  // Renders max 100 items to prevent modal lag
  const displayErrors = useMemo(() => {
    if (!selectedLog?.logs?.errors) return [];
    return selectedLog.logs.errors.slice(0, 100);
  }, [selectedLog]);

  const displayDuplicates = useMemo(() => {
    if (!selectedLog?.logs?.duplicates) return [];
    return selectedLog.logs.duplicates.slice(0, 100);
  }, [selectedLog]);

  // --- Columns ---
  const columns = [
    {
      header: "Date",
      accessor: "createdAt",
      className: "w-40",
      render: (row) => (
        <span className="text-slate-600 text-sm font-medium">
          {new Date(row.createdAt).toLocaleString()}
        </span>
      ),
    },
    {
      header: "Type",
      accessor: "type",
      render: (row) => (
        <span className="px-2.5 py-1 rounded-md bg-blue-50 text-blue-600 text-xs font-bold uppercase tracking-wide">
          {row.type}
        </span>
      ),
    },
    {
      header: "Success",
      accessor: "logs.success",
      render: (row) => (
        <div className="flex items-center gap-1.5 text-green-600 font-medium">
          <CheckCircle className="w-4 h-4" />
          {row.logs?.success || 0}
        </div>
      ),
    },
    {
      header: "Errors",
      accessor: "logs.errors",
      render: (row) => (
        <div
          className={`flex items-center gap-1.5 font-medium ${
            row.logs?.errors?.length > 0 ? "text-red-600" : "text-slate-400"
          }`}
        >
          <AlertCircle className="w-4 h-4" />
          {row.logs?.errors?.length || 0}
        </div>
      ),
    },
    {
      header: "Duplicates",
      accessor: "logs.duplicates",
      render: (row) => (
        <div
          className={`flex items-center gap-1.5 font-medium ${
            row.logs?.duplicates?.length > 0
              ? "text-amber-600"
              : "text-slate-400"
          }`}
        >
          <Copy className="w-4 h-4" />
          {row.logs?.duplicates?.length || 0}
        </div>
      ),
    },
    {
      header: "Action",
      className: "text-right",
      render: (row) => (
        <button
          onClick={() => handleView(row)}
          className="p-1.5 rounded-md hover:bg-slate-100 text-slate-500 hover:text-indigo-600 transition-colors"
          title="View Details"
        >
          <Eye className="w-4 h-4" />
        </button>
      ),
    },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800">Import Logs</h1>
        <p className="text-slate-500 mt-1">
          Track history of bulk data imports
        </p>
      </div>

      <DataTable
        title="History"
        columns={columns}
        data={data}
        loading={loading}
        pagination={pagination}
        onPageChange={(p) => fetchData(p, pagination.limit)}
        onLimitChange={(l) => fetchData(1, l)}
      />

      {/* --- OPTIMIZED MODAL --- */}
      <AnimatePresence>
        {isModalOpen && selectedLog && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* 1. Light Backdrop (Fast Fade, No Blur) */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              onClick={closeModal}
              className="absolute inset-0 bg-black/40"
            />

            {/* 2. Modal Content (Snappy Spring Animation) */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ type: "spring", stiffness: 350, damping: 25 }}
              className="bg-white w-full max-w-2xl rounded-xl shadow-2xl relative z-10 flex flex-col max-h-[85vh] overflow-hidden"
            >
              {/* Header */}
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-white">
                <div>
                  <h3 className="text-lg font-bold text-slate-800">
                    Import Details
                  </h3>
                  <p className="text-xs text-slate-500 uppercase font-bold tracking-wider mt-1">
                    {selectedLog.type}
                  </p>
                </div>
                <button
                  onClick={closeModal}
                  className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Body */}
              <div className="p-6 overflow-y-auto space-y-6">
                {/* Stats Grid */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-4 rounded-lg bg-green-50 border border-green-100 flex flex-col items-center">
                    <span className="text-2xl font-bold text-green-600">
                      {selectedLog.logs?.success || 0}
                    </span>
                    <span className="text-xs font-bold text-green-700 uppercase tracking-wide">
                      Success
                    </span>
                  </div>
                  <div className="p-4 rounded-lg bg-red-50 border border-red-100 flex flex-col items-center">
                    <span className="text-2xl font-bold text-red-600">
                      {selectedLog.logs?.errors?.length || 0}
                    </span>
                    <span className="text-xs font-bold text-red-700 uppercase tracking-wide">
                      Errors
                    </span>
                  </div>
                  <div className="p-4 rounded-lg bg-amber-50 border border-amber-100 flex flex-col items-center">
                    <span className="text-2xl font-bold text-amber-600">
                      {selectedLog.logs?.duplicates?.length || 0}
                    </span>
                    <span className="text-xs font-bold text-amber-700 uppercase tracking-wide">
                      Duplicates
                    </span>
                  </div>
                </div>

                {/* Error List (CAPPED) */}
                {displayErrors.length > 0 && (
                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-red-500" /> Errors
                      </h4>
                      {selectedLog.logs.errors.length > 100 && (
                        <span className="text-[10px] text-red-500 bg-red-50 px-2 py-0.5 rounded-full font-medium">
                          Showing 100 of {selectedLog.logs.errors.length}
                        </span>
                      )}
                    </div>

                    <div className="bg-red-50/50 rounded-lg border border-red-100 p-3 max-h-48 overflow-y-auto">
                      <ul className="space-y-2">
                        {displayErrors.map((err, idx) => (
                          <li
                            key={idx}
                            className="text-xs text-red-700 font-mono break-all bg-white p-2 rounded border border-red-100/60 shadow-sm"
                          >
                            {typeof err === "object"
                              ? JSON.stringify(err)
                              : err}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}

                {/* Duplicate List (CAPPED) */}
                {displayDuplicates.length > 0 && (
                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                        <Copy className="w-4 h-4 text-amber-500" /> Duplicates
                      </h4>
                      {selectedLog.logs.duplicates.length > 100 && (
                        <span className="text-[10px] text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full font-medium">
                          Showing 100 of {selectedLog.logs.duplicates.length}
                        </span>
                      )}
                    </div>

                    <div className="bg-amber-50/50 rounded-lg border border-amber-100 p-3 max-h-48 overflow-y-auto">
                      <ul className="space-y-2">
                        {displayDuplicates.map((dup, idx) => (
                          <li
                            key={idx}
                            className="text-xs text-amber-700 font-mono break-all bg-white p-2 rounded border border-amber-100/60 shadow-sm"
                          >
                            {typeof dup === "object"
                              ? JSON.stringify(dup)
                              : dup}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}

                {/* Empty State */}
                {!selectedLog.logs?.errors?.length &&
                  !selectedLog.logs?.duplicates?.length && (
                    <div className="text-center py-8 text-slate-400">
                      <CheckCircle className="w-12 h-12 mx-auto mb-3 text-green-100" />
                      <p>Clean import. No errors or duplicates found.</p>
                    </div>
                  )}
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
                <button
                  onClick={closeModal}
                  className="px-4 py-2 bg-white border border-slate-300 text-slate-700 font-medium rounded-lg hover:bg-slate-50 transition-colors text-sm"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ImportLogs;
