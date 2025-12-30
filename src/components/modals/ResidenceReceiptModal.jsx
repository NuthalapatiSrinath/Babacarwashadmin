import React, { useRef, useState, useEffect } from "react";
import { X, Download, Edit2, Check, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import html2canvas from "html2canvas";
import toast from "react-hot-toast";

const ResidenceReceiptModal = ({ isOpen, onClose, data, type = "Receipt" }) => {
  const receiptRef = useRef(null);
  const [downloading, setDownloading] = useState(false);

  // State for in-place editing
  const [isEditing, setIsEditing] = useState(false);
  const [localData, setLocalData] = useState(null);

  // Initialize local data when modal opens
  useEffect(() => {
    if (data) {
      setLocalData({
        id: data.id,
        date: data.createdAt,
        carNo: data.vehicle?.registration_no || "",
        parkingNo: data.vehicle?.parking_no || "",
        building: data.building?.name || "",
        // Default text description
        billAmountDesc: `For the month of ${new Date(
          data.createdAt
        ).toLocaleDateString("en-US", { month: "long" })}`,
        amount: data.amount_paid || "0",
        receiver: data.worker?.name || "Admin",
        paymentMode: data.payment_mode || "cash",
      });
    }
  }, [data, isOpen]);

  if (!isOpen || !localData) return null;

  const handleDownload = async () => {
    if (!receiptRef.current) return;

    // Save (exit edit mode) before downloading
    if (isEditing) setIsEditing(false);

    // Wait for UI to update (remove input boxes)
    await new Promise((resolve) => setTimeout(resolve, 300));

    setDownloading(true);
    try {
      const canvas = await html2canvas(receiptRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
      });

      const image = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.href = image;
      // Dynamic Filename based on Type
      link.download = `${type}_${localData.id || "000"}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success(`${type} downloaded!`);
    } catch (error) {
      console.error(error);
      toast.error("Download failed");
    } finally {
      setDownloading(false);
    }
  };

  const handleChange = (key, value) => {
    setLocalData((prev) => ({ ...prev, [key]: value }));
  };

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
    });
  };

  // --- DYNAMIC TITLE LOGIC ---
  const getTitle = () => {
    if (type === "Invoice") return "TAX INVOICE";
    // For Receipt, distinguish Cash vs Card
    return localData.paymentMode === "card" ? "CARD RECEIPT" : "CASH RECEIPT";
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-transparent max-w-md w-full flex flex-col items-center"
        >
          {/* --- PAPER START --- */}
          <div
            ref={receiptRef}
            className="bg-white p-8 w-full shadow-2xl rounded-sm relative text-slate-800 font-sans"
            style={{ minHeight: "500px" }}
          >
            {/* Header / Logo */}
            <div className="flex flex-col items-center mb-6 text-center">
              <div className="w-20 h-20 mb-2">
                <img
                  src="/carwash.jpeg"
                  alt="Logo"
                  className="w-full h-full object-contain"
                />
              </div>
              <h1 className="text-lg font-bold uppercase">
                BABA CAR WASHING & CLEANING
              </h1>
              <p className="text-xs text-slate-500">
                PO Box 126297, Dubai - UAE
              </p>
              <p className="text-xs text-slate-500">
                Mob: 050 809 1289, Tel: 04 327 8827
              </p>
              <p className="text-xs text-slate-500 font-bold mt-1">
                TRN: 100026453900003
              </p>
            </div>

            {/* DYNAMIC TITLE */}
            <div className="text-center font-bold uppercase text-sm mb-2 tracking-widest border-2 border-slate-800 px-4 py-1 inline-block mx-auto relative left-1/2 -translate-x-1/2">
              {getTitle()}
            </div>

            <div className="border-b-2 border-dotted border-slate-400 mb-6 mt-4"></div>

            {/* Details Grid */}
            <div className="space-y-3 text-xs sm:text-sm relative">
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-700">No:</span>
                  <span className="text-red-600 font-bold text-lg">
                    {localData.id}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-700">Date:</span>
                  <span>{formatDate(localData.date)}</span>
                </div>
              </div>

              {/* Editable Fields */}
              <div className="grid grid-cols-[140px_1fr] gap-y-3 items-baseline">
                <span className="font-bold text-slate-700">Car No:</span>
                <div className="border-b border-dotted border-slate-400 pb-1">
                  {isEditing ? (
                    <input
                      value={localData.carNo}
                      onChange={(e) => handleChange("carNo", e.target.value)}
                      className="w-full bg-transparent outline-none text-slate-900 p-0 m-0 font-medium"
                    />
                  ) : (
                    <span>{localData.carNo}</span>
                  )}
                </div>

                <span className="font-bold text-slate-700">Parking No:</span>
                <div className="border-b border-dotted border-slate-400 pb-1">
                  {isEditing ? (
                    <input
                      value={localData.parkingNo}
                      onChange={(e) =>
                        handleChange("parkingNo", e.target.value)
                      }
                      className="w-full bg-transparent outline-none text-slate-900 p-0 m-0 font-medium"
                    />
                  ) : (
                    <span>{localData.parkingNo}</span>
                  )}
                </div>

                <span className="font-bold text-slate-700">
                  Office / Residence:
                </span>
                <div className="border-b border-dotted border-slate-400 pb-1">
                  {isEditing ? (
                    <input
                      value={localData.building}
                      onChange={(e) => handleChange("building", e.target.value)}
                      className="w-full bg-transparent outline-none text-slate-900 p-0 m-0 font-medium uppercase"
                    />
                  ) : (
                    <span className="uppercase">{localData.building}</span>
                  )}
                </div>

                <span className="font-bold text-slate-700">Bill Amount:</span>
                <div className="border-b border-dotted border-slate-400 pb-1">
                  {isEditing ? (
                    <input
                      value={localData.billAmountDesc}
                      onChange={(e) =>
                        handleChange("billAmountDesc", e.target.value)
                      }
                      className="w-full bg-transparent outline-none text-slate-900 p-0 m-0 font-medium"
                    />
                  ) : (
                    <span>{localData.billAmountDesc}</span>
                  )}
                </div>

                <span className="font-bold text-slate-700">VAT 5%:</span>
                <span className="border-b border-dotted border-slate-400 pb-1">
                  -
                </span>

                <span className="font-bold text-slate-700">Total AED:</span>
                <div className="border-b border-dotted border-slate-400 pb-1">
                  {isEditing ? (
                    <input
                      value={localData.amount}
                      onChange={(e) => handleChange("amount", e.target.value)}
                      className="w-full bg-transparent outline-none text-slate-900 p-0 m-0 font-bold"
                    />
                  ) : (
                    <span className="font-bold">{localData.amount}</span>
                  )}
                </div>

                <span className="font-bold text-slate-700">Receiver:</span>
                <div className="border-b border-dotted border-slate-400 pb-1">
                  {isEditing ? (
                    <input
                      value={localData.receiver}
                      onChange={(e) => handleChange("receiver", e.target.value)}
                      className="w-full bg-transparent outline-none text-slate-900 p-0 m-0 font-medium uppercase"
                    />
                  ) : (
                    <span className="uppercase">{localData.receiver}</span>
                  )}
                </div>
              </div>
            </div>
          </div>
          {/* --- PAPER END --- */}

          {/* Buttons */}
          <div className="flex gap-3 mt-6">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-white text-slate-700 font-bold rounded-lg shadow hover:bg-slate-50 transition-colors"
            >
              Close
            </button>

            <button
              onClick={() => setIsEditing(!isEditing)}
              className={`px-6 py-2 font-bold rounded-lg shadow transition-colors flex items-center gap-2 ${
                isEditing
                  ? "bg-emerald-600 text-white"
                  : "bg-blue-600 text-white"
              }`}
            >
              {isEditing ? (
                <>
                  <Check className="w-4 h-4" /> Done
                </>
              ) : (
                <>
                  <Edit2 className="w-4 h-4" /> Edit
                </>
              )}
            </button>

            <button
              onClick={handleDownload}
              disabled={downloading}
              className="px-6 py-2 bg-[#009ef7] text-white font-bold rounded-lg shadow hover:bg-[#0086d6] transition-colors flex items-center gap-2"
            >
              {downloading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              Download {type}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default ResidenceReceiptModal;
