import React, { useState, useEffect } from "react";
import {
  Plus,
  Edit2,
  Trash2,
  Phone,
  Briefcase,
  ShoppingBag,
} from "lucide-react";
import toast from "react-hot-toast";

// Components
import DataTable from "../components/DataTable";
import WorkerModal from "../components/modals/WorkerModal";
import DeleteModal from "../components/modals/DeleteModal";

// API
import { workerService } from "../api/workerService";

const Workers = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);

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

  // --- Fetch Data ---
  const fetchData = async (page = 1, limit = 10, search = "") => {
    setLoading(true);
    setCurrentSearch(search);
    try {
      // API call now sends correct params (pageNo, pageSize)
      const response = await workerService.list(page, limit, search);

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
      toast.error("Failed to load workers");
    } finally {
      setLoading(false);
    }
  };

  // Initial Load
  useEffect(() => {
    fetchData(pagination.page, pagination.limit);
  }, []);

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
      // Refresh current page
      fetchData(pagination.page, pagination.limit, currentSearch);
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
      fetchData(pagination.page, pagination.limit, currentSearch);
    } catch (error) {
      toast.error("Status update failed");
    }
  };

  // --- Columns ---
  const columns = [
    {
      header: "Id",
      accessor: "id",
      className: "w-16",
      render: (row, idx) => (
        <span className="text-slate-400 font-mono">#{row.id}</span>
      ),
    },
    {
      header: "Name",
      accessor: "name",
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center text-xs font-bold border border-blue-100">
            {row.name?.charAt(0).toUpperCase()}
          </div>
          <span className="font-medium text-slate-800">{row.name}</span>
        </div>
      ),
    },
    {
      header: "Mobile",
      accessor: "mobile",
      render: (row) => (
        <div className="flex items-center gap-2 text-slate-600 text-sm font-mono">
          <Phone className="w-3.5 h-3.5 text-slate-400" />
          {row.mobile}
        </div>
      ),
    },
    {
      header: "Status",
      accessor: "status",
      render: (row) => (
        <div
          onClick={() => toggleStatus(row)}
          className={`w-9 h-5 rounded-full relative cursor-pointer transition-colors ${
            row.status === 1 ? "bg-blue-500" : "bg-slate-300"
          }`}
        >
          <div
            className={`absolute top-1 w-3 h-3 bg-white rounded-full shadow-sm transition-all ${
              row.status === 1 ? "left-5" : "left-1"
            }`}
          ></div>
        </div>
      ),
    },
    {
      header: "Actions",
      className: "text-right",
      render: (row) => (
        <div className="flex justify-end items-center gap-2">
          <button
            onClick={() => handleEdit(row)}
            className="p-1.5 hover:bg-blue-50 text-slate-400 hover:text-blue-600 rounded transition-colors"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleDeleteAction(row)}
            className="p-1.5 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  // Expanded Row (Assignments)
  const renderDetailsRow = (row) => {
    const buildings = row.buildings || [];
    const malls = row.malls || [];
    const hasAssignments = buildings.length > 0 || malls.length > 0;

    return (
      <div className="flex items-start gap-4 text-sm py-1">
        <span className="font-bold text-slate-700 mt-1.5">Assigned To:</span>
        <div className="flex flex-wrap gap-2">
          {hasAssignments ? (
            <>
              {malls.map((m, i) => (
                <span
                  key={`m-${i}`}
                  className="bg-[#2a2e3e] text-white text-xs px-3 py-1.5 rounded-md font-medium tracking-wide shadow-sm flex items-center gap-1"
                >
                  <ShoppingBag className="w-3 h-3 opacity-70" />{" "}
                  {typeof m === "object" ? m.name : `Mall ${m}`}
                </span>
              ))}
              {buildings.map((b, i) => (
                <span
                  key={`b-${i}`}
                  className="bg-[#2a2e3e] text-white text-xs px-3 py-1.5 rounded-md font-medium tracking-wide shadow-sm flex items-center gap-1"
                >
                  <Briefcase className="w-3 h-3 opacity-70" />{" "}
                  {typeof b === "object" ? b.name : `Bldg ${b}`}
                </span>
              ))}
            </>
          ) : (
            <span className="text-slate-400 italic mt-1 px-2">
              No active assignments
            </span>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="p-3 max-w-7xl mx-auto">
      {/* <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800">Workers</h1>
        <p className="text-slate-500 mt-1">
          Manage cleaning staff and assignments
        </p>
      </div> */}

      <DataTable
        title="All Workers"
        columns={columns}
        data={data}
        loading={loading}
        pagination={pagination}
        // Pagination Events
        onPageChange={(p) => fetchData(p, pagination.limit, currentSearch)}
        onLimitChange={(l) => fetchData(1, l, currentSearch)}
        onSearch={(term) => fetchData(1, pagination.limit, term)}
        renderExpandedRow={renderDetailsRow}
        actionButton={
          <button
            onClick={handleAdd}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-all shadow-lg shadow-indigo-600/20 active:scale-95"
          >
            <Plus className="w-4 h-4" /> Add Worker
          </button>
        }
      />

      <WorkerModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() =>
          fetchData(pagination.page, pagination.limit, currentSearch)
        }
        editData={selectedWorker}
      />

      <DeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        loading={deleteLoading}
        title="Delete Worker"
      />
    </div>
  );
};

export default Workers;
