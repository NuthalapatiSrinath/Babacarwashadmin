import React, { useState, useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  FileText,
  Filter,
  Layers,
  Building,
  User,
  Loader2,
  Calendar,
  Clock,
  Search, // Ensure Search icon is imported
} from "lucide-react";
import toast from "react-hot-toast";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// Redux & API
import { fetchBuildings } from "../../redux/slices/buildingSlice";
import { fetchWorkers } from "../../redux/slices/workerSlice";
import { paymentService } from "../../api/paymentService";

// Components
import DataTable from "../../components/DataTable";
import CustomDropdown from "../../components/ui/CustomDropdown";
import RichDateRangePicker from "../../components/inputs/RichDateRangePicker";

const PendingPayments = () => {
  const dispatch = useDispatch();

  // Redux Data
  const { buildings } = useSelector((state) => state.building);
  const { workers } = useSelector((state) => state.worker);

  // State
  const [loading, setLoading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [data, setData] = useState([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 1,
  });

  // --- FILTER MODES ---
  const [filterMode, setFilterMode] = useState("month"); // 'date_range' | 'month'

  const today = new Date();
  const [filters, setFilters] = useState({
    serviceType: "residence",
    building: "all",
    worker: "all",
    status: "pending", // Force Pending Status

    // Date Range Defaults
    startDate: new Date(today.getFullYear(), today.getMonth(), 1).toISOString(),
    endDate: new Date(
      today.getFullYear(),
      today.getMonth() + 1,
      0,
    ).toISOString(),

    // Month Mode Defaults
    month: today.getMonth() + 1,
    year: today.getFullYear(),
  });

  // Load Dropdowns
  useEffect(() => {
    dispatch(fetchBuildings({ page: 1, limit: 1000 }));
    dispatch(fetchWorkers({ page: 1, limit: 1000, status: 1 }));
  }, [dispatch]);

  // Fetch Data on Filter Change
  useEffect(() => {
    fetchData(1, pagination.limit);
    // eslint-disable-next-line
  }, [filters, filterMode]);

  // Search Debounce is already here, but let's make it actually filter
  // Since we want client-side instant search on the fetched data (if dataset is small enough per page)
  // OR server side. You likely want server side if pagination is server side.
  // BUT, previously we discussed fetching ALL for instant search.
  // Let's stick to the existing pattern: fetchData calls API with searchTerm.
  useEffect(() => {
    const delay = setTimeout(() => {
      fetchData(1, pagination.limit);
    }, 500);
    return () => clearTimeout(delay);
    // eslint-disable-next-line
  }, [searchTerm]);

  // Helper to calculate start/end date based on mode
  const getDateRangeParams = () => {
    let start, end;

    if (filterMode === "date_range") {
      start = filters.startDate;
      end = filters.endDate;
    } else {
      // Month Mode
      start = new Date(filters.year, filters.month - 1, 1).toISOString();
      const lastDay = new Date(filters.year, filters.month, 0);
      lastDay.setHours(23, 59, 59, 999);
      end = lastDay.toISOString();
    }
    return { startDate: start, endDate: end };
  };

  const fetchData = async (page = 1, limit = 50) => {
    setLoading(true);
    try {
      const { startDate, endDate } = getDateRangeParams();

      const query = {
        ...filters,
        startDate,
        endDate,
        // Pass search term to backend
        search: searchTerm,
        onewash: filters.serviceType === "onewash",
        worker: filters.worker === "all" ? "" : filters.worker,
        building: filters.building === "all" ? "" : filters.building,
        status: "pending",
      };

      const response = await paymentService.list(
        page,
        limit,
        searchTerm, // Ensure searchTerm is passed here as well if service expects it
        query,
      );

      // Flatten data for display if needed, but DataTable handles accessors usually.
      // If we need custom search fields on frontend we can map them here.
      // For now, raw data is fine as columns access nested props.
      setData(response.data || []);
      setTotalRecords(response.total || 0);
      setPagination({
        page,
        limit,
        total: response.total || 0,
        totalPages: Math.ceil((response.total || 0) / limit) || 1,
      });
    } catch (error) {
      console.error("Fetch Error:", error);
      toast.error("Failed to load pending payments");
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
  };

  const handleDateRangeChange = (field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
  };

  // --- IMAGE LOADER FOR PDF ---
  const loadImage = (url) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.src = url;
      img.onload = () => resolve(img);
      img.onerror = (err) => reject(err);
    });
  };

  // --- RICH PDF GENERATION ---
  const handleDownloadPDF = async () => {
    setPdfLoading(true);
    const toastId = toast.loading("Generating PDF Report...");

    try {
      const { startDate, endDate } = getDateRangeParams();

      // Get grouped collection data
      const reportData = await paymentService.getCollectionData({
        ...filters,
        startDate,
        endDate,
        worker: filters.worker === "all" ? "" : filters.worker,
        building: filters.building === "all" ? "" : filters.building,
        status: "pending",
      });

      if (!reportData || !Array.isArray(reportData)) {
        toast.error("Invalid data format", { id: toastId });
        setPdfLoading(false);
        return;
      }

      // Filter: Keep only items with Total Due > Paid (Pending)
      const pendingReportData = reportData
        .map((bg) => ({
          ...bg,
          workers: bg.workers
            .map((wg) => ({
              ...wg,
              payments: wg.payments.filter(
                (p) => Number(p.totalDue) - Number(p.paid) > 0,
              ),
            }))
            .filter((wg) => wg.payments.length > 0),
        }))
        .filter((bg) => bg.workers.length > 0);

      if (pendingReportData.length === 0) {
        toast.error("No pending payments found", { id: toastId });
        setPdfLoading(false);
        return;
      }

      const doc = new jsPDF();

      // Add Logo
      try {
        const logoImg = await loadImage("/carwash.jpeg");
        doc.addImage(logoImg, "JPEG", 92.5, 10, 25, 25); // Centered Logo (A4 width 210)
      } catch (e) {
        console.warn("Logo failed", e);
      }

      // Title Section
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.text("BABA CAR WASHING AND CLEANING LLC", 105, 40, {
        align: "center",
      });

      doc.setFontSize(12);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(220, 38, 38); // Red
      doc.text("PENDING PAYMENTS / DUE LIST", 105, 48, { align: "center" });
      doc.setTextColor(0); // Reset

      let dateText = "";
      if (filterMode === "month") {
        const mName = new Date(filters.year, filters.month - 1).toLocaleString(
          "default",
          { month: "long" },
        );
        dateText = `Period: ${mName} ${filters.year}`;
      } else {
        dateText = `${new Date(startDate).toLocaleDateString()} - ${new Date(endDate).toLocaleDateString()}`;
      }
      doc.setFontSize(10);
      doc.text(dateText, 105, 54, { align: "center" });

      let currentY = 60;

      // Render Tables by Building -> Worker
      pendingReportData.forEach((buildingGroup, bIndex) => {
        // Page break logic
        if (bIndex > 0 || currentY > 250) {
          doc.addPage();
          currentY = 20;
        }

        buildingGroup.workers.forEach((workerGroup) => {
          if (currentY > 240) {
            doc.addPage();
            currentY = 20;
          }

          // Group Header
          doc.setFontSize(10);
          doc.setFont("helvetica", "bold");
          doc.setFillColor(245, 245, 245);
          doc.rect(14, currentY - 5, 182, 7, "F");
          doc.text(
            `${workerGroup.workerName}  |  ${buildingGroup.buildingName}`,
            16,
            currentY,
          );

          currentY += 4;

          const tableHead = [
            ["Sl No", "Parking", "Reg No", "Building", "Amount", "Due Date"],
          ];

          const tableBody = workerGroup.payments.map((p, i) => {
            // Calculate Amount Pending
            const amount = (Number(p.totalDue) - Number(p.paid)).toFixed(2);

            // Format Date
            let dateStr = p.dueDate || "-";

            return [
              i + 1,
              p.parkingNo,
              p.regNo,
              buildingGroup.buildingName,
              amount,
              dateStr,
            ];
          });

          autoTable(doc, {
            startY: currentY,
            head: tableHead,
            body: tableBody,
            theme: "grid",
            headStyles: {
              fillColor: [50, 50, 50],
              fontSize: 9,
              halign: "center",
            },
            bodyStyles: { fontSize: 9, cellPadding: 2, halign: "center" },
            columnStyles: {
              0: { cellWidth: 15 },
              1: { cellWidth: 25 },
              2: { cellWidth: 35 },
              3: { cellWidth: "auto" }, // Building auto
              4: { cellWidth: 25, fontStyle: "bold", halign: "right" },
              5: { cellWidth: 30 },
            },
            margin: { left: 14, right: 14 },
          });

          currentY = doc.lastAutoTable.finalY + 10;
        });
      });

      doc.save(`Pending_List_${filterMode}_${filters.year}.pdf`);
      toast.success("PDF Downloaded", { id: toastId, duration: 4000 });
    } catch (error) {
      console.error(error);
      toast.error("PDF generation failed", { id: toastId });
    } finally {
      setPdfLoading(false);
    }
  };

  // --- OPTIONS ---
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

  const yearOptions = [2024, 2025, 2026, 2027].map((y) => ({
    value: y,
    label: String(y),
  }));

  const buildingOptions = useMemo(() => {
    const opts = [{ value: "all", label: "All Buildings" }];
    if (buildings)
      buildings.forEach((b) => opts.push({ value: b._id, label: b.name }));
    return opts;
  }, [buildings]);

  const workerOptions = useMemo(() => {
    const opts = [{ value: "all", label: "All Workers" }];
    if (workers)
      workers.forEach((w) => opts.push({ value: w._id, label: w.name }));
    return opts;
  }, [workers]);

  // --- TABLE COLUMNS (Matches Requested Image) ---
  const columns = [
    {
      header: "SL NO",
      accessor: "id",
      className: "w-16 text-center text-xs font-bold text-slate-500",
      render: (_, idx) => (pagination.page - 1) * pagination.limit + idx + 1,
    },
    {
      header: "PARKING",
      accessor: "vehicle.parking_no",
      className: "text-xs font-bold text-slate-600",
      render: (r) => r.vehicle?.parking_no || "-",
    },
    {
      header: "REG NO",
      accessor: "vehicle.registration_no",
      className: "text-xs font-mono font-bold text-slate-700",
      render: (r) => r.vehicle?.registration_no || "-",
    },
    {
      header: "BUILDING",
      accessor: "building.name",
      className: "text-xs font-medium text-slate-600",
      render: (r) => r.building?.name || r.customer?.building?.name || "-",
    },
    {
      header: "AMOUNT",
      accessor: "balance",
      className: "text-right text-xs font-bold text-red-600",
      render: (r) => (r.total_amount - r.amount_paid).toFixed(2),
    },
    {
      header: "DUE DATE",
      accessor: "createdAt",
      className: "text-right text-xs text-slate-500",
      render: (r) => {
        const d = new Date(r.createdAt);
        // Example: Due Date is end of next month
        const dueDate = new Date(d.getFullYear(), d.getMonth() + 1, 0);
        return dueDate.toLocaleDateString("en-GB", {
          day: "numeric",
          month: "short",
          year: "numeric",
        });
      },
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 p-6 font-sans">
      {/* --- FILTER PANEL --- */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 mb-6">
        {/* Row 1: Title & Mode Toggle */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-5 gap-4">
          <div className="flex items-center gap-2 text-slate-500 font-bold uppercase text-xs tracking-wider">
            <Filter className="w-4 h-4" /> Filter Pending Payments
          </div>

          <div className="flex bg-slate-100 p-1 rounded-lg">
            <button
              onClick={() => setFilterMode("date_range")}
              className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${
                filterMode === "date_range"
                  ? "bg-white text-indigo-600 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              Date Range Wise
            </button>
            <button
              onClick={() => setFilterMode("month")}
              className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${
                filterMode === "month"
                  ? "bg-white text-indigo-600 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              Month Wise
            </button>
          </div>
        </div>

        {/* Row 2: Inputs & Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4 items-end">
          {/* Dynamic Filter Input */}
          <div className="lg:col-span-2">
            {filterMode === "date_range" ? (
              <div className="w-full">
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1 ml-1">
                  Select Dates
                </label>
                <RichDateRangePicker
                  startDate={filters.startDate}
                  endDate={filters.endDate}
                  onChange={handleDateRangeChange}
                />
              </div>
            ) : (
              <div className="flex gap-3">
                <div className="flex-1">
                  <CustomDropdown
                    label="Select Month"
                    value={filters.month}
                    onChange={(v) => handleFilterChange("month", Number(v))}
                    options={monthOptions}
                    icon={Calendar}
                  />
                </div>
                <div className="w-32">
                  <CustomDropdown
                    label="Select Year"
                    value={filters.year}
                    onChange={(v) => handleFilterChange("year", Number(v))}
                    options={yearOptions}
                    icon={Calendar}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Common Dropdowns */}
          <div className="xl:col-span-1">
            <CustomDropdown
              label="Building"
              value={filters.building}
              onChange={(v) => handleFilterChange("building", v)}
              options={buildingOptions}
              icon={Building}
              searchable
            />
          </div>
          <div className="xl:col-span-1">
            <CustomDropdown
              label="Worker"
              value={filters.worker}
              onChange={(v) => handleFilterChange("worker", v)}
              options={workerOptions}
              icon={User}
              searchable
            />
          </div>

          {/* Action Buttons */}
          <div className="xl:col-span-2 flex gap-2">
            <button
              onClick={handleDownloadPDF}
              disabled={pdfLoading}
              className="flex-1 h-[42px] bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white font-bold rounded-xl shadow-lg hover:shadow-red-200 transition-all flex items-center justify-center gap-2 disabled:opacity-70 text-xs"
            >
              {pdfLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <FileText className="w-4 h-4" />
              )}
              Export PDF
            </button>
          </div>
        </div>
      </div>

      {/* --- TABLE (Cleaned Up) --- */}
      <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden flex flex-col">
        <DataTable
          columns={columns}
          data={data}
          loading={loading}
          pagination={pagination}
          onPageChange={(p) => fetchData(p, pagination.limit)}
          onLimitChange={(l) => fetchData(1, l)}
          // ✅ Hooking up the DataTable internal search
          onSearch={(term) => setSearchTerm(term)}
        />
      </div>
    </div>
  );
};

export default PendingPayments;
