import React, { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, Phone } from "lucide-react";
import toast from "react-hot-toast";

// Components
import DataTable from "../components/DataTable"; // Using the Reusable Component
import SupervisorModal from "../components/modals/SupervisorModal";
import DeleteModal from "../components/modals/DeleteModal";

// API
import { supervisorService } from "../api/supervisorService";

const Supervisors = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSupervisor, setSelectedSupervisor] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [supervisorToDelete, setSupervisorToDelete] = useState(null);
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
      let resultData = [];
      let totalRecords = 0;

      if (search) {
        // Client-side search workaround
        const response = await supervisorService.list(1, 1000, "");
        const allItems = response.data || [];
        resultData = allItems.filter(
          (item) =>
            item.name?.toLowerCase().includes(search.toLowerCase()) ||
            item.number?.includes(search)
        );
        totalRecords = resultData.length;
      } else {
        const response = await supervisorService.list(page, limit, "");
        resultData = response.data || [];
        totalRecords = response.total || 0;
      }

      setData(resultData);
      setPagination({
        page,
        limit,
        total: totalRecords,
        totalPages: Math.ceil(totalRecords / limit) || 1,
      });
    } catch (error) {
      toast.error("Failed to load supervisors");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(pagination.page, pagination.limit);
  }, []);

  const getDisplayData = () => {
    if (!data) return [];
    if (currentSearch && data.length > pagination.limit) {
      const start = (pagination.page - 1) * pagination.limit;
      return data.slice(start, start + pagination.limit);
    }
    return data;
  };

  // Handlers
  const handleAdd = () => {
    setSelectedSupervisor(null);
    setIsModalOpen(true);
  };
  const handleEdit = (sup) => {
    setSelectedSupervisor(sup);
    setIsModalOpen(true);
  };
  const handleDeleteAction = (sup) => {
    setSupervisorToDelete(sup);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    setDeleteLoading(true);
    try {
      await supervisorService.delete(supervisorToDelete._id);
      toast.success("Deleted successfully");
      setIsDeleteModalOpen(false);
      fetchData(pagination.page, pagination.limit, currentSearch);
    } catch (error) {
      toast.error("Delete failed");
    } finally {
      setDeleteLoading(false);
    }
  };

  // Columns Configuration
  const columns = [
    {
      header: "Id",
      accessor: "id",
      className: "w-16",
      render: (row, idx) => (
        <span className="text-slate-400 font-mono">#{row.id || idx + 1}</span>
      ),
    },
    {
      header: "Service Type",
      accessor: "role",
      render: (row) => (
        <span className="font-semibold text-slate-700 text-sm">
          {row.mall ? "MALL" : "RESIDENCE"}
        </span>
      ),
    },
    {
      header: "Name",
      accessor: "name",
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center text-xs font-bold">
            {row.name?.charAt(0).toUpperCase()}
          </div>
          <span className="font-medium text-slate-800">{row.name}</span>
        </div>
      ),
    },
    {
      header: "Mobile",
      accessor: "number",
      render: (row) => (
        <div className="flex items-center gap-2 text-slate-600 text-sm">
          <Phone className="w-3.5 h-3.5" />
          {row.number}
        </div>
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
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleDeleteAction(row)}
            className="p-2 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-lg transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  // --- THE EXPANDED ROW CONTENT (The "Below" Prop) ---
  const renderDetailsRow = (row) => {
    const isMall = !!row.mall;
    return (
      <div className="flex items-start gap-4 text-sm">
        <span className="font-bold text-slate-700 mt-1.5">
          {isMall ? "Mall:" : "Buildings:"}
        </span>
        <div className="flex flex-wrap gap-2">
          {isMall ? (
            <span className="bg-[#2a2e3e] text-white text-xs px-3 py-1.5 rounded-md font-medium tracking-wide shadow-sm">
              {row.mall?.name || "Unknown Mall"}
            </span>
          ) : row.buildings && row.buildings.length > 0 ? (
            row.buildings.map((b, i) => (
              <span
                key={i}
                className="bg-[#2a2e3e] text-white text-xs px-3 py-1.5 rounded-md font-medium tracking-wide shadow-sm"
              >
                {typeof b === "object" ? b.name : `ID: ${b}`}
              </span>
            ))
          ) : (
            <span className="text-slate-400 italic mt-1">
              No buildings assigned
            </span>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="p-3 w-full">
      {/* <div className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Supervisors</h1>
          <p className="text-slate-500 mt-1">Manage team assignments</p>
        </div>
      </div> */}

      {/* REUSABLE COMPONENT WITH EXPANDED ROW PROP */}
      <DataTable
        title="All Supervisors"
        columns={columns}
        data={getDisplayData()}
        loading={loading}
        pagination={pagination}
        onPageChange={(p) => fetchData(p, pagination.limit, currentSearch)}
        onLimitChange={(l) => fetchData(1, l, currentSearch)}
        onSearch={(term) => fetchData(1, pagination.limit, term)}
        // Pass the function here to render content below the row
        renderExpandedRow={renderDetailsRow}
        actionButton={
          <button
            onClick={handleAdd}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-all shadow-lg shadow-indigo-600/20 active:scale-95"
          >
            <Plus className="w-4 h-4" /> Add Supervisor
          </button>
        }
      />

      <SupervisorModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() =>
          fetchData(pagination.page, pagination.limit, currentSearch)
        }
        editData={selectedSupervisor}
      />

      <DeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        loading={deleteLoading}
        title="Delete Supervisor"
      />
    </div>
  );
};

export default Supervisors;
