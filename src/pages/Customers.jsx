import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  UserPlus,
  Trash2,
  Archive,
  Edit2,
  MapPin,
  Download,
  UploadCloud,
  Loader2,
  FileSpreadsheet,
  Server,
} from "lucide-react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import * as XLSX from "xlsx"; // <--- IMPORT THIS for Excel generation

// Components
import DataTable from "../components/DataTable";
import CustomerModal from "../components/modals/CustomerModal";

// API
import { customerService } from "../api/customerService";

const Customers = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [loading, setLoading] = useState(false);
  const [importLoading, setImportLoading] = useState(false);
  const [serverData, setServerData] = useState([]);
  const [activeTab, setActiveTab] = useState(1);

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 1,
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  // --- Fetch Data ---
  const fetchData = async (page = 1, limit = 50, search = "", status = 1) => {
    setLoading(true);
    try {
      const res = await customerService.list(page, limit, search, status);
      setServerData(res.data || []);
      setPagination({
        page: Number(page),
        limit: Number(limit),
        total: res.total || 0,
        totalPages: Math.ceil((res.total || 0) / Number(limit)) || 1,
      });
    } catch (e) {
      toast.error("Failed to load customers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(1, 50, "", activeTab);
  }, [activeTab]);

  // --- Flatten Data for Table ---
  const flattenedData = useMemo(() => {
    if (!serverData) return [];
    const rows = [];
    serverData.forEach((customer) => {
      if (customer.vehicles && customer.vehicles.length > 0) {
        customer.vehicles.forEach((vehicle) => {
          rows.push({
            ...vehicle,
            customer: customer,
            uniqueId: vehicle._id,
          });
        });
      } else {
        rows.push({
          customer: customer,
          uniqueId: customer._id,
          registration_no: "NO VEHICLE",
          status: customer.status,
        });
      }
    });
    return rows;
  }, [serverData]);

  // --- Handlers ---
  const handleTabChange = (status) => {
    setActiveTab(status);
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleSearch = (term) => {
    setSearchTerm(term);
    fetchData(1, pagination.limit, term, activeTab);
  };

  const handleCreate = () => {
    setSelectedCustomer(null);
    setIsModalOpen(true);
  };

  const handleEdit = (customerData) => {
    const fullCustomer = serverData.find((c) => c._id === customerData._id);
    setSelectedCustomer(fullCustomer || customerData);
    setIsModalOpen(true);
  };

  const handleDelete = async (customerId) => {
    if (!window.confirm("Delete this customer? This removes all vehicles."))
      return;
    try {
      await customerService.delete(customerId);
      toast.success("Deleted");
      fetchData(pagination.page, pagination.limit, searchTerm, activeTab);
    } catch (e) {
      toast.error("Delete failed");
    }
  };

  const handleArchive = async (customerId) => {
    if (!window.confirm("Archive this customer?")) return;
    try {
      await customerService.archive(customerId);
      toast.success("Archived");
      fetchData(pagination.page, pagination.limit, searchTerm, activeTab);
    } catch (e) {
      toast.error("Archive failed");
    }
  };

  const handleToggleStatus = async (row) => {
    const newStatus = row.status === 1 ? 2 : 1;
    const action = newStatus === 1 ? "Activate" : "Deactivate";
    if (!window.confirm(`${action} this vehicle?`)) return;
    try {
      await customerService.toggleVehicle(row._id, row.status);
      toast.success(`Vehicle ${action}d`);
      fetchData(pagination.page, pagination.limit, searchTerm, activeTab);
    } catch (e) {
      toast.error("Status update failed");
    }
  };

  // ==========================================
  //  1. EXPORT ALL DATA (Frontend -> .xlsx)
  // ==========================================
  const handleExportFrontendXLSX = async () => {
    const toastId = toast.loading("Fetching all records for Excel export...");

    try {
      // 1. Fetch EVERYTHING (Limit 10,000)
      const res = await customerService.list(1, 10000, searchTerm, activeTab);
      const allData = res.data || [];

      if (allData.length === 0) {
        toast.error("No data found to export", { id: toastId });
        return;
      }

      // 2. Flatten Data (Same logic as table)
      const rows = [];
      allData.forEach((customer) => {
        if (customer.vehicles && customer.vehicles.length > 0) {
          customer.vehicles.forEach((vehicle) => {
            rows.push({ ...vehicle, customer, uniqueId: vehicle._id });
          });
        } else {
          rows.push({
            customer,
            uniqueId: customer._id,
            registration_no: "NO VEHICLE",
            status: customer.status,
          });
        }
      });

      // 3. Format Data for Excel
      const excelData = rows.map((row) => ({
        "Customer Name": `${row.customer.firstName || ""} ${
          row.customer.lastName || ""
        }`.trim(),
        Mobile: row.customer.mobile || "",
        Email: row.customer.email || "",
        "Vehicle No": row.registration_no || "",
        "Parking No": row.parking_no || "",
        Building: row.customer.building?.name || "",
        Flat: row.customer.flat_no || "",
        Amount: row.amount || 0,
        Status: row.status === 1 ? "Active" : "Inactive",
        Cleaner: row.worker?.name || "Unassigned",
        Schedule: row.schedule_days?.map((d) => d.day).join(", ") || "",
        "Start Date": row.start_date
          ? new Date(row.start_date).toLocaleDateString()
          : "",
      }));

      // 4. Create Workbook using XLSX
      const worksheet = XLSX.utils.json_to_sheet(excelData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Customers");

      // 5. Download File
      const fileName = `All_Customers_${
        activeTab === 1 ? "Active" : "Inactive"
      }.xlsx`;
      XLSX.writeFile(workbook, fileName);

      toast.success(`Exported ${rows.length} records to Excel!`, {
        id: toastId,
      });
    } catch (e) {
      console.error(e);
      toast.error("Excel export failed", { id: toastId });
    }
  };

  // ==========================================
  //  2. EXPORT SERVER SIDE (Keep as is)
  // ==========================================
  const handleExportServerSide = async () => {
    const toastId = toast.loading("Requesting server export...");
    try {
      const blob = await customerService.exportData();
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `customers_server_export.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast.success("Server export downloaded", { id: toastId });
    } catch (error) {
      console.error(error);
      toast.error("Server export failed. Try Frontend Export.", {
        id: toastId,
      });
    }
  };

  // ==========================================
  //  3. DOWNLOAD TEMPLATE
  // ==========================================
  const handleDownloadTemplate = () => {
    const headers = [
      "mobile",
      "firstName",
      "lastName",
      "email",
      "location",
      "building",
      "registration_no",
      "parking_no",
      "worker",
      "amount",
      "schedule_type",
      "schedule_days",
      "start_date",
    ];
    const sampleRow = [
      "971501234567",
      "John",
      "Doe",
      "john@example.com",
      "Downtown Dubai",
      "Burj Khalifa",
      "DXB 12345",
      "B1-202",
      "Ali (Cleaner)",
      "150",
      "weekly",
      "Monday,Wednesday,Friday",
      "2024-01-01",
    ];

    const csvContent = [headers.join(","), sampleRow.join(",")].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "customer_import_template.csv");
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  // ==========================================
  //  4. IMPORT
  // ==========================================
  const handleImportClick = () => fileInputRef.current?.click();

  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    event.target.value = null;

    const formData = new FormData();
    formData.append("file", file);

    setImportLoading(true);
    const toastId = toast.loading("Importing data...");

    try {
      const res = await customerService.importData(formData);
      if (res.success > 0 || res.statusCode === 200) {
        toast.success(`Imported successfully`, { id: toastId });
        fetchData(pagination.page, pagination.limit, searchTerm, activeTab);
      } else {
        toast.error(res.message || "Import finished with errors", {
          id: toastId,
        });
      }
    } catch (error) {
      console.error(error);
      toast.error("Import failed. Check file format.", { id: toastId });
    } finally {
      setImportLoading(false);
    }
  };

  // --- Render Table Row ---
  const renderExpandedRow = (row) => {
    const c = row.customer;
    const workerName = row.worker?.name || "Unassigned";
    const schedule =
      row.schedule_days?.map((d) => d.day).join(", ") || "No Schedule";

    return (
      <div className="bg-slate-50 p-5 rounded-lg border border-slate-200 ml-12 shadow-inner">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-5 border-b border-slate-200 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-lg">
              {c.firstName?.[0]?.toUpperCase() || "U"}
            </div>
            <div>
              <h4 className="font-bold text-slate-800 text-base">
                {c.firstName} {c.lastName}
              </h4>
              <p className="text-xs text-slate-500 font-mono">ID: {c._id}</p>
            </div>
          </div>
          <div className="mt-3 md:mt-0 flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500 uppercase">
                Cleaner:
              </span>
              <span className="bg-white border border-slate-300 px-3 py-1 rounded-md text-sm font-semibold text-slate-700 shadow-sm">
                {workerName}
              </span>
            </div>
            <button
              onClick={() => navigate(`/customers/${c._id}/history`)}
              className="px-4 py-1.5 bg-white border border-slate-300 rounded-md text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors shadow-sm"
            >
              Show Work
            </button>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-white p-3 rounded border border-slate-200">
            <span className="block text-[10px] text-slate-400 uppercase font-bold mb-1">
              Vehicle
            </span>
            <span className="font-mono font-bold text-slate-800">
              {row.registration_no}
            </span>
          </div>
          <div className="bg-white p-3 rounded border border-slate-200">
            <span className="block text-[10px] text-slate-400 uppercase font-bold mb-1">
              Schedule
            </span>
            <span className="font-medium text-slate-700 text-sm">
              {schedule}
            </span>
          </div>
          <div className="bg-white p-3 rounded border border-slate-200">
            <span className="block text-[10px] text-slate-400 uppercase font-bold mb-1">
              Amount
            </span>
            <span className="font-bold text-emerald-600 text-sm">
              {row.amount || 0} AED
            </span>
          </div>
        </div>
      </div>
    );
  };

  const columns = [
    {
      header: "#",
      accessor: "uniqueId",
      className: "w-12 text-center",
      render: (row, idx) => (
        <span className="text-slate-400 text-xs font-mono">
          {(pagination.page - 1) * pagination.limit + idx + 1}
        </span>
      ),
    },
    {
      header: "Mobile",
      accessor: "customer.mobile",
      render: (row) => (
        <div className="flex flex-col">
          <span className="font-mono text-slate-700 font-medium">
            {row.customer.mobile}
          </span>
          <span className="text-[10px] text-slate-400 font-bold">
            {row.customer.firstName}
          </span>
        </div>
      ),
    },
    {
      header: "Vehicle",
      accessor: "registration_no",
      render: (row) => (
        <span className="bg-slate-100 px-2 py-1 rounded text-xs font-bold uppercase tracking-wide text-slate-700 border border-slate-200">
          {row.registration_no}
        </span>
      ),
    },
    {
      header: "Flat",
      accessor: "customer.flat_no",
      render: (row) => (
        <span className="text-slate-600 text-sm font-medium">
          {row.customer.flat_no || "-"}
        </span>
      ),
    },
    {
      header: "Building",
      accessor: "customer.building",
      render: (row) => (
        <div className="flex flex-col">
          <span className="text-slate-700 font-medium text-sm truncate max-w-[150px]">
            {row.customer.building?.name || "-"}
          </span>
          {row.customer.building?.location_id && (
            <span className="text-[10px] text-slate-400 uppercase font-bold flex items-center gap-1">
              <MapPin className="w-3 h-3" />{" "}
              {row.customer.building.location_id.address}
            </span>
          )}
        </div>
      ),
    },
    ...(activeTab === 2
      ? [
          {
            header: "Reason",
            accessor: "deactivateReason",
            render: (row) => (
              <span className="text-red-600 text-[10px] font-bold bg-red-50 border border-red-100 px-2 py-1 rounded uppercase">
                {row.deactivateReason || "Stopped"}
              </span>
            ),
          },
          {
            header: "Deactivate Date",
            accessor: "deactivateDate",
            render: (row) => (
              <span className="text-slate-500 text-xs font-mono">
                {row.deactivateDate
                  ? new Date(row.deactivateDate).toLocaleDateString()
                  : "-"}
              </span>
            ),
          },
        ]
      : []),
    {
      header: "Actions",
      className: "text-right",
      render: (row) => (
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={() => handleEdit(row.customer)}
            className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 border border-indigo-100 transition-colors"
            title="Edit"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleArchive(row.customer._id)}
            className="p-1.5 rounded-lg bg-orange-50 text-orange-600 hover:bg-orange-100 border border-orange-100 transition-colors"
            title="Archive"
          >
            <Archive className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleDelete(row.customer._id)}
            className="p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 border border-red-100 transition-colors"
            title="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          <div className="pl-2 border-l border-slate-200 ml-1">
            <button
              onClick={() => handleToggleStatus(row)}
              className={`w-9 h-5 rounded-full p-1 flex items-center transition-colors duration-300 shadow-inner ${
                row.status === 1
                  ? "bg-emerald-500 justify-end"
                  : "bg-slate-300 justify-start"
              }`}
              title={row.status === 1 ? "Deactivate" : "Activate"}
            >
              <div className="w-3.5 h-3.5 bg-white rounded-full shadow-sm" />
            </button>
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className="p-6 w-full max-w-7xl mx-auto flex flex-col font-sans">
      <input
        type="file"
        accept=".csv, .xlsx"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
      />

      <div className="mb-0 flex-shrink-0">
        <div className="flex flex-col md:flex-row justify-between items-end md:items-center mb-4 gap-4">
          <div className="flex border-b border-slate-200">
            <button
              onClick={() => handleTabChange(1)}
              className={`px-6 py-2 text-sm font-bold border-b-2 transition-all ${
                activeTab === 1
                  ? "border-sky-500 text-sky-600 bg-sky-50/50"
                  : "border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50"
              }`}
            >
              Active
            </button>
            <button
              onClick={() => handleTabChange(2)}
              className={`px-6 py-2 text-sm font-bold border-b-2 transition-all ${
                activeTab === 2
                  ? "border-sky-500 text-sky-600 bg-sky-50/50"
                  : "border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50"
              }`}
            >
              In Active
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2 justify-end">
            {/* Template */}
            <button
              onClick={handleDownloadTemplate}
              className="px-3 py-2 bg-slate-50 border border-slate-300 text-slate-600 rounded-lg font-bold text-xs flex items-center gap-2 hover:bg-slate-100 transition-all shadow-sm"
              title="Download Import Template"
            >
              <FileSpreadsheet className="w-4 h-4" /> Template
            </button>

            {/* Server Export */}
            <button
              onClick={handleExportServerSide}
              className="px-3 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg font-bold text-xs flex items-center gap-2 hover:bg-slate-50 transition-all shadow-sm"
              title="Server Export (CSV)"
            >
              <Server className="w-4 h-4" /> Export Server
            </button>

            {/* Frontend Export XLSX */}
            <button
              onClick={handleExportFrontendXLSX}
              className="px-3 py-2 bg-white border border-slate-300 text-emerald-700 rounded-lg font-bold text-xs flex items-center gap-2 hover:bg-emerald-50 transition-all shadow-sm"
              title="Download Data from Frontend (XLSX)"
            >
              <Download className="w-4 h-4" /> Export Data Frontend(XLSX)
            </button>

            {/* Import */}
            <button
              onClick={handleImportClick}
              disabled={importLoading}
              className="px-3 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg font-bold text-xs flex items-center gap-2 hover:bg-slate-50 transition-all shadow-sm disabled:opacity-70"
            >
              {importLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <UploadCloud className="w-4 h-4" />
              )}{" "}
              Import
            </button>

            {/* Add */}
            <button
              onClick={handleCreate}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-bold text-xs flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-md ml-2"
            >
              <UserPlus className="w-4 h-4" /> Add
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 bg-white shadow-sm border border-t-0 border-slate-200 overflow-hidden flex flex-col rounded-b-xl rounded-t-xl">
        <DataTable
          key={activeTab}
          columns={columns}
          data={flattenedData}
          loading={loading}
          pagination={pagination}
          onPageChange={(p) =>
            fetchData(p, pagination.limit, searchTerm, activeTab)
          }
          onLimitChange={(l) => fetchData(1, l, searchTerm, activeTab)}
          onSearch={handleSearch}
          renderExpandedRow={renderExpandedRow}
        />
      </div>

      <CustomerModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        customer={selectedCustomer}
        onSuccess={() =>
          fetchData(pagination.page, pagination.limit, searchTerm, activeTab)
        }
      />
    </div>
  );
};

export default Customers;
