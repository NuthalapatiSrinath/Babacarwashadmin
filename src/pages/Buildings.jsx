import React, { useState, useEffect } from "react";
import {
  Plus,
  Edit2,
  Trash2,
  Building,
  MapPin,
  DollarSign,
  CheckCircle,
  XCircle,
} from "lucide-react";
import toast from "react-hot-toast";

// Components
import DataTable from "../components/DataTable";
import BuildingModal from "../components/modals/BuildingModal";
import DeleteModal from "../components/modals/DeleteModal";

// API
import { buildingService } from "../api/buildingService";

const Buildings = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);

  // -- Modal States --
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedBuilding, setSelectedBuilding] = useState(null);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [buildingToDelete, setBuildingToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // -- Pagination --
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50, // <--- CHANGED: Default limit set to 50
    total: 0,
    totalPages: 1,
  });

  // --- Fetch Data ---
  // <--- CHANGED: Default limit parameter set to 50
  const fetchData = async (page = 1, limit = 50, search = "") => {
    setLoading(true);
    try {
      const response = await buildingService.list(page, limit, search);
      const totalRecords = response.total || response.data?.length || 0;
      const totalPages = Math.ceil(totalRecords / limit) || 1;

      setData(response.data || []);
      setPagination({ page, limit, total: totalRecords, totalPages });
    } catch (error) {
      console.error("Error fetching buildings:", error);
      toast.error("Failed to load buildings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(pagination.page, pagination.limit);
  }, []);

  // --- Helper: Client-side Pagination Fallback ---
  const getDisplayData = () => {
    if (!data) return [];
    if (data.length > pagination.limit) {
      const startIndex = (pagination.page - 1) * pagination.limit;
      return data.slice(startIndex, startIndex + pagination.limit);
    }
    return data;
  };

  // --- Handlers ---
  const handleAdd = () => {
    setSelectedBuilding(null);
    setIsModalOpen(true);
  };

  const handleEdit = (building) => {
    setSelectedBuilding(building);
    setIsModalOpen(true);
  };

  const openDeleteModal = (building) => {
    setBuildingToDelete(building);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!buildingToDelete) return;
    setDeleteLoading(true);
    try {
      await buildingService.delete(buildingToDelete._id);
      toast.success("Building deleted successfully");
      setIsDeleteModalOpen(false);
      fetchData(pagination.page, pagination.limit);
    } catch (error) {
      console.error(error);
      toast.error(error.message || "Failed to delete building");
    } finally {
      setDeleteLoading(false);
    }
  };

  // --- Columns Configuration ---
  const columns = [
    {
      header: "#",
      accessor: "id",
      className: "w-16",
      render: (row) => (
        <span className="text-slate-400 font-mono">#{row.id}</span>
      ),
    },
    {
      header: "Building Name",
      accessor: "name",
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100">
            <Building className="w-4 h-4" />
          </div>
          <span className="font-medium text-slate-700">{row.name}</span>
        </div>
      ),
    },
    {
      header: "Location",
      accessor: "location",
      render: (row) => (
        <div className="flex items-center gap-2 text-slate-600 text-sm">
          <MapPin className="w-3.5 h-3.5 text-slate-400" />
          <span
            className="truncate max-w-[150px]"
            title={row.location_id?.address}
          >
            {row.location_id?.address || (
              <span className="text-red-400 italic">No Location</span>
            )}
          </span>
        </div>
      ),
    },
    // NEW: Amount Field
    {
      header: "Amount",
      accessor: "amount",
      render: (row) => (
        <div className="flex items-center gap-1 text-slate-700 font-medium">
          <DollarSign className="w-3 h-3 text-slate-400" />
          {row.amount?.toFixed(2) || "0.00"}
        </div>
      ),
    },
    // NEW: Card Charges Field
    {
      header: "Card Charges",
      accessor: "card_charges",
      render: (row) => (
        <span className="text-slate-600 text-sm">
          {row.card_charges?.toFixed(2) || "0.00"}
        </span>
      ),
    },
    // NEW: Schedule Today Toggle Status
    {
      header: "Scheduled",
      accessor: "schedule_today",
      render: (row) =>
        row.schedule_today ? (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700">
            <CheckCircle className="w-3 h-3" /> Yes
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-500">
            <XCircle className="w-3 h-3" /> No
          </span>
        ),
    },
    {
      header: "Actions",
      className: "text-right",
      render: (row) => (
        <div className="flex justify-end gap-2">
          <button
            onClick={() => handleEdit(row)}
            className="p-2 hover:bg-blue-50 text-slate-400 hover:text-blue-600 rounded-lg transition-colors"
            title="Edit"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => openDeleteModal(row)}
            className="p-2 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-lg transition-colors"
            title="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="p-2 w-full">
      {/* <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800">Buildings</h1>
        <p className="text-slate-500 mt-1">
          Manage buildings, charges, and daily schedules
        </p>
      </div> */}

      <DataTable
        title="All Buildings"
        columns={columns}
        data={getDisplayData()}
        loading={loading}
        pagination={pagination}
        onPageChange={(newPage) => fetchData(newPage, pagination.limit)}
        onLimitChange={(newLimit) => fetchData(1, newLimit)}
        onSearch={(term) => fetchData(1, pagination.limit, term)}
        actionButton={
          <button
            onClick={handleAdd}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-all shadow-lg shadow-indigo-600/20 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            Add Building
          </button>
        }
      />

      <BuildingModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => fetchData(pagination.page, pagination.limit)}
        editData={selectedBuilding}
      />

      <DeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        loading={deleteLoading}
        title="Delete Building"
        message={`Are you sure you want to delete "${buildingToDelete?.name}"?`}
      />
    </div>
  );
};

export default Buildings;
