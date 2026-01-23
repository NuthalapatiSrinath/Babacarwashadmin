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
  Download,
  FileText,
} from "lucide-react";
import toast from "react-hot-toast";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// Redux
import { fetchBuildings } from "../../redux/slices/buildingSlice";
import { fetchWorkers } from "../../redux/slices/workerSlice";
import { downloadCollectionSheet } from "../../redux/slices/collectionSheetSlice";

// Custom Components
import CustomDropdown from "../../components/ui/CustomDropdown";
import { paymentService } from "../../api/paymentService";

const CollectionSheet = () => {
  const dispatch = useDispatch();

  const { buildings } = useSelector((state) => state.building);
  const { workers } = useSelector((state) => state.worker);
  const { downloading } = useSelector((state) => state.collectionSheet);

  const [pdfLoading, setPdfLoading] = useState(false);

  // --- 1. DYNAMIC DATE LOGIC (COMPLETED MONTHS ONLY) ---
  const today = new Date();
  const currentMonth = today.getMonth() + 1; // 1-12
  const currentYear = today.getFullYear();

  // If currently Jan (1), previous completed month is Dec (12) of prev year
  // If currently Feb (2), previous completed month is Jan (1) of current year
  const initialYear = currentMonth === 1 ? currentYear - 1 : currentYear;
  const initialMonth = currentMonth === 1 ? 12 : currentMonth - 1;

  const [filters, setFilters] = useState({
    serviceType: "residence",
    building: "all",
    worker: "all",
    month: initialMonth,
    year: initialYear,
  });

  // Calculate available years (only up to current year)
  const yearOptions = useMemo(() => {
    const startYear = 2024;
    const years = [];
    for (let y = startYear; y <= currentYear; y++) {
      years.push({ value: y, label: y.toString() });
    }
    return years.reverse();
  }, [currentYear]);

  // Calculate available months (Strictly Completed Months)
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

    return allMonths.filter((m) => {
      // If past year, all months valid
      if (filters.year < currentYear) return true;
      // If current year, only months LESS than current month
      if (filters.year === currentYear) {
        return m.value < currentMonth;
      }
      return false;
    });
  }, [filters.year, currentMonth, currentYear]);

  // Auto-correct month selection if invalid
  useEffect(() => {
    const isValid = availableMonths.some((m) => m.value === filters.month);
    if (!isValid && availableMonths.length > 0) {
      setFilters((prev) => ({ ...prev, month: availableMonths[0].value }));
    }
  }, [availableMonths, filters.month]);

  // --- INITIAL DATA LOAD ---
  useEffect(() => {
    dispatch(fetchBuildings({ page: 1, limit: 1000 }));
    dispatch(fetchWorkers({ page: 1, limit: 1000, status: 1 }));
  }, [dispatch]);

  const handleFilterChange = (name, value) => {
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const loadImage = (url) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.src = url;
      img.onload = () => resolve(img);
      img.onerror = (err) => reject(err);
    });
  };

  // --- DOWNLOAD HANDLERS ---
  const handleDownloadExcel = async () => {
    const toastId = toast.loading("Generating Excel Sheet...");
    try {
      const result = await dispatch(downloadCollectionSheet(filters)).unwrap();
      const blob = result.blob;
      if (blob.size < 100) {
        toast.error("File appears empty.", { id: toastId });
        return;
      }
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement("a");
      link.href = url;
      link.download = `Collection_${filters.serviceType}_${filters.month}_${filters.year}.xlsx`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success("Excel Download successful!", { id: toastId });
    } catch (error) {
      console.error("Download Error:", error);
      toast.error("Failed to download sheet.", { id: toastId });
    }
  };

  const handleDownloadPDF = async () => {
    setPdfLoading(true);
    const toastId = toast.loading("Fetching data for PDF...");

    try {
      const data = await paymentService.getCollectionData(filters);

      if (!data || !Array.isArray(data)) {
        toast.error("Invalid data format received.", { id: toastId });
        setPdfLoading(false);
        return;
      }

      if (data.length === 0) {
        toast.error("No records found for this period", { id: toastId });
        setPdfLoading(false);
        return;
      }

      const doc = new jsPDF("landscape");

      try {
        const logoImg = await loadImage("/carwash.jpeg");
        const imgWidth = 25;
        const imgHeight = 25;
        const xPos = (297 - imgWidth) / 2;
        doc.addImage(logoImg, "JPEG", xPos, 10, imgWidth, imgHeight);
      } catch (e) {
        console.warn("Logo load failed", e);
      }

      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.text("BABA CAR WASHING AND CLEANING LLC", 148.5, 42, {
        align: "center",
      });

      doc.setFontSize(12);
      doc.setFont("helvetica", "normal");
      doc.text("MONTHLY COLLECTION SHEET", 148.5, 50, { align: "center" });

      const monthName = availableMonths.find(
        (m) => m.value === filters.month,
      )?.label;
      doc.setFontSize(10);
      doc.text(`Period: ${monthName} ${filters.year}`, 148.5, 56, {
        align: "center",
      });

      let currentY = 65;

      data.forEach((buildingGroup, bIndex) => {
        if (bIndex > 0 || currentY > 180) {
          doc.addPage();
          currentY = 20;
        }

        buildingGroup.workers.forEach((workerGroup) => {
          if (currentY > 170) {
            doc.addPage();
            currentY = 20;
          }

          doc.setFontSize(11);
          doc.setFont("helvetica", "bold");
          doc.setTextColor(40);
          doc.text(
            `${workerGroup.workerName}  |  ${buildingGroup.buildingName}`,
            14,
            currentY,
          );

          currentY += 5;

          const tableHead = [
            [
              "Sl",
              "Parking",
              "Reg No",
              "Mobile",
              "Flat",
              "Start",
              "Sch",
              "Adv",
              "Curr",
              "Last",
              "Total",
              "Paid",
              "Due Date",
            ],
          ];

          const tableBody = workerGroup.payments.map((p, i) => [
            i + 1,
            p.parkingNo,
            p.regNo,
            p.mobile,
            p.flatNo,
            p.startDate,
            p.schedule,
            p.advance,
            p.currentMonth,
            p.lastMonth,
            (p.totalDue - p.paid).toFixed(2),
            p.paid,
            p.dueDate,
          ]);

          autoTable(doc, {
            startY: currentY,
            head: tableHead,
            body: tableBody,
            theme: "grid",
            headStyles: {
              fillColor: [30, 75, 133],
              fontSize: 8,
              halign: "center",
            },
            bodyStyles: { fontSize: 8, cellPadding: 1.5, halign: "center" },
            columnStyles: {
              0: { cellWidth: 8 },
              3: { cellWidth: 22 },
              12: { cellWidth: 20 },
            },
            margin: { left: 10, right: 10 },
          });

          currentY = doc.lastAutoTable.finalY + 15;
        });
      });

      doc.save(`Collection_Sheet_${monthName}_${filters.year}.pdf`);
      toast.success("PDF Generated!", { id: toastId });
    } catch (error) {
      console.error(error);
      toast.error("Failed to generate PDF", { id: toastId });
    } finally {
      setPdfLoading(false);
    }
  };

  const buildingList = useMemo(() => {
    const options = [{ value: "all", label: "All Buildings" }];
    if (buildings) {
      buildings.forEach((b) => {
        options.push({ value: b._id, label: b.name });
      });
    }
    return options;
  }, [buildings]);

  const workerList = useMemo(() => {
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
      <div className="max-w-7xl mx-auto bg-white rounded-2xl shadow-xl border border-slate-100 relative">
        <div className="h-1.5 w-full bg-gradient-to-r from-emerald-400 via-teal-500 to-cyan-500 rounded-t-2xl"></div>

        <div className="p-6 md:p-8">
          <div className="flex items-center gap-2 mb-6 text-slate-400 text-xs font-bold uppercase tracking-wider">
            <Filter className="w-4 h-4" /> Report Parameters
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 items-end">
            <div className="relative group md:col-span-1">
              <CustomDropdown
                label="Service Type"
                value={filters.serviceType}
                onChange={(val) => handleFilterChange("serviceType", val)}
                options={[
                  { value: "residence", label: "Residence", icon: Layers },
                  { value: "onewash", label: "One Wash", icon: Filter },
                ]}
                icon={Layers}
                placeholder="Select Service"
              />
            </div>

            <div className="relative group md:col-span-1 xl:col-span-1">
              <CustomDropdown
                label="Building"
                value={filters.building}
                onChange={(val) => handleFilterChange("building", val)}
                options={buildingList}
                icon={Building}
                placeholder="All Buildings"
                searchable={true}
              />
            </div>

            <div className="relative group md:col-span-1 xl:col-span-1">
              <CustomDropdown
                label="Worker"
                value={filters.worker}
                onChange={(val) => handleFilterChange("worker", val)}
                options={workerList}
                icon={User}
                placeholder="All Workers"
                searchable={true}
              />
            </div>

            <div className="relative group md:col-span-1">
              <CustomDropdown
                label="Month"
                value={filters.month}
                onChange={(val) => handleFilterChange("month", Number(val))}
                options={availableMonths}
                icon={Calendar}
                placeholder={
                  availableMonths.length === 0 ? "No Data" : "Select Month"
                }
                disabled={availableMonths.length === 0}
              />
            </div>

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

            <div className="md:col-span-1 flex gap-2">
              <button
                onClick={handleDownloadExcel}
                disabled={downloading || availableMonths.length === 0}
                className="flex-1 h-[42px] bg-white border border-emerald-200 text-emerald-700 font-bold rounded-xl hover:bg-emerald-50 transition-all flex items-center justify-center gap-2 disabled:opacity-70 text-xs"
              >
                {downloading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <FileSpreadsheet className="w-4 h-4" />
                )}
                Excel
              </button>

              <button
                onClick={handleDownloadPDF}
                disabled={pdfLoading || availableMonths.length === 0}
                className="flex-1 h-[42px] bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold rounded-xl shadow-lg hover:shadow-xl shadow-emerald-200 transition-all flex items-center justify-center gap-2 disabled:opacity-70 text-xs"
              >
                {pdfLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <FileText className="w-4 h-4" />
                )}
                PDF
              </button>
            </div>
          </div>
        </div>
      </div>

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
          download button to generate the collection sheet.
        </p>
      </div>
    </div>
  );
};

export default CollectionSheet;
