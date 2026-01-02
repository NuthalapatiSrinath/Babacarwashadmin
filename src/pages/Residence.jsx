import React, { useState, useEffect } from "react";
import {
  Plus,
  Trash2,
  Edit2,
  Download,
  Search,
  Filter,
  User,
} from "lucide-react";
import toast from "react-hot-toast";

// Components
import DataTable from "../components/DataTable";
import JobModal from "../components/modals/JobModal";
import RichDateRangePicker from "../components/inputs/RichDateRangePicker";

// API
import { jobService } from "../api/jobService";
import { workerService } from "../api/workerService";

const Residence = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);

  const [workers, setWorkers] = useState([]);

  // --- DATE HELPERS ---
  const getToday = () => new Date().toISOString().split("T")[0];

  const getYesterday = () => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d.toISOString().split("T")[0];
  };

  // 🔹 DEFAULT RANGE = Yesterday → Today
  const [filters, setFilters] = useState({
    startDate: getYesterday(),
    endDate: getToday(),
    worker: "",
    status: "",
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
    fetchData(1, 50);
  }, []);

  // --- Fetch Data ---
  const fetchData = async (page = 1, limit = 50) => {
    setLoading(true);
    try {
      const res = await jobService.list(page, limit, searchTerm, filters);

      setData(res.data || []);

      const totalCount = res.total || 0;

      setPagination({
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit) || 1,
      });
    } catch (e) {
      toast.error("Failed to load jobs");
    } finally {
      setLoading(false);
    }
  };

  // --- Date Change Handler ---
  const handleDateChange = (field, value) => {
    if (field === "clear") {
      // 🔹 Reset to Yesterday → Today
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

  const handleCreate = () => {
    setSelectedJob(null);
    setIsModalOpen(true);
  };

  const handleEdit = (row) => {
    setSelectedJob(row);
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this job?")) return;

    try {
      await jobService.delete(id);
      toast.success("Job deleted");
      fetchData(pagination.page, pagination.limit);
    } catch (e) {
      toast.error("Delete failed");
    }
  };

  const handleExport = async () => {
    const toastId = toast.loading("Preparing download...");

    try {
      const exportParams = {
        search: searchTerm,
        startDate: filters.startDate,
        endDate: filters.endDate,
        worker: filters.worker,
        status: filters.status,
      };

      const blob = await jobService.exportData(exportParams);

      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement("a");

      const dateStr = new Date().toISOString().split("T")[0];

      link.href = url;
      link.setAttribute("download", `residence_jobs_${dateStr}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);

      toast.success("Download started", { id: toastId });
    } catch (e) {
      console.error("Export Error:", e);
      toast.error("Export failed", { id: toastId });
    }
  };

  // --- Columns ---
  const columns = [
    {
      header: "Id",
      accessor: "id",
      className: "w-12 text-center text-slate-500",
      render: (row, idx) => (
        <span className="font-mono text-xs">
          {(pagination.page - 1) * pagination.limit + idx + 1}
        </span>
      ),
    },
    {
      header: "Created",
      accessor: "assignedDate",
      render: (row) => (
        <span className="text-slate-700 text-sm font-medium">
          {row.assignedDate
            ? new Date(row.assignedDate).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              })
            : "-"}
        </span>
      ),
    },
    {
      header: "Completed",
      accessor: "completedDate",
      render: (row) => (
        <span className="text-slate-500 text-sm">
          {row.completedDate
            ? new Date(row.completedDate).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              })
            : "-"}
        </span>
      ),
    },
    {
      header: "Status",
      accessor: "status",
      render: (row) => {
        const status = (row.status || "pending").toUpperCase();

        let colorClass = "text-amber-500";
        if (status === "COMPLETED") colorClass = "text-emerald-500";
        if (status === "CANCELLED") colorClass = "text-red-500";

        return (
          <span className={`text-xs font-bold ${colorClass}`}>{status}</span>
        );
      },
    },
    {
      header: "Vehicle No",
      accessor: "vehicle.registration_no",
      render: (row) => (
        <span className="text-slate-700 font-medium text-sm">
          {row.vehicle?.registration_no || "N/A"}
        </span>
      ),
    },
    {
      header: "Parking No",
      accessor: "vehicle.parking_no",
      render: (row) => (
        <span className="text-slate-600 text-sm">
          {row.vehicle?.parking_no || "-"}
        </span>
      ),
    },
    {
      header: "Building",
      accessor: "building.name",
      render: (row) => (
        <span className="text-slate-700 text-sm uppercase">
          {row.building?.name || "-"}
        </span>
      ),
    },
    {
      header: "Customer",
      accessor: "customer.mobile",
      render: (row) => (
        <span className="text-slate-600 font-mono text-sm">
          {row.customer?.mobile || "-"}
        </span>
      ),
    },
    {
      header: "Worker",
      accessor: "worker.name",
      render: (row) => (
        <span className="text-slate-700 text-xs font-bold uppercase">
          {row.worker?.name || "UNASSIGNED"}
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
            title="Edit"
          >
            <Edit2 className="w-4 h-4" />
          </button>

          <button
            onClick={() => handleDelete(row._id)}
            className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-red-600 rounded transition-colors"
            title="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="p-3 w-full">
      {/* Header */}
      <div className="mb-6 flex flex-col xl:flex-row xl:items-center justify-between gap-4 flex-shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Residence Jobs</h1>
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
            <Plus className="w-4 h-4" /> Schedule Job
          </button>
        </div>
      </div>

      {/* Filters */}
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
              <option value="cancelled">Cancelled</option>
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
            placeholder="Search Vehicle / Parking..."
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
      </div>

      {/* Table */}
      <div className="flex-1 min-h-0 bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col">
        <DataTable
          columns={columns}
          data={data}
          loading={loading}
          pagination={pagination}
          onPageChange={(p) => fetchData(p, pagination.limit)}
          onLimitChange={(l) => fetchData(1, l)}
        />
      </div>

      <JobModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        job={selectedJob}
        onSuccess={() => fetchData(pagination.page, pagination.limit)}
      />
    </div>
  );
};

export default Residence;
