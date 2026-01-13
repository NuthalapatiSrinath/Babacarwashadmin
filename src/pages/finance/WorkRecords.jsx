import React, { useState, useMemo, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Download,
  Loader2,
  FileSpreadsheet,
  Layers,
  Calendar,
  Filter,
} from "lucide-react";
import toast from "react-hot-toast";
import { downloadWorkRecordsStatement } from "../../redux/slices/workRecordsSlice";
import CustomDropdown from "../../components/ui/CustomDropdown";

const WorkRecords = () => {
  const dispatch = useDispatch();

  // Redux State
  const { downloading } = useSelector((state) => state.workRecords);

  // --- DYNAMIC DATE LOGIC ---
  const today = new Date();
  const currentMonth = today.getMonth() + 1; // 1-12 (January is 1)
  const currentYear = today.getFullYear();

  // 1. Calculate the latest year that has completed data.
  // If we are in January (1), the current year has NO completed months yet.
  // So the latest valid year is the previous year (2025).
  // If we are in Feb (2) or later, the current year (2026) has at least Jan completed.
  const maxValidYear = currentMonth === 1 ? currentYear - 1 : currentYear;

  // 2. Initial State Logic
  // If maxValidYear is previous year (e.g. 2025), default to December.
  // If maxValidYear is current year (e.g. 2026), default to last completed month (currentMonth - 1).
  const initialYear = maxValidYear;
  const initialMonth = maxValidYear < currentYear ? 12 : currentMonth - 1;

  const [filters, setFilters] = useState({
    serviceType: "residence",
    month: initialMonth,
    year: initialYear,
  });

  // --- DROPDOWN OPTIONS ---

  const serviceTypeOptions = [
    { value: "residence", label: "Residence", icon: Layers },
    { value: "onewash", label: "Onewash", icon: Filter },
  ];

  // Generate Year Options dynamically up to maxValidYear
  const yearOptions = useMemo(() => {
    const startYear = 2024; // Base year
    const years = [];
    for (let y = startYear; y <= maxValidYear; y++) {
      years.push({ value: y, label: y.toString() });
    }
    return years.reverse(); // Show newest year first (e.g., 2025, 2024)
  }, [maxValidYear]);

  // --- MONTH LOGIC ---
  const availableMonths = useMemo(() => {
    const allMonths = [
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

    const selectedYear = Number(filters.year);

    return allMonths.filter((m) => {
      // 1. If selected year is purely in the past (e.g. 2024 when we are in 2025/2026)
      // All months are valid/completed.
      if (selectedYear < currentYear) return true;

      // 2. If selected year IS the current year (e.g. 2026)
      // We only show months strictly LESS than current month.
      // (e.g. if Today is Feb 15, currentMonth=2. We show Jan (1). 1 < 2 is True).
      if (selectedYear === currentYear) {
        return m.value < currentMonth;
      }

      return false; // Should not happen given yearOptions logic, but safe fallback
    });
  }, [filters.year, currentMonth, currentYear]);

  // Safety Effect: If current selected month becomes invalid (hidden), reset it
  useEffect(() => {
    const isCurrentMonthValid = availableMonths.some(
      (m) => m.value === Number(filters.month)
    );

    if (!isCurrentMonthValid && availableMonths.length > 0) {
      setFilters((prev) => ({
        ...prev,
        month: availableMonths[availableMonths.length - 1].value,
      }));
    }
  }, [availableMonths, filters.month]);

  const handleDownload = async () => {
    const toastId = toast.loading(
      `Generating ${filters.serviceType} report...`
    );

    try {
      const result = await dispatch(
        downloadWorkRecordsStatement({
          serviceType: filters.serviceType,
          month: filters.month,
          year: filters.year,
        })
      ).unwrap();
      const blob = result.blob;

      if (blob.size < 100) {
        console.warn("File size is very small, might be empty.");
      }

      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement("a");
      link.href = url;
      link.download = `Statement_${filters.serviceType}_${filters.year}_${filters.month}.xlsx`;
      document.body.appendChild(link);
      link.click();

      link.remove();
      window.URL.revokeObjectURL(url);

      toast.success("Download successful!", { id: toastId });
    } catch (error) {
      console.error("Download Error:", error);
      toast.error("Failed to download file. Check if data exists.", {
        id: toastId,
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6 font-sans">
      {/* --- HEADER --- */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center shadow-lg shadow-indigo-200">
            <FileSpreadsheet className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-800 to-indigo-800 bg-clip-text text-transparent">
              Work Records
            </h1>
            <p className="text-slate-500 font-medium mt-1">
              Generate and download monthly work statements
            </p>
          </div>
        </div>
      </div>

      {/* --- FILTER CARD --- */}
      <div className="max-w-7xl mx-auto bg-white rounded-2xl shadow-xl border border-slate-100 relative">
        <div className="h-1.5 w-full bg-gradient-to-r from-indigo-400 via-blue-500 to-cyan-500 rounded-t-2xl"></div>

        <div className="p-6 md:p-8">
          <div className="flex items-center gap-2 mb-6 text-slate-400 text-xs font-bold uppercase tracking-wider">
            <Filter className="w-4 h-4" /> Statement Parameters
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-end">
            {/* Service Type */}
            <div>
              <CustomDropdown
                label="Service Type"
                value={filters.serviceType}
                onChange={(val) => setFilters({ ...filters, serviceType: val })}
                options={serviceTypeOptions}
                icon={Layers}
                placeholder="Select Service"
              />
            </div>

            {/* Year */}
            <div>
              <CustomDropdown
                label="Year"
                value={filters.year}
                onChange={(val) =>
                  setFilters({ ...filters, year: Number(val) })
                }
                options={yearOptions}
                icon={Calendar}
                placeholder="Select Year"
              />
            </div>

            {/* Month */}
            <div>
              <CustomDropdown
                label="Month"
                value={filters.month}
                onChange={(val) =>
                  setFilters({ ...filters, month: Number(val) })
                }
                options={availableMonths}
                icon={Calendar}
                placeholder={
                  availableMonths.length === 0
                    ? "No completed months"
                    : "Select Month"
                }
                disabled={availableMonths.length === 0}
              />
            </div>

            {/* Download Button */}
            <div>
              <button
                onClick={handleDownload}
                disabled={downloading || availableMonths.length === 0}
                className="w-full h-[42px] bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-600 hover:to-blue-700 text-white font-bold rounded-xl shadow-lg hover:shadow-xl shadow-indigo-200 hover:shadow-indigo-200 transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed text-sm"
              >
                {downloading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Download className="w-5 h-5" />
                )}
                <span>{downloading ? "Processing..." : "Download Report"}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* --- EMPTY STATE ILLUSTRATION --- */}
      <div className="max-w-7xl mx-auto mt-16 flex flex-col items-center justify-center text-center opacity-70">
        <div className="w-32 h-32 rounded-full bg-white border-4 border-slate-100 flex items-center justify-center mb-6 shadow-sm">
          <div className="w-24 h-24 rounded-full bg-slate-50 flex items-center justify-center">
            <FileSpreadsheet className="w-10 h-10 text-slate-300" />
          </div>
        </div>
        <h3 className="text-xl font-bold text-slate-700">Ready to Export</h3>
        <p className="text-slate-500 mt-2 max-w-sm">
          Select the service type, month, and year from the panel above to
          generate and download the work records statement.
        </p>
      </div>
    </div>
  );
};

export default WorkRecords;
