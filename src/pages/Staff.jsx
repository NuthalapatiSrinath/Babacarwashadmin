import React, { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, Hash, Map } from "lucide-react";
import toast from "react-hot-toast";

// Components
import DataTable from "../components/DataTable";
import StaffModal from "../components/modals/StaffModal";
import DeleteModal from "../components/modals/DeleteModal";

// API
import { staffService } from "../api/staffService";

const Staff = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [staffToDelete, setStaffToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Pagination & Search
  const [currentSearch, setCurrentSearch] = useState("");
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 1,
  });

  // Fetch Data
  const fetchData = async (page = 1, limit = 10, search = "") => {
    setLoading(true);
    setCurrentSearch(search);
    try {
      const response = await staffService.list(page, limit, search);

      setData(response.data || []);
      setPagination({
        page,
        limit,
        total: response.total || 0,
        totalPages: Math.ceil((response.total || 0) / limit) || 1,
      });
    } catch (error) {
      toast.error("Failed to load staff");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(pagination.page, pagination.limit);
  }, []);

  // Handlers
  const handleAdd = () => {
    setSelectedStaff(null);
    setIsModalOpen(true);
  };
  const handleEdit = (staff) => {
    setSelectedStaff(staff);
    setIsModalOpen(true);
  };
  const handleDeleteAction = (staff) => {
    setStaffToDelete(staff);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    setDeleteLoading(true);
    try {
      await staffService.delete(staffToDelete._id);
      toast.success("Deleted successfully");
      setIsDeleteModalOpen(false);
      fetchData(pagination.page, pagination.limit, currentSearch);
    } catch (error) {
      const msg = error.response?.data?.message || "Delete failed";
      toast.error(msg);
    } finally {
      setDeleteLoading(false);
    }
  };

  // Columns
  const columns = [
    {
      header: "#",
      accessor: "id",
      className: "w-16",
      render: (row, idx) => (
        <span className="text-slate-400 font-mono">#{row.id || idx + 1}</span>
      ),
    },
    {
      header: "Name",
      accessor: "name",
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center text-xs font-bold border border-emerald-100">
            {row.name?.charAt(0).toUpperCase()}
          </div>
          <span className="font-medium text-slate-800">{row.name}</span>
        </div>
      ),
    },
    {
      header: "Employee Code",
      accessor: "employeeCode",
      render: (row) => (
        <div className="flex items-center gap-2 text-slate-600 text-sm font-mono">
          <Hash className="w-3.5 h-3.5 text-slate-400" />
          {row.employeeCode}
        </div>
      ),
    },
    {
      header: "Assigned Site",
      accessor: "site",
      render: (row) => (
        <div className="flex items-center gap-2">
          {row.site ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-gray-100 text-gray-700 text-xs font-medium border border-gray-200">
              <Map className="w-3 h-3 text-gray-500" />
              {typeof row.site === "object"
                ? row.site.name
                : "Site ID: " + row.site}
            </span>
          ) : (
            <span className="text-slate-400 text-xs italic">Unassigned</span>
          )}
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

  return (
    <div className="p-3 max-w-7xl mx-auto">
      {/* <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800">Staff</h1>
        <p className="text-slate-500 mt-1">
          Manage employees and site allocations
        </p>
      </div> */}

      <DataTable
        title="All Staff"
        columns={columns}
        data={data}
        loading={loading}
        pagination={pagination}
        onPageChange={(p) => fetchData(p, pagination.limit, currentSearch)}
        onLimitChange={(l) => fetchData(1, l, currentSearch)}
        onSearch={(term) => fetchData(1, pagination.limit, term)}
        actionButton={
          <button
            onClick={handleAdd}
            className="bg-[#009ef7] hover:bg-[#0095e8] text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 shadow-sm transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" /> Add Staff
          </button>
        }
      />

      <StaffModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() =>
          fetchData(pagination.page, pagination.limit, currentSearch)
        }
        editData={selectedStaff}
      />

      <DeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        loading={deleteLoading}
        title="Delete Staff"
        message={`Are you sure you want to delete "${staffToDelete?.name}"?`}
      />
    </div>
  );
};

export default Staff;
