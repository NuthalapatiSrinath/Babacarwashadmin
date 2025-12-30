import React, { useState, useEffect } from "react";
import {
  Download,
  Layers,
  Calendar,
  ChevronDown,
  FileSpreadsheet,
  Building,
  User,
  Loader2,
} from "lucide-react";
import toast from "react-hot-toast";

// APIs
import { paymentService } from "../api/paymentService";
import { buildingService } from "../api/buildingService";
import { workerService } from "../api/workerService";

const CollectionSheet = () => {
  const [downloading, setDownloading] = useState(false);

  // Dropdown Data
  const [buildings, setBuildings] = useState([]);
  const [workers, setWorkers] = useState([]);

  // Filters
  const today = new Date();
  const [filters, setFilters] = useState({
    serviceType: "residence", // Default per screenshot
    building: "all",
    worker: "all",
    month: today.getMonth() + 1, // UI uses 1-12
    year: today.getFullYear(),
  });

  // Load Dropdown Data on Mount
  useEffect(() => {
    const loadFilters = async () => {
      try {
        const [resBuildings, resWorkers] = await Promise.all([
          buildingService.list(1, 1000),
          workerService.list(1, 1000),
        ]);
        setBuildings(resBuildings.data || []);
        setWorkers(resWorkers.data || []);
      } catch (error) {
        console.error("Failed to load filters", error);
        toast.error("Could not load building/worker lists");
      }
    };
    loadFilters();
  }, []);

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const handleDownload = async () => {
    setDownloading(true);
    const toastId = toast.loading("Generating Collection Sheet...");

    try {
      const blob = await paymentService.downloadCollectionSheet(filters);

      // Check for empty file
      if (blob.size < 100) {
        toast.error("File appears empty. Check if data exists.", {
          id: toastId,
        });
        // Return or continue depending on preference. Usually we let it download.
      }

      // Download Logic
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement("a");
      link.href = url;
      // Filename: Collection_Residence_Dec_2025.xlsx
      link.download = `Collection_${filters.serviceType}_${filters.month}_${filters.year}.xlsx`;
      document.body.appendChild(link);
      link.click();

      // Cleanup
      link.remove();
      window.URL.revokeObjectURL(url);

      toast.success("Download successful!", { id: toastId });
    } catch (error) {
      console.error("Download Error:", error);
      toast.error("Failed to download sheet.", { id: toastId });
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
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <FileSpreadsheet className="w-8 h-8 text-indigo-600" />
          Collection Sheet
        </h1>
        <p className="text-slate-500 mt-1 ml-10">
          Generate monthly collection sheets for buildings and workers.
        </p>
      </div>

      {/* Filter Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-6 items-end">
          {/* 1. Service Type */}
          <div className="relative group md:col-span-1">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">
              Service Type
            </label>
            <div className="relative">
              <select
                name="serviceType"
                value={filters.serviceType}
                onChange={handleFilterChange}
                className="w-full h-12 bg-slate-50 border border-slate-200 text-slate-700 font-medium rounded-xl pl-10 pr-8 appearance-none outline-none focus:border-indigo-500 cursor-pointer"
              >
                <option value="residence">Residence</option>
                {/* Add other types if backend supports, e.g. mall */}
              </select>
              <Layers className="absolute left-3 top-3.5 w-5 h-5 text-slate-400" />
              <ChevronDown className="absolute right-3 top-4 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
          </div>

          {/* 2. Select Buildings */}
          <div className="relative group md:col-span-1">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">
              Select Buildings
            </label>
            <div className="relative">
              <select
                name="building"
                value={filters.building}
                onChange={handleFilterChange}
                className="w-full h-12 bg-slate-50 border border-slate-200 text-slate-700 font-medium rounded-xl pl-10 pr-8 appearance-none outline-none focus:border-indigo-500 cursor-pointer"
              >
                <option value="all">All</option>
                {buildings.map((b) => (
                  <option key={b._id} value={b._id}>
                    {b.name}
                  </option>
                ))}
              </select>
              <Building className="absolute left-3 top-3.5 w-5 h-5 text-slate-400" />
              <ChevronDown className="absolute right-3 top-4 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
          </div>

          {/* 3. Select Workers */}
          <div className="relative group md:col-span-1">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">
              Select Workers
            </label>
            <div className="relative">
              <select
                name="worker"
                value={filters.worker}
                onChange={handleFilterChange}
                className="w-full h-12 bg-slate-50 border border-slate-200 text-slate-700 font-medium rounded-xl pl-10 pr-8 appearance-none outline-none focus:border-indigo-500 cursor-pointer"
              >
                <option value="all">All</option>
                {workers.map((w) => (
                  <option key={w._id} value={w._id}>
                    {w.name}
                  </option>
                ))}
              </select>
              <User className="absolute left-3 top-3.5 w-5 h-5 text-slate-400" />
              <ChevronDown className="absolute right-3 top-4 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
          </div>

          {/* 4. Select Month */}
          <div className="relative group md:col-span-1">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">
              Select Month
            </label>
            <div className="relative">
              <select
                name="month"
                value={filters.month}
                onChange={handleFilterChange}
                className="w-full h-12 bg-slate-50 border border-slate-200 text-slate-700 font-medium rounded-xl pl-10 pr-8 appearance-none outline-none focus:border-indigo-500 cursor-pointer"
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

          {/* 5. Select Year */}
          <div className="relative group md:col-span-1">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">
              Select Year
            </label>
            <div className="relative">
              <select
                name="year"
                value={filters.year}
                onChange={handleFilterChange}
                className="w-full h-12 bg-slate-50 border border-slate-200 text-slate-700 font-medium rounded-xl pl-10 pr-8 appearance-none outline-none focus:border-indigo-500 cursor-pointer"
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

          {/* 6. Download Button */}
          <div className="md:col-span-1">
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
              {downloading ? "Processing..." : "Download"}
            </button>
          </div>
        </div>
      </div>

      {/* Placeholder / Empty State */}
      <div className="flex-1 flex flex-col items-center justify-center text-slate-400 mt-8">
        <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mb-4 shadow-sm border border-slate-100">
          <FileSpreadsheet className="w-10 h-10 text-slate-300" />
        </div>
        <h3 className="text-lg font-semibold text-slate-600">
          No Sheet Generated Yet
        </h3>
        <p className="text-sm max-w-xs text-center mt-1">
          Select parameters above and click download to get the collection
          sheet.
        </p>
      </div>
    </div>
  );
};

export default CollectionSheet;
