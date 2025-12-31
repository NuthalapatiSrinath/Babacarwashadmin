import React, { useState, useEffect, useMemo } from "react";
import { Plus, Trash2, Edit2, CheckCircle, Clock, XCircle } from "lucide-react";
import toast from "react-hot-toast";

// Components
import DataTable from "../components/DataTable";
import EnquiryModal from "../components/modals/EnquiryModal";
import EnquiryFilterBar from "../components/filters/EnquiryFilterBar";

// API
import { enquiryService } from "../api/enquiryService";

const Enquiry = () => {
  const [loading, setLoading] = useState(false);
  const [serverData, setServerData] = useState([]);

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 1,
  });
  const [activeFilters, setActiveFilters] = useState({});
  const [clientSearchTerm, setClientSearchTerm] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEnquiry, setSelectedEnquiry] = useState(null);

  // --- Fetch Data ---
  const fetchData = async (page = 1, limit = 50, filters = {}) => {
    setLoading(true);
    try {
      const response = await enquiryService.list(page, limit, filters);
      const records = response.data || [];
      const totalRecords = response.total || 0;

      setServerData(records);
      setActiveFilters(filters);

      setPagination({
        page: Number(page),
        limit: Number(limit),
        total: totalRecords,
        totalPages: Math.ceil(totalRecords / Number(limit)) || 1,
      });
    } catch (error) {
      toast.error("Failed to load enquiries");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(1, 50, {});
  }, []);

  // --- Client-Side Search ---
  const filteredData = useMemo(() => {
    if (!clientSearchTerm) return serverData;
    const lowerTerm = clientSearchTerm.toLowerCase();
    return serverData.filter(
      (row) =>
        row.mobile?.toLowerCase().includes(lowerTerm) ||
        row.registration_no?.toLowerCase().includes(lowerTerm) ||
        row.parking_no?.toLowerCase().includes(lowerTerm)
    );
  }, [serverData, clientSearchTerm]);

  // --- Handlers ---
  const handleClientSearch = (term) => setClientSearchTerm(term);
  const handleFilterApply = (newFilters) =>
    fetchData(1, pagination.limit, newFilters);
  const handlePageChange = (newPage) =>
    fetchData(newPage, pagination.limit, activeFilters);
  const handleLimitChange = (newLimit) => fetchData(1, newLimit, activeFilters);

  const handleCreate = () => {
    setSelectedEnquiry(null);
    setIsModalOpen(true);
  };

  const handleEdit = (row) => {
    setSelectedEnquiry(row);
    setIsModalOpen(true);
  };

  const handleDelete = async (row) => {
    if (!window.confirm("Delete this enquiry?")) return;
    try {
      await enquiryService.delete(row._id);
      toast.success("Deleted");
      fetchData(pagination.page, pagination.limit, activeFilters);
    } catch (error) {
      toast.error("Delete failed");
    }
  };

  // --- Columns ---
  const columns = [
    {
      header: "#",
      accessor: "id",
      className: "w-16 text-center",
      render: (row, idx) => {
        if (row.id)
          return (
            <span className="text-slate-500 font-mono text-xs">#{row.id}</span>
          );
        const p = Number(pagination.page) || 1;
        const l = Number(pagination.limit) || 10;
        return (
          <span className="text-slate-400 font-mono text-xs">
            {(p - 1) * l + idx + 1}
          </span>
        );
      },
    },
    {
      header: "Date",
      accessor: "createdAt",
      render: (row) => (
        <span className="text-slate-600 text-sm whitespace-nowrap">
          {new Date(row.createdAt).toLocaleDateString()}
          <span className="text-slate-400 text-xs ml-1">
            {new Date(row.createdAt).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        </span>
      ),
    },
    {
      header: "Customer Mobile",
      accessor: "mobile",
      render: (row) => (
        <span className="text-slate-700 font-semibold text-sm font-mono">
          {row.mobile || "---"}
        </span>
      ),
    },
    {
      header: "Vehicle No",
      accessor: "registration_no",
      render: (row) => (
        <span className="bg-slate-100 text-slate-800 px-2 py-1 rounded text-xs font-bold uppercase tracking-wide">
          {row.registration_no || "---"}
        </span>
      ),
    },
    {
      header: "Parking",
      accessor: "parking_no",
      render: (row) => (
        <span className="text-slate-600 text-sm">{row.parking_no || "-"}</span>
      ),
    },
    {
      header: "Worker",
      accessor: "worker",
      render: (row) => (
        <span
          className={`text-sm font-medium ${
            row.worker ? "text-indigo-600" : "text-slate-400 italic"
          }`}
        >
          {row.worker?.name || row.worker || "System"}
        </span>
      ),
    },
    {
      header: "Status",
      accessor: "status",
      render: (row) => {
        const status = (row.status || "pending").toLowerCase();
        if (status === "completed") {
          return (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-700 text-[10px] font-bold uppercase w-fit">
              <CheckCircle className="w-3 h-3" /> Completed
            </div>
          );
        } else if (status === "cancelled") {
          return (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-50 border border-red-100 text-red-700 text-[10px] font-bold uppercase w-fit">
              <XCircle className="w-3 h-3" /> Cancelled
            </div>
          );
        } else {
          return (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 border border-amber-100 text-amber-700 text-[10px] font-bold uppercase w-fit">
              <Clock className="w-3 h-3" /> Pending
            </div>
          );
        }
      },
    },
    {
      header: "Actions",
      className: "text-right",
      render: (row) => (
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={() => handleEdit(row)}
            className="p-1.5 bg-slate-50 hover:bg-indigo-50 text-slate-500 hover:text-indigo-600 rounded border border-slate-200"
            title="Edit"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleDelete(row)}
            className="p-1.5 bg-slate-50 hover:bg-red-50 text-slate-500 hover:text-red-600 rounded border border-slate-200"
            title="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    // FIX: Using h-screen minus header/padding offset to force full height
    <div className="p-6 w-full max-w-7xl mx-auto flex flex-col font-sans">
      {/* 1. Header (Fixed Height) */}
      <div className="mb-6 flex-shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Enquiries</h1>
          {/* <p className="text-slate-500 text-sm mt-1">
            Track and manage customer vehicle enquiries
          </p> */}
        </div>
        <button
          onClick={handleCreate}
          className="px-4 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-bold text-sm flex items-center gap-2 shadow-lg shadow-indigo-200"
        >
          <Plus className="w-4 h-4" />
          New Enquiry
        </button>
      </div>

      {/* 2. Filter Bar (Fixed Height) */}
      <div className="flex-shrink-0">
        <EnquiryFilterBar onFilterApply={handleFilterApply} loading={loading} />
      </div>

      {/* 3. Table Container (Expands to fill remaining space) */}
      {/* min-h-[500px] ensures it doesn't shrink too small on tiny screens */}
      <div className="flex-1 w-full bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col min-h-[500px]">
        <DataTable
          columns={columns}
          data={filteredData}
          loading={loading}
          pagination={pagination}
          onPageChange={handlePageChange}
          onLimitChange={handleLimitChange}
          onSearch={handleClientSearch}
        />
      </div>

      {/* Modal */}
      <EnquiryModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        enquiry={selectedEnquiry}
        onSuccess={() =>
          fetchData(pagination.page, pagination.limit, activeFilters)
        }
      />
    </div>
  );
};

export default Enquiry;
