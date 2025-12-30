import React, { useState } from "react";
import {
  Download,
  ChevronDown,
  Loader2,
  FileSpreadsheet,
  Layers,
  Calendar,
} from "lucide-react";
import toast from "react-hot-toast";
import { workRecordsService } from "../api/workRecordsService";

const WorkRecords = () => {
  const [downloading, setDownloading] = useState(false);

  // Default to Current Date
  const today = new Date();
  const [filters, setFilters] = useState({
    serviceType: "onewash", // Default
    month: today.getMonth() + 1, // Keep UI 1-12
    year: today.getFullYear(),
  });

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const handleDownload = async () => {
    setDownloading(true);
    const toastId = toast.loading(
      `Generating ${filters.serviceType} report...`
    );

    try {
      // 1. Call Service
      const blob = await workRecordsService.downloadStatement(
        filters.serviceType,
        filters.month,
        filters.year
      );

      // 2. Check if file is valid (sometimes empty blobs return on error)
      if (blob.size < 100) {
        console.warn("File size is very small, might be empty.");
      }

      // 3. Create Download Link
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement("a");
      link.href = url;
      // Filename: Statement_residence_2025_12.xlsx
      link.download = `Statement_${filters.serviceType}_${filters.year}_${filters.month}.xlsx`;
      document.body.appendChild(link);
      link.click();

      // Cleanup
      link.remove();
      window.URL.revokeObjectURL(url);

      toast.success("Download successful!", { id: toastId });
    } catch (error) {
      console.error("Download Error:", error);
      toast.error("Failed to download file. Check if data exists.", {
        id: toastId,
      });
    } finally {
      setDownloading(false);
    }
  };

  // --- STATIC OPTIONS ---
  const months = [
    { value: 1, label: "January" },
    { value: 2, label: "February" },
    { value: 3, label: "March" },
    { value: 4, label: "April" },
    { value: 5, label: "May" },
    { value: 6, label: "June" },
    { value: 7, label: "July" },
    { value: 8, label: "August" },
    { value: 9, label: "September" },
    { value: 10, label: "October" },
    { value: 11, label: "November" },
    { value: 12, label: "December" },
  ];

  const years = [2024, 2025, 2026, 2027];

  return (
    <div className="p-6 w-full h-[calc(100vh-80px)] flex flex-col font-sans bg-slate-50/50">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <FileSpreadsheet className="w-8 h-8 text-indigo-600" />
          Work Records
        </h1>
        <p className="text-slate-500 mt-1 ml-10">
          Generate and download monthly work statements.
        </p>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
          {/* Service Type */}
          <div className="relative group">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">
              Service Type
            </label>
            <div className="relative">
              <select
                name="serviceType"
                value={filters.serviceType}
                onChange={handleFilterChange}
                className="w-full h-12 bg-slate-50 border border-slate-200 text-slate-700 font-medium rounded-xl pl-10 pr-10 appearance-none outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all cursor-pointer hover:border-slate-300"
              >
                <option value="onewash">Onewash</option>
                <option value="residence">Residence</option>
              </select>
              <Layers className="absolute left-3 top-3.5 w-5 h-5 text-slate-400" />
              <ChevronDown className="absolute right-3 top-4 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
          </div>

          {/* Month */}
          <div className="relative group">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">
              Month
            </label>
            <div className="relative">
              <select
                name="month"
                value={filters.month}
                onChange={handleFilterChange}
                className="w-full h-12 bg-slate-50 border border-slate-200 text-slate-700 font-medium rounded-xl pl-10 pr-10 appearance-none outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all cursor-pointer hover:border-slate-300"
              >
                {months.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
              <Calendar className="absolute left-3 top-3.5 w-5 h-5 text-slate-400" />
              <ChevronDown className="absolute right-3 top-4 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
          </div>

          {/* Year */}
          <div className="relative group">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">
              Year
            </label>
            <div className="relative">
              <select
                name="year"
                value={filters.year}
                onChange={handleFilterChange}
                className="w-full h-12 bg-slate-50 border border-slate-200 text-slate-700 font-medium rounded-xl pl-10 pr-10 appearance-none outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all cursor-pointer hover:border-slate-300"
              >
                {years.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
              <Calendar className="absolute left-3 top-3.5 w-5 h-5 text-slate-400" />
              <ChevronDown className="absolute right-3 top-4 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
          </div>

          {/* Download Button */}
          <div>
            <button
              onClick={handleDownload}
              disabled={downloading}
              className="w-full h-12 bg-[#009ef7] hover:bg-[#0086d6] text-white font-bold rounded-xl shadow-lg shadow-blue-200 hover:shadow-blue-300 transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {downloading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Download className="w-5 h-5" />
              )}
              {downloading ? "Downloading..." : "Download"}
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center text-slate-400 mt-8">
        <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mb-4 shadow-sm border border-slate-100">
          <FileSpreadsheet className="w-10 h-10 text-slate-300" />
        </div>
        <h3 className="text-lg font-semibold text-slate-600">
          Ready to Export
        </h3>
        <p className="text-sm max-w-xs text-center mt-1">
          Select the service type, month, and year to download the Excel report.
        </p>
      </div>
    </div>
  );
};

export default WorkRecords;
