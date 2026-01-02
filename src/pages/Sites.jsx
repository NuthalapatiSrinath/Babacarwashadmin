import React, { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, Map, Globe } from "lucide-react";
import toast from "react-hot-toast";

// Components
import DataTable from "../components/DataTable";
import SiteModal from "../components/modals/SiteModal";
import DeleteModal from "../components/modals/DeleteModal";

// API
import { siteService } from "../api/siteService";

const Sites = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);

  // -- Modals --
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSite, setSelectedSite] = useState(null);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [siteToDelete, setSiteToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // -- Pagination --
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 1,
  });

  // Track search term locally
  const [currentSearch, setCurrentSearch] = useState("");

  // --- Fetch Data ---
  const fetchData = async (page = 1, limit = 10, search = "") => {
    console.log(
      `[SitesPage] Fetching... Page:${page}, Limit:${limit}, Search:"${search}"`
    );
    setLoading(true);
    setCurrentSearch(search);

    try {
      let resultData = [];
      let totalRecords = 0;

      if (search) {
        // CLIENT-SIDE SEARCH: Fetch all (limit=1000) then filter
        const response = await siteService.list(1, 1000, "");

        const allItems = response.data || [];
        resultData = allItems.filter((item) =>
          item.name.toLowerCase().includes(search.toLowerCase())
        );
        totalRecords = resultData.length;
        console.log(`[SitesPage] Local search found ${totalRecords} results`);
      } else {
        // NORMAL FETCH
        const response = await siteService.list(page, limit, "");
        resultData = response.data || [];
        totalRecords = response.total || 0;
      }

      setData(resultData);

      // Calculate pages
      const totalPages = Math.ceil(totalRecords / limit) || 1;
      setPagination({ page, limit, total: totalRecords, totalPages });
    } catch (error) {
      console.error("[SitesPage] Fetch error:", error);
      toast.error("Failed to load sites");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(pagination.page, pagination.limit);
  }, []);

  // --- Helper: Slice Data for Pagination ---
  const getDisplayData = () => {
    if (!data) return [];

    // Slice if searching OR if backend returns unpaginated list
    if (
      (currentSearch && data.length > pagination.limit) ||
      data.length > pagination.limit
    ) {
      const startIndex = (pagination.page - 1) * pagination.limit;
      return data.slice(startIndex, startIndex + pagination.limit);
    }
    return data;
  };

  // --- Handlers ---
  const handleAdd = () => {
    setSelectedSite(null);
    setIsModalOpen(true);
  };

  const handleEdit = (site) => {
    setSelectedSite(site);
    setIsModalOpen(true);
  };

  const openDeleteModal = (site) => {
    setSiteToDelete(site);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!siteToDelete) return;
    setDeleteLoading(true);
    try {
      await siteService.delete(siteToDelete._id);
      toast.success("Site deleted successfully");
      setIsDeleteModalOpen(false);
      fetchData(pagination.page, pagination.limit, currentSearch);
    } catch (error) {
      console.error("[SitesPage] Delete error:", error);
      toast.error(error.message || "Failed to delete site");
    } finally {
      setDeleteLoading(false);
    }
  };

  // --- Columns ---
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
      header: "Site Name",
      accessor: "name",
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center border border-teal-100">
            <Globe className="w-4 h-4" />
          </div>
          <span className="font-medium text-slate-700">{row.name}</span>
        </div>
      ),
    },
    {
      header: "Created By",
      accessor: "createdBy",
      render: (row) => (
        <span className="text-xs text-slate-400">{row.createdBy}</span>
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
      {/* <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800">Sites</h1>
        <p className="text-slate-500 mt-1">
          Manage operational sites and locations
        </p>
      </div> */}

      <DataTable
        title="All Sites"
        columns={columns}
        data={getDisplayData()}
        loading={loading}
        pagination={pagination}
        onPageChange={(newPage) =>
          fetchData(newPage, pagination.limit, currentSearch)
        }
        onLimitChange={(newLimit) => fetchData(1, newLimit, currentSearch)}
        onSearch={(term) => fetchData(1, pagination.limit, term)}
        actionButton={
          <button
            onClick={handleAdd}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-all shadow-lg shadow-indigo-600/20 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            Add Site
          </button>
        }
      />

      <SiteModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() =>
          fetchData(pagination.page, pagination.limit, currentSearch)
        }
        editData={selectedSite}
      />

      <DeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        loading={deleteLoading}
        title="Delete Site"
        message={`Are you sure you want to delete "${siteToDelete?.name}"?`}
      />
    </div>
  );
};

export default Sites;
