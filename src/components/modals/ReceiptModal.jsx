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
      // Wait for image to load
      await new Promise((resolve) => setTimeout(resolve, 500));

      const canvas = await html2canvas(receiptRef.current, {
        scale: 2, // High resolution
        useCORS: true, // Allow loading local/external images
        backgroundColor: "#ffffff",
      });

      const image = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.href = image;
      // Download as Receipt
      link.download = `Receipt_${data.id || data._id}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success("Receipt downloaded successfully");
    } catch (error) {
      console.error("Download failed", error);
      toast.error("Failed to download receipt");
    } finally {
      setDownloading(false);
    }
  };

  // Format Date: DD/MM/YY
  const formatDate = (dateString) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
    });
  };

  // Derived Values
  const receiptNo = data.id || "REC-000";
  const carNo = data.vehicle?.registration_no || "-";
  const parkingNo = data.vehicle?.parking_no || "-";
  const locationName =
    data.mall?.name || data.building?.name || "Baba Car Wash Site";
  const customerName = data.customer
    ? `${data.customer.firstName || ""} ${data.customer.lastName || ""}`
    : "Guest";
  const amount = data.amount_paid || data.total_amount || 0;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden flex flex-col"
        >
          {/* Header Actions */}
          <div className="flex justify-between items-center p-4 border-b bg-gray-50">
            <h3 className="font-bold text-gray-700">View Receipt</h3>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-200 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* --- RECEIPT PREVIEW AREA --- */}
          <div className="p-6 bg-gray-100 flex justify-center overflow-auto">
            {/* ACTUAL RECEIPT DOM NODE */}
            <div
              ref={receiptRef}
              className="bg-white w-[450px] p-8 shadow-md text-black font-sans relative"
              style={{ minHeight: "600px" }}
            >
              {/* Logo Section */}
              <div className="flex flex-col items-center mb-6">
                <div className="w-16 h-16 mb-2">
                  <img
                    src="/carwash.jpeg"
                    alt="Logo"
                    className="w-full h-full object-contain"
                  />
                </div>
                <h1 className="text-xl font-bold uppercase tracking-wide text-center">
                  BABA CAR WASHING & CLEANING LLC
                </h1>
              </div>

              {/* Info Grid */}
              <div className="flex justify-between mb-6 text-sm">
                {/* Left Side */}
                <div className="space-y-1">
                  <div>
                    <span className="font-bold">Issued To:</span> {customerName}
                  </div>
                  <div>
                    <span className="font-bold">Car No:</span> {carNo}
                  </div>
                  <div>
                    <span className="font-bold">Parking No:</span> {parkingNo}
                  </div>
                  <div>
                    <span className="font-bold">Building Name:</span>{" "}
                    {locationName}
                  </div>
                </div>

                {/* Right Side */}
                <div className="text-right space-y-1">
                  <div>
                    <span className="font-bold">Receipt No:</span> {receiptNo}
                  </div>
                  <div>
                    <span className="font-bold">Date:</span>{" "}
                    {formatDate(data.createdAt)}
                  </div>
                  <div>
                    <span className="font-bold">Mode:</span>{" "}
                    <span className="uppercase">{data.payment_mode}</span>
                  </div>
                </div>
              </div>

              {/* Table */}
              <div className="mb-6">
                <div className="grid grid-cols-12 bg-gray-200 p-2 font-bold text-sm border-b border-gray-300">
                  <div className="col-span-6">Description</div>
                  <div className="col-span-2 text-center">Unit Price</div>
                  <div className="col-span-2 text-center">Qty</div>
                  <div className="col-span-2 text-right">Total</div>
                </div>
                <div className="grid grid-cols-12 p-2 text-sm border-b border-gray-100">
                  <div className="col-span-6">CAR WASH PAYMENT</div>
                  <div className="col-span-2 text-center">1</div>
                  <div className="col-span-2 text-center">{amount}</div>
                  <div className="col-span-2 text-right">{amount}</div>
                </div>
                {/* Total Row */}
                <div className="grid grid-cols-12 bg-gray-100 p-2 font-bold text-sm">
                  <div className="col-span-10 text-right pr-4">Total</div>
                  <div className="col-span-2 text-right">{amount}</div>
                </div>
              </div>

              <div className="text-center font-bold text-sm mb-6 uppercase">
                THIS IS SYSTEM GENERATED RECEIPT
              </div>

              {/* Bank Details */}
              <div className="mb-6">
                <h3 className="text-red-500 font-bold mb-2">Bank Details</h3>
                <div className="text-xs space-y-1 text-gray-800">
                  <div className="grid grid-cols-3">
                    <span className="font-bold">Bank Address:</span>
                    <span className="col-span-2">Ummhurrair Dubai UAE</span>
                  </div>
                  <div className="grid grid-cols-3">
                    <span className="font-bold">Swift Code:</span>
                    <span className="col-span-2">NRAKAEAK</span>
                  </div>
                  <div className="grid grid-cols-3">
                    <span className="font-bold">Bank Name:</span>
                    <span className="col-span-2">
                      Rak Bank(National Bank of Ras Alkhaimah)
                    </span>
                  </div>
                  <div className="grid grid-cols-3">
                    <span className="font-bold">Bank Account:</span>
                    <span className="col-span-2">0033422488061</span>
                  </div>
                  <div className="grid grid-cols-3">
                    <span className="font-bold">Account Name:</span>
                    <span className="col-span-2">
                      Baba car washing and cleaning
                    </span>
                  </div>
                  <div className="grid grid-cols-3">
                    <span className="font-bold">IBAN No:</span>
                    <span className="col-span-2">
                      AE46 0400 0000 3342 2488 061
                    </span>
                  </div>
                </div>
              </div>

              {/* Footer Note */}
              <div className="text-[10px] text-gray-600 mb-6 leading-tight">
                Please mention your vehicle number and building name in the
                payment receipt and send an email to +971552411075 or
                customerregistration@babagroup.ae
              </div>

              <div className="text-center font-bold text-sm uppercase border-t pt-4">
                THANK YOU FOR CHOOSING BABA CAR WASH
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="p-4 bg-white border-t flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-6 py-2 border rounded-lg hover:bg-gray-50 font-bold text-gray-600"
            >
              Close
            </button>
            <button
              onClick={handleDownload}
              disabled={downloading}
              className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold flex items-center gap-2 shadow-lg"
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
