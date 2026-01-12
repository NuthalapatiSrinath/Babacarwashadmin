import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Download,
  Search,
  Filter,
  User,
  Banknote,
  CreditCard,
  Landmark,
  FileText,
  Edit2,
  Trash2,
  Eye,
  ShoppingBag,
  Plus,
  Calendar,
  Car,
  CheckCircle2,
  Clock,
} from "lucide-react";
import toast from "react-hot-toast";

// Components
import DataTable from "../../components/DataTable";
import ReceiptModal from "../../components/modals/ReceiptModal";
import ViewPaymentModal from "../../components/modals/ViewPaymentModal";
import OneWashModal from "../../components/modals/OneWashModal";
import DeleteModal from "../../components/modals/DeleteModal";
import RichDateRangePicker from "../../components/inputs/RichDateRangePicker";

// Redux
import { exportPayments } from "../../redux/slices/paymentSlice";
import { fetchWorkers } from "../../redux/slices/workerSlice";
import { fetchOneWash, deleteOneWash } from "../../redux/slices/oneWashSlice";

const OneWashPayments = () => {
  const dispatch = useDispatch();

  // Redux State
  const { oneWashJobs, stats, total, loading } = useSelector(
    (state) => state.oneWash
  );
  const { workers } = useSelector((state) => state.worker);

  // --- DATES & TABS LOGIC ---

  // Get dynamic month names (e.g., "December", "January")
  const getMonthNames = () => {
    const today = new Date();
    const thisMonth = today.toLocaleString("default", { month: "long" });

    const prevDate = new Date();
    prevDate.setMonth(prevDate.getMonth() - 1);
    const lastMonth = prevDate.toLocaleString("default", { month: "long" });

    return { thisMonth, lastMonth };
  };

  const { thisMonth, lastMonth } = getMonthNames();

  // Helper to generate ISO strings with your backend's 18:30 offset
  const getRangeForTab = (tab) => {
    const today = new Date();
    let start, end;

    if (tab === "this_month") {
      // Start: 1st of This Month
      start = new Date(today.getFullYear(), today.getMonth(), 1);
      start.setDate(start.getDate() - 1); // Go back 1 day
      start.setUTCHours(18, 30, 0, 0); // 18:30 UTC

      // End: Today
      end = new Date();
      end.setUTCHours(18, 29, 59, 999);
    } else {
      // Last Month
      // Start: 1st of Prev Month
      start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      start.setDate(start.getDate() - 1);
      start.setUTCHours(18, 30, 0, 0);

      // End: Last Day of Prev Month
      end = new Date(today.getFullYear(), today.getMonth(), 0);
      end.setUTCHours(18, 29, 59, 999);
    }

    return {
      startDate: start.toISOString(),
      endDate: end.toISOString(),
    };
  };

  // State
  const [activeTab, setActiveTab] = useState("this_month"); // 'this_month' or 'last_month'
  const initialDates = getRangeForTab("this_month");

  // Filters
  const [filters, setFilters] = useState({
    startDate: initialDates.startDate,
    endDate: initialDates.endDate,
    worker: "",
    status: "",
    service_type: "",
    mall: "",
    building: "",
  });

  const [searchTerm, setSearchTerm] = useState("");

  // Default Limit 50
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 1,
  });

  // --- MODAL STATES ---
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [viewPayment, setViewPayment] = useState(null);
  const [editJob, setEditJob] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [deleteJob, setDeleteJob] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    dispatch(fetchWorkers({ page: 1, limit: 1000, status: 1 }));
    fetchData(1, 50);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch]);

  // --- AUTOMATIC FETCH EFFECTS ---
  // Trigger when filters (dates/tabs) change
  useEffect(() => {
    fetchData(1, pagination.limit);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  // Trigger when Search Term changes (Debounced)
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      // If searching, fetch more data (up to 3000) to filter client-side
      const limit = searchTerm ? 3000 : 50;
      fetchData(1, limit);
    }, 500);
    return () => clearTimeout(delayDebounceFn);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm]);

  const fetchData = async (page = 1, limit = 50) => {
    try {
      const apiFilters = { ...filters };
      // Dates are already in correct ISO format from logic

      const isSearching = searchTerm.trim().length > 0;
      const fetchLimit = isSearching ? 3000 : limit;

      const result = await dispatch(
        fetchOneWash({
          page,
          limit: fetchLimit,
          search: "", // Don't use backend search, fetch all & filter here
          filters: apiFilters,
        })
      ).unwrap();

      setPagination({
        page,
        limit: fetchLimit,
        total: result.total || 0,
        totalPages: Math.ceil((result.total || 0) / fetchLimit) || 1,
      });
    } catch (e) {
      toast.error("Failed to load payments");
    }
  };

  // --- CLIENT SIDE FILTERING ---
  const filteredPayments = oneWashJobs.filter((row) => {
    if (!searchTerm) return true;
    const lowerTerm = searchTerm.toLowerCase().trim();

    // Fields to search against
    const id = String(row.id || row._id || "").toLowerCase();
    const vehicleReg = row.registration_no?.toLowerCase() || "";
    const parkingNo = row.parking_no?.toString().toLowerCase() || "";
    const workerName = row.worker?.name ? row.worker.name.toLowerCase() : "";
    const amount = String(row.amount || "").toLowerCase();
    const paymentMode = row.payment_mode?.toLowerCase() || "";
    const status = row.status?.toLowerCase() || "";
    const dateObj = new Date(row.createdAt);
    const dateStr = dateObj.toLocaleDateString().toLowerCase();
    const monthStr = dateObj
      .toLocaleString("default", { month: "long" })
      .toLowerCase();

    return (
      id.includes(lowerTerm) ||
      vehicleReg.includes(lowerTerm) ||
      parkingNo.includes(lowerTerm) ||
      workerName.includes(lowerTerm) ||
      amount.includes(lowerTerm) ||
      paymentMode.includes(lowerTerm) ||
      status.includes(lowerTerm) ||
      dateStr.includes(lowerTerm) ||
      monthStr.includes(lowerTerm)
    );
  });

  // --- HANDLERS ---

  // Tab Switch Handler
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    const newDates = getRangeForTab(tab);
    setFilters((prev) => ({
      ...prev,
      startDate: newDates.startDate,
      endDate: newDates.endDate,
    }));
  };

  const handleDateChange = (field, value) => {
    if (field === "clear") {
      // If clearing manually, revert to This Month
      handleTabChange("this_month");
    } else {
      setFilters((prev) => ({ ...prev, [field]: value }));
      setActiveTab("custom"); // If manual date pick, deselect tabs
    }
  };

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const handleViewReceipt = (row) => {
    const receiptData = {
      id: row.id || "000000",
      createdAt: row.createdAt,
      vehicle: {
        registration_no: row.registration_no || "-",
        parking_no: row.parking_no || "-",
      },
      building: row.building || row.mall || { name: "-" },
      amount_paid: row.amount || 0,
      tip: row.tip_amount || 0,
      balance: row.balance || 0,
      payment_mode: row.payment_mode || "cash",
      status: row.status || "pending",
      settled: row.settled || "pending",
      worker: row.worker,
      service_type: row.service_type,
      mall: row.mall,
    };
    setSelectedReceipt(receiptData);
  };

  const handleViewDetails = (row) => {
    setViewPayment(row);
  };

  const handleEdit = (row) => {
    setEditJob(row);
    setIsEditModalOpen(true);
  };

  const handleAddNew = () => {
    setEditJob(null);
    setIsEditModalOpen(true);
  };

  const handleEditSuccess = () => {
    fetchData(pagination.page, pagination.limit);
  };

  const handleDelete = (row) => {
    setDeleteJob(row);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleteJob) return;
    setIsDeleting(true);
    try {
      await dispatch(deleteOneWash(deleteJob._id)).unwrap();
      toast.success("Payment deleted successfully!");
      fetchData(pagination.page, pagination.limit);
      setIsDeleteModalOpen(false);
      setDeleteJob(null);
    } catch (error) {
      toast.error("Failed to delete payment");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleExport = async () => {
    const toastId = toast.loading("Downloading report...");
    try {
      const exportParams = {
        ...filters,
        search: searchTerm,
        onewash: "true",
      };

      const result = await dispatch(exportPayments(exportParams)).unwrap();
      const blobData = result.blob || result;
      const blob = new Blob([blobData], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      const dateStr = new Date().toISOString().split("T")[0];
      link.href = url;
      link.setAttribute("download", `onewash_payments_${dateStr}.xlsx`);

      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success("Download complete", { id: toastId });
    } catch (e) {
      console.error("Export Error:", e);
      toast.error("Export failed", { id: toastId });
    }
  };

  // --- COLUMNS ---
  const columns = [
    {
      header: "Id",
      accessor: "id",
      className: "w-16 text-center",
      render: (row, idx) => (
        <span className="text-slate-400 font-mono text-xs">
          {(pagination.page - 1) * pagination.limit + idx + 1}
        </span>
      ),
    },
    {
      header: "Date",
      accessor: "createdAt",
      className: "w-32",
      render: (row) => (
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5 text-slate-700 font-medium text-sm">
            <Calendar className="w-3 h-3 text-indigo-500" />
            {new Date(row.createdAt).toLocaleDateString("en-GB", {
              day: "numeric",
              month: "short",
            })}
          </div>
          <span className="text-[10px] text-slate-400 pl-4.5">
            {new Date(row.createdAt).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        </div>
      ),
    },
    {
      header: "Vehicle",
      accessor: "registration_no",
      render: (row) => (
        <div className="flex flex-col">
          <span className="font-bold text-slate-700 text-sm flex items-center gap-1">
            <Car className="w-3 h-3 text-slate-400" />
            {row.registration_no || "N/A"}
          </span>
          {row.parking_no && (
            <span className="text-[10px] text-slate-400 flex items-center gap-1 pl-4">
              P: {row.parking_no}
            </span>
          )}
        </div>
      ),
    },
    {
      header: "Amount",
      accessor: "amount",
      className: "text-right",
      render: (row) => (
        <span className="font-bold text-emerald-600 text-sm">
          {row.amount} <span className="text-[10px] text-emerald-400">AED</span>
        </span>
      ),
    },
    {
      header: "Tip",
      accessor: "tip_amount",
      className: "text-center",
      render: (row) => (
        <span className="text-slate-500 text-sm">
          {row.tip_amount ? `${row.tip_amount}` : "-"}
        </span>
      ),
    },
    {
      header: "Mode",
      accessor: "payment_mode",
      className: "text-center",
      render: (row) => (
        <span className="px-2 py-1 rounded text-[10px] font-bold uppercase bg-slate-100 text-slate-600 border border-slate-200">
          {row.payment_mode || "-"}
        </span>
      ),
    },
    {
      header: "Status",
      accessor: "status",
      className: "text-center w-28",
      render: (row) => {
        const s = (row.status || "").toUpperCase();
        return (
          <span
            className={`flex items-center justify-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold border ${
              s === "COMPLETED"
                ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                : "bg-amber-50 text-amber-700 border-amber-100"
            }`}
          >
            {s === "COMPLETED" ? (
              <CheckCircle2 className="w-3 h-3" />
            ) : (
              <Clock className="w-3 h-3" />
            )}
            {s}
          </span>
        );
      },
    },
    {
      header: "Settle",
      accessor: "settled",
      className: "text-center w-24",
      render: (row) => {
        const s = (row.settled || "pending").toUpperCase();
        return (
          <span
            className={`text-[10px] font-bold uppercase ${
              s === "COMPLETED" ? "text-emerald-600" : "text-amber-500"
            }`}
          >
            {s}
          </span>
        );
      },
    },
    {
      header: "Worker",
      accessor: "worker.name",
      render: (row) => {
        if (!row.worker?.name) return null;
        return (
          <div className="flex items-start gap-1.5 min-w-[100px]">
            <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
              {row.worker.name[0]}
            </div>
            <span className="text-xs font-semibold text-slate-700 whitespace-normal break-words leading-tight">
              {row.worker.name}
            </span>
          </div>
        );
      },
    },
    {
      header: "Receipt",
      className: "text-center w-16",
      // Only show receipt button if Completed
      render: (row) => {
        const isPaid = (row.status || "").toLowerCase() === "completed";
        if (!isPaid) return <span className="text-slate-300">-</span>;

        return (
          <button
            onClick={() => handleViewReceipt(row)}
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-colors"
            title="Download Receipt"
          >
            <FileText className="w-4 h-4" />
          </button>
        );
      },
    },
    {
      header: "Actions",
      className:
        "text-right sticky right-0 bg-white shadow-[-10px_0_10px_-10px_rgba(0,0,0,0.1)] min-w-[120px]",
      render: (row) => (
        <div className="flex items-center justify-end gap-1">
          <button
            onClick={() => handleViewDetails(row)}
            className="p-1.5 hover:bg-blue-50 rounded text-slate-400 hover:text-blue-600 transition-all"
            title="View Details"
          >
            <Eye className="w-4 h-4" />
          </button>

          <button
            onClick={() => handleEdit(row)}
            className="p-1.5 hover:bg-indigo-50 rounded text-slate-400 hover:text-indigo-600 transition-all"
            title="Edit"
          >
            <Edit2 className="w-4 h-4" />
          </button>

          <button
            onClick={() => handleDelete(row)}
            className="p-1.5 hover:bg-red-50 rounded text-slate-400 hover:text-red-600 transition-all"
            title="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6 font-sans">
      {/* --- HEADER & STATS --- */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-200">
              <ShoppingBag className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                One Wash Payments
              </h1>
              <p className="text-sm text-slate-500 font-medium">
                Manage on-demand wash transactions
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* ✅ TAB SWITCHER */}
            <div className="bg-slate-100 p-1 rounded-xl flex">
              <button
                onClick={() => handleTabChange("last_month")}
                className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                  activeTab === "last_month"
                    ? "bg-white text-indigo-600 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {lastMonth}
              </button>
              <button
                onClick={() => handleTabChange("this_month")}
                className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                  activeTab === "this_month"
                    ? "bg-white text-indigo-600 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {thisMonth}
              </button>
            </div>

            {/* Export Only - Bulk buttons removed as requested */}
            <button
              onClick={handleExport}
              className="h-10 px-4 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-md hover:shadow-lg transition-all"
            >
              <Download className="w-4 h-4" /> Export
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="flex flex-wrap gap-4 mt-6">
          <div className="px-5 py-3 rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 text-white shadow-md flex flex-col justify-center min-w-[140px]">
            <span className="text-[10px] font-bold opacity-60 uppercase tracking-wider mb-1">
              Total Revenue
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-bold">{stats.totalAmount}</span>
              <span className="text-xs opacity-70">AED</span>
            </div>
          </div>

          <div className="px-4 py-2 rounded-xl bg-white border border-slate-100 shadow-sm flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
              <Banknote className="w-5 h-5" />
            </div>
            <div>
              <span className="block text-xs text-slate-400 font-bold uppercase">
                Cash
              </span>
              <span className="font-bold text-slate-700">{stats.cash}</span>
            </div>
          </div>

          <div className="px-4 py-2 rounded-xl bg-white border border-slate-100 shadow-sm flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <span className="block text-xs text-slate-400 font-bold uppercase">
                Card
              </span>
              <span className="font-bold text-slate-700">{stats.card}</span>
            </div>
          </div>

          <div className="px-4 py-2 rounded-xl bg-white border border-slate-100 shadow-sm flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center text-purple-600">
              <Landmark className="w-5 h-5" />
            </div>
            <div>
              <span className="block text-xs text-slate-400 font-bold uppercase">
                Bank
              </span>
              <span className="font-bold text-slate-700">{stats.bank}</span>
            </div>
          </div>
        </div>
      </div>

      {/* --- FILTERS & ACTIONS --- */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm mb-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-end">
          {/* Date Range */}
          <div className="lg:col-span-4">
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 ml-1">
              Date Range
            </label>
            <RichDateRangePicker
              startDate={filters.startDate}
              endDate={filters.endDate}
              onChange={handleDateChange}
            />
          </div>

          {/* Filters */}
          <div className="lg:col-span-2">
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 ml-1">
              Status
            </label>
            <div className="relative">
              <select
                name="status"
                value={filters.status}
                onChange={handleFilterChange}
                className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl px-3 text-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 transition-all appearance-none cursor-pointer text-slate-600 font-medium"
              >
                <option value="">All Status</option>
                <option value="pending">Pending</option>
                <option value="completed">Completed</option>
              </select>
              <Filter className="absolute right-3 top-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
          </div>

          <div className="lg:col-span-2">
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 ml-1">
              Worker
            </label>
            <div className="relative">
              <select
                name="worker"
                value={filters.worker}
                onChange={handleFilterChange}
                className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl px-3 text-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 transition-all appearance-none cursor-pointer text-slate-600 font-medium"
              >
                <option value="">All Workers</option>
                {workers.map((w) => (
                  <option key={w._id} value={w._id}>
                    {w.name}
                  </option>
                ))}
              </select>
              <User className="absolute right-3 top-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
          </div>

          {/* Search */}
          <div className="lg:col-span-2">
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 ml-1">
              Search
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 text-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 transition-all"
              />
              <Search className="absolute left-3 top-3.5 w-4 h-4 text-slate-400" />
            </div>
          </div>

          {/* Buttons */}
          <div className="lg:col-span-2 flex gap-2">
            <button
              onClick={handleAddNew}
              className="flex-1 h-11 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md transition-all active:scale-95 flex items-center justify-center gap-1"
              title="Add New Payment"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* --- DATA TABLE --- */}
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden flex flex-col flex-1">
        <DataTable
          columns={columns}
          data={filteredPayments} // Use filtered data here
          loading={loading}
          pagination={pagination}
          onPageChange={(p) => fetchData(p, pagination.limit)}
          onLimitChange={(l) => fetchData(1, l)}
          hideSearch={true} // Hide inner search
        />
      </div>

      {/* --- MODALS --- */}
      <ReceiptModal
        isOpen={!!selectedReceipt}
        onClose={() => setSelectedReceipt(null)}
        data={selectedReceipt}
      />

      <ViewPaymentModal
        isOpen={!!viewPayment}
        onClose={() => setViewPayment(null)}
        payment={viewPayment}
      />

      <OneWashModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditJob(null);
        }}
        job={editJob}
        onSuccess={handleEditSuccess}
      />

      <DeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setDeleteJob(null);
        }}
        onConfirm={confirmDelete}
        loading={isDeleting}
        title="Delete Payment?"
        message={`Are you sure you want to delete the payment for ${
          deleteJob?.registration_no || "this vehicle"
        }? This action cannot be undone.`}
      />
    </div>
  );
};

export default OneWashPayments;
