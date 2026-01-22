import React, { useState, useEffect } from "react";
import {
  Search,
  Download,
  Loader2,
  Calendar,
  User,
  ShoppingBag,
  Building,
  BarChart2,
} from "lucide-react";
import toast from "react-hot-toast";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { workerService } from "../../api/workerService";
import CustomDropdown from "../../components/ui/CustomDropdown";

const YearlyRecords = () => {
  // --- STATE ---
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState(null);

  // Filters
  // ✅ DEFAULT SELECTED: "onewash"
  const [serviceType, setServiceType] = useState("onewash");
  const [selectedWorker, setSelectedWorker] = useState("");

  // Time Mode: 'year' or 'last6'
  const [timeMode, setTimeMode] = useState("year");
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  // Data Lists
  const [allWorkers, setAllWorkers] = useState([]);
  const [filteredWorkers, setFilteredWorkers] = useState([]);

  const years = [2024, 2025, 2026, 2027];

  const serviceTypes = [
    { value: "onewash", label: "One Wash", icon: ShoppingBag },
    { value: "residence", label: "Residence", icon: Building },
  ];

  // --- 1. Load Workers on Mount ---
  useEffect(() => {
    const fetchWorkers = async () => {
      try {
        const res = await workerService.list(1, 3000, "", 1); // Active workers
        if (res.data) setAllWorkers(res.data);
      } catch (error) {
        console.error("Failed to load workers");
      }
    };
    fetchWorkers();
  }, []);

  // --- 2. Filter Workers by Service Type ---
  useEffect(() => {
    if (!serviceType) {
      setFilteredWorkers([]);
      return;
    }
    let filtered = [];
    if (serviceType === "onewash") {
      filtered = allWorkers.filter((w) =>
        ["mall", "mobile", "site"].includes(w.service_type),
      );
    } else {
      filtered = allWorkers.filter((w) => w.service_type === "residence");
    }
    setFilteredWorkers(filtered);
    setSelectedWorker(""); // Reset worker when type changes
    setReportData(null); // Clear old data
  }, [serviceType, allWorkers]);

  // --- 3. AUTO FETCH DATA (Instant) ---
  useEffect(() => {
    const fetchData = async () => {
      if (!selectedWorker) return;

      setLoading(true);
      try {
        const response = await workerService.getYearlyRecords(
          timeMode,
          selectedYear,
          selectedWorker,
        );
        setReportData(response);
      } catch (error) {
        console.error(error);
        toast.error("Failed to load data");
      } finally {
        setLoading(false);
      }
    };

    // Debounce slightly to prevent double calls on rapid clicks
    const timeoutId = setTimeout(() => {
      fetchData();
    }, 100);

    return () => clearTimeout(timeoutId);
  }, [selectedWorker, timeMode, selectedYear]);

  // --- 4. Export PDF ---
  const handleExportPDF = () => {
    if (!reportData) return;
    const doc = new jsPDF("l", "mm", "a4"); // Landscape
    const workerName =
      filteredWorkers.find((w) => w._id === selectedWorker)?.name || "Worker";

    // Header
    doc.setFontSize(16);
    doc.text(`Work Record History`, 14, 15);
    doc.setFontSize(10);
    doc.text(`Worker: ${workerName}`, 14, 22);
    doc.text(`Period: ${reportData.period}`, 14, 27);

    // Columns: Month | 1..31 | Total | Tips
    const tableHead = [
      "Month",
      ...Array.from({ length: 31 }, (_, i) => (i + 1).toString()),
      "Total",
      "Tips",
    ];

    const tableBody = reportData.data.map((row) => {
      const days = Array.from({ length: 31 }, (_, i) => {
        const val = row[`day_${i + 1}`];
        // ✅ FIX: Show 0 for empty/missing data
        return val === null || val === undefined ? 0 : val;
      });
      return [row.month, ...days, row.total, row.tips];
    });

    // Add Summary
    const summaryRow = [
      "GRAND TOTAL",
      ...Array(31).fill(""),
      reportData.grandTotal.cars,
      `AED ${reportData.grandTotal.tips}`,
    ];
    tableBody.push(summaryRow);

    autoTable(doc, {
      startY: 35,
      head: [tableHead],
      body: tableBody,
      theme: "grid",
      headStyles: { fillColor: [30, 75, 133], fontSize: 6, halign: "center" },
      styles: { fontSize: 6, cellPadding: 1, halign: "center" },
      columnStyles: {
        0: { halign: "left", fontStyle: "bold", cellWidth: 25 }, // Month Name
        32: { fontStyle: "bold", cellWidth: 10 }, // Total
        33: { fontStyle: "bold", cellWidth: 15 }, // Tips
      },
    });

    doc.save(`${workerName}_Records.pdf`);
  };

  // Dropdown Options
  const workerOptions = filteredWorkers.map((w) => ({
    value: w._id,
    label: w.name,
  }));

  return (
    <div className="min-h-screen bg-[#f1f5f9] p-4 lg:p-8 font-sans">
      {/* HEADER & FILTERS */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 mb-6">
        <div className="flex flex-col lg:flex-row justify-between items-center gap-6">
          {/* Title */}
          <div className="flex items-center gap-3">
            <div className="p-3 bg-indigo-50 rounded-xl text-indigo-600">
              <BarChart2 className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-800">
                Historical Records
              </h1>
              <p className="text-xs text-slate-500 font-bold">
                Comprehensive Daily Breakdowns
              </p>
            </div>
          </div>

          {/* Filter Group */}
          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
            {/* 1. Service Type */}
            <div className="flex bg-slate-100 p-1 rounded-xl">
              {serviceTypes.map((type) => (
                <button
                  key={type.value}
                  onClick={() => setServiceType(type.value)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                    serviceType === type.value
                      ? "bg-white text-slate-800 shadow-sm"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  <type.icon className="w-3.5 h-3.5" /> {type.label}
                </button>
              ))}
            </div>

            {/* 2. Worker Select (Searchable) */}
            <div className="w-64">
              <CustomDropdown
                options={workerOptions}
                value={selectedWorker}
                onChange={setSelectedWorker}
                placeholder={
                  serviceType ? "Search Worker..." : "Select Type First"
                }
                icon={User}
                disabled={!serviceType}
                searchable={true} // ✅ ADDED: Enable Search in Dropdown
              />
            </div>

            {/* 3. Time Filter */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button
                onClick={() => setTimeMode("year")}
                className={`px-3 py-2 rounded-lg text-xs font-bold transition-all ${timeMode === "year" ? "bg-white shadow-sm text-indigo-600" : "text-slate-500"}`}
              >
                Specific Year
              </button>
              <button
                onClick={() => setTimeMode("last6")}
                className={`px-3 py-2 rounded-lg text-xs font-bold transition-all ${timeMode === "last6" ? "bg-white shadow-sm text-indigo-600" : "text-slate-500"}`}
              >
                Last 6 Months
              </button>
            </div>

            {/* 4. Year Selector (Conditional) */}
            {timeMode === "year" && (
              <div className="relative">
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  className="bg-white border border-slate-200 text-slate-700 font-bold text-xs rounded-xl px-4 py-3 pr-8 outline-none focus:ring-2 focus:ring-indigo-100 shadow-sm appearance-none cursor-pointer"
                >
                  {years.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
                <Calendar className="w-3.5 h-3.5 absolute right-3 top-3.5 text-slate-400 pointer-events-none" />
              </div>
            )}

            {/* Export */}
            <button
              onClick={handleExportPDF}
              disabled={!reportData}
              className="p-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              title="Download PDF"
            >
              <Download className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* RESULT TABLE */}
      <div className="bg-white rounded-[20px] shadow-xl border border-slate-200 overflow-hidden relative min-h-[400px]">
        {loading ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 z-10">
            <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
            <span className="text-sm font-bold text-slate-400 mt-2">
              Loading Data...
            </span>
          </div>
        ) : !selectedWorker ? (
          <div className="flex flex-col items-center justify-center h-[400px] text-slate-300">
            <User className="w-16 h-16 mb-4 opacity-50" />
            <span className="text-sm font-bold">
              Select a Worker to view records
            </span>
          </div>
        ) : !reportData ? (
          <div className="flex flex-col items-center justify-center h-[400px] text-slate-300">
            <span className="text-sm font-bold">No Data Found</span>
          </div>
        ) : (
          <div className="overflow-x-auto custom-scrollbar pb-2">
            <table className="w-full text-left border-collapse">
              <thead>
                {/* Header Row */}
                <tr className="bg-[#1e4b85] text-white">
                  <th className="px-4 py-4 text-xs font-bold uppercase tracking-wider border-r border-white/10 sticky left-0 bg-[#1e4b85] z-20 min-w-[140px]">
                    Month
                  </th>
                  {/* Days 1-31 */}
                  {Array.from({ length: 31 }, (_, i) => (
                    <th
                      key={i}
                      className="px-1 py-2 text-[10px] font-bold text-center border-r border-white/10 min-w-[32px]"
                    >
                      {i + 1}
                    </th>
                  ))}
                  <th className="px-2 py-2 text-[10px] font-bold text-center bg-[#f97316] border-r border-white/10 min-w-[60px]">
                    Total
                  </th>
                  <th className="px-4 py-2 text-[10px] font-bold text-center bg-[#10b981] min-w-[80px]">
                    Tips
                  </th>
                </tr>
              </thead>
              <tbody>
                {reportData.data.map((row, idx) => (
                  <tr
                    key={idx}
                    className="hover:bg-blue-50/50 transition-colors border-b border-slate-100"
                  >
                    {/* Month Name (Sticky) */}
                    <td className="px-4 py-3 text-xs font-bold text-slate-700 border-r border-slate-100 bg-slate-50 sticky left-0 z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                      {row.month}
                    </td>

                    {/* 31 Day Columns */}
                    {Array.from({ length: 31 }, (_, i) => {
                      const count = row[`day_${i + 1}`];
                      // ✅ FIX: Keep 0 if data missing/null, otherwise actual value
                      const displayVal =
                        count === null || count === undefined ? 0 : count;

                      return (
                        <td
                          key={i}
                          className={`px-1 py-1 text-center text-[11px] border-r border-slate-100 
                                                ${displayVal > 0 ? "font-black text-slate-800 bg-blue-100/30" : "text-slate-300"}
                                            `}
                        >
                          {displayVal}
                        </td>
                      );
                    })}

                    {/* Total Column */}
                    <td className="px-2 py-3 text-center text-sm font-black text-orange-600 bg-orange-50/30 border-r border-slate-100">
                      {row.total}
                    </td>

                    {/* Tips Column */}
                    <td className="px-2 py-3 text-center text-xs font-bold text-emerald-600 bg-emerald-50/30">
                      {row.tips > 0 ? row.tips : "0"}
                    </td>
                  </tr>
                ))}
              </tbody>

              {/* FOOTER TOTALS */}
              <tfoot className="bg-slate-800 text-white sticky bottom-0 z-20">
                <tr>
                  <td className="px-4 py-3 text-xs font-bold uppercase tracking-widest sticky left-0 bg-slate-800 z-30 border-r border-slate-700">
                    GRAND TOTAL
                  </td>
                  <td
                    colSpan={31}
                    className="bg-slate-800/90 border-r border-slate-700"
                  ></td>
                  <td className="px-2 py-3 text-center text-sm font-black text-orange-400 border-r border-slate-700">
                    {reportData.grandTotal.cars}
                  </td>
                  <td className="px-2 py-3 text-center text-xs font-bold text-emerald-400">
                    AED {reportData.grandTotal.tips}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { height: 10px; width: 8px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #f1f5f9; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 5px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
      `}</style>
    </div>
  );
};

export default YearlyRecords;
