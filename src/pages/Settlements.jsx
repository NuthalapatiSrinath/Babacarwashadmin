import React, { useState, useEffect } from "react";
import {
  CheckCircle,
  Clock,
  DollarSign,
  User,
  Calendar,
  ChevronLeft,
  ChevronRight,
  FileText,
} from "lucide-react";
import toast from "react-hot-toast";
import { paymentService } from "../api/paymentService";

const Settlements = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });

  // --- FETCH DATA ---
  const fetchData = async (page = 1) => {
    setLoading(true);
    try {
      const res = await paymentService.getSettlements(page, pagination.limit);
      setData(res.data || []);

      const total = res.total || 0;
      setPagination({
        page,
        limit: pagination.limit,
        total,
        totalPages: Math.ceil(total / pagination.limit) || 1,
      });
    } catch (error) {
      console.error("Failed to load settlements", error);
      toast.error("Could not load settlements");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(1);
  }, []);

  // --- APPROVE HANDLER ---
  const handleApprove = async (id) => {
    if (!window.confirm("Are you sure you want to approve this settlement?"))
      return;

    try {
      await paymentService.updateSettlement(id);
      toast.success("Settlement Approved!");
      fetchData(pagination.page); // Refresh list
    } catch (error) {
      console.error(error);
      toast.error("Failed to approve settlement");
    }
  };

  // --- FORMAT CURRENCY ---
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-AE", {
      style: "currency",
      currency: "AED",
    }).format(amount || 0);
  };

  return (
    <div className="p-3 w-full">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <DollarSign className="w-7 h-7 text-emerald-600" />
            Settlements
          </h1>
          <p className="text-slate-500 text-sm mt-1 ml-9">
            Track and approve payment settlements from supervisors.
          </p>
        </div>
      </div>

      {/* --- TABLE CONTAINER --- */}
      <div className="flex-1 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        {/* Table Header */}
        <div className="overflow-auto flex-1">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 sticky top-0 z-10 border-b border-slate-200">
              <tr>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Supervisor
                </th>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">
                  Total Amount
                </th>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">
                  Breakdown
                </th>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">
                  Status
                </th>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">
                  Action
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-slate-400">
                    Loading settlements...
                  </td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td
                    colSpan="6"
                    className="p-8 text-center text-slate-400 flex flex-col items-center gap-2"
                  >
                    <FileText className="w-8 h-8 opacity-20" />
                    No settlements found.
                  </td>
                </tr>
              ) : (
                data.map((row) => (
                  <tr
                    key={row._id}
                    className="hover:bg-slate-50 transition-colors"
                  >
                    {/* Date */}
                    <td className="p-4">
                      <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
                        <Calendar className="w-4 h-4 text-slate-400" />
                        {new Date(row.createdAt).toLocaleDateString()}
                      </div>
                      <div className="text-xs text-slate-400 ml-6">
                        {new Date(row.createdAt).toLocaleTimeString()}
                      </div>
                    </td>

                    {/* Supervisor */}
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xs">
                          {row.supervisor?.name?.charAt(0) || "U"}
                        </div>
                        <span className="text-sm font-bold text-slate-700">
                          {row.supervisor?.name || "Unknown"}
                        </span>
                      </div>
                    </td>

                    {/* Total Amount */}
                    <td className="p-4 text-right">
                      <span className="text-lg font-bold text-slate-800">
                        {row.amount || 0}
                      </span>
                      <span className="text-xs text-slate-400 ml-1">AED</span>
                    </td>

                    {/* Breakdown (Cash/Card/Bank) */}
                    <td className="p-4">
                      <div className="flex justify-center gap-2 text-xs">
                        <span
                          className="px-2 py-1 bg-green-50 text-green-700 rounded border border-green-100 font-medium"
                          title="Cash"
                        >
                          💵 {row.cash || 0}
                        </span>
                        <span
                          className="px-2 py-1 bg-blue-50 text-blue-700 rounded border border-blue-100 font-medium"
                          title="Card"
                        >
                          💳 {row.card || 0}
                        </span>
                        <span
                          className="px-2 py-1 bg-purple-50 text-purple-700 rounded border border-purple-100 font-medium"
                          title="Bank"
                        >
                          🏦 {row.bank || 0}
                        </span>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="p-4 text-center">
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide border ${
                          row.status === "completed"
                            ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                            : "bg-amber-100 text-amber-700 border-amber-200"
                        }`}
                      >
                        {row.status === "completed" ? (
                          <CheckCircle className="w-3 h-3" />
                        ) : (
                          <Clock className="w-3 h-3" />
                        )}
                        {row.status || "Pending"}
                      </span>
                    </td>

                    {/* Action */}
                    <td className="p-4 text-right">
                      {row.status !== "completed" && (
                        <button
                          onClick={() => handleApprove(row._id)}
                          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow-sm transition-all active:scale-95"
                        >
                          Approve
                        </button>
                      )}
                      {row.status === "completed" && (
                        <span className="text-xs font-medium text-slate-400 italic">
                          No actions
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <span className="text-xs font-medium text-slate-500">
            Page {pagination.page} of {pagination.totalPages}
          </span>
          <div className="flex gap-2">
            <button
              disabled={pagination.page === 1}
              onClick={() => fetchData(pagination.page - 1)}
              className="p-2 border rounded hover:bg-white disabled:opacity-50 transition-colors"
            >
              <ChevronLeft className="w-4 h-4 text-slate-600" />
            </button>
            <button
              disabled={pagination.page === pagination.totalPages}
              onClick={() => fetchData(pagination.page + 1)}
              className="p-2 border rounded hover:bg-white disabled:opacity-50 transition-colors"
            >
              <ChevronRight className="w-4 h-4 text-slate-600" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settlements;
