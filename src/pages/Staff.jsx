import React, { useState, useEffect, useRef } from "react";
import {
  Plus,
  Edit2,
  Trash2,
  Hash,
  Map,
  Download,
  UploadCloud,
  FileSpreadsheet,
  Server,
  Search,
  FileText,
  Briefcase,
  Calendar,
  CreditCard,
  Globe,
  Loader2,
} from "lucide-react";
import toast from "react-hot-toast";
import * as XLSX from "xlsx"; // npm install xlsx

// Components
import DataTable from "../components/DataTable";
import StaffModal from "../components/modals/StaffModal";
import DeleteModal from "../components/modals/DeleteModal";

// API
import { staffService } from "../api/staffService";

const Staff = () => {
  const fileInputRef = useRef(null);

  const [loading, setLoading] = useState(false);
  const [importLoading, setImportLoading] = useState(false);
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

  // --- SAFE HELPERS ---
  const safeDate = (dateVal) => {
    if (!dateVal) return "Nil";
    try {
      const date = new Date(dateVal);
      return isNaN(date.getTime()) ? "Nil" : date.toLocaleDateString();
    } catch (e) {
      return "Nil";
    }
  };

  const safeString = (val) => {
    return val || "Nil";
  };

  // --- Fetch Data ---
  const fetchData = async (page = 1, limit = 10, search = "") => {
    setLoading(true);
    setCurrentSearch(search);
    try {
      const response = await staffService.list(page, limit, search);
      setData(Array.isArray(response.data) ? response.data : []);
      setPagination({
        page,
        limit,
        total: response.total || 0,
        totalPages: Math.ceil((response.total || 0) / limit) || 1,
      });
    } catch (error) {
      console.error("Staff load error:", error);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(pagination.page, pagination.limit);
  }, []);

  // --- Handlers ---
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

  // --- 1. FRONTEND EXCEL EXPORT (XLSX) ---
  const handleExportFrontendXLSX = async () => {
    const toastId = toast.loading("Fetching data...");
    try {
      const res = await staffService.list(1, 10000, currentSearch);
      const allData = Array.isArray(res.data) ? res.data : [];

      if (allData.length === 0) {
        toast.error("No data to export", { id: toastId });
        return;
      }

      const excelData = allData.map((row, idx) => ({
        "S. No": idx + 1,
        "Company Name": row.companyName || "Nil",
        "Employee Name": row.name || "Unknown",
        "Employee Code": row.employeeCode || "Nil",
        "Date of Join": safeDate(row.joiningDate),
        "Working Site": row.site
          ? typeof row.site === "object"
            ? row.site.name
            : row.site
          : "Unassigned",
        "Passport No": row.passportNumber || "Nil",
        "Passport Expiry": safeDate(row.passportExpiry),
        "Visa Expiry": safeDate(row.visaExpiry),
        "E ID": row.emiratesId || "Nil",
        "E ID Expiry": safeDate(row.emiratesIdExpiry),
      }));

      const worksheet = XLSX.utils.json_to_sheet(excelData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Staff List");
      XLSX.writeFile(workbook, "Staff_List.xlsx");
      toast.success("Export successful!", { id: toastId });
    } catch (e) {
      toast.error("Export failed", { id: toastId });
    }
  };

  // --- 2. SERVER EXPORT (XLSX) ---
  const handleExportServerSide = async () => {
    const toastId = toast.loading("Requesting Excel file...");
    try {
      const blob = await staffService.exportData();
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "staff_server_export.xlsx");
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success("Downloaded", { id: toastId });
    } catch (error) {
      toast.error("Server export failed", { id: toastId });
    }
  };

  // --- 3. DOWNLOAD TEMPLATE (XLSX) ---
  const handleDownloadTemplate = () => {
    try {
      const headers = [
        "Company Name",
        "Employee Name",
        "Employee Code",
        "Date of Join (YYYY-MM-DD)",
        "Passport Number",
        "Passport Expiry (YYYY-MM-DD)",
        "Visa Expiry (YYYY-MM-DD)",
        "E ID Number",
        "E ID Expiry (YYYY-MM-DD)",
      ];

      const sample = [
        "Baba Car Wash",
        "John Doe",
        "EMP001",
        "2024-01-01",
        "A1234567",
        "2029-01-01",
        "2026-01-01",
        "784-1234-1234567-1",
        "2026-01-01",
      ];

      const worksheet = XLSX.utils.aoa_to_sheet([headers, sample]);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Template");
      XLSX.writeFile(workbook, "Staff_Import_Template.xlsx");
      toast.success("Template downloaded!");
    } catch (e) {
      console.error(e);
      toast.error("Failed to generate template");
    }
  };

  // --- 4. IMPORT (XLSX) ---
  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    event.target.value = null;

    const formData = new FormData();
    formData.append("file", file);

    setImportLoading(true);
    const toastId = toast.loading("Importing...");
    try {
      await staffService.importData(formData);
      toast.success("Import successful!", { id: toastId });
      fetchData(1, pagination.limit);
    } catch (error) {
      toast.error("Import failed", { id: toastId });
    } finally {
      setImportLoading(false);
    }
  };

  // --- 5. DOCUMENT UPLOAD SIMULATION ---
  const handleDocumentUpload = (docType, staffName) => {
    toast(`Upload ${docType} for ${staffName} (Backend feature pending)`, {
      icon: "📂",
    });
  };

  const columns = [
    {
      header: "S. No",
      accessor: "id",
      className: "w-12 text-center",
      render: (row, idx) => (
        <span className="text-slate-400 font-mono text-xs">
          {(pagination.page - 1) * pagination.limit + idx + 1}
        </span>
      ),
    },
    {
      header: "Company Name",
      accessor: "companyName",
      className: "min-w-[140px]",
      render: (row) => (
        <div className="flex items-center gap-2">
          <Briefcase className="w-3 h-3 text-slate-400" />
          <span className="text-slate-600 text-xs font-medium">
            {safeString(row.companyName)}
          </span>
        </div>
      ),
    },
    {
      header: "Employee Name",
      accessor: "name",
      className: "min-w-[140px]",
      render: (row) => (
        <span className="font-bold text-slate-800 text-xs">
          {safeString(row.name)}
        </span>
      ),
    },
    {
      header: "Employee Code",
      accessor: "employeeCode",
      render: (row) => (
        <span className="bg-slate-100 text-slate-600 text-[10px] px-2 py-1 rounded font-mono">
          {safeString(row.employeeCode)}
        </span>
      ),
    },
    {
      header: "Date of Join",
      accessor: "joiningDate",
      render: (row) => (
        <span className="text-slate-500 text-xs">
          {safeDate(row.joiningDate)}
        </span>
      ),
    },
    {
      header: "Site",
      accessor: "site",
      className: "min-w-[120px]",
      render: (row) => (
        <div className="flex items-center gap-1">
          <Map className="w-3 h-3 text-slate-400" />
          <span className="text-slate-700 text-xs">
            {row.site
              ? typeof row.site === "object"
                ? row.site.name || "Unknown"
                : row.site
              : "Unassigned"}
          </span>
        </div>
      ),
    },
    {
      header: "Passport No",
      accessor: "passportNumber",
      render: (row) => (
        <span className="text-slate-600 text-xs font-mono">
          {safeString(row.passportNumber)}
        </span>
      ),
    },
    {
      header: "Passport Exp",
      accessor: "passportExpiry",
      render: (row) => (
        <span className="text-slate-500 text-xs">
          {safeDate(row.passportExpiry)}
        </span>
      ),
    },
    {
      header: "Visa Expiry",
      accessor: "visaExpiry",
      render: (row) => (
        <span className="text-slate-500 text-xs">
          {safeDate(row.visaExpiry)}
        </span>
      ),
    },
    {
      header: "E ID No",
      accessor: "emiratesId",
      className: "min-w-[120px]",
      render: (row) => (
        <span className="text-slate-600 text-xs font-mono">
          {safeString(row.emiratesId)}
        </span>
      ),
    },
    {
      header: "E ID Exp",
      accessor: "emiratesIdExpiry",
      render: (row) => (
        <span className="text-slate-500 text-xs">
          {safeDate(row.emiratesIdExpiry)}
        </span>
      ),
    },
    {
      header: "Documents",
      className: "min-w-[120px] text-center",
      render: (row) => (
        <div className="flex justify-center gap-1">
          <button
            className="p-1.5 bg-blue-50 text-blue-600 rounded hover:bg-blue-100"
            title="Passport"
            onClick={() => handleDocumentUpload("Passport", row.name)}
          >
            <Globe className="w-3.5 h-3.5" />
          </button>
          <button
            className="p-1.5 bg-purple-50 text-purple-600 rounded hover:bg-purple-100"
            title="Visa"
            onClick={() => handleDocumentUpload("Visa", row.name)}
          >
            <FileText className="w-3.5 h-3.5" />
          </button>
          <button
            className="p-1.5 bg-emerald-50 text-emerald-600 rounded hover:bg-emerald-100"
            title="E-ID"
            onClick={() => handleDocumentUpload("E-ID", row.name)}
          >
            <CreditCard className="w-3.5 h-3.5" />
          </button>
        </div>
      ),
    },
    {
      header: "Actions",
      className:
        "text-right sticky right-0 bg-white shadow-[-10px_0_10px_-10px_rgba(0,0,0,0.1)]",
      render: (row) => (
        <div className="flex justify-end items-center gap-1">
          <button
            onClick={() => handleEdit(row)}
            className="p-1.5 hover:bg-blue-50 text-slate-400 hover:text-blue-600 rounded transition-colors"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => handleDeleteAction(row)}
            className="p-1.5 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ),
    },
  ];

  return (
    // UPDATED: Added px-6 md:px-12 py-8 for nicer spacing
    <div className="px-6 md:px-9 py-8 w-full flex flex-col font-sans">
      <input
        type="file"
        accept=".xlsx"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
      />

      <div className="bg-white p-6 rounded-2xl border shadow-sm mb-6 flex flex-col md:flex-row justify-between items-end gap-6 shrink-0">
        <div className="w-full md:w-auto flex-1">
          <h1 className="text-3xl font-bold text-slate-800 mb-2 tracking-tight">
            Staff Management
          </h1>
          <div className="relative max-w-md mt-2">
            <input
              type="text"
              placeholder="Search staff details..."
              value={currentSearch}
              onChange={(e) => setCurrentSearch(e.target.value)}
              onKeyDown={(e) =>
                e.key === "Enter" &&
                fetchData(1, pagination.limit, currentSearch)
              }
              className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl pl-11 pr-4 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-50 transition-all"
            />
            <Search className="absolute left-4 top-3.5 w-4 h-4 text-slate-400" />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleDownloadTemplate}
            className="h-10 px-4 bg-slate-100 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-200 flex items-center gap-2 transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4" /> Template
          </button>

          <button
            onClick={handleExportServerSide}
            className="h-10 px-4 bg-white border border-slate-200 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-50 flex items-center gap-2 shadow-sm transition-colors"
          >
            <Server className="w-4 h-4" /> Server Excel
          </button>

          <button
            onClick={handleExportFrontendXLSX}
            className="h-10 px-4 bg-white border border-slate-200 text-emerald-600 rounded-xl text-xs font-bold hover:bg-emerald-50 flex items-center gap-2 shadow-sm transition-colors"
          >
            <Download className="w-4 h-4" /> Export Excel
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={importLoading}
            className="h-10 px-4 bg-white border border-slate-200 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-50 flex items-center gap-2 disabled:opacity-70 shadow-sm transition-colors"
          >
            {importLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <UploadCloud className="w-4 h-4" />
            )}{" "}
            Import
          </button>

          <button
            onClick={handleAdd}
            className="h-10 px-5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold flex items-center gap-2 shadow-lg shadow-indigo-200 transition-all active:scale-95 ml-2"
          >
            <Plus className="w-4 h-4" /> Add Staff
          </button>
        </div>
      </div>

      <div className="flex-1 min-h-0 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
        <DataTable
          columns={columns}
          data={data}
          loading={loading}
          pagination={pagination}
          onPageChange={(p) => fetchData(p, pagination.limit, currentSearch)}
          onLimitChange={(l) => fetchData(1, l, currentSearch)}
        />
      </div>

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
