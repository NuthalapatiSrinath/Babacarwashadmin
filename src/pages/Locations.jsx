import React, { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, MapPin } from "lucide-react";
import toast from "react-hot-toast";

// Components
import DataTable from "../components/DataTable";
import LocationModal from "../components/modals/LocationModal";
import DeleteModal from "../components/modals/DeleteModal";

// API
import { locationService } from "../api/locationService";

const Locations = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);

  // -- Modal States --
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [locationToDelete, setLocationToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // -- Pagination State --
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50, // <--- CHANGED: Default limit set to 50
    total: 0,
    totalPages: 1,
  });

  // --- Fetch Data ---
  // CHANGED: Default limit parameter set to 50
  const fetchData = async (page = 1, limit = 50, search = "") => {
    setLoading(true);
    try {
      const response = await locationService.list(page, limit, search);

      // Backend usually returns: { total: 100, data: [...] }
      const totalRecords = response.total || response.data.length || 0;
      const totalPages = Math.ceil(totalRecords / limit) || 1;

      setData(response.data);
      setPagination({
        page,
        limit,
        total: totalRecords,
        totalPages,
      });
    } catch (error) {
      console.error("Error fetching locations:", error);
      toast.error("Failed to load locations");
    } finally {
      setLoading(false);
    }
  };

  // Initial Load
  useEffect(() => {
    fetchData(pagination.page, pagination.limit);
  }, []);

  // --- Helper: Handle Backend Pagination Issues ---
  // If the backend returns ALL data (ignores page/limit), we slice it here manually.
  const getDisplayData = () => {
    if (!data) return [];

    // If backend returned more items than the limit, it means server-side pagination failed.
    // We fix it by slicing the array client-side.
    if (data.length > pagination.limit) {
      const startIndex = (pagination.page - 1) * pagination.limit;
      const endIndex = startIndex + pagination.limit;
      return data.slice(startIndex, endIndex);
    }

    // Otherwise, backend works fine, return data as is.
    return data;
  };

  // --- Handlers: Add / Edit ---
  const handleAdd = () => {
    setSelectedLocation(null);
    setIsModalOpen(true);
  };

  const handleEdit = (location) => {
    setSelectedLocation(location);
    setIsModalOpen(true);
  };

  // --- Handlers: Delete ---
  const openDeleteModal = (location) => {
    setLocationToDelete(location);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!locationToDelete) return;

    setDeleteLoading(true);
    try {
      await locationService.delete(locationToDelete._id);
      toast.success("Location deleted successfully");
      setIsDeleteModalOpen(false);
      // Refresh page data
      fetchData(pagination.page, pagination.limit);
    } catch (error) {
      console.error(error);
      toast.error(error.message || "Failed to delete location");
    } finally {
      setDeleteLoading(false);
    }
  };

  // --- Table Configuration ---
  const columns = [
    {
      header: "#",
      accessor: "id",
      className: "w-20",
      render: (row) => (
        <span className="text-slate-400 font-mono">#{row.id}</span>
      ),
    },
    {
      header: "Address",
      accessor: "address",
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100">
            <MapPin className="w-4 h-4" />
          </div>
          <span className="font-medium text-slate-700">{row.address}</span>
        </div>
      ),
    },
    {
      header: "Created At",
      accessor: "createdAt",
      render: (row) => (
        <span className="text-sm text-slate-500">
          {new Date(row.createdAt).toLocaleDateString()}
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
    <div className="p-3 w-full">
      {/* Table */}
      <DataTable
        title="Location List"
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
            Add Location
          </button>
        }
      />

      {/* -- Modals -- */}

      {/* Add / Edit Modal */}
      <LocationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => fetchData(pagination.page, pagination.limit)}
        editData={selectedLocation}
      />

      {/* Delete Confirmation Modal */}
      <DeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        loading={deleteLoading}
        title="Delete Location"
        message={`Are you sure you want to delete "${locationToDelete?.address}"?`}
      />
    </div>
  );
};

export default Locations;
