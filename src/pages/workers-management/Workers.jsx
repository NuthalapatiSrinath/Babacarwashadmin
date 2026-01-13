import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  Edit2,
  Trash2,
  Phone,
  Briefcase,
  ShoppingBag,
  Eye,
  Calendar,
  User,
} from "lucide-react";
import toast from "react-hot-toast";

// Components
import DataTable from "../../components/DataTable";
import WorkerModal from "../../components/modals/WorkerModal";
import DeleteModal from "../../components/modals/DeleteModal";

// API
import { workerService } from "../../api/workerService";

const Workers = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  const [activeTab, setActiveTab] = useState("active"); // "active" or "inactive"
  const [currency, setCurrency] = useState("AED"); // Default currency

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedWorker, setSelectedWorker] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [workerToDelete, setWorkerToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Pagination & Search State
  const [currentSearch, setCurrentSearch] = useState("");
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 1,
  });

  // --- Load Currency from Settings ---
  useEffect(() => {
    const savedCurrency = localStorage.getItem("app_currency");
    if (savedCurrency) {
      setCurrency(savedCurrency);
    }
  }, []);

  // --- Fetch Data ---
  const fetchData = async (
    page = 1,
    limit = 10,
    search = "",
    status = undefined
  ) => {
    setLoading(true);
    setCurrentSearch(search);
    try {
      // Use status from activeTab if not provided
      const fetchStatus =
        status !== undefined ? status : activeTab === "active" ? 1 : 2;

      const response = await workerService.list(
        page,
        limit,
        search,
        fetchStatus
      );

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
      console.error("❌ [WORKERS] Error:", error);
      toast.error("Failed to load workers");
    } finally {
      setLoading(false);
    }
  };

  // Initial Load
  useEffect(() => {
    const status = activeTab === "active" ? 1 : 2;
    fetchData(pagination.page, pagination.limit, currentSearch, status);
  }, [activeTab]);

  // --- Handlers ---
  const handleAdd = () => {
    setSelectedWorker(null);
    setIsModalOpen(true);
  };

  const handleEdit = (w) => {
    setSelectedWorker(w);
    setIsModalOpen(true);
  };

  const handleDeleteAction = (w) => {
    setWorkerToDelete(w);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    setDeleteLoading(true);
    try {
      await workerService.delete(workerToDelete._id);
      toast.success("Deleted successfully");
      setIsDeleteModalOpen(false);
      const status = activeTab === "active" ? 1 : 2;
      fetchData(pagination.page, pagination.limit, currentSearch, status);
    } catch (error) {
      const msg = error.response?.data?.message || "Delete failed";
      toast.error(msg);
    } finally {
      setDeleteLoading(false);
    }
  };

  const toggleStatus = async (worker) => {
    try {
      const newStatus = worker.status === 1 ? 2 : 1;
      await workerService.update(worker._id, { status: newStatus });
      toast.success(`Worker ${newStatus === 1 ? "Activated" : "Deactivated"}`);
      const status = activeTab === "active" ? 1 : 2;
      fetchData(pagination.page, pagination.limit, currentSearch, status);
    } catch (error) {
      toast.error("Status update failed");
    }
  };

  // Navigation handlers
  const handleViewPayments = (worker) => {
    navigate(`/workers/${worker._id}/payments`, { state: { worker } });
  };

  const handleViewHistory = (worker) => {
    navigate(`/workers/${worker._id}/history`, { state: { worker } });
  };

  // Format date helper
  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-GB");
  };

  // --- Columns (Rich CSS) ---
  const columns = [
    {
      header: "#",
      accessor: "id",
      className: "w-16 text-center",
      render: (row, idx) => (
        <div className="flex justify-center">
          <span className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold text-xs font-mono border border-indigo-100">
            {row.id || (pagination.page - 1) * pagination.limit + idx + 1}
          </span>
        </div>
      ),
    },
    {
      header: "Name",
      accessor: "name",
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-sm text-white font-bold text-sm">
            {row.name?.charAt(0).toUpperCase() || <User className="w-4 h-4" />}
          </div>
          <span className="font-bold text-slate-700 text-sm">{row.name}</span>
        </div>
      ),
    },
    {
      header: "Mobile",
      accessor: "mobile",
      render: (row) => (
        <div className="flex items-center gap-2 text-slate-600 text-sm font-medium">
          <div className="p-1.5 rounded-lg bg-slate-100 text-slate-500">
            <Phone className="w-3.5 h-3.5" />
          </div>
          {row.mobile || (
            <span className="text-slate-400 italic">No Number</span>
          )}
        </div>
      ),
    },
    {
      header: "Start Date",
      accessor: "createdAt",
      render: (row) => (
        <div className="flex items-center gap-2 text-slate-600 text-sm font-medium">
          <Calendar className="w-3.5 h-3.5 text-indigo-500" />
          {formatDate(row.createdAt)}
        </div>
      ),
    },
    {
      header: "Quick Links",
      className: "text-center min-w-[120px]",
      render: (row) => (
        <div className="flex items-center justify-center gap-2">
          {/* Only Payments & History */}
          <button
            onClick={() => handleViewPayments(row)}
            className="p-1.5 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 hover:text-green-700 transition-colors shadow-sm border border-green-100"
            title="Payments"
          >
            {/* ✅ DYNAMIC CURRENCY SYMBOL */}
            <span className="text-[10px] font-bold px-1">{currency}</span>
          </button>

          <button
            onClick={() => handleViewHistory(row)}
            className="p-1.5 bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100 hover:text-purple-700 transition-colors shadow-sm border border-purple-100"
            title="History"
          >
            <Calendar className="w-3.5 h-3.5" />
          </button>
        </div>
      ),
    },
    {
      header: "Status",
      accessor: "status",
      className: "text-center w-24",
      render: (row) => (
        <div className="flex justify-center">
          <div
            onClick={() => toggleStatus(row)}
            className={`w-11 h-6 rounded-full relative cursor-pointer transition-all duration-300 shadow-inner ${
              row.status === 1
                ? "bg-gradient-to-r from-emerald-400 to-emerald-600"
                : "bg-slate-200"
            }`}
            title={row.status === 1 ? "Deactivate" : "Activate"}
          >
            <div
              className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-md transition-all duration-300 ${
                row.status === 1 ? "left-6" : "left-1"
              }`}
            />
          </div>
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
            onClick={() => handleDeleteAction(row)}
            className="p-2 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-lg transition-all"
            title="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  // --- Expanded Row Content (Assignments) ---
  const renderDetailsRow = (row) => {
    const buildings = row.buildings || [];
    const malls = row.malls || [];
    const hasAssignments = buildings.length > 0 || malls.length > 0;

    return (
      <div className="flex items-start gap-4 text-sm py-2 px-4 bg-slate-50/50 rounded-lg border border-slate-100 mt-2 mx-4 mb-2">
        <div className="flex items-center gap-2 text-slate-500 font-bold mt-1.5 min-w-[100px]">
          <Briefcase className="w-4 h-4 text-indigo-500" />
          <span>Assigned To:</span>
        </div>

        <div className="flex flex-wrap gap-2">
          {hasAssignments ? (
            <>
              {malls.map((m, i) => (
                <span
                  key={`m-${i}`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 font-semibold text-xs shadow-sm"
                >
                  <ShoppingBag className="w-3.5 h-3.5 text-purple-500" />
                  {typeof m === "object" ? m.name : `Mall ${m}`}
                </span>
              ))}
              {buildings.map((b, i) => (
                <span
                  key={`b-${i}`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 font-semibold text-xs shadow-sm"
                >
                  <Briefcase className="w-3.5 h-3.5 text-blue-500" />
                  {typeof b === "object" ? b.name : `Bldg ${b}`}
                </span>
              ))}
            </>
          ) : (
            <span className="text-slate-400 italic text-xs mt-1.5">
              No active assignments
            </span>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6 font-sans">
      {/* --- TABLE SECTION --- */}
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
        {/* Custom Tabs Header within the Card */}
        <div className="flex border-b border-gray-100 bg-slate-50/50">
          <button
            onClick={() => setActiveTab("active")}
            className={`px-6 py-4 text-sm font-bold transition-all relative ${
              activeTab === "active"
                ? "text-indigo-600 bg-white border-t-2 border-t-indigo-600 shadow-sm z-10"
                : "text-slate-500 hover:text-slate-700 hover:bg-slate-100/50"
            }`}
          >
            Active Workers
          </button>
          <button
            onClick={() => setActiveTab("inactive")}
            className={`px-6 py-4 text-sm font-bold transition-all relative ${
              activeTab === "inactive"
                ? "text-indigo-600 bg-white border-t-2 border-t-indigo-600 shadow-sm z-10"
                : "text-slate-500 hover:text-slate-700 hover:bg-slate-100/50"
            }`}
          >
            Inactive Workers
          </button>
        </div>

        <DataTable
          columns={columns}
          data={data}
          loading={loading}
          // Pagination props
          pagination={pagination}
          onPageChange={(p) => {
            const status = activeTab === "active" ? 1 : 2;
            fetchData(p, pagination.limit, currentSearch, status);
          }}
          onLimitChange={(l) => {
            const status = activeTab === "active" ? 1 : 2;
            fetchData(1, l, currentSearch, status);
          }}
          // Search & Action
          onSearch={(term) => {
            const status = activeTab === "active" ? 1 : 2;
            fetchData(1, pagination.limit, term, status);
          }}
          actionButton={
            <button
              onClick={handleAdd}
              className="h-10 px-5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all active:scale-95 whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              Add Worker
            </button>
          }
          // Expanded Row
          renderExpandedRow={renderDetailsRow}
        />
      </div>

      {/* --- MODALS --- */}
      <WorkerModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => {
          const status = activeTab === "active" ? 1 : 2;
          fetchData(pagination.page, pagination.limit, currentSearch, status);
        }}
        editData={selectedWorker}
      />

      <DeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        loading={deleteLoading}
        title="Delete Worker"
        message={`Are you sure you want to delete "${workerToDelete?.name}"?`}
      />
    </div>
  );
};

export default Workers;
