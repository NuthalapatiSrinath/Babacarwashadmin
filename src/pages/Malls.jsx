import React, { useState, useEffect } from "react";
import {
  Plus,
  Edit2,
  Trash2,
  ShoppingBag,
  DollarSign,
  CreditCard,
} from "lucide-react";
import toast from "react-hot-toast";

// Components
import DataTable from "../components/DataTable";
import MallModal from "../components/modals/MallModal";
import DeleteModal from "../components/modals/DeleteModal";

// API
import { mallService } from "../api/mallService";

const Malls = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);

  // -- Modals --
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMall, setSelectedMall] = useState(null);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [mallToDelete, setMallToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // -- Pagination --
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 1,
  });

  // --- Search State ---
  // We track the current search term to decide how to fetch data
  const [currentSearch, setCurrentSearch] = useState("");

  // --- Fetch Data ---
  const fetchData = async (page = 1, limit = 10, search = "") => {
    console.log(
      `[MallsPage] Fetching data... Page:${page}, Limit:${limit}, Search:"${search}"`
    );
    setLoading(true);
    setCurrentSearch(search); // Keep track of search term

    try {
      let resultData = [];
      let totalRecords = 0;

      // STRATEGY:
      // If searching: Fetch ALL items (limit=1000) and filter locally (Backend doesn't support search).
      // If not searching: Use standard server-side pagination.

      if (search) {
        // 1. Fetch EVERYTHING
        const response = await mallService.list(1, 1000, "");

        // 2. Filter Locally
        const allItems = response.data || [];
        resultData = allItems.filter((item) =>
          item.name.toLowerCase().includes(search.toLowerCase())
        );

        totalRecords = resultData.length;

        console.log(
          `[MallsPage] Search active. Found ${totalRecords} matches locally.`
        );
      } else {
        // Normal Server Fetch
        const response = await mallService.list(page, limit, "");
        resultData = response.data || [];
        totalRecords = response.total || 0;
      }

      // 3. Update State
      // Note: If searching, 'resultData' contains ALL matches. We slice it in 'getDisplayData'.
      // If not searching, 'resultData' contains only the current page from server.
      setData(resultData);

      const totalPages = Math.ceil(totalRecords / limit) || 1;
      setPagination({ page, limit, total: totalRecords, totalPages });
    } catch (error) {
      console.error("[MallsPage] Fetch error:", error);
      toast.error("Failed to load malls");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(pagination.page, pagination.limit);
  }, []);

  // --- Helper: Get Data for Current Page ---
  const getDisplayData = () => {
    if (!data) return [];

    // If we are searching, 'data' has ALL matching records (e.g., 50 records).
    // We need to slice it to show only 10 for the current page.
    if (currentSearch && data.length > pagination.limit) {
      const startIndex = (pagination.page - 1) * pagination.limit;
      return data.slice(startIndex, startIndex + pagination.limit);
    }

    // If backend pagination failed and returned everything, slice it.
    if (!currentSearch && data.length > pagination.limit) {
      const startIndex = (pagination.page - 1) * pagination.limit;
      return data.slice(startIndex, startIndex + pagination.limit);
    }

    // Otherwise (Normal mode), return data as is
    return data;
  };

  // --- Handlers ---
  const handleAdd = () => {
    setSelectedMall(null);
    setIsModalOpen(true);
  };

  const handleEdit = (mall) => {
    setSelectedMall(mall);
    setIsModalOpen(true);
  };

  const openDeleteModal = (mall) => {
    setMallToDelete(mall);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!mallToDelete) return;
    setDeleteLoading(true);
    try {
      await mallService.delete(mallToDelete._id);
      toast.success("Mall deleted successfully");
      setIsDeleteModalOpen(false);
      // Refresh with current state
      fetchData(pagination.page, pagination.limit, currentSearch);
    } catch (error) {
      console.error("[MallsPage] Delete error:", error);
      toast.error(error.message || "Failed to delete mall");
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
      header: "Mall Name",
      accessor: "name",
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-pink-50 text-pink-600 flex items-center justify-center border border-pink-100">
            <ShoppingBag className="w-4 h-4" />
          </div>
          <span className="font-medium text-slate-700">{row.name}</span>
        </div>
      ),
    },
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
    {
      header: "Card Charges",
      accessor: "card_charges",
      render: (row) => (
        <div className="flex items-center gap-1 text-slate-600 text-sm">
          <CreditCard className="w-3 h-3 text-slate-400" />
          {row.card_charges?.toFixed(2) || "0.00"}
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
    <div className="p-3 max-w-7xl mx-auto">
      {/* <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800">Malls</h1>
        <p className="text-slate-500 mt-1">
          Manage shopping malls and service charges
        </p>
      </div> */}

      <DataTable
        title="All Malls"
        columns={columns}
        data={getDisplayData()} // Uses the helper to show correct slice
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
            Add Mall
          </button>
        }
      />

      {/* Modals */}
      <MallModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() =>
          fetchData(pagination.page, pagination.limit, currentSearch)
        }
        editData={selectedMall}
      />

      <DeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        loading={deleteLoading}
        title="Delete Mall"
        message={`Are you sure you want to delete "${mallToDelete?.name}"?`}
      />
    </div>
  );
};

export default Malls;
