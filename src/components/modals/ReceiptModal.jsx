import React, { useRef, useState, useEffect } from "react";
import { X, Download, Loader2, Edit2, Check, RotateCcw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import html2canvas from "html2canvas";
import toast from "react-hot-toast";

const ReceiptModal = ({ isOpen, onClose, data, onSave }) => {
  const receiptRef = useRef(null);
  const [downloading, setDownloading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editableData, setEditableData] = useState(null);

  // Initialize editable data: Check if we have saved overrides first
  useEffect(() => {
    if (data) {
      if (data._saved_receipt_state) {
        // Restore previously edited state (ensure date is a Date object)
        setEditableData({
          ...data._saved_receipt_state,
          date: new Date(data._saved_receipt_state.date),
        });
      } else {
        // Use default values from data
        setEditableData({
          id: data.id || "000000",
          date: data.createdAt ? new Date(data.createdAt) : new Date(),
          carNo: data.vehicle?.registration_no || "-",
          parkingNo: data.vehicle?.parking_no || "-",
          building: data.building?.name || "-",
          billAmount: `For the month of ${
            data.createdAt
              ? new Date(data.createdAt).toLocaleString("default", {
                  month: "long",
                })
              : "Current Month"
          }`,
          vat: "-",
          total: `${data.amount_paid || 0} د.إ`,
          receiver: "",
        });
      }
    }
  }, [data, isOpen]);

  if (!isOpen || !editableData) return null;

  // --- SAVE HANDLER ---
  const saveChanges = () => {
    if (onSave && data) {
      onSave({
        ...data,
        _saved_receipt_state: editableData, // Store edits in a special property
      });
    }
  };

  const handleDownload = async () => {
    if (!receiptRef.current) return;

    // Auto-save edit mode before download
    if (isEditing) {
      setIsEditing(false);
      saveChanges(); // Save before downloading
    }

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
      link.download = `Receipt_${editableData.id}.png`;
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

  const handleDoneEditing = () => {
    setIsEditing(false);
    saveChanges(); // Persist changes to parent
    toast.success("Changes saved locally");
  };

  const handleReset = () => {
    if (data) {
      const resetData = {
        id: data.id || "000000",
        date: data.createdAt ? new Date(data.createdAt) : new Date(),
        carNo: data.vehicle?.registration_no || "-",
        parkingNo: data.vehicle?.parking_no || "-",
        building: data.building?.name || "-",
        billAmount: `For the month of ${
          data.createdAt
            ? new Date(data.createdAt).toLocaleString("default", {
                month: "long",
              })
            : "Current Month"
        }`,
        vat: "-",
        total: `${data.amount_paid || 0} د.إ`,
        receiver: "",
      };
      setEditableData(resetData);
      if (onSave) {
        const resetOriginal = { ...data };
        delete resetOriginal._saved_receipt_state;
        onSave(resetOriginal);
      }
      toast.success("Reset to original values");
    }
  };

  const handleChange = (field, value) => {
    setEditableData((prev) => ({ ...prev, [field]: value }));
  };

  const formatDate = (dateObj) => {
    if (!dateObj) return "";
    return dateObj.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
    });
  };

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
            className="bg-white p-10 w-full shadow-2xl text-slate-900 font-sans text-sm relative transition-all"
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
              <h1 className="text-lg font-bold uppercase tracking-wide">
                BABA CAR WASHING AND CLEANING L.L.C.
              </h1>
              <p className="text-xs text-slate-500 mt-1">
                PO Box 126297, Dubai - UAE
              </p>
              <p className="text-xs text-slate-500">Mob: 055 241 1075</p>
              <p className="text-xs text-slate-500 font-bold mt-1">
                TRN: 105021812000003
              </p>
            </div>

            <div className="text-center font-bold uppercase text-base mb-4 tracking-wider text-slate-700">
              CASH RECEIPT
            </div>

            <div className="border-t-2 border-dashed border-gray-300 mb-4"></div>

            {/* Metadata Row: No & Date */}
            <div className="flex justify-between items-center mb-6 font-bold text-sm">
              <div className="flex items-center">
                <span className="text-slate-800 mr-2">No:</span>
                <span className="text-[#ef4444] text-lg">
                  {editableData.id}
                </span>
              </div>

              {/* UPDATED: Date Field is now Editable */}
              <div className="flex items-center">
                <span className="text-slate-800 mr-2">Date:</span>
                {isEditing ? (
                  <input
                    type="date"
                    value={
                      editableData.date
                        ? editableData.date.toISOString().split("T")[0]
                        : ""
                    }
                    onChange={(e) =>
                      handleChange("date", new Date(e.target.value))
                    }
                    className="bg-transparent border-b border-indigo-300 outline-none text-indigo-600 font-bold text-right w-32 cursor-pointer"
                  />
                ) : (
                  <span>{formatDate(editableData.date)}</span>
                )}
              </div>
            </div>

            {/* Editable Fields Section */}
            <div className="space-y-4 text-sm font-medium">
              {/* Car No */}
              <div className="flex items-end">
                <span className="font-bold w-24 whitespace-nowrap">
                  Car No:
                </span>
                <div className="flex-1 border-b-2 border-dotted border-gray-400 pb-1 relative top-1.5">
                  {isEditing ? (
                    <input
                      type="text"
                      value={editableData.carNo}
                      onChange={(e) => handleChange("carNo", e.target.value)}
                      className="w-full text-center bg-transparent outline-none border-none p-0 focus:ring-0 text-indigo-600 font-bold"
                    />
                  ) : (
                    <div className="text-center">{editableData.carNo}</div>
                  )}
                </div>
              </div>

              {/* Parking No */}
              <div className="flex items-end">
                <span className="font-bold w-24 whitespace-nowrap">
                  Parking No:
                </span>
                <div className="flex-1 border-b-2 border-dotted border-gray-400 pb-1 relative top-1.5">
                  {isEditing ? (
                    <input
                      type="text"
                      value={editableData.parkingNo}
                      onChange={(e) =>
                        handleChange("parkingNo", e.target.value)
                      }
                      className="w-full text-center bg-transparent outline-none border-none p-0 focus:ring-0 text-indigo-600 font-bold"
                    />
                  ) : (
                    <div className="text-center">{editableData.parkingNo}</div>
                  )}
                </div>
              </div>

              {/* Building */}
              <div className="flex items-end">
                <span className="font-bold whitespace-nowrap mr-2">
                  Office / Residence Building:
                </span>
                <div className="flex-1 border-b-2 border-dotted border-gray-400 pb-1 relative top-1.5">
                  {isEditing ? (
                    <input
                      type="text"
                      value={editableData.building}
                      onChange={(e) => handleChange("building", e.target.value)}
                      className="w-full text-center bg-transparent outline-none border-none p-0 focus:ring-0 text-indigo-600 font-bold uppercase"
                    />
                  ) : (
                    <div className="text-center uppercase truncate">
                      {editableData.building}
                    </div>
                  )}
                </div>
              </div>

              {/* Bill Amount */}
              <div className="flex items-end">
                <span className="font-bold w-24 whitespace-nowrap">
                  Bill Amount:
                </span>
                <div className="flex-1 border-b-2 border-dotted border-gray-400 pb-1 relative top-1.5">
                  {isEditing ? (
                    <input
                      type="text"
                      value={editableData.billAmount}
                      onChange={(e) =>
                        handleChange("billAmount", e.target.value)
                      }
                      className="w-full text-center bg-transparent outline-none border-none p-0 focus:ring-0 text-indigo-600 font-bold"
                    />
                  ) : (
                    <div className="text-center">{editableData.billAmount}</div>
                  )}
                </div>
              </div>

              {/* VAT */}
              <div className="flex items-end">
                <span className="font-bold w-24 whitespace-nowrap">
                  VAT 5%:
                </span>
                <div className="flex-1 border-b-2 border-dotted border-gray-400 pb-1 relative top-1.5">
                  {isEditing ? (
                    <input
                      type="text"
                      value={editableData.vat}
                      onChange={(e) => handleChange("vat", e.target.value)}
                      className="w-full text-center bg-transparent outline-none border-none p-0 focus:ring-0 text-indigo-600 font-bold"
                    />
                  ) : (
                    <div className="text-center">{editableData.vat}</div>
                  )}
                </div>
              </div>

              {/* Total AED */}
              <div className="flex items-end">
                <span className="font-bold w-24 whitespace-nowrap">
                  Total AED:
                </span>
                <div className="flex-1 border-b-2 border-dotted border-gray-400 pb-1 relative top-1.5 font-bold">
                  {isEditing ? (
                    <input
                      type="text"
                      value={editableData.total}
                      onChange={(e) => handleChange("total", e.target.value)}
                      className="w-full text-center bg-transparent outline-none border-none p-0 focus:ring-0 text-indigo-600 font-bold"
                    />
                  ) : (
                    <div className="text-center">{editableData.total}</div>
                  )}
                </div>
              </div>

              {/* Receiver */}
              <div className="flex items-end pt-4">
                <span className="font-bold w-24 whitespace-nowrap">
                  Receiver:
                </span>
                <div className="flex-1 border-b-2 border-dotted border-gray-400 pb-1 relative top-1.5">
                  {isEditing ? (
                    <input
                      type="text"
                      value={editableData.receiver}
                      onChange={(e) => handleChange("receiver", e.target.value)}
                      className="w-full text-center bg-transparent outline-none border-none p-0 focus:ring-0 text-indigo-600 font-bold placeholder-indigo-300"
                      placeholder="Enter receiver name..."
                    />
                  ) : (
                    <div className="text-center">
                      {editableData.receiver || ""}
                    </div>
                  )}
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

            {/* Reset Button (Only visible in edit mode) */}
            {isEditing && (
              <button
                onClick={handleReset}
                className="px-4 py-2 bg-slate-100 text-slate-600 font-bold rounded-lg shadow hover:bg-slate-200 transition-colors"
                title="Reset Changes"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            )}

            {/* Edit/Save Button */}
            <button
              onClick={isEditing ? handleDoneEditing : () => setIsEditing(true)}
              className={`px-6 py-2 font-bold rounded-lg shadow transition-colors flex items-center gap-2 ${
                isEditing
                  ? "bg-emerald-600 text-white hover:bg-emerald-700"
                  : "bg-blue-600 text-white hover:bg-blue-700"
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
              className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg shadow-lg transition-colors flex items-center gap-2"
            >
              {downloading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              Download
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default ReceiptModal;
