import React, { useState, useEffect } from "react";
import {
  Plus,
  Trash2,
  Edit2,
  Download,
  Search,
  Filter,
  User,
  CreditCard,
  Banknote,
  Briefcase,
  DollarSign,
  Layers,
  Calendar,
  Car,
  MapPin,
} from "lucide-react";
import toast from "react-hot-toast";

import DataTable from "../../components/DataTable";
import OneWashModal from "../../components/modals/OneWashModal";
import RichDateRangePicker from "../../components/inputs/RichDateRangePicker";

import { oneWashService } from "../../api/oneWashService";
import { workerService } from "../../api/workerService";

const OneWash = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);

  const [stats, setStats] = useState({
    totalAmount: 0,
    totalJobs: 0,
    cash: 0,
    card: 0,
    bank: 0,
  });

  const [workers, setWorkers] = useState([]);

  // -----------------------------
  // DATE HELPERS (Local Time Safe)
  // -----------------------------
  const formatDateLocal = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const getToday = () => formatDateLocal(new Date());

  // 🔹 CHANGED: Get 1st of current month
  const getFirstOfMonth = () => {
    const d = new Date();
    d.setDate(1); // Set to 1st day of month
    return formatDateLocal(d);
  };

  const [filters, setFilters] = useState({
    startDate: getFirstOfMonth(), // Default: 1st of Month
    endDate: getToday(), // Default: Today
    service_type: "",
    worker: "",
  });

  const [searchTerm, setSearchTerm] = useState("");

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 1,
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);

  // --------------------------------
  // LOAD WORKERS ON MOUNT
  // --------------------------------
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
  }, []);

  // --------------------------------
  // AUTOMATIC FETCH EFFECTS
  // --------------------------------

  // 1. Trigger when filters change
  useEffect(() => {
    fetchData(1, pagination.limit);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  // 2. Trigger when Search Term changes (Debounced)
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchData(1, pagination.limit);
    }, 500);

    return () => clearTimeout(delayDebounceFn);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm]);

  // --------------------------------
  // FETCH DATA
  // --------------------------------
  const fetchData = async (page = 1, limit = 50) => {
    setLoading(true);

    try {
      const apiFilters = { ...filters };
      if (apiFilters.endDate) {
        apiFilters.endDate = `${apiFilters.endDate}T23:59:59`;
      }

      const res = await oneWashService.list(
        page,
        limit,
        searchTerm,
        apiFilters
      );

      setData(res.data || []);

      if (res.counts) setStats(res.counts);

      const total =
        res.total !== undefined ? res.total : res.data ? res.data.length : 0;

      setPagination({
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      });
    } catch (e) {
      console.error(e);
      toast.error("Failed to load jobs");
    } finally {
      setLoading(false);
    }
  };

  // --------------------------------
  // CLIENT-SIDE FILTERING (Strict Visual Match)
  // --------------------------------
  const filteredData = data.filter((row) => {
    if (!searchTerm) return true;
    const lowerTerm = searchTerm.toLowerCase();

    // Fields to search against
    const id = String(row.id || "").toLowerCase();
    const vehicle = row.registration_no?.toLowerCase() || "";
    const parking = row.parking_no?.toLowerCase() || "";
    const amount = String(row.amount || "").toLowerCase();
    const tip = String(row.tip_amount || "").toLowerCase();
    const payMode = row.payment_mode?.toLowerCase() || "";
    const status = row.status?.toLowerCase() || "";
    const workerName = row.worker?.name?.toLowerCase() || "";

    const locationName =
      (row.service_type === "mall"
        ? row.mall?.name
        : row.building?.name
      )?.toLowerCase() || "";

    const dateStr = new Date(row.createdAt).toLocaleString().toLowerCase();

    return (
      id.includes(lowerTerm) ||
      vehicle.includes(lowerTerm) ||
      parking.includes(lowerTerm) ||
      amount.includes(lowerTerm) ||
      tip.includes(lowerTerm) ||
      payMode.includes(lowerTerm) ||
      status.includes(lowerTerm) ||
      locationName.includes(lowerTerm) ||
      workerName.includes(lowerTerm) ||
      dateStr.includes(lowerTerm)
    );
  });

  // --------------------------------
  // FILTER HANDLERS
  // --------------------------------
  const handleDateChange = (field, value) => {
    if (field === "clear") {
      setFilters((prev) => ({
        ...prev,
        startDate: getFirstOfMonth(), // Reset to 1st of month
        endDate: getToday(),
      }));
    } else {
      setFilters((prev) => ({ ...prev, [field]: value }));
    }
  };

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  // --------------------------------
  // CRUD
  // --------------------------------
  const handleCreate = () => {
    setSelectedJob(null);
    setIsModalOpen(true);
  };

  const handleEdit = (row) => {
    setSelectedJob(row);
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this job record?")) return;

    try {
      await oneWashService.delete(id);
      toast.success("Deleted successfully");
      fetchData(pagination.page, pagination.limit);
    } catch {
      toast.error("Delete failed");
    }
  };

  const handleExport = async () => {
    const toastId = toast.loading("Downloading report...");
    try {
      const exportFilters = { ...filters };
      // Backend handles partial date strings, no need to add time manually for filtering
      // just pass the dates as strings

      const blobData = await oneWashService.exportData({
        ...exportFilters,
        search: searchTerm,
      });

      const blob = new Blob([blobData], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");

      const dateStr = new Date().toISOString().split("T")[0];
      link.href = url;
      link.setAttribute("download", `onewash_report_${dateStr}.xlsx`);

      document.body.appendChild(link);
      link.click();

      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success("Download complete", { id: toastId });
    } catch (e) {
      console.error("Export Error:", e);
      if (e.response && e.response.data instanceof Blob) {
        const reader = new FileReader();
        reader.onload = () => {
          try {
            const errorObj = JSON.parse(reader.result);
            toast.error(errorObj.message || "Export failed", { id: toastId });
          } catch {
            toast.error("Export failed", { id: toastId });
          }
        };
        reader.readAsText(e.response.data);
      } else {
        toast.error("Export failed", { id: toastId });
      }
    }
  };

  // --------------------------------
  // TABLE COLUMNS
  // --------------------------------
  const columns = [
    {
      header: "Id",
      accessor: "id",
      className: "w-16 text-center text-slate-500",
      render: (row) => <span>{row.id}</span>,
    },
    {
      header: "Date",
      accessor: "createdAt",
      render: (row) => (
        <span className="text-slate-700 font-medium text-sm">
          {new Date(row.createdAt).toLocaleString("en-US", {
            month: "short",
            day: "numeric",
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
          })}
        </span>
      ),
    },
    {
      header: "Vehicle No",
      accessor: "registration_no",
      render: (row) => (
        <span className="font-semibold text-slate-700">
          {row.registration_no}
        </span>
      ),
    },
    {
      header: "Parking No",
      accessor: "parking_no",
      render: (row) => (
        <span className="text-slate-600">{row.parking_no || "-"}</span>
      ),
    },
    {
      header: "Amount",
      accessor: "amount",
      render: (row) => (
        <span className="font-bold text-slate-800">{row.amount}</span>
      ),
    },
    {
      header: "Tip",
      accessor: "tip_amount",
      render: (row) => (
        <span className="text-slate-600">{row.tip_amount || 0}</span>
      ),
    },
    {
      header: "Payment Mode",
      accessor: "payment_mode",
      render: (row) => (
        <span className="text-slate-600 capitalize">
          {row.payment_mode || "-"}
        </span>
      ),
    },
    {
      header: "Status",
      accessor: "status",
      render: (row) => (
        <span
          className={`text-xs font-bold uppercase tracking-wide ${
            row.status === "completed" ? "text-emerald-500" : "text-amber-500"
          }`}
        >
          {row.status}
        </span>
      ),
    },
    {
      header: "Mall/Building",
      accessor: "location",
      render: (row) => {
        const name =
          row.service_type === "mall" ? row.mall?.name : row.building?.name;
        return <span className="text-slate-700 uppercase">{name || "-"}</span>;
      },
    },
    {
      header: "Worker",
      accessor: "worker.name",
      render: (row) => (
        <span className="text-slate-700 uppercase font-medium">
          {row.worker?.name || "Unassigned"}
        </span>
      ),
    },
    {
      header: "Actions",
      className: "text-right w-24 sticky right-0 bg-white",
      render: (row) => (
        <div className="flex justify-end gap-2 pr-2">
          <button
            onClick={() => handleEdit(row)}
            className="hover:text-indigo-600 text-slate-400 transition-colors"
            title="Edit"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleDelete(row._id)}
            className="hover:text-red-600 text-slate-400 transition-colors"
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
      {/* --- HEADER SECTION --- */}
      <div className="mb-6 flex flex-col xl:flex-row xl:items-center justify-between gap-6">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-200">
              <Layers className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-slate-800 to-indigo-800 bg-clip-text text-transparent">
                One Wash Jobs
              </h1>
              <p className="text-sm text-slate-500 font-medium">
                Manage daily washing records
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 text-xs font-medium text-slate-600 mt-1">
            <div className="bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm flex items-center gap-2">
              <Briefcase className="w-3.5 h-3.5 text-indigo-500" />
              <span>
                Total: <b className="text-slate-800">{stats.totalJobs}</b>
              </span>
            </div>
            <div className="bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm flex items-center gap-2">
              <DollarSign className="w-3.5 h-3.5 text-emerald-500" />
              <span>
                Revenue:{" "}
                <b className="text-emerald-700">{stats.totalAmount} AED</b>
              </span>
            </div>
            <div className="bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm flex items-center gap-2">
              <Banknote className="w-3.5 h-3.5 text-slate-400" />
              <span>
                Cash: <b>{stats.cash}</b>
              </span>
            </div>
            <div className="bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm flex items-center gap-2">
              <CreditCard className="w-3.5 h-3.5 text-blue-400" />
              <span>
                Card: <b>{stats.card}</b>
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleExport}
            className="h-11 px-5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl font-bold text-sm shadow-sm transition-all flex items-center gap-2"
          >
            <Download className="w-4 h-4 text-slate-500" /> Export
          </button>
          <button
            onClick={handleCreate}
            className="h-11 px-6 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl font-bold text-sm shadow-lg shadow-indigo-200 hover:shadow-indigo-300 transition-all active:scale-95 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> New Job
          </button>
        </div>
      </div>

      {/* --- FILTERS & TABLE CONTAINER --- */}
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden flex flex-col">
        {/* Filters Bar */}
        <div className="p-4 border-b border-gray-100 bg-slate-50/50 flex flex-col xl:flex-row gap-4 items-end">
          <div className="w-full xl:w-auto">
            <span className="text-xs font-bold text-slate-500 uppercase mb-1.5 block ml-1">
              Date Range
            </span>
            <RichDateRangePicker
              startDate={filters.startDate}
              endDate={filters.endDate}
              onChange={handleDateChange}
            />
          </div>

          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
            <div className="relative">
              <span className="text-xs font-bold text-slate-500 uppercase mb-1.5 block ml-1">
                Service Type
              </span>
              <div className="relative">
                <select
                  name="service_type"
                  value={filters.service_type}
                  onChange={handleFilterChange}
                  className="w-full h-[42px] bg-white border border-slate-200 rounded-lg px-4 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 appearance-none cursor-pointer font-medium text-slate-700"
                >
                  <option value="">All Services</option>
                  <option value="mall">Mall</option>
                  <option value="residence">Residence</option>
                </select>
                <Filter className="absolute right-3 top-3 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
            </div>

            <div className="relative">
              <span className="text-xs font-bold text-slate-500 uppercase mb-1.5 block ml-1">
                Worker
              </span>
              <div className="relative">
                <select
                  name="worker"
                  value={filters.worker}
                  onChange={handleFilterChange}
                  className="w-full h-[42px] bg-white border border-slate-200 rounded-lg px-4 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 appearance-none cursor-pointer font-medium text-slate-700"
                >
                  <option value="">All Workers</option>
                  {workers.map((w) => (
                    <option key={w._id} value={w._id}>
                      {w.name}
                    </option>
                  ))}
                </select>
                <User className="absolute right-3 top-3 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
            </div>
          </div>

          <div className="flex-1 w-full">
            <span className="text-xs font-bold text-slate-500 uppercase mb-1.5 block ml-1">
              Search
            </span>
            <div className="relative h-[42px]">
              <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search All Columns..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full h-full pl-10 pr-4 bg-white border border-slate-200 rounded-lg text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 font-medium"
              />
            </div>
          </div>
        </div>

        {/* Data Table */}
        <DataTable
          columns={columns}
          data={filteredData}
          loading={loading}
          pagination={pagination}
          onPageChange={(p) => fetchData(p, pagination.limit)}
          onLimitChange={(l) => fetchData(1, l)}
          hideSearch={true}
        />
      </div>

      <OneWashModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        job={selectedJob}
        onSuccess={() => fetchData(pagination.page, pagination.limit)}
      />
    </div>
  );
};

export default OneWash;
