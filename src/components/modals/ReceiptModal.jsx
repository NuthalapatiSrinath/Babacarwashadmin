import React, { useRef, useState } from "react";
import { X, Download, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import html2canvas from "html2canvas";
import toast from "react-hot-toast";

const ReceiptModal = ({ isOpen, onClose, data }) => {
  const receiptRef = useRef(null);
  const [downloading, setDownloading] = useState(false);

  if (!isOpen || !data) return null;

  const handleDownload = async () => {
    if (!receiptRef.current) return;
    setDownloading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
      const canvas = await html2canvas(receiptRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
      });
      const image = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.href = image;
      link.download = `Receipt_${data.id || "000"}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("Receipt downloaded successfully");
    } catch (error) {
      console.error(error);
      toast.error("Download failed");
    } finally {
      setDownloading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
    });
  };

  const amount = data.amount_paid || 0;
  const dateStr = formatDate(data.createdAt);

  const monthName = data.createdAt
    ? new Date(data.createdAt).toLocaleString("default", { month: "long" })
    : "Current Month";

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-transparent w-full max-w-xl flex flex-col items-center"
        >
          {/* --- RECEIPT PAPER START --- */}
          <div
            ref={receiptRef}
            className="bg-white p-10 w-full shadow-2xl text-slate-900 font-sans text-sm relative"
            style={{ minHeight: "600px" }}
          >
            {/* Header */}
            <div className="flex flex-col items-center mb-4 text-center">
              <div className="w-16 h-16 mb-2 rounded-full overflow-hidden">
                <img
                  src="/carwash.jpeg"
                  alt="Logo"
                  className="w-full h-full object-contain"
                />
              </div>

              {/* UPDATED: Company Name */}
              <h1 className="text-lg font-bold uppercase tracking-wide">
                BABA CAR WASHING AND CLEANING L.L.C.
              </h1>

              <p className="text-xs text-slate-500 mt-1">Dubai - UAE</p>

              {/* UPDATED: Mobile Number */}
              <p className="text-xs text-slate-500">Mob: 055 241 1075</p>

              {/* UPDATED: TRN Number */}
              <p className="text-xs text-slate-500 font-bold mt-1">
                TRN: 105021812000003
              </p>
            </div>

            {/* Title */}
            <div className="text-center font-bold uppercase text-base mb-4 tracking-wider text-slate-700">
              CASH RECEIPT
            </div>

            {/* Separator - Dotted Line */}
            <div className="border-t-2 border-dashed border-gray-300 mb-4"></div>

            {/* Metadata Row: Red No & Date */}
            <div className="flex justify-between items-center mb-6 font-bold text-sm">
              <div className="flex items-center">
                <span className="text-slate-800 mr-2">No:</span>
                <span className="text-[#ef4444] text-lg">
                  {data.id || "000000"}
                </span>
              </div>
              <div>
                <span className="text-slate-800 mr-2">Date:</span>
                <span>{dateStr}</span>
              </div>
            </div>

            {/* Fields with Dotted Lines */}
            <div className="space-y-4 text-sm font-medium">
              {/* Car No */}
              <div className="flex items-end">
                <span className="font-bold w-24 whitespace-nowrap">
                  Car No:
                </span>
                <div className="flex-1 border-b-2 border-dotted border-gray-400 text-center pb-1 relative top-1.5">
                  {data.vehicle?.registration_no || "-"}
                </div>
              </div>

              {/* Parking No */}
              <div className="flex items-end">
                <span className="font-bold w-24 whitespace-nowrap">
                  Parking No:
                </span>
                <div className="flex-1 border-b-2 border-dotted border-gray-400 text-center pb-1 relative top-1.5">
                  {data.vehicle?.parking_no || "-"}
                </div>
              </div>

              {/* Building */}
              <div className="flex items-end">
                <span className="font-bold whitespace-nowrap mr-2">
                  Office / Residence Building:
                </span>
                <div className="flex-1 border-b-2 border-dotted border-gray-400 text-center pb-1 relative top-1.5 uppercase truncate">
                  {data.building?.name || "-"}
                </div>
              </div>

              {/* Bill Amount */}
              <div className="flex items-end">
                <span className="font-bold w-24 whitespace-nowrap">
                  Bill Amount:
                </span>
                <div className="flex-1 border-b-2 border-dotted border-gray-400 text-center pb-1 relative top-1.5">
                  For the month of {monthName}
                </div>
              </div>

              {/* VAT */}
              <div className="flex items-end">
                <span className="font-bold w-24 whitespace-nowrap">
                  VAT 5%:
                </span>
                <div className="flex-1 border-b-2 border-dotted border-gray-400 text-center pb-1 relative top-1.5">
                  -
                </div>
              </div>

              {/* Total AED */}
              <div className="flex items-end">
                <span className="font-bold w-24 whitespace-nowrap">
                  Total AED:
                </span>
                <div className="flex-1 border-b-2 border-dotted border-gray-400 text-center pb-1 relative top-1.5 font-bold">
                  {amount} د.إ
                </div>
              </div>

              {/* Receiver */}
              <div className="flex items-end pt-4">
                <span className="font-bold w-24 whitespace-nowrap">
                  Receiver:
                </span>
                <div className="flex-1 border-b-2 border-dotted border-gray-400 text-center pb-1 relative top-1.5">
                  {/* Intentionally Empty */}
                </div>
              </div>
            </div>
          </div>
          {/* --- RECEIPT PAPER END --- */}

          {/* Buttons */}
          <div className="flex gap-3 mt-6">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-white text-slate-700 font-bold rounded-lg shadow hover:bg-slate-50 transition-colors"
            >
              Close
            </button>
            <button
              onClick={handleDownload}
              disabled={downloading}
              className="px-6 py-2 bg-indigo-600 text-white font-bold rounded-lg shadow hover:bg-indigo-700 transition-colors flex items-center gap-2"
            >
              {downloading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              Download Receipt
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default ReceiptModal;
