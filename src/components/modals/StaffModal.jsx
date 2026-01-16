import React, { useState, useEffect } from "react";
import {
  X,
  User,
  Hash,
  Map,
  Loader2,
  ChevronDown,
  Briefcase,
  Calendar,
  CreditCard,
  Globe,
  FileText,
  Upload,
  Phone,
  Mail,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { staffService } from "../../api/staffService";
import { siteService } from "../../api/siteService";

const StaffModal = ({ isOpen, onClose, onSuccess, editData }) => {
  const [loading, setLoading] = useState(false);
  const [fetchingSites, setFetchingSites] = useState(false);
  const [sites, setSites] = useState([]);

  // Document upload states
  const [uploadingDoc, setUploadingDoc] = useState({
    passport: false,
    visa: false,
    emiratesId: false,
  });

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    employeeCode: "",
    companyName: "",
    joiningDate: "",
    site: "",
    mobile: "",
    email: "",
    passportNumber: "",
    passportExpiry: "",
    passportDocument: "",
    visaNumber: "", // ✅ Added
    visaExpiry: "",
    visaDocument: "",
    emiratesId: "",
    emiratesIdExpiry: "",
    emiratesIdDocument: "",
  });

  // Load Sites & Populate Data
  useEffect(() => {
    if (isOpen) {
      const loadSites = async () => {
        setFetchingSites(true);
        try {
          const response = await siteService.list(1, 1000);
          setSites(response.data || []);
        } catch (error) {
          console.error("Failed to load sites", error);
        } finally {
          setFetchingSites(false);
        }
      };
      loadSites();

      if (editData) {
        setFormData({
          name: editData.name || "",
          employeeCode: editData.employeeCode || "",
          companyName: editData.companyName || "",
          joiningDate: editData.joiningDate
            ? editData.joiningDate.split("T")[0]
            : "",
          site:
            editData.site && typeof editData.site === "object"
              ? editData.site._id
              : editData.site || "",
          mobile: editData.mobile || "",
          email: editData.email || "",
          passportNumber: editData.passportNumber || "",
          passportExpiry: editData.passportExpiry
            ? editData.passportExpiry.split("T")[0]
            : "",
          passportDocument: editData.passportDocument || "",
          visaNumber: editData.visaNumber || "", // ✅ Populates from editData
          visaExpiry: editData.visaExpiry
            ? editData.visaExpiry.split("T")[0]
            : "",
          visaDocument: editData.visaDocument || "",
          emiratesId: editData.emiratesId || "",
          emiratesIdExpiry: editData.emiratesIdExpiry
            ? editData.emiratesIdExpiry.split("T")[0]
            : "",
          emiratesIdDocument: editData.emiratesIdDocument || "",
        });
      } else {
        setFormData({
          name: "",
          employeeCode: "",
          companyName: "",
          joiningDate: "",
          site: "",
          mobile: "",
          email: "",
          passportNumber: "",
          passportExpiry: "",
          passportDocument: "",
          visaNumber: "",
          visaExpiry: "",
          visaDocument: "",
          emiratesId: "",
          emiratesIdExpiry: "",
          emiratesIdDocument: "",
        });
      }
    }
  }, [isOpen, editData]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (
      !formData.name ||
      !formData.employeeCode ||
      !formData.companyName ||
      !formData.site
    ) {
      toast.error("Name, Employee Code, Company Name and Site are required");
      return;
    }

    setLoading(true);
    try {
      if (editData) {
        await staffService.update(editData._id, formData);
        toast.success("Staff updated successfully");
      } else {
        await staffService.create(formData);
        toast.success("Staff created successfully");
      }
      onSuccess();
      onClose();
    } catch (error) {
      console.error(error);
      const msg =
        error.response?.data?.message || error.message || "Operation failed";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleDocumentUpload = async (docType) => {
    if (!editData?._id) {
      toast.error(
        "Please save the staff details first before uploading documents."
      );
      return;
    }
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".pdf";
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      if (!file.name.toLowerCase().endsWith(".pdf")) {
        toast.error("Only PDF files are allowed");
        return;
      }
      const docKey =
        docType === "Passport"
          ? "passport"
          : docType === "Visa"
          ? "visa"
          : "emiratesId";
      setUploadingDoc((prev) => ({ ...prev, [docKey]: true }));
      const toastId = toast.loading(`Uploading ${docType}...`);
      try {
        const response = await staffService.uploadDocument(
          editData._id,
          file,
          docType
        );
        toast.success(`${docType} uploaded successfully!`, { id: toastId });
        const fieldName =
          docType === "Passport"
            ? "passportDocument"
            : docType === "Visa"
            ? "visaDocument"
            : "emiratesIdDocument";
        setFormData((prev) => ({
          ...prev,
          [fieldName]: { filename: response.fileName },
        }));
      } catch (error) {
        toast.error(`Failed to upload ${docType}`, { id: toastId });
      } finally {
        setUploadingDoc((prev) => ({ ...prev, [docKey]: false }));
      }
    };
    input.click();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="bg-white w-full max-w-2xl rounded-xl shadow-2xl overflow-hidden relative z-10 flex flex-col max-h-[90vh]"
        >
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
            <div>
              <h3 className="text-lg font-bold text-gray-800">
                {editData ? "Edit Staff Details" : "Add New Staff Member"}
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Fill in the information below to{" "}
                {editData ? "update" : "create"} a record.
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 overflow-y-auto custom-scrollbar">
            <form id="staffForm" onSubmit={handleSubmit} className="space-y-6">
              {/* Personal & Job Information */}
              <div className="space-y-4">
                <h4 className="text-sm font-semibold text-gray-900 border-b border-gray-100 pb-2 mb-3 flex items-center gap-2">
                  <User className="w-4 h-4 text-blue-500" /> Personal & Job
                  Information
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Company Name <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Briefcase className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                      <input
                        type="text"
                        value={formData.companyName}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            companyName: e.target.value,
                          })
                        }
                        className="w-full pl-9 pr-4 py-2 rounded-lg border border-gray-300 text-sm focus:border-blue-500 outline-none transition-all"
                        placeholder="e.g. Baba Car Wash"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Full Name <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) =>
                          setFormData({ ...formData, name: e.target.value })
                        }
                        className="w-full pl-9 pr-4 py-2 rounded-lg border border-gray-300 text-sm focus:border-blue-500 outline-none transition-all"
                        placeholder="John Doe"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Employee Code <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Hash className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                      <input
                        type="text"
                        value={formData.employeeCode}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            employeeCode: e.target.value,
                          })
                        }
                        className="w-full pl-9 pr-4 py-2 rounded-lg border border-gray-300 text-sm focus:border-blue-500 outline-none transition-all"
                        placeholder="EMP-001"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Assigned Site <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Map className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                      <select
                        value={formData.site}
                        onChange={(e) =>
                          setFormData({ ...formData, site: e.target.value })
                        }
                        disabled={fetchingSites}
                        className="w-full pl-9 pr-8 py-2 rounded-lg border border-gray-300 text-sm focus:border-blue-500 outline-none bg-white appearance-none transition-all"
                      >
                        <option value="">Select Site</option>
                        {sites.map((site) => (
                          <option key={site._id} value={site._id}>
                            {site.name}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3 top-3 h-4 w-4 text-gray-400 pointer-events-none" />
                    </div>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Joining Date
                    </label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                      <input
                        type="date"
                        value={formData.joiningDate}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            joiningDate: e.target.value,
                          })
                        }
                        className="w-full pl-9 pr-4 py-2 rounded-lg border border-gray-300 text-sm focus:border-blue-500 outline-none transition-all"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div className="space-y-4">
                <h4 className="text-sm font-semibold text-gray-900 border-b border-gray-100 pb-2 mb-3 flex items-center gap-2">
                  <Phone className="w-4 h-4 text-emerald-500" /> Contact
                  Information
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Mobile Number
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                      <input
                        type="tel"
                        value={formData.mobile}
                        onChange={(e) =>
                          setFormData({ ...formData, mobile: e.target.value })
                        }
                        className="w-full pl-9 pr-4 py-2 rounded-lg border border-gray-300 text-sm focus:border-blue-500 outline-none"
                        placeholder="+971 50 123 4567"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) =>
                          setFormData({ ...formData, email: e.target.value })
                        }
                        className="w-full pl-9 pr-4 py-2 rounded-lg border border-gray-300 text-sm focus:border-blue-500 outline-none"
                        placeholder="john@example.com"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Official Documents */}
              <div className="space-y-4">
                <h4 className="text-sm font-semibold text-gray-900 border-b border-gray-100 pb-2 mb-3 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-indigo-500" /> Official
                  Documents
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Passport Section */}
                  <div className="p-3 bg-gray-50 rounded-lg border border-gray-100 space-y-2">
                    <span className="text-[10px] font-bold text-indigo-600 uppercase flex items-center gap-1">
                      <Globe className="w-3 h-3" /> Passport
                    </span>
                    <input
                      type="text"
                      value={formData.passportNumber}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          passportNumber: e.target.value,
                        })
                      }
                      className="w-full px-3 py-1.5 rounded border border-gray-300 text-sm focus:border-indigo-500 outline-none"
                      placeholder="Passport No."
                    />
                    <input
                      type="date"
                      value={formData.passportExpiry}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          passportExpiry: e.target.value,
                        })
                      }
                      className="w-full px-3 py-1.5 rounded border border-gray-300 text-sm focus:border-indigo-500 outline-none"
                    />
                  </div>

                  {/* Visa Section */}
                  <div className="p-3 bg-gray-50 rounded-lg border border-gray-100 space-y-2">
                    <span className="text-[10px] font-bold text-blue-600 uppercase flex items-center gap-1">
                      <FileText className="w-3 h-3" /> Visa
                    </span>
                    <input
                      type="text"
                      value={formData.visaNumber}
                      onChange={(e) =>
                        setFormData({ ...formData, visaNumber: e.target.value })
                      }
                      className="w-full px-3 py-1.5 rounded border border-gray-300 text-sm focus:border-blue-500 outline-none"
                      placeholder="Visa No."
                    />
                    <input
                      type="date"
                      value={formData.visaExpiry}
                      onChange={(e) =>
                        setFormData({ ...formData, visaExpiry: e.target.value })
                      }
                      className="w-full px-3 py-1.5 rounded border border-gray-300 text-sm focus:border-blue-500 outline-none"
                    />
                  </div>

                  {/* Emirates ID Section */}
                  <div className="p-3 bg-gray-50 rounded-lg border border-gray-100 space-y-2 md:col-span-2">
                    <span className="text-[10px] font-bold text-emerald-600 uppercase flex items-center gap-1">
                      <CreditCard className="w-3 h-3" /> Emirates ID
                    </span>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <input
                        type="text"
                        value={formData.emiratesId}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            emiratesId: e.target.value,
                          })
                        }
                        className="w-full px-3 py-1.5 rounded border border-gray-300 text-sm focus:border-emerald-500 outline-none"
                        placeholder="ID Number (784-...)"
                      />
                      <input
                        type="date"
                        value={formData.emiratesIdExpiry}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            emiratesIdExpiry: e.target.value,
                          })
                        }
                        className="w-full px-3 py-1.5 rounded border border-gray-300 text-sm focus:border-emerald-500 outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Uploads (Only in Edit Mode) */}
              {editData && (
                <div className="pt-2">
                  <h4 className="text-sm font-semibold text-gray-900 border-b border-gray-100 pb-2 mb-4">
                    Cloud Document Storage (PDF)
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {["Passport", "Visa", "Emirates ID"].map((doc) => (
                      <button
                        key={doc}
                        type="button"
                        onClick={() => handleDocumentUpload(doc)}
                        disabled={
                          uploadingDoc[
                            doc === "Passport"
                              ? "passport"
                              : doc === "Visa"
                              ? "visa"
                              : "emiratesId"
                          ]
                        }
                        className="flex flex-col items-center justify-center p-3 rounded-lg border border-dashed border-gray-300 text-gray-500 hover:bg-gray-50 transition-all group"
                      >
                        {uploadingDoc[
                          doc === "Passport"
                            ? "passport"
                            : doc === "Visa"
                            ? "visa"
                            : "emiratesId"
                        ] ? (
                          <Loader2 className="w-5 h-5 animate-spin mb-1 text-blue-500" />
                        ) : (
                          <Upload className="w-5 h-5 mb-1 group-hover:text-blue-500" />
                        )}
                        <span className="text-[10px] font-bold uppercase">
                          {doc}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </form>
          </div>

          <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3 bg-gray-50/50">
            <button
              onClick={onClose}
              className="px-5 py-2.5 rounded-lg border border-gray-300 bg-white text-gray-700 text-sm font-semibold hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="staffForm"
              disabled={loading}
              className="px-6 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold shadow-lg shadow-indigo-200 disabled:opacity-60 transition-all flex items-center"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              {editData ? "Save Changes" : "Create Staff"}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default StaffModal;
