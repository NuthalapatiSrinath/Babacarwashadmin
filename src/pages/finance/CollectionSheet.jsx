import React, { useState, useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  FileSpreadsheet,
  Building,
  User,
  Loader2,
  Filter,
  Layers,
  Calendar,
  Download, // ✅ Fixed: Added missing import
} from "lucide-react";
import toast from "react-hot-toast";

// Redux
import { fetchBuildings } from "../../redux/slices/buildingSlice";
import { fetchWorkers } from "../../redux/slices/workerSlice";
import { downloadCollectionSheet } from "../../redux/slices/collectionSheetSlice";

// Custom Components
import CustomDropdown from "../../components/ui/CustomDropdown";

const CollectionSheet = () => {
  const dispatch = useDispatch();

  // Redux State
  const { buildings, loading: buildingsLoading } = useSelector(
    (state) => state.building,
  );
  const { workers, loading: workersLoading } = useSelector(
    (state) => state.worker,
  );
  const { downloading } = useSelector((state) => state.collectionSheet);

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
    dispatch(fetchBuildings({ page: 1, limit: 1000 }));
    dispatch(fetchWorkers({ page: 1, limit: 1000, status: 1 }));
  }, [dispatch]);

  // Handle Dropdown Changes
  const handleFilterChange = (name, value) => {
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleDownload = async () => {
    const toastId = toast.loading("Generating Collection Sheet...");

    try {
      const result = await dispatch(downloadCollectionSheet(filters)).unwrap();
      const blob = result.blob;

      // Check for empty file
      if (blob.size < 100) {
        toast.error("File appears empty. Check if data exists.", {
          id: toastId,
        });
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
    }
  };

  // --- OPTIONS ---
  const serviceTypeOptions = [
    { value: "residence", label: "Residence", icon: Layers },
    { value: "onewash", label: "One Wash", icon: Filter },
  ];

  const monthOptions = [
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

  const yearOptions = [
    { value: 2024, label: "2024" },
    { value: 2025, label: "2025" },
    { value: 2026, label: "2026" },
    { value: 2027, label: "2027" },
  ];

  const buildingOptions = useMemo(() => {
    const options = [{ value: "all", label: "All Buildings" }];
    if (buildings) {
      buildings.forEach((b) => {
        options.push({ value: b._id, label: b.name });
      });
    }
    return options;
  }, [buildings]);

  const workerOptions = useMemo(() => {
    const options = [{ value: "all", label: "All Workers" }];
    if (workers) {
      workers.forEach((w) => {
        options.push({ value: w._id, label: w.name });
      });
    }
    return options;
  }, [workers]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6 font-sans">
      {/* --- HEADER --- */}
      {/* <div className="max-w-7xl mx-auto mb-8">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-200">
            <FileSpreadsheet className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-800 to-emerald-800 bg-clip-text text-transparent">
              Collection Sheet
            </h1>
            <p className="text-slate-500 font-medium mt-1">
              Generate and download monthly financial reports
            </p>
          </div>
        </div>
      </div> */}

      {/* --- FILTER CARD --- */}
      <div className="max-w-7xl mx-auto bg-white rounded-2xl shadow-xl border border-slate-100 relative">
        {/* Top Decorative Line */}
        <div className="h-1.5 w-full bg-gradient-to-r from-emerald-400 via-teal-500 to-cyan-500 rounded-t-2xl"></div>

        <div className="p-6 md:p-8">
          <div className="flex items-center gap-2 mb-6 text-slate-400 text-xs font-bold uppercase tracking-wider">
            <Filter className="w-4 h-4" /> Report Parameters
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 items-end">
            {/* 1. Service Type */}
            <div className="relative group md:col-span-1">
              <CustomDropdown
                label="Service Type"
                value={filters.serviceType}
                onChange={(val) => handleFilterChange("serviceType", val)}
                options={serviceTypeOptions}
                icon={Layers}
                placeholder="Select Service"
              />
            </div>

            {/* 2. Select Buildings */}
            <div className="relative group md:col-span-1 xl:col-span-1">
              <CustomDropdown
                label="Building"
                value={filters.building}
                onChange={(val) => handleFilterChange("building", val)}
                options={buildingOptions}
                icon={Building}
                placeholder="All Buildings"
                searchable={true}
              />
            </div>

            {/* 3. Select Workers */}
            <div className="relative group md:col-span-1 xl:col-span-1">
              <CustomDropdown
                label="Worker"
                value={filters.worker}
                onChange={(val) => handleFilterChange("worker", val)}
                options={workerOptions}
                icon={User}
                placeholder="All Workers"
                searchable={true}
              />
            </div>

            {/* 4. Select Month */}
            <div className="relative group md:col-span-1">
              <CustomDropdown
                label="Month"
                value={filters.month}
                onChange={(val) => handleFilterChange("month", Number(val))}
                options={monthOptions}
                icon={Calendar}
                placeholder="Select Month"
              />
            </div>

            {/* 5. Select Year */}
            <div className="relative group md:col-span-1">
              <CustomDropdown
                label="Year"
                value={filters.year}
                onChange={(val) => handleFilterChange("year", Number(val))}
                options={yearOptions}
                icon={Calendar}
                placeholder="Select Year"
              />
            </div>

            {/* 6. Download Button */}
            <div className="md:col-span-1">
              <button
                onClick={handleDownload}
                disabled={downloading}
                className="w-full h-[42px] bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold rounded-xl shadow-lg hover:shadow-xl shadow-emerald-200 hover:shadow-emerald-200 transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {downloading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Download className="w-5 h-5" />
                )}
                <span>{downloading ? "Processing..." : "Download"}</span>
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
        <h3 className="text-xl font-bold text-slate-700">
          Ready to Generate Report
        </h3>
        <p className="text-slate-500 mt-2 max-w-sm">
          Select your desired parameters from the filters above and click the
          download button to generate the collection sheet Excel file.
        </p>
      </div>
    </div>
  );
};

export default CollectionSheet;
