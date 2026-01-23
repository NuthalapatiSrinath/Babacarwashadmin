import React, { useState, useMemo, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Download,
  Loader2,
  FileSpreadsheet,
  Layers,
  Calendar,
  Filter,
  FileText,
} from "lucide-react";
import toast from "react-hot-toast";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { downloadWorkRecordsStatement } from "../../redux/slices/workRecordsSlice";
import { workRecordsService } from "../../api/workRecordsService";
import CustomDropdown from "../../components/ui/CustomDropdown";

const WorkRecords = () => {
  const dispatch = useDispatch();
  const { downloading } = useSelector((state) => state.workRecords);
  const [pdfLoading, setPdfLoading] = useState(false);

  const today = new Date();
  const currentMonth = today.getMonth() + 1;
  const currentYear = today.getFullYear();
  const maxValidYear = currentMonth === 1 ? currentYear - 1 : currentYear;
  const initialYear = maxValidYear;
  const initialMonth = maxValidYear < currentYear ? 12 : currentMonth - 1;

  const [filters, setFilters] = useState({
    serviceType: "residence",
    month: initialMonth,
    year: initialYear,
  });

  const serviceTypeOptions = [
    { value: "residence", label: "Residence", icon: Layers },
    { value: "onewash", label: "Onewash", icon: Filter },
  ];

  const yearOptions = useMemo(() => {
    const startYear = 2024;
    const years = [];
    for (let y = startYear; y <= maxValidYear; y++) {
      years.push({ value: y, label: y.toString() });
    }
    return years.reverse();
  }, [maxValidYear]);

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
      if (selectedYear < currentYear) return true;
      if (selectedYear === currentYear) {
        return m.value < currentMonth;
      }
      return false;
    });
  }, [filters.year, currentMonth, currentYear]);

  useEffect(() => {
    const isCurrentMonthValid = availableMonths.some(
      (m) => m.value === Number(filters.month),
    );
    if (!isCurrentMonthValid && availableMonths.length > 0) {
      setFilters((prev) => ({
        ...prev,
        month: availableMonths[availableMonths.length - 1].value,
      }));
    }
  }, [availableMonths, filters.month]);

  const loadImage = (url) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.src = url;
      img.onload = () => resolve(img);
      img.onerror = (err) => reject(err);
    });
  };

  const handleDownloadExcel = async () => {
    const toastId = toast.loading(`Generating Excel report...`);
    try {
      const result = await dispatch(
        downloadWorkRecordsStatement({
          serviceType: filters.serviceType,
          month: filters.month,
          year: filters.year,
        }),
      ).unwrap();
      const blob = result.blob;
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement("a");
      link.href = url;
      link.download = `Statement_${filters.serviceType}_${filters.year}_${filters.month}.xlsx`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success("Excel Download successful!", { id: toastId });
    } catch (error) {
      console.error("Download Error:", error);
      toast.error("Failed to download Excel.", { id: toastId });
    }
  };

  const handleDownloadPDF = async () => {
    setPdfLoading(true);
    const toastId = toast.loading("Fetching data for PDF...");

    try {
      const data = await workRecordsService.getStatementData(
        filters.year,
        filters.month,
        filters.serviceType,
      );

      if (!data || data.length === 0) {
        toast.error("No records found for this period", { id: toastId });
        setPdfLoading(false);
        return;
      }

      // ✅ Landscape Mode for Wide Table
      const doc = new jsPDF("landscape");
      const monthName = availableMonths.find(
        (m) => m.value === filters.month,
      )?.label;

      try {
        const logoImg = await loadImage("/carwash.jpeg");
        const imgWidth = 25;
        const imgHeight = 25;
        // Center on Landscape A4 (297mm width)
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
      doc.text(
        `${filters.serviceType.toUpperCase()} WORK STATEMENT`,
        148.5,
        50,
        { align: "center" },
      );

      doc.setFontSize(10);
      doc.text(`Period: ${monthName} ${filters.year}`, 148.5, 56, {
        align: "center",
      });

      // ✅ Dynamic Days Logic (1-28/30/31)
      const daysInMonth = new Date(filters.year, filters.month, 0).getDate();
      const daysHeader = Array.from({ length: daysInMonth }, (_, i) =>
        (i + 1).toString(),
      );

      // Headers: Sl, Name, [1..31], Total, (Amount for OneWash)
      const tableHead = [["Sl", "Worker Name", ...daysHeader, "Total", "Tips"]];

      // Body Mapping
      const tableBody = data.map((row, index) => {
        // row.daily is array of counts [5, 4, 0...] from backend
        // If undefined, fill with 0s
        const dailyCounts = row.daily || Array(daysInMonth).fill(0);

        return [
          index + 1,
          row.name,
          ...dailyCounts,
          row.totalCars || 0,
          (row.amount || 0).toFixed(2),
        ];
      });

      // Calculate Column Totals for Summary
      const dailyTotals = Array(daysInMonth).fill(0);
      let grandTotalCars = 0;
      let grandTotalTips = 0;

      data.forEach((row) => {
        const daily = row.daily || [];
        daily.forEach((count, i) => {
          if (i < daysInMonth) dailyTotals[i] += count;
        });
        grandTotalCars += row.totalCars || 0;
        grandTotalTips += row.amount || 0;
      });

      // Summary Row
      tableBody.push([
        {
          content: "TOTAL",
          colSpan: 2,
          styles: { halign: "center", fontStyle: "bold" },
        },
        ...dailyTotals,
        { content: grandTotalCars, styles: { fontStyle: "bold" } },
        { content: grandTotalTips.toFixed(2), styles: { fontStyle: "bold" } },
      ]);

      autoTable(doc, {
        startY: 65,
        head: tableHead,
        body: tableBody,
        theme: "grid",
        headStyles: {
          fillColor: [30, 75, 133],
          halign: "center",
          fontSize: 7, // Smaller font for header
          cellPadding: 1,
        },
        bodyStyles: {
          fontSize: 7, // Smaller font for body
          cellPadding: 1,
          halign: "center",
        },
        columnStyles: {
          0: { cellWidth: 8 }, // Sl
          1: { halign: "left", cellWidth: 35 }, // Name (Wider)
          // Days auto-size
          [daysInMonth + 2]: { fontStyle: "bold", cellWidth: 12 }, // Total Column
          [daysInMonth + 3]: { fontStyle: "bold", cellWidth: 15 }, // Tips Column
        },
      });

      doc.save(
        `Monthly_Statement_${filters.serviceType}_${monthName}_${filters.year}.pdf`,
      );
      toast.success("PDF Generated!", { id: toastId });
    } catch (error) {
      console.error(error);
      toast.error("Failed to generate PDF", { id: toastId });
    } finally {
      setPdfLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6 font-sans">
      <div className="max-w-7xl mx-auto bg-white rounded-2xl shadow-xl border border-slate-100 relative">
        <div className="h-1.5 w-full bg-gradient-to-r from-indigo-400 via-blue-500 to-cyan-500 rounded-t-2xl"></div>
        <div className="p-6 md:p-8">
          <div className="flex items-center gap-2 mb-6 text-slate-400 text-xs font-bold uppercase tracking-wider">
            <Filter className="w-4 h-4" /> Statement Parameters
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-end">
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
            <div className="flex gap-2">
              <button
                onClick={handleDownloadExcel}
                disabled={downloading || availableMonths.length === 0}
                className="flex-1 h-[42px] bg-white border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 hover:text-slate-900 transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed text-xs shadow-sm"
              >
                {downloading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <FileSpreadsheet className="w-4 h-4" />
                )}{" "}
                Excel
              </button>
              <button
                onClick={handleDownloadPDF}
                disabled={pdfLoading || availableMonths.length === 0}
                className="flex-1 h-[42px] bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white font-bold rounded-xl shadow-lg hover:shadow-xl shadow-red-200 hover:shadow-red-200 transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed text-xs"
              >
                {pdfLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <FileText className="w-4 h-4" />
                )}{" "}
                Export pdf
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
        <h3 className="text-xl font-bold text-slate-700">Ready to Export</h3>
        <p className="text-slate-500 mt-2 max-w-sm">
          Select the service type, month, and year to generate standard Excel or
          formatted PDF reports.
        </p>
      </div>
    </div>
  );
};

export default WorkRecords;
