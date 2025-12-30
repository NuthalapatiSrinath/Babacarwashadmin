import React, { useState, useEffect } from "react";
import {
  Download,
  Search,
  Filter,
  User,
  DollarSign,
  CreditCard,
  Banknote,
  Landmark,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import toast from "react-hot-toast";

// Components
import DataTable from "../components/DataTable";
import PaymentModal from "../components/modals/PaymentModal";
import RichDateRangePicker from "../components/inputs/RichDateRangePicker";

// API
import { paymentService } from "../api/paymentService";
import { workerService } from "../api/workerService";

const Payments = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  const [workers, setWorkers] = useState([]);

  // Stats State
  const [stats, setStats] = useState({
    totalAmount: 0,
    totalJobs: 0,
    cash: 0,
    card: 0,
    bank: 0,
  });

  // --- DATES HELPER (Local Time) ---
  const getDateString = (dateObj) => {
    const local = new Date(dateObj);
    local.setMinutes(local.getMinutes() - local.getTimezoneOffset());
    return local.toISOString().split("T")[0];
  };

  const getToday = () => getDateString(new Date());

  const getYesterday = () => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return getDateString(d);
  };

  // --- FILTER STATE ---
  const [filters, setFilters] = useState({
    startDate: getYesterday(), // Default: Yesterday
    endDate: getToday(), // Default: Today
    worker: "",
    status: "",
    onewash: "true", // 'true' = OneWash, 'false' = Residence (Adjust based on your need)
  });

  const [searchTerm, setSearchTerm] = useState("");

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);

  // --- Initial Load ---
  useEffect(() => {
    const loadWorkers = async () => {
      try {
        const res = await workerService.list(1, 1000);
        setWorkers(res.data || []);
      } catch (e) {
        console.error(e);
      }
    };
    loadWorkers();
    fetchData(1, 10);
  }, []);

  // --- Fetch Data ---
  const fetchData = async (page = 1, limit = 10) => {
    setLoading(true);
    try {
      // 1. Clone filters to modify for API without affecting UI
      const apiFilters = { ...filters };

      // 2. FORCE END OF DAY TIME
      // If endDate is just "YYYY-MM-DD", append time to get full day data
      if (apiFilters.endDate && apiFilters.endDate.length === 10) {
        apiFilters.endDate = `${apiFilters.endDate}T23:59:59`;
      }

      // 3. Make API Call
      const res = await paymentService.list(
        page,
        limit,
        searchTerm,
        apiFilters
      );

      setData(res.data || []);

      // 4. Update Stats Dashboard
      if (res.counts) {
        setStats(res.counts);
      }

      const totalCount = res.total || 0;
      setPagination({
        page: page,
        limit: limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit) || 1,
      });
    } catch (e) {
      toast.error("Failed to load payments");
    } finally {
      setLoading(false);
    }
  };

  // --- Handlers ---
  const handleDateChange = (field, value) => {
    if (field === "clear") {
      setFilters((prev) => ({
        ...prev,
        startDate: getYesterday(),
        endDate: getToday(),
      }));
    } else {
      setFilters((prev) => ({ ...prev, [field]: value }));
    }
  };

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const handleSearch = () => {
    fetchData(1, pagination.limit);
  };

  const handleCollect = (row) => {
    setSelectedPayment(row);
    setIsModalOpen(true);
  };

  const handleExport = async () => {
    const toastId = toast.loading("Preparing download...");
    try {
      const exportParams = {
        search: searchTerm,
        ...filters,
      };
      // Fix end date for export too
      if (exportParams.endDate && exportParams.endDate.length === 10) {
        exportParams.endDate = `${exportParams.endDate}T23:59:59`;
      }

      const blob = await paymentService.exportData(exportParams);
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement("a");
      link.href = url;
      const dateStr = new Date().toISOString().split("T")[0];
      link.setAttribute("download", `payments_report_${dateStr}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);

      toast.success("Download started", { id: toastId });
    } catch (e) {
      console.error("Export Error:", e);
      toast.error("Export failed", { id: toastId });
    }
  };

  // --- Columns (Matched to Screenshot) ---
  const columns = [
    {
      header: "Id",
      accessor: "id",
      className: "w-16 text-center text-xs font-mono text-slate-400",
      render: (row, idx) => (
        <span className="font-mono text-xs">
          {(pagination.page - 1) * pagination.limit + idx + 1}
        </span>
      ),
    },
    {
      header: "Date",
      accessor: "createdAt",
      render: (row) => (
        <div className="flex flex-col">
          <span className="text-slate-700 font-medium text-sm">
            {new Date(row.createdAt).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            })}
          </span>
          <span className="text-[10px] text-slate-400">
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
      accessor: "vehicle.registration_no",
      render: (row) => (
        <span className="font-bold text-slate-700 text-sm">
          {row.vehicle?.registration_no || "N/A"}
        </span>
      ),
    },
    {
      header: "Parking",
      accessor: "vehicle.parking_no",
      render: (row) => (
        <span className="text-slate-600 text-sm font-mono">
          {row.vehicle?.parking_no || "-"}
        </span>
      ),
    },
    {
      header: "Amount",
      accessor: "amount_charged",
      className: "text-right",
      render: (row) => (
        <span className="font-bold text-slate-800 text-sm">
          {row.amount_charged || 0}
        </span>
      ),
    },
    {
      header: "Tip",
      accessor: "tip_amount",
      className: "text-right",
      render: (row) => (
        <span className="text-slate-500 text-sm">{row.tip_amount || 0}</span>
      ),
    },
    {
      header: "Balance",
      accessor: "balance",
      className: "text-right",
      render: (row) => {
        const bal = row.balance || 0;
        return (
          <span
            className={`text-sm font-bold ${
              bal > 0 ? "text-red-500" : "text-slate-400"
            }`}
          >
            {bal}
          </span>
        );
      },
    },
    {
      header: "Mode",
      accessor: "payment_mode",
      className: "text-center",
      render: (row) => (
        <span className="text-xs font-bold uppercase text-slate-500">
          {row.payment_mode || "-"}
        </span>
      ),
    },
    {
      header: "Status",
      accessor: "status",
      className: "text-center",
      render: (row) => {
        const s = (row.status || "pending").toLowerCase();
        if (s === "completed")
          return (
            <span className="text-[10px] font-bold text-emerald-500 uppercase">
              COMPLETED
            </span>
          );
        return (
          <span className="text-[10px] font-bold text-amber-500 uppercase">
            PENDING
          </span>
        );
      },
    },
    {
      header: "Worker",
      accessor: "worker.name",
      render: (row) => (
        <span
          className="text-xs font-bold text-slate-700 uppercase truncate max-w-[100px] block"
          title={row.worker?.name}
        >
          {row.worker?.name || "UNASSIGNED"}
        </span>
      ),
    },
    {
      header: "Action",
      className: "text-right w-24",
      render: (row) => {
        const total = row.amount_charged || row.total_amount || 0;
        const paid = row.amount_paid || 0;
        const remaining = total - paid;

        if (remaining <= 0)
          return (
            <span className="text-[10px] text-slate-300 font-medium">
              Settled
            </span>
          );

        return (
          <button
            onClick={() => handleCollect(row)}
            className="px-3 py-1.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-lg text-xs font-bold transition-colors"
          >
            Collect
          </button>
        );
      },
    },
  ];

  return (
    <div className="p-6 w-full h-[calc(100vh-80px)] flex flex-col font-sans">
      {/* --- STATS DASHBOARD --- */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 flex-shrink-0">
        <div className="bg-indigo-600 p-4 rounded-xl shadow-lg flex items-center justify-between text-white">
          <div>
            <p className="text-xs font-medium opacity-80 uppercase">
              Total Revenue
            </p>
            <h3 className="text-2xl font-bold">{stats.totalAmount}</h3>
          </div>
          <div className="bg-white/20 p-2 rounded-lg">
            <DollarSign className="w-6 h-6 text-white" />
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
            <Banknote className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-bold uppercase">Cash</p>
            <h3 className="text-lg font-bold text-slate-800">{stats.cash}</h3>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
            <CreditCard className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-bold uppercase">Card</p>
            <h3 className="text-lg font-bold text-slate-800">{stats.card}</h3>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center text-purple-600">
            <Landmark className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-bold uppercase">Bank</p>
            <h3 className="text-lg font-bold text-slate-800">{stats.bank}</h3>
          </div>
        </div>
      </div>

      {/* --- FILTERS --- */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm mb-4 flex flex-col xl:flex-row gap-4 items-end flex-shrink-0">
        <div className="w-full xl:w-auto">
          <RichDateRangePicker
            startDate={filters.startDate}
            endDate={filters.endDate}
            onChange={handleDateChange}
          />
        </div>

        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
          <div className="relative">
            <select
              name="status"
              value={filters.status}
              onChange={handleFilterChange}
              className="w-full h-[50px] bg-slate-50 border border-slate-200 rounded-xl px-4 text-sm text-slate-700 outline-none focus:border-indigo-500 appearance-none cursor-pointer uppercase"
            >
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
            </select>
            <Filter className="absolute right-4 top-4 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>

          <div className="relative">
            <select
              name="worker"
              value={filters.worker}
              onChange={handleFilterChange}
              className="w-full h-[50px] bg-slate-50 border border-slate-200 rounded-xl px-4 text-sm text-slate-700 outline-none focus:border-indigo-500 appearance-none cursor-pointer"
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
        </div>

        <div className="flex-1 w-full relative h-[50px]">
          <Search className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search Vehicle / Reg No..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="w-full h-full pl-12 pr-4 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-indigo-500 transition-all"
          />
        </div>

        <button
          onClick={handleSearch}
          className="h-[50px] px-8 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md transition-all flex items-center gap-2"
        >
          Search
        </button>
        <button
          onClick={handleExport}
          className="h-[50px] px-4 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 font-bold rounded-xl shadow-sm transition-all flex items-center gap-2"
        >
          <Download className="w-4 h-4" />
        </button>
      </div>

      {/* --- TABLE --- */}
      <div className="flex-1 min-h-0 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
        <DataTable
          columns={columns}
          data={data}
          loading={loading}
          pagination={pagination}
          onPageChange={(p) => fetchData(p, pagination.limit)}
          onLimitChange={(l) => fetchData(1, l)}
        />
      </div>

      <PaymentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        payment={selectedPayment}
        onSuccess={() => fetchData(pagination.page, pagination.limit)}
      />
    </div>
  );
};

export default Payments;
