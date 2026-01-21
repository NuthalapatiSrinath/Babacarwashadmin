import React, { useState, useEffect, useRef } from "react";
import {
  User,
  Phone,
  Lock,
  Building,
  ShoppingBag,
  Loader2,
  Check,
  X,
  Briefcase,
  FileText,
  Globe,
  CreditCard,
  Upload,
  Calendar,
} from "lucide-react";
import toast from "react-hot-toast";
import { useDispatch } from "react-redux";
import { createWorker, updateWorker } from "../../redux/slices/workerSlice";
import { fetchBuildings } from "../../redux/slices/buildingSlice";
import { fetchMalls } from "../../redux/slices/mallSlice";
import ModalManager from "./ModalManager";
import CustomDropdown from "../ui/CustomDropdown";
import { workerService } from "../../api/workerService";

const WorkerModal = ({ isOpen, onClose, onSuccess, editData }) => {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(false);

  // Data Options
  const [allBuildings, setAllBuildings] = useState([]);
  const [allMalls, setAllMalls] = useState([]);

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    mobile: "",
    password: "",
    confirmPassword: "",
    serviceType: "residence",
    employeeCode: "",
    companyName: "",
    joiningDate: "",
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

  const [uploadingDoc, setUploadingDoc] = useState({
    passport: false,
    visa: false,
    emiratesId: false,
  });
  const [selectedBuildings, setSelectedBuildings] = useState([]);
  const [selectedMalls, setSelectedMalls] = useState([]);

  // UI States for Dropdowns
  const [buildingSearch, setBuildingSearch] = useState("");
  const [isBuildingDropdownOpen, setIsBuildingDropdownOpen] = useState(false);
  const buildingDropdownRef = useRef(null);

  const [mallSearch, setMallSearch] = useState("");
  const [isMallDropdownOpen, setIsMallDropdownOpen] = useState(false);
  const mallDropdownRef = useRef(null);

  const serviceTypeOptions = [
    { value: "residence", label: "Residence", icon: Building },
    { value: "mall", label: "Mall", icon: ShoppingBag },
  ];

  // --- 1. Load Data ---
  useEffect(() => {
    if (isOpen) {
      const loadOptions = async () => {
        setFetchingData(true);
        try {
          const [bRes, mRes] = await Promise.all([
            dispatch(
              fetchBuildings({ page: 1, limit: 1000, search: "" }),
            ).unwrap(),
            dispatch(fetchMalls({ page: 1, limit: 1000, search: "" })).unwrap(),
          ]);
          setAllBuildings(bRes.data || []);
          setAllMalls(mRes.data || []);
        } catch (error) {
          toast.error("Failed to load options");
        } finally {
          setFetchingData(false);
        }
      };
      loadOptions();

      if (editData) {
        const sType =
          editData.malls && editData.malls.length > 0 ? "mall" : "residence";
        const existingBuildings = Array.isArray(editData.buildings)
          ? editData.buildings.map((b) =>
              typeof b === "object" ? b : { _id: b, name: "Loading..." },
            )
          : [];
        const existingMalls = Array.isArray(editData.malls)
          ? editData.malls.map((m) =>
              typeof m === "object" ? m : { _id: m, name: "Loading..." },
            )
          : [];

        setFormData({
          name: editData.name || "",
          mobile: editData.mobile || "",
          password: editData.password || "",
          confirmPassword: editData.password || "",
          serviceType: sType,
          employeeCode: editData.employeeCode || "",
          companyName: editData.companyName || "",
          joiningDate: editData.joiningDate
            ? editData.joiningDate.split("T")[0]
            : "",
          email: editData.email || "",
          passportNumber: editData.passportNumber || "",
          passportExpiry: editData.passportExpiry
            ? editData.passportExpiry.split("T")[0]
            : "",
          passportDocument: editData.passportDocument || "",
          visaNumber: editData.visaNumber || "",
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
        setSelectedBuildings(existingBuildings);
        setSelectedMalls(existingMalls);
      } else {
        setFormData({
          name: "",
          mobile: "",
          password: "",
          confirmPassword: "",
          serviceType: "residence",
          employeeCode: "",
          companyName: "",
          joiningDate: "",
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
        setSelectedBuildings([]);
        setSelectedMalls([]);
      }
    }
  }, [isOpen, editData, dispatch]);

  // --- 2. Multi-Select Logic ---
  const toggleSelection = (item, list, setList, searchSetter) => {
    const exists = list.find((i) => i._id === item._id);
    if (exists) setList(list.filter((i) => i._id !== item._id));
    else setList([...list, item]);
    searchSetter("");
  };

  const removeSelection = (id, list, setList) => {
    setList(list.filter((i) => i._id !== id));
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        buildingDropdownRef.current &&
        !buildingDropdownRef.current.contains(event.target)
      )
        setIsBuildingDropdownOpen(false);
      if (
        mallDropdownRef.current &&
        !mallDropdownRef.current.contains(event.target)
      )
        setIsMallDropdownOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredBuildings = allBuildings.filter((b) =>
    b.name.toLowerCase().includes(buildingSearch.toLowerCase()),
  );
  const filteredMalls = allMalls.filter((m) =>
    m.name.toLowerCase().includes(mallSearch.toLowerCase()),
  );

  // --- 3. Document Upload ---
  const handleDocumentUpload = async (docType) => {
    if (!editData?._id) {
      toast.error("Please save details first before uploading docs.");
      return;
    }
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".pdf";
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      if (!file.name.toLowerCase().endsWith(".pdf"))
        return toast.error("Only PDF allowed");

      const docKey =
        docType === "Passport"
          ? "passport"
          : docType === "Visa"
            ? "visa"
            : "emiratesId";
      setUploadingDoc((prev) => ({ ...prev, [docKey]: true }));
      const toastId = toast.loading(`Uploading ${docType}...`);

      try {
        const response = await workerService.uploadDocument(
          editData._id,
          file,
          docType,
        );
        toast.success("Uploaded!", { id: toastId });
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
        toast.error("Upload failed", { id: toastId });
      } finally {
        setUploadingDoc((prev) => ({ ...prev, [docKey]: false }));
      }
    };
    input.click();
  };

  // --- 4. Submit ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.mobile)
      return toast.error("Name & Mobile required");
    if (!formData.password) return toast.error("Password required");
    if (formData.password !== formData.confirmPassword) return;

    setLoading(true);
    try {
      const payload = {
        name: formData.name,
        mobile: formData.mobile,
        password: formData.password,
        employeeCode: formData.employeeCode,
        companyName: formData.companyName,
        joiningDate: formData.joiningDate,
        email: formData.email,
        passportNumber: formData.passportNumber,
        passportExpiry: formData.passportExpiry,
        visaNumber: formData.visaNumber,
        visaExpiry: formData.visaExpiry,
        emiratesId: formData.emiratesId,
        emiratesIdExpiry: formData.emiratesIdExpiry,
      };

      if (formData.serviceType === "mall") {
        if (selectedMalls.length === 0)
          throw new Error("Select at least one Mall");
        payload.malls = selectedMalls.map((m) => m._id);
        payload.buildings = [];
      } else {
        if (selectedBuildings.length === 0)
          throw new Error("Select at least one Building");
        payload.buildings = selectedBuildings.map((b) => b._id);
        payload.malls = [];
      }

      if (editData)
        await dispatch(
          updateWorker({ id: editData._id, data: payload }),
        ).unwrap();
      else await dispatch(createWorker(payload)).unwrap();

      toast.success(editData ? "Worker Updated" : "Worker Created");
      onSuccess();
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || "Failed");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;
  const isPasswordMismatch =
    formData.password &&
    formData.confirmPassword &&
    formData.password !== formData.confirmPassword;

  return (
    <ModalManager
      isOpen={isOpen}
      onClose={onClose}
      title={editData ? "Edit Worker" : "Add New Worker"}
      pageName="WORKERS"
      modalType={editData ? "EDIT" : "CREATE"}
      size="lg"
    >
      {/* ✅ SCROLLABLE CONTAINER WITH MAX HEIGHT & PADDING */}
      <div className="overflow-y-auto max-h-[70vh] p-6 space-y-8 custom-scrollbar">
        <form id="workerForm" onSubmit={handleSubmit} className="space-y-8">
          {/* --- SECTION 1: ACCOUNT INFO --- */}
          <div className="space-y-4">
            <h4 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-2 flex items-center gap-2">
              <div className="p-1.5 bg-blue-50 rounded-lg text-blue-600">
                <User className="w-4 h-4" />
              </div>
              Account Information
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Mobile <span className="text-red-500">*</span>
                </label>
                <div className="relative group">
                  <Phone className="absolute left-3 top-3 h-4 w-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                  <input
                    type="text"
                    value={formData.mobile}
                    onChange={(e) =>
                      setFormData({ ...formData, mobile: e.target.value })
                    }
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                    placeholder="9876543210"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Name <span className="text-red-500">*</span>
                </label>
                <div className="relative group">
                  <User className="absolute left-3 top-3 h-4 w-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                    placeholder="Full Name"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Password <span className="text-red-500">*</span>
                </label>
                <div className="relative group">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                  <input
                    type="text"
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                    placeholder="Enter Password"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Confirm <span className="text-red-500">*</span>
                </label>
                <div className="relative group">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                  <input
                    type="text"
                    value={formData.confirmPassword}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        confirmPassword: e.target.value,
                      })
                    }
                    className={`w-full pl-10 pr-4 py-2.5 bg-slate-50 border rounded-xl text-sm font-medium focus:bg-white focus:ring-2 outline-none transition-all ${isPasswordMismatch ? "border-red-300 focus:ring-red-200" : "border-slate-200 focus:ring-blue-500"}`}
                    placeholder="Confirm"
                  />
                </div>
                {isPasswordMismatch && (
                  <p className="text-[10px] text-red-500 font-bold ml-1">
                    Passwords do not match
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* --- SECTION 2: HR DETAILS --- */}
          <div className="space-y-4">
            <h4 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-2 flex items-center gap-2">
              <div className="p-1.5 bg-emerald-50 rounded-lg text-emerald-600">
                <Briefcase className="w-4 h-4" />
              </div>
              Employment Details
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Company
                </label>
                <input
                  type="text"
                  value={formData.companyName}
                  onChange={(e) =>
                    setFormData({ ...formData, companyName: e.target.value })
                  }
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                  placeholder="Company Name"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Emp Code
                </label>
                <input
                  type="text"
                  value={formData.employeeCode}
                  onChange={(e) =>
                    setFormData({ ...formData, employeeCode: e.target.value })
                  }
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                  placeholder="EMP-001"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                  placeholder="john@example.com"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Joined Date
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-3 h-4 w-4 text-slate-400 pointer-events-none" />
                  <input
                    type="date"
                    value={formData.joiningDate}
                    onChange={(e) =>
                      setFormData({ ...formData, joiningDate: e.target.value })
                    }
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-600 focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all cursor-pointer rich-date-input"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* --- SECTION 3: ASSIGNMENT --- */}
          <div className="space-y-4">
            <h4 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-2 flex items-center gap-2">
              <div className="p-1.5 bg-purple-50 rounded-lg text-purple-600">
                <Building className="w-4 h-4" />
              </div>
              Assignment Logic
            </h4>
            <div className="space-y-4">
              <CustomDropdown
                label="Service Type"
                value={formData.serviceType}
                onChange={(val) =>
                  setFormData({ ...formData, serviceType: val })
                }
                options={serviceTypeOptions}
                icon={Briefcase}
                placeholder="Select Service Type"
              />

              {formData.serviceType === "mall" && (
                <div ref={mallDropdownRef} className="space-y-2 relative">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Assign Malls <span className="text-red-500">*</span>
                  </label>
                  <div
                    onClick={() => setIsMallDropdownOpen(true)}
                    className="w-full min-h-[48px] px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-white focus-within:bg-white focus-within:ring-2 focus-within:ring-purple-500 flex flex-wrap gap-2 items-center cursor-text transition-all"
                  >
                    {selectedMalls.map((m) => (
                      <span
                        key={m._id}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-white text-purple-700 border border-purple-100 shadow-sm"
                      >
                        {m.name}{" "}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeSelection(
                              m._id,
                              selectedMalls,
                              setSelectedMalls,
                            );
                          }}
                          className="hover:bg-purple-100 rounded-full p-0.5"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                    <input
                      type="text"
                      className="flex-1 min-w-[120px] outline-none text-sm bg-transparent h-full placeholder:text-slate-400"
                      placeholder={
                        selectedMalls.length === 0 ? "Search Malls..." : ""
                      }
                      value={mallSearch}
                      onChange={(e) => {
                        setMallSearch(e.target.value);
                        setIsMallDropdownOpen(true);
                      }}
                      onFocus={() => setIsMallDropdownOpen(true)}
                    />
                  </div>
                  {isMallDropdownOpen && (
                    <div className="absolute left-0 right-0 mt-2 bg-white border border-slate-100 rounded-xl shadow-xl max-h-48 overflow-y-auto z-50 custom-scrollbar">
                      {filteredMalls.map((m) => (
                        <div
                          key={m._id}
                          onClick={() =>
                            toggleSelection(
                              m,
                              selectedMalls,
                              setSelectedMalls,
                              setMallSearch,
                            )
                          }
                          className={`px-4 py-3 text-sm cursor-pointer flex justify-between items-center ${selectedMalls.find((sm) => sm._id === m._id) ? "bg-purple-50 text-purple-700 font-medium" : "text-slate-600 hover:bg-slate-50"}`}
                        >
                          <span className="flex items-center gap-3">
                            <ShoppingBag className="w-4 h-4 text-slate-400" />{" "}
                            {m.name}
                          </span>
                          {selectedMalls.find((sm) => sm._id === m._id) && (
                            <Check className="w-4 h-4 text-purple-600" />
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {formData.serviceType === "residence" && (
                <div ref={buildingDropdownRef} className="space-y-2 relative">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Assign Buildings <span className="text-red-500">*</span>
                  </label>
                  <div
                    onClick={() => setIsBuildingDropdownOpen(true)}
                    className="w-full min-h-[48px] px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-white focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-500 flex flex-wrap gap-2 items-center cursor-text transition-all"
                  >
                    {selectedBuildings.map((b) => (
                      <span
                        key={b._id}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-white text-blue-700 border border-blue-100 shadow-sm"
                      >
                        {b.name}{" "}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeSelection(
                              b._id,
                              selectedBuildings,
                              setSelectedBuildings,
                            );
                          }}
                          className="hover:bg-blue-100 rounded-full p-0.5"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                    <input
                      type="text"
                      className="flex-1 min-w-[120px] outline-none text-sm bg-transparent h-full placeholder:text-slate-400"
                      placeholder={
                        selectedBuildings.length === 0
                          ? "Search Buildings..."
                          : ""
                      }
                      value={buildingSearch}
                      onChange={(e) => {
                        setBuildingSearch(e.target.value);
                        setIsBuildingDropdownOpen(true);
                      }}
                      onFocus={() => setIsBuildingDropdownOpen(true)}
                    />
                  </div>
                  {isBuildingDropdownOpen && (
                    <div className="absolute left-0 right-0 mt-2 bg-white border border-slate-100 rounded-xl shadow-xl max-h-48 overflow-y-auto z-50 custom-scrollbar">
                      {filteredBuildings.map((b) => (
                        <div
                          key={b._id}
                          onClick={() =>
                            toggleSelection(
                              b,
                              selectedBuildings,
                              setSelectedBuildings,
                              setBuildingSearch,
                            )
                          }
                          className={`px-4 py-3 text-sm cursor-pointer flex justify-between items-center ${selectedBuildings.find((sb) => sb._id === b._id) ? "bg-blue-50 text-blue-700 font-medium" : "text-slate-600 hover:bg-slate-50"}`}
                        >
                          <span className="flex items-center gap-3">
                            <Building className="w-4 h-4 text-slate-400" />{" "}
                            {b.name}
                          </span>
                          {selectedBuildings.find((sb) => sb._id === b._id) && (
                            <Check className="w-4 h-4 text-blue-600" />
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* --- SECTION 4: DOCUMENTS --- */}
          <div className="space-y-4 pb-4">
            <h4 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-2 flex items-center gap-2">
              <div className="p-1.5 bg-indigo-50 rounded-lg text-indigo-600">
                <FileText className="w-4 h-4" />
              </div>
              Official Documents
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <span className="text-[10px] font-black text-indigo-500 uppercase flex items-center gap-1.5">
                  <Globe className="w-3 h-3" /> Passport Details
                </span>
                <input
                  type="text"
                  value={formData.passportNumber}
                  onChange={(e) =>
                    setFormData({ ...formData, passportNumber: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="Passport No."
                />
                <input
                  type="date"
                  value={formData.passportExpiry}
                  onChange={(e) =>
                    setFormData({ ...formData, passportExpiry: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm rich-date-input outline-none"
                />
              </div>
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <span className="text-[10px] font-black text-blue-500 uppercase flex items-center gap-1.5">
                  <FileText className="w-3 h-3" /> Visa Details
                </span>
                <input
                  type="text"
                  value={formData.visaNumber}
                  onChange={(e) =>
                    setFormData({ ...formData, visaNumber: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="Visa No."
                />
                <input
                  type="date"
                  value={formData.visaExpiry}
                  onChange={(e) =>
                    setFormData({ ...formData, visaExpiry: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm rich-date-input outline-none"
                />
              </div>
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3 md:col-span-2">
                <span className="text-[10px] font-black text-emerald-500 uppercase flex items-center gap-1.5">
                  <CreditCard className="w-3 h-3" /> Emirates ID
                </span>
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    value={formData.emiratesId}
                    onChange={(e) =>
                      setFormData({ ...formData, emiratesId: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                    placeholder="ID Number"
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
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm rich-date-input outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* --- SECTION 5: UPLOADS (Edit Mode) --- */}
          {editData && (
            <div className="pt-4 border-t border-dashed border-slate-200">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">
                Cloud Document Storage (PDF)
              </h4>
              <div className="grid grid-cols-3 gap-4">
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
                    className="flex flex-col items-center justify-center p-4 rounded-xl border border-dashed border-slate-300 text-slate-500 hover:bg-slate-50 hover:border-slate-400 transition-all group disabled:opacity-50"
                  >
                    {uploadingDoc[
                      doc === "Passport"
                        ? "passport"
                        : doc === "Visa"
                          ? "visa"
                          : "emiratesId"
                    ] ? (
                      <Loader2 className="w-6 h-6 animate-spin text-blue-500 mb-2" />
                    ) : (
                      <Upload className="w-6 h-6 mb-2 text-slate-300 group-hover:text-blue-500 transition-colors" />
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

      {/* --- FIXED FOOTER --- */}
      <div className="flex justify-end p-6 border-t border-slate-100 bg-white rounded-b-xl gap-3">
        <button
          type="button"
          onClick={onClose}
          className="px-5 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          form="workerForm"
          disabled={loading || isPasswordMismatch}
          className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl text-sm font-bold flex items-center gap-2 shadow-lg shadow-indigo-200 disabled:opacity-70 disabled:shadow-none transition-all"
        >
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}{" "}
          {editData ? "Save Changes" : "Create Worker"}
        </button>
      </div>

      {/* --- CUSTOM CSS FOR SCROLLBAR & DATE INPUTS --- */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
        
        /* Rich Date Input Styling */
        .rich-date-input::-webkit-calendar-picker-indicator { cursor: pointer; opacity: 0.5; transition: 0.2s; }
        .rich-date-input::-webkit-calendar-picker-indicator:hover { opacity: 1; transform: scale(1.1); }
      `}</style>
    </ModalManager>
  );
};

export default WorkerModal;
