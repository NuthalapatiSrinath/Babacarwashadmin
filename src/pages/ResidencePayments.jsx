import React, { useState, useEffect } from "react";
import {
  Download,
  Search,
  Filter,
  User,
  Banknote,
  CreditCard,
  Landmark,
  CheckCircle,
  Edit2,
  Trash2,
  Eye,
  FileText,
  Building,
} from "lucide-react";
import toast from "react-hot-toast";

// Components
import DataTable from "../components/DataTable";
import RichDateRangePicker from "../components/inputs/RichDateRangePicker";

// Modals
import ResidenceReceiptModal from "../components/modals/ResidenceReceiptModal";
import ReceiptModal from "../components/modals/ReceiptModal";
import EditPaymentModal from "../components/modals/EditPaymentModal";
import ViewPaymentModal from "../components/modals/ViewPaymentModal";

// API
import { paymentService } from "../api/paymentService";
import { workerService } from "../api/workerService";
import { buildingService } from "../api/buildingService"; // Import Building Service

const ResidencePayments = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);

  // Lists for Dropdowns
  const [workers, setWorkers] = useState([]);
  const [buildings, setBuildings] = useState([]);

  const [stats, setStats] = useState({
    totalAmount: 0,
    totalJobs: 0,
    cash: 0,
    card: 0,
    bank: 0,
  });

  // Date Helpers
  const getLocalYMD = (date) => {
    const offset = date.getTimezoneOffset();
    const local = new Date(date.getTime() - offset * 60 * 1000);
    return local.toISOString().split("T")[0];
  };
  const getStartOfMonth = () =>
    getLocalYMD(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const getEndOfMonth = () =>
    getLocalYMD(
      new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0)
    );

  const [filters, setFilters] = useState({
    startDate: getStartOfMonth(),
    endDate: getEndOfMonth(),
    worker: "",
    status: "",
    onewash: "false",
    building: "", // Building Filter State
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 1,
  });

  // Modal States
  const [invoiceData, setInvoiceData] = useState(null);
  const [receiptData, setReceiptData] = useState(null);
  const [editPayment, setEditPayment] = useState(null);
  const [viewPayment, setViewPayment] = useState(null);

  // --- INITIAL LOAD ---
  useEffect(() => {
    const loadFilters = async () => {
      try {
        // Fetch Workers and Buildings in parallel
        const [resWorkers, resBuildings] = await Promise.all([
          workerService.list(1, 1000),
          buildingService.list(1, 1000),
        ]);

        setWorkers(resWorkers.data || []);
        setBuildings(resBuildings.data || []);
      } catch (e) {
        console.error("Filter Load Error:", e);
      }
    };
    loadFilters();
    fetchData(1, 50);
  }, []);

  const fetchData = async (page = 1, limit = 50) => {
    setLoading(true);
    try {
      const apiFilters = { ...filters };
      if (filters.startDate) {
        const start = new Date(filters.startDate);
        start.setHours(0, 0, 0, 0);
        apiFilters.startDate = start.toISOString();
      }
      if (filters.endDate) {
        const end = new Date(filters.endDate);
        end.setHours(23, 59, 59, 999);
        apiFilters.endDate = end.toISOString();
      }

      const res = await paymentService.list(
        page,
        limit,
        searchTerm,
        apiFilters
      );
      setData(res.data || []);
      if (res.counts) setStats(res.counts);
      setPagination({
        page,
        limit,
        total: res.total || 0,
        totalPages: Math.ceil((res.total || 0) / limit) || 1,
      });
    } catch (e) {
      toast.error("Failed to load payments");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePayment = async (id, formData) => {
    try {
      const payload = {
        amount_charged: Number(formData.amount),
        payment_mode: formData.payment_mode,
        notes: formData.notes,
      };
      await paymentService.updatePayment(id, payload);
      toast.success("Payment updated successfully");
      setEditPayment(null);
      fetchData(pagination.page, pagination.limit);
    } catch (error) {
      toast.error("Failed to update payment");
    }
  };

  const handleDateChange = (field, value) => {
    if (field === "clear")
      setFilters((prev) => ({
        ...prev,
        startDate: getStartOfMonth(),
        endDate: getEndOfMonth(),
      }));
    else setFilters((prev) => ({ ...prev, [field]: value }));
  };
  const handleFilterChange = (e) =>
    setFilters({ ...filters, [e.target.name]: e.target.value });

  const handleExport = async () => {
    const toastId = toast.loading("Preparing download...");
    try {
      const exportParams = { search: searchTerm, ...filters };
      if (filters.startDate) {
        const start = new Date(filters.startDate);
        start.setHours(0, 0, 0, 0);
        exportParams.startDate = start.toISOString();
      }
      if (filters.endDate) {
        const end = new Date(filters.endDate);
        end.setHours(23, 59, 59, 999);
        exportParams.endDate = end.toISOString();
      }
      const blob = await paymentService.exportData(exportParams);
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement("a");
      link.href = url;
      link.download = `residence_payments.xlsx`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success("Download started", { id: toastId });
    } catch (e) {
      toast.error("Export failed", { id: toastId });
    }
  };

  // --- COLUMNS ---
  const columns = [
    {
      header: "Id",
      accessor: "id",
      className: "w-12 text-center text-slate-500 text-xs",
      render: (r) => r.id,
    },
    {
      header: "Date",
      accessor: "createdAt",
      className: "w-28",
      render: (r) => (
        <div className="flex flex-col text-xs">
          <span className="font-bold text-slate-700">
            {new Date(r.createdAt).toLocaleDateString("en-GB")}
          </span>
          <span className="text-slate-400">
            {new Date(r.createdAt).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        </div>
      ),
    },
    {
      header: "Vehicle",
      render: (r) => (
        <span className="font-bold text-sm">{r.vehicle?.registration_no}</span>
      ),
    },
    {
      header: "Parking",
      render: (r) => (
        <span className="text-sm font-mono">{r.vehicle?.parking_no}</span>
      ),
    },
    {
      header: "Actual Amount",
      accessor: "amount_charged",
      className: "text-right",
      render: (r) => (
        <span className="font-bold text-slate-800">{r.amount_charged}</span>
      ),
    },
    {
      header: "Last Month",
      accessor: "old_balance",
      className: "text-right",
      render: (r) => <span className="text-slate-500">{r.old_balance}</span>,
    },
    {
      header: "Total",
      accessor: "total_amount",
      className: "text-right",
      render: (r) => (
        <span className="font-bold text-indigo-600">{r.total_amount}</span>
      ),
    },
    {
      header: "Paid",
      accessor: "amount_paid",
      className: "text-right",
      render: (r) => (
        <span className="font-bold text-emerald-600">{r.amount_paid}</span>
      ),
    },
    {
      header: "Balance",
      accessor: "balance",
      className: "text-right",
      render: (r) => (
        <span
          className={`font-bold ${
            r.balance > 0 ? "text-red-500" : "text-slate-400"
          }`}
        >
          {r.balance}
        </span>
      ),
    },
    {
      header: "Mode",
      accessor: "payment_mode",
      className: "text-center uppercase text-xs font-bold text-slate-500",
      render: (r) => (r.status === "completed" ? r.payment_mode : "-"),
    },
    {
      header: "Status",
      accessor: "status",
      className: "text-center",
      render: (r) => (
        <span
          className={`text-[10px] font-bold uppercase ${
            r.status === "completed" ? "text-emerald-500" : "text-amber-500"
          }`}
        >
          {r.status}
        </span>
      ),
    },
    {
      header: "Settle Status",
      accessor: "settled",
      className: "text-center",
      render: (r) => (
        <span
          className={`text-[10px] font-bold uppercase ${
            r.settled === "completed" ? "text-emerald-500" : "text-amber-500"
          }`}
        >
          {r.settled}
        </span>
      ),
    },
    {
      header: "Worker",
      accessor: "worker",
      render: (r) => (
        <span className="text-xs font-bold uppercase truncate max-w-[100px] block">
          {r.worker?.name}
        </span>
      ),
    },
    {
      header: "Invoice",
      className: "text-center w-16",
      render: (r) => (
        <button
          onClick={() => setInvoiceData(r)}
          className="text-slate-400 hover:text-indigo-600"
        >
          <FileText className="w-4 h-4 mx-auto" />
        </button>
      ),
    },
    {
      header: "Receipt",
      className: "text-center w-16",
      render: (r) => (
        <button
          onClick={() => setReceiptData(r)}
          className="text-slate-400 hover:text-indigo-600"
        >
          <FileText className="w-4 h-4 mx-auto" />
        </button>
      ),
    },
    {
      header: "Actions",
      className: "text-right",
      render: (r) => (
        <div className="flex justify-end gap-1">
          <button className="p-1 hover:bg-slate-100 rounded text-emerald-500">
            <CheckCircle className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewPayment(r)}
            className="p-1 hover:bg-slate-100 rounded text-blue-500"
          >
            <Eye className="w-4 h-4" />
          </button>
        </div>
      ),
    },
    {
      header: "Modify",
      className: "text-right",
      render: (r) => (
        <div className="flex justify-end gap-1">
          <button
            onClick={() => setEditPayment(r)}
            className="p-1 hover:bg-slate-100 rounded text-indigo-600"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button className="p-1 hover:bg-slate-100 rounded text-red-500">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="p-6 w-full max-w-7xl mx-auto flex flex-col font-sans">
      <div className="bg-indigo-600 text-white p-4 rounded-xl shadow-lg mb-4 flex justify-between items-center shrink-0">
        <div>
          <h2 className="text-xl font-bold">Total {stats.totalAmount}</h2>
        </div>
        <div className="flex gap-4 text-sm font-medium">
          <span>Cash: {stats.cash}</span>
          <span>Card: {stats.card}</span>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl border mb-4 flex gap-4 items-end shrink-0">
        <div className="w-auto">
          <RichDateRangePicker
            startDate={filters.startDate}
            endDate={filters.endDate}
            onChange={handleDateChange}
          />
        </div>

        {/* --- FILTERS GRID --- */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4 w-full">
          {/* Status */}
          <div className="relative">
            <select
              name="status"
              value={filters.status}
              onChange={handleFilterChange}
              className="w-full h-[50px] bg-slate-50 border border-slate-200 rounded-xl px-4 text-sm outline-none cursor-pointer"
            >
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
            </select>
            <Filter className="absolute right-4 top-4 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>

          {/* Buildings Filter */}
          <div className="relative">
            <select
              name="building"
              value={filters.building}
              onChange={handleFilterChange}
              className="w-full h-[50px] bg-slate-50 border border-slate-200 rounded-xl px-4 text-sm outline-none cursor-pointer"
            >
              <option value="">All Buildings</option>
              {buildings.map((b) => (
                <option key={b._id} value={b._id}>
                  {b.name}
                </option>
              ))}
            </select>
            <Building className="absolute right-4 top-4 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>

          {/* Workers Filter */}
          <div className="relative">
            <select
              name="worker"
              value={filters.worker}
              onChange={handleFilterChange}
              className="w-full h-[50px] bg-slate-50 border border-slate-200 rounded-xl px-4 text-sm outline-none cursor-pointer"
            >
              <option value="">All Workers</option>
              {workers.map((w) => (
                <option key={w._id} value={w._id}>
                  {w.name}
                </option>
              ))}
            </select>
            <User className="absolute right-4 top-4 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>

          {/* Search Input */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && fetchData(1, 10)}
              className="w-full h-[50px] bg-slate-50 border border-slate-200 rounded-xl pl-4 pr-10 text-sm outline-none focus:border-indigo-500"
            />
            <Search className="absolute right-4 top-3.5 w-5 h-5 text-slate-400" />
          </div>
        </div>

        <button
          onClick={() => fetchData(1, 10)}
          className="h-[50px] px-6 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md transition-colors"
        >
          Search
        </button>
        <button
          onClick={handleExport}
          className="h-[50px] px-4 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 font-bold rounded-xl shadow-sm transition-colors"
        >
          <Download className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 min-h-0 bg-white rounded-2xl shadow-sm border overflow-hidden flex flex-col">
        <DataTable
          columns={columns}
          data={data}
          loading={loading}
          pagination={pagination}
          onPageChange={(p) => fetchData(p, pagination.limit)}
          onLimitChange={(l) => fetchData(1, l)}
        />
      </div>

      <ResidenceReceiptModal
        isOpen={!!invoiceData}
        onClose={() => setInvoiceData(null)}
        data={invoiceData}
        type="Invoice"
      />
      <ReceiptModal
        isOpen={!!receiptData}
        onClose={() => setReceiptData(null)}
        data={receiptData}
      />
      <EditPaymentModal
        isOpen={!!editPayment}
        onClose={() => setEditPayment(null)}
        payment={editPayment}
        onSubmit={handleUpdatePayment}
      />
      <ViewPaymentModal
        isOpen={!!viewPayment}
        onClose={() => setViewPayment(null)}
        payment={viewPayment}
      />
    </div>
  );
};

export default ResidencePayments;
