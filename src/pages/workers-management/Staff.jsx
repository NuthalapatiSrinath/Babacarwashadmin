import React, { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  Edit2,
  Trash2,
  Hash,
  MapPin,
  Download,
  UploadCloud,
  FileSpreadsheet,
  Search,
  Briefcase,
  Users,
  Filter,
  Loader2,
  CheckCircle,
  AlertCircle,
  User,
  Clock,
  ArrowRight,
  ShieldAlert,
} from "lucide-react";
import toast from "react-hot-toast";
import * as XLSX from "xlsx";

// Components
import DataTable from "../../components/DataTable";
import StaffModal from "../../components/modals/StaffModal";
import DeleteModal from "../../components/modals/DeleteModal";
import CustomDropdown from "../../components/ui/CustomDropdown";

// API
import { staffService } from "../../api/staffService";

const Staff = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  // --- STATE ---
  const [loading, setLoading] = useState(false);
  const [importLoading, setImportLoading] = useState(false);
  const [data, setData] = useState([]);

  // Filters State
  const [currentSearch, setCurrentSearch] = useState("");
  const [selectedCompany, setSelectedCompany] = useState("");
  const [selectedSite, setSelectedSite] = useState("");
  const [selectedExpiryRange, setSelectedExpiryRange] = useState("");

  // Modals State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [staffToDelete, setStaffToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 1,
  });

  // --- HELPERS ---
  const getDaysDiff = (date) => {
    if (!date) return null;
    const diff = new Date(date) - new Date();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  // ✅ NEW: Enhanced Compliance Logic to detect Expired and Upcoming
  const getExpiryStatus = (staff) => {
    const dates = [
      { type: "Passport", val: staff.passportExpiry },
      { type: "Visa", val: staff.visaExpiry },
      { type: "EID", val: staff.emiratesIdExpiry },
    ];

    // Check for already expired first
    const expired = dates.filter((d) => d.val && getDaysDiff(d.val) < 0);
    if (expired.length > 0) {
      return {
        label: `EXPIRED (${expired.map((e) => e.type).join(", ")})`,
        color: "red",
      };
    }

    // Check for upcoming within 90 days
    const upcoming = dates
      .map((d) => ({ ...d, diff: getDaysDiff(d.val) }))
      .filter((d) => d.diff !== null && d.diff >= 0 && d.diff <= 90)
      .sort((a, b) => a.diff - b.diff)[0];

    if (upcoming) {
      return {
        label:
          upcoming.diff <= 30
            ? `Critical: ${upcoming.diff} Days`
            : `Expires in ${upcoming.diff} Days`,
        color: "amber",
      };
    }

    return { label: "All Valid", color: "emerald" };
  };

  const fetchData = async (page = 1, limit = 50, search = "") => {
    setLoading(true);
    try {
      const res = await staffService.list(page, limit, search);
      setData(res.data || []);
      setPagination({
        page,
        limit,
        total: res.total || 0,
        totalPages: Math.ceil((res.total || 0) / limit) || 1,
      });
    } catch (e) {
      toast.error("Failed to load staff directory");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // --- FILTER OPTIONS ---
  const companyOptions = useMemo(() => {
    const companies = [
      ...new Set(data.map((item) => item.companyName).filter(Boolean)),
    ].sort();
    return [
      { value: "", label: "All Companies" },
      ...companies.map((c) => ({ value: c, label: c })),
    ];
  }, [data]);

  const siteOptions = useMemo(() => {
    const sites = [
      ...new Set(
        data
          .map((item) =>
            typeof item.site === "string" ? item.site : item.site?.name
          )
          .filter(Boolean)
      ),
    ].sort();
    return [
      { value: "", label: "All Sites" },
      ...sites.map((s) => ({ value: s, label: s })),
    ];
  }, [data]);

  const expiryRangeOptions = [
    { value: "", label: "Any Validity" },
    { value: "already_expired", label: "Already Expired" },
    { value: "expired_month", label: "Expired This Month" },
    { value: "15", label: "Within 15 Days" },
    { value: "30", label: "Within 1 Month" },
    { value: "90", label: "Within 3 Months" },
  ];

  const filteredData = useMemo(() => {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    return data.filter((item) => {
      if (selectedCompany && item.companyName !== selectedCompany) return false;
      const siteName =
        typeof item.site === "string" ? item.site : item.site?.name;
      if (selectedSite && siteName !== selectedSite) return false;

      if (selectedExpiryRange) {
        const dates = [
          item.passportExpiry,
          item.visaExpiry,
          item.emiratesIdExpiry,
        ];
        const diffs = dates.map((d) => getDaysDiff(d));

        if (selectedExpiryRange === "already_expired") {
          if (!diffs.some((d) => d !== null && d < 0)) return false;
        } else if (selectedExpiryRange === "expired_month") {
          const hasExpiredThisMonth = dates.some(
            (d) => d && new Date(d) < today && new Date(d) >= startOfMonth
          );
          if (!hasExpiredThisMonth) return false;
        } else {
          const limit = parseInt(selectedExpiryRange);
          const minUpcoming = Math.min(
            ...diffs.filter((d) => d !== null && d >= 0)
          );
          if (minUpcoming > limit || minUpcoming === Infinity) return false;
        }
      }

      if (currentSearch) {
        const s = currentSearch.toLowerCase();
        const siteName =
          typeof item.site === "string" ? item.site : item.site?.name || "";
        return (
          item.name?.toLowerCase().includes(s) ||
          item.employeeCode?.toLowerCase().includes(s) ||
          item.companyName?.toLowerCase().includes(s) ||
          siteName.toLowerCase().includes(s)
        );
      }
      return true;
    });
  }, [data, selectedCompany, selectedSite, selectedExpiryRange, currentSearch]);

  // ✅ NEW: Alert logic for the Scrolling Bar
  const criticalAlerts = useMemo(() => {
    return data.filter((item) => {
      const dates = [
        item.passportExpiry,
        item.visaExpiry,
        item.emiratesIdExpiry,
      ];
      const diffs = dates.map((d) => getDaysDiff(d)).filter((d) => d !== null);
      if (diffs.length === 0) return false;
      const minDiff = Math.min(...diffs);
      // Logic: Show if already expired (minDiff < 0) or expiring within 30 days
      return minDiff <= 30;
    });
  }, [data]);

  // --- HANDLERS ---
  const handleExportData = async () => {
    const toastId = toast.loading("Preparing Export...");
    try {
      const blob = await staffService.exportData();
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `Staff_Export_${new Date().toISOString().slice(0, 10)}.xlsx`
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success("Done", { id: toastId });
    } catch {
      toast.error("Export failed", { id: toastId });
    }
  };

  const handleDownloadTemplate = () => {
    const templateData = [
      {
        "Employee Code": "EMP101",
        Name: "John Doe",
        Mobile: "971501234567",
        Email: "john@mail.com",
        Company: "Baba Wash",
        Site: "Dubai",
        "Joining Date": "2024-01-01",
        "Passport Number": "P123",
        "Passport Expiry": "2030-01-01",
        "Visa Number": "V123",
        "Visa Expiry": "2026-01-01",
        "Emirates ID": "E123",
        "Emirates ID Expiry": "2026-01-01",
      },
    ];
    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Staff");
    XLSX.writeFile(wb, "Staff_Template.xlsx");
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    e.target.value = null;
    const toastId = toast.loading("Processing upload...");
    setImportLoading(true);
    const formData = new FormData();
    formData.append("file", file);
    try {
      await staffService.importData(formData);
      toast.success("Success", { id: toastId });
      fetchData(1, pagination.limit);
    } catch {
      toast.error("Failed", { id: toastId });
    } finally {
      setImportLoading(false);
    }
  };

  const confirmDelete = async () => {
    if (!staffToDelete) return;
    setDeleteLoading(true);
    try {
      await staffService.delete(staffToDelete._id);
      toast.success("Deleted");
      setIsDeleteModalOpen(false);
      fetchData();
    } catch {
      toast.error("Failed");
    } finally {
      setDeleteLoading(false);
    }
  };

  const columns = [
    {
      header: "Staff Member",
      className: "min-w-[280px]",
      render: (r) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-xs">
            {r.name?.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="font-bold text-slate-700 text-sm leading-tight mb-1">
              {r.name}
            </div>
            <div className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100 uppercase tracking-tighter w-fit">
              {r.employeeCode}
            </div>
          </div>
        </div>
      ),
    },
    {
      header: "Company",
      render: (r) => (
        <span className="text-sm font-medium text-slate-600">
          {r.companyName}
        </span>
      ),
    },
    {
      header: "Site",
      render: (r) => (
        <span className="text-sm font-medium text-slate-600">
          {typeof r.site === "string" ? r.site : r.site?.name || "Unassigned"}
        </span>
      ),
    },
    {
      header: "Compliance",
      render: (r) => {
        const info = getExpiryStatus(r);
        const styles = {
          red: "text-red-600 bg-red-50 border-red-100 shadow-sm",
          amber: "text-amber-600 bg-amber-50 border-amber-100",
          emerald: "text-emerald-600 bg-emerald-50 border-emerald-100",
        };
        return (
          <span
            className={`px-2.5 py-1 rounded-lg border text-[10px] font-black uppercase flex items-center gap-1.5 w-fit ${
              styles[info.color]
            }`}
          >
            {info.color === "red" && <ShieldAlert className="w-3 h-3" />}
            {info.label}
          </span>
        );
      },
    },
    {
      header: "Actions",
      className: "text-right",
      render: (r) => (
        <div className="flex justify-end gap-2 pr-2">
          <button
            onClick={() => navigate(`/workers/staff/${r._id}`)}
            className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors"
          >
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setSelectedStaff(r);
              setIsModalOpen(true);
            }}
            className="p-1.5 bg-slate-50 text-slate-400 hover:text-amber-600 rounded-lg"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setStaffToDelete(r);
              setIsDeleteModalOpen(true);
            }}
            className="p-1.5 bg-slate-50 text-slate-400 hover:text-red-600 rounded-lg"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-4 lg:p-6 font-sans">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
      />

      {/* --- HEADER --- */}
      <div className="mb-6 flex flex-col xl:flex-row xl:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-200">
            <Users className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-slate-800 to-indigo-800 bg-clip-text text-transparent uppercase tracking-tight">
              Staff Master
            </h1>
            <p className="text-sm text-slate-500 font-medium">
              {pagination.total} Registered Personnel
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleExportData}
            className="h-10 px-4 bg-white border border-slate-200 hover:bg-emerald-50 hover:text-emerald-600 text-slate-600 rounded-xl font-bold text-xs shadow-sm transition-all flex items-center gap-2"
          >
            <Download className="w-4 h-4" /> Export
          </button>
          <button
            onClick={handleDownloadTemplate}
            className="h-10 px-4 bg-white border border-slate-200 hover:bg-blue-50 hover:text-blue-600 text-slate-600 rounded-xl font-bold text-xs shadow-sm transition-all flex items-center gap-2"
          >
            <FileSpreadsheet className="w-4 h-4" /> Template
          </button>
          <button
            onClick={() => fileInputRef.current.click()}
            className="h-10 px-4 bg-white border border-slate-200 hover:bg-indigo-50 hover:text-indigo-600 text-slate-600 rounded-xl font-bold text-xs shadow-sm transition-all flex items-center gap-2"
          >
            {importLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <UploadCloud className="w-4 h-4" />
            )}{" "}
            Import
          </button>
          <button
            onClick={() => {
              setSelectedStaff(null);
              setIsModalOpen(true);
            }}
            className="h-10 px-6 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl font-bold text-sm shadow-lg active:scale-95 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Add Staff
          </button>
        </div>
      </div>

      {/* --- FILTERS --- */}
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 relative z-20 flex flex-col mb-6">
        <div className="p-4 border-b border-gray-100 bg-slate-50/50 flex flex-col xl:flex-row gap-4 items-end">
          <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase mb-1.5 block ml-1 tracking-widest">
                Company
              </span>
              <CustomDropdown
                value={selectedCompany}
                onChange={setSelectedCompany}
                options={companyOptions}
                icon={Briefcase}
                placeholder="All Companies"
              />
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase mb-1.5 block ml-1 tracking-widest">
                Site
              </span>
              <CustomDropdown
                value={selectedSite}
                onChange={setSelectedSite}
                options={siteOptions}
                icon={MapPin}
                placeholder="All Sites"
              />
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase mb-1.5 block ml-1 tracking-widest">
                Expiry Range
              </span>
              <CustomDropdown
                value={selectedExpiryRange}
                onChange={setSelectedExpiryRange}
                options={expiryRangeOptions}
                icon={Clock}
                placeholder="Any Validity"
              />
            </div>
          </div>
          <div className="flex-1 w-full xl:max-w-[350px]">
            <span className="text-[10px] font-bold text-slate-400 uppercase mb-1.5 block ml-1 tracking-widest">
              Search
            </span>
            <div className="relative h-[42px]">
              <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search..."
                value={currentSearch}
                onChange={(e) => setCurrentSearch(e.target.value)}
                className="w-full h-full pl-10 pr-4 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:border-indigo-500 shadow-inner"
              />
            </div>
          </div>
        </div>
      </div>

      {/* ✅ NEW: FLOATING MARQUEE ALERT BAR ADDED ABOVE TABLE */}
      {criticalAlerts.length > 0 && (
        <div className="mb-4 bg-white/60 backdrop-blur-xl border border-rose-100 py-3 rounded-2xl overflow-hidden relative shadow-sm mx-1 ring-1 ring-rose-50/50">
          <div className="flex whitespace-nowrap animate-marquee items-center gap-20">
            <div className="flex items-center gap-2 bg-rose-600 text-white px-4 py-1.5 rounded-full ml-6 font-black text-[9px] uppercase tracking-widest shadow-lg">
              <ShieldAlert className="w-3.5 h-3.5" /> CRITICAL COMPLIANCE ALERT
            </div>
            {criticalAlerts.map((staff) => (
              <div
                key={staff._id}
                className="flex items-center gap-3 text-slate-700"
              >
                <span className="text-[12px] font-black">{staff.name}</span>
                <span className="bg-slate-200 text-slate-500 text-[9px] px-2 py-0.5 rounded font-bold">
                  {staff.employeeCode}
                </span>
                <span className="text-[10px] font-bold text-rose-600 uppercase italic">
                  Check Expiry Status
                </span>
                <div className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-pulse"></div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* --- TABLE CONTAINER --- */}
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden relative z-10">
        <DataTable
          columns={columns}
          data={filteredData}
          loading={loading}
          pagination={pagination}
          onPageChange={(p) => fetchData(p, pagination.limit, currentSearch)}
          hideSearch={true}
        />
      </div>

      {/* MODALS */}
      <StaffModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => fetchData()}
        editData={selectedStaff}
      />
      <DeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        loading={deleteLoading}
        title="Delete Staff"
        message={`Are you sure you want to delete ${staffToDelete?.name}?`}
      />

      <style>{`
        @keyframes marquee { 0% { transform: translateX(100%); } 100% { transform: translateX(-100%); } }
        .animate-marquee { animation: marquee 35s linear infinite; }
        .animate-marquee:hover { animation-play-state: paused; }
        .DataTable th { font-weight: 800; color: #64748b; text-transform: uppercase; font-size: 11px; letter-spacing: 0.05em; padding: 18px 24px !important; border-bottom: 1px solid #f1f5f9; }
        .DataTable td { padding: 14px 24px !important; border-bottom: 1px solid #f1f5f9; }
      `}</style>
    </div>
  );
};

export default Staff;
