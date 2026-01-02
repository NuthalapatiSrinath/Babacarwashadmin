import React, { useState, useEffect } from "react";
import {
  Plus,
  Trash2,
  Edit2,
  Download,
  Search,
  MapPin,
  User,
  Filter,
  CreditCard,
  Banknote,
} from "lucide-react";
import toast from "react-hot-toast";

import DataTable from "../components/DataTable";
import OneWashModal from "../components/modals/OneWashModal";
import RichDateRangePicker from "../components/inputs/RichDateRangePicker";

import { oneWashService } from "../api/oneWashService";
import { workerService } from "../api/workerService";

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
  // DATE HELPERS
  // -----------------------------
  const getToday = () => new Date().toISOString().split("T")[0];

  const getYesterday = () => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d.toISOString().split("T")[0];
  };

  // DEFAULT DATES: yesterday ➜ today
  const [filters, setFilters] = useState({
    startDate: getYesterday(),
    endDate: getToday(),
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
  // LOAD WORKERS + INITIAL DATA
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
    fetchData(1, 50);
  }, []);

  // --------------------------------
  // FETCH DATA
  // --------------------------------
  const fetchData = async (page = 1, limit = 50) => {
    setLoading(true);

    try {
      const res = await oneWashService.list(page, limit, searchTerm, filters);

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
  // FILTER HANDLERS
  // --------------------------------
  const handleDateChange = (field, value) => {
    if (field === "clear") {
      // 🔁 reset again to yesterday → today
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

  const applyFilters = () => {
    fetchData(1, pagination.limit);
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
    try {
      const blob = await oneWashService.exportData({
        ...filters,
        search: searchTerm,
      });

      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement("a");

      link.href = url;
      link.setAttribute("download", "onewash_report.xlsx");
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);

      toast.success("Download started");
    } catch {
      toast.error("Export failed");
    }
  };

  // --------------------------------
  // TABLE COLUMNS
  // --------------------------------
  const columns = [
    {
      header: "ID",
      accessor: "id",
      className: "w-16 text-center text-xs font-mono text-slate-400",
      render: (row) => <span>#{row.id}</span>,
    },
    {
      header: "Date",
      accessor: "createdAt",
      className: "w-28",
      render: (row) => (
        <div className="flex flex-col">
          <span className="text-slate-700 font-medium text-sm">
            {new Date(row.createdAt).toLocaleDateString()}
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
      header: "Vehicle Info",
      accessor: "registration_no",
      render: (row) => (
        <div className="flex flex-col gap-1">
          <span className="bg-slate-100 border border-slate-200 px-2 py-0.5 rounded text-xs font-bold uppercase text-slate-700 tracking-wide w-fit">
            {row.registration_no}
          </span>

          {row.parking_no && (
            <span className="text-[10px] text-slate-500">
              Parking: <b>{row.parking_no}</b>
            </span>
          )}
        </div>
      ),
    },
    {
      header: "Location",
      accessor: "service_type",
      render: (row) => (
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5 mb-0.5">
            <MapPin
              className={`w-3 h-3 ${
                row.service_type === "mall"
                  ? "text-purple-500"
                  : "text-orange-500"
              }`}
            />
            <span className="text-xs font-bold uppercase text-slate-500">
              {row.service_type}
            </span>
          </div>

          <span className="text-sm font-medium text-slate-700 truncate max-w-[140px]">
            {row.service_type === "mall"
              ? row.mall?.name || "-"
              : row.building?.name || "-"}
          </span>
        </div>
      ),
    },
    {
      header: "Assigned Worker",
      accessor: "worker",
      render: (row) => (
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 text-xs font-bold">
            {row.worker?.name?.[0] || "U"}
          </div>
          <span className="text-sm text-slate-600 font-medium">
            {row.worker?.name || "Unassigned"}
          </span>
        </div>
      ),
    },
    {
      header: "Amount",
      accessor: "amount",
      className: "text-right",
      render: (row) => (
        <div className="flex flex-col items-end">
          <span className="font-bold text-slate-800 text-sm">
            {row.amount} AED
          </span>

          <div className="flex items-center gap-1 mt-0.5">
            {row.payment_mode === "cash" && (
              <Banknote className="w-3 h-3 text-emerald-500" />
            )}
            {row.payment_mode === "card" && (
              <CreditCard className="w-3 h-3 text-blue-500" />
            )}

            <span className="text-[10px] text-slate-400 uppercase font-bold">
              {row.payment_mode}
            </span>
          </div>
        </div>
      ),
    },
    {
      header: "Status",
      accessor: "status",
      className: "w-24 text-center",
      render: (row) => (
        <span
          className={`inline-flex items-center justify-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ${
            row.status === "completed"
              ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
              : "bg-amber-50 text-amber-700 border border-amber-100"
          }`}
        >
          {row.status}
        </span>
      ),
    },
    {
      header: "Actions",
      className: "text-right w-20",
      render: (row) => (
        <div className="flex justify-end gap-1">
          <button
            onClick={() => handleEdit(row)}
            className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-indigo-600 rounded transition-colors"
          >
            <Edit2 className="w-4 h-4" />
          </button>

          <button
            onClick={() => handleDelete(row._id)}
            className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-red-600 rounded transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="p-3 w-full">
      {/* HEADER */}
      <div className="mb-6 flex flex-col xl:flex-row xl:items-center justify-between gap-4 flex-shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">One Wash Jobs</h1>

          <div className="flex flex-wrap gap-3 mt-2 text-xs font-medium text-slate-500">
            <span className="bg-white px-2 py-1 rounded border border-slate-200 shadow-sm">
              Total Jobs: <b className="text-indigo-600">{stats.totalJobs}</b>
            </span>

            <span className="bg-white px-2 py-1 rounded border border-slate-200 shadow-sm">
              Revenue:{" "}
              <b className="text-emerald-600">{stats.totalAmount} AED</b>
            </span>

            <span className="bg-white px-2 py-1 rounded border border-slate-200 shadow-sm">
              Cash: <b>{stats.cash}</b>
            </span>

            <span className="bg-white px-2 py-1 rounded border border-slate-200 shadow-sm">
              Card: <b>{stats.card}</b>
            </span>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleExport}
            className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-xl font-bold text-sm hover:bg-slate-50 transition-all flex items-center gap-2 shadow-sm"
          >
            <Download className="w-4 h-4" /> Export
          </button>

          <button
            onClick={handleCreate}
            className="px-5 py-2 bg-indigo-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> New Job
          </button>
        </div>
      </div>

      {/* FILTERS */}
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
              name="service_type"
              value={filters.service_type}
              onChange={handleFilterChange}
              className="w-full h-[50px] bg-slate-50 border border-slate-200 rounded-xl px-4 text-sm outline-none focus:border-indigo-500 appearance-none cursor-pointer"
            >
              <option value="">All Services</option>
              <option value="mall">Mall</option>
              <option value="residence">Residence</option>
            </select>
            <Filter className="absolute right-4 top-4 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>

          <div className="relative">
            <select
              name="worker"
              value={filters.worker}
              onChange={handleFilterChange}
              className="w-full h-[50px] bg-slate-50 border border-slate-200 rounded-xl px-4 text-sm outline-none focus:border-indigo-500 appearance-none cursor-pointer"
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
            placeholder="Search Plate No..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) =>
              e.key === "Enter" && fetchData(1, pagination.limit)
            }
            className="w-full h-full pl-12 pr-4 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-indigo-500"
          />
        </div>

        <button
          onClick={applyFilters}
          className="h-[50px] px-8 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-md transition-all flex items-center gap-2"
        >
          Search
        </button>
      </div>

      {/* TABLE */}
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
