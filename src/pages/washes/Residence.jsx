import React, { useState, useEffect } from "react";
import {
  Plus,
  Trash2,
  Edit2,
  Download,
  Search,
  Filter,
  User,
  Calendar,
  Car,
  CheckCircle,
  XCircle,
  Clock,
  Briefcase,
  Phone,
  Building2,
} from "lucide-react";
import toast from "react-hot-toast";

// Components
import DataTable from "../../components/DataTable";
import JobModal from "../../components/modals/JobModal";
import RichDateRangePicker from "../../components/inputs/RichDateRangePicker";

// API
import { jobService } from "../../api/jobService";
import { workerService } from "../../api/workerService";
import { buildingService } from "../../api/buildingService";

const Residence = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [buildings, setBuildings] = useState([]);

  // --- DATE HELPERS ---
  const formatDateLocal = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const getToday = () => formatDateLocal(new Date());

  const getLast10Days = () => {
    const d = new Date();
    d.setDate(d.getDate() - 10);
    return formatDateLocal(d);
  };

  // 🔹 FILTERS STATE
  const [filters, setFilters] = useState({
    startDate: getLast10Days(),
    endDate: getToday(),
    worker: "",
    status: "",
    building: "",
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
    const loadResources = async () => {
      try {
        const wRes = await workerService.list(1, 1000);
        setWorkers(wRes.data || []);
        try {
          const bRes = await buildingService.list(1, 1000);
          setBuildings(bRes.data || []);
        } catch (err) {
          console.warn("Failed to load buildings", err);
        }
      } catch (e) {
        console.error(e);
      }
    };
    loadResources();
  }, []);

  // --- Automatic Fetch on Filter Change ---
  useEffect(() => {
    fetchData(1, pagination.limit);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  // --- Instant Search Fetch (Server Side) ---
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchData(1, pagination.limit);
    }, 500);
    return () => clearTimeout(delayDebounceFn);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm]);

  // --- Fetch Data ---
  const fetchData = async (page = 1, limit = 50) => {
    setLoading(true);
    try {
      // FIX: Send raw YYYY-MM-DD. Backend now handles end-of-day logic.
      const apiFilters = { ...filters };

      const res = await jobService.list(page, limit, searchTerm, apiFilters);
      let fetchedData = res.data || [];

      // Sort by assignedDate descending
      fetchedData.sort((a, b) => {
        const dateA = new Date(a.assignedDate);
        const dateB = new Date(b.assignedDate);
        return dateB - dateA;
      });

      setData(fetchedData);
      const totalCount = res.total || 0;
      setPagination({
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit) || 1,
      });
    } catch (e) {
      toast.error("Failed to load jobs");
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  // --- CLIENT SIDE FILTERING ---
  const filteredData = data.filter((row) => {
    if (!searchTerm) return true;
    const lowerTerm = searchTerm.toLowerCase();

    const vehicleReg = row.vehicle?.registration_no?.toLowerCase() || "";
    const parkingNo = row.vehicle?.parking_no?.toString().toLowerCase() || "";
    const mobile = row.customer?.mobile?.toLowerCase() || "";
    const buildingName = row.building?.name?.toLowerCase() || "";
    const workerName = row.worker?.name?.toLowerCase() || "";

    return (
      vehicleReg.includes(lowerTerm) ||
      parkingNo.includes(lowerTerm) ||
      mobile.includes(lowerTerm) ||
      buildingName.includes(lowerTerm) ||
      workerName.includes(lowerTerm)
    );
  });

  // --- Handlers ---
  const handleDateChange = (field, value) => {
    if (field === "clear") {
      setFilters((prev) => ({
        ...prev,
        startDate: getLast10Days(),
        endDate: getToday(),
      }));
    } else {
      setFilters((prev) => ({ ...prev, [field]: value }));
    }
  };

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
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
      const exportFilters = { ...filters };
      // Backend now handles dates robustly (no need to manually append time)

      const blobData = await jobService.exportData({
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
      link.setAttribute("download", `residence_jobs_${dateStr}.xlsx`);

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

  // --- Columns ---
  const columns = [
    {
      header: "ID",
      accessor: "id",
      className: "w-16 text-center",
      render: (row, idx) => (
        <div className="flex justify-center">
          <span className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-xs font-mono border border-slate-200">
            {(pagination.page - 1) * pagination.limit + idx + 1}
          </span>
        </div>
      ),
    },
    {
      header: "Created",
      accessor: "assignedDate",
      render: (row) => (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
            <Calendar className="w-4 h-4" />
          </div>
          <span className="text-slate-700 text-sm font-bold">
            {row.assignedDate
              ? new Date(row.assignedDate).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })
              : "-"}
          </span>
        </div>
      ),
    },
    {
      header: "Completed",
      accessor: "completedDate",
      render: (row) => (
        <span className="text-slate-500 text-xs font-medium bg-slate-50 px-2 py-1 rounded border border-slate-100">
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
      className: "w-24 text-center",
      render: (row) => {
        const status = (row.status || "pending").toLowerCase();
        const statusConfig = {
          completed: {
            classes: "bg-emerald-50 text-emerald-600 border-emerald-100",
            icon: CheckCircle,
            label: "Completed",
          },
          cancelled: {
            classes: "bg-red-50 text-red-600 border-red-100",
            icon: XCircle,
            label: "Cancelled",
          },
          pending: {
            classes: "bg-amber-50 text-amber-600 border-amber-100",
            icon: Clock,
            label: "Pending",
          },
        };
        const config = statusConfig[status] || statusConfig.pending;
        const Icon = config.icon;
        return (
          <div
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[10px] font-bold uppercase tracking-wide ${config.classes}`}
          >
            <Icon className="w-3 h-3" />
            {config.label}
          </div>
        );
      },
    },
    {
      header: "Vehicle Details",
      accessor: "vehicle.registration_no",
      render: (row) => (
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <Car className="w-3.5 h-3.5 text-slate-400" />
            <span className="bg-slate-100 border border-slate-200 px-2 py-0.5 rounded text-xs font-bold uppercase text-slate-700 tracking-wide w-fit">
              {row.vehicle?.registration_no || "N/A"}
            </span>
          </div>
          {row.vehicle?.parking_no && (
            <span className="text-[10px] text-slate-500 pl-6">
              Parking:{" "}
              <span className="font-bold">{row.vehicle.parking_no}</span>
            </span>
          )}
        </div>
      ),
    },
    {
      header: "Building / Customer",
      accessor: "building.name",
      render: (row) => (
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5 mb-0.5">
            <Building2 className="w-3 h-3 text-indigo-500" />
            <span className="text-xs font-bold uppercase text-slate-600 truncate max-w-[150px]">
              {row.building?.name || "-"}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <Phone className="w-3 h-3 text-slate-400" />
            <span className="text-xs font-mono text-slate-500">
              {row.customer?.mobile || "-"}
            </span>
          </div>
        </div>
      ),
    },
    {
      header: "Worker",
      accessor: "worker.name",
      render: (row) => (
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-100 to-purple-200 flex items-center justify-center text-purple-700 text-xs font-bold border border-purple-200">
            {row.worker?.name?.[0] || "U"}
          </div>
          <span className="text-sm text-slate-700 font-medium">
            {row.worker?.name || (
              <span className="text-slate-400 italic text-xs">Unassigned</span>
            )}
          </span>
        </div>
      ),
    },
    {
      header: "Actions",
      className:
        "text-right w-24 sticky right-0 bg-white shadow-[-5px_0_10px_-5px_rgba(0,0,0,0.05)]",
      render: (row) => (
        <div className="flex justify-end gap-1.5 pr-2">
          <button
            onClick={() => handleEdit(row)}
            className="p-2 hover:bg-indigo-50 text-slate-400 hover:text-indigo-600 rounded-lg transition-all"
            title="Edit"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleDelete(row._id)}
            className="p-2 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-lg transition-all"
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
      <div className="mb-6 flex flex-col xl:flex-row xl:items-center justify-between gap-6">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-200">
              <Briefcase className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-slate-800 to-indigo-800 bg-clip-text text-transparent">
                Residence Jobs
              </h1>
              <p className="text-sm text-slate-500 font-medium">
                Manage residential service schedules
              </p>
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
            <Plus className="w-4 h-4" /> Schedule Job
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden flex flex-col">
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

          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
            <div className="relative">
              <span className="text-xs font-bold text-slate-500 uppercase mb-1.5 block ml-1">
                Status
              </span>
              <div className="relative">
                <select
                  name="status"
                  value={filters.status}
                  onChange={handleFilterChange}
                  className="w-full h-[42px] bg-white border border-slate-200 rounded-lg px-4 text-sm text-slate-700 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 appearance-none cursor-pointer font-medium uppercase"
                >
                  <option value="">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
                <Filter className="absolute right-3 top-3 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
            </div>

            <div className="relative">
              <span className="text-xs font-bold text-slate-500 uppercase mb-1.5 block ml-1">
                Building
              </span>
              <div className="relative">
                <select
                  name="building"
                  value={filters.building}
                  onChange={handleFilterChange}
                  className="w-full h-[42px] bg-white border border-slate-200 rounded-lg px-4 text-sm text-slate-700 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 appearance-none cursor-pointer font-medium"
                >
                  <option value="">All Buildings</option>
                  {buildings.map((b) => (
                    <option key={b._id} value={b._id}>
                      {b.name}
                    </option>
                  ))}
                </select>
                <Building2 className="absolute right-3 top-3 w-4 h-4 text-slate-400 pointer-events-none" />
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
                  className="w-full h-[42px] bg-white border border-slate-200 rounded-lg px-4 text-sm text-slate-700 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 appearance-none cursor-pointer font-medium"
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

            <div className="relative">
              <span className="text-xs font-bold text-slate-500 uppercase mb-1.5 block ml-1">
                Search
              </span>
              <div className="relative h-[42px]">
                <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search Vehicle, Parking, Mobile or Worker..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full h-full pl-10 pr-4 bg-white border border-slate-200 rounded-lg text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 font-medium"
                />
              </div>
            </div>
          </div>
        </div>

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
