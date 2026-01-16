import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Camera,
  UploadCloud,
  Eye,
  Loader2,
  Calendar,
  MapPin,
  Phone,
  Mail,
  Briefcase,
  AlertCircle,
  CheckCircle,
  Edit2, // ✅ Added Edit Icon
} from "lucide-react";
import toast from "react-hot-toast";
import { staffService } from "../../api/staffService";
import StaffModal from "../../components/modals/StaffModal"; // ✅ Import Modal

const StaffProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const profileInputRef = useRef(null);

  const [staff, setStaff] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  // ✅ State for Edit Modal
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // --- FETCH DATA ---
  const fetchStaff = async () => {
    try {
      const res = await staffService.list(1, 1000, "");
      const found = res.data.find((s) => s._id === id || s.id === id);

      if (found) {
        setStaff(found);
      } else {
        toast.error("Staff member not found");
        navigate(-1);
      }
    } catch (error) {
      console.error("Fetch error:", error);
      toast.error("Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
    // eslint-disable-next-line
  }, [id]);

  // --- HANDLERS ---
  const handleProfileImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    setUploading(true);
    const toastId = toast.loading("Updating profile picture...");

    try {
      await staffService.uploadProfileImage(id, file);
      toast.success("Profile picture updated", { id: toastId });
      fetchStaff();
    } catch (error) {
      console.error(error);
      toast.error("Upload failed", { id: toastId });
    } finally {
      setUploading(false);
    }
  };

  const handleDocUpload = async (file, type) => {
    if (!file) return;
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/jpg",
      "application/pdf",
    ];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Only JPG, PNG or PDF files are allowed");
      return;
    }

    const toastId = toast.loading(`Uploading ${type}...`);
    try {
      await staffService.uploadDocument(id, file, type);
      toast.success("Uploaded successfully", { id: toastId });
      fetchStaff();
    } catch (error) {
      toast.error("Upload failed", { id: toastId });
    }
  };

  // --- HELPERS ---
  const isExpired = (date) => date && new Date(date) < new Date();
  const formatDate = (date) =>
    date ? new Date(date).toISOString().split("T")[0] : "-";

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#e0e5ec]">
        <Loader2 className="w-10 h-10 animate-spin text-slate-600" />
      </div>
    );

  if (!staff) return null;

  return (
    <div className="min-h-screen bg-[#e0e5ec] p-4 md:p-8 flex items-center justify-center font-sans">
      <div className="bg-[#f0f3f7] w-full max-w-6xl rounded-[40px] shadow-2xl flex flex-col lg:flex-row overflow-hidden relative min-h-[800px]">
        <button
          onClick={() => navigate(-1)}
          className="absolute top-6 left-6 z-50 p-2 bg-white/50 backdrop-blur-md rounded-full hover:bg-white transition-all shadow-sm text-slate-600"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>

        {/* === LEFT COLUMN (Profile Identity) === */}
        <div className="w-full lg:w-[40%] p-8 lg:p-12 flex flex-col items-center justify-center text-center relative border-b lg:border-b-0 lg:border-r border-slate-200/50">
          {/* Profile Circle */}
          <div className="relative mb-6">
            <div className="w-56 h-56 rounded-full border-[8px] border-[#f0f3f7] shadow-[inset_5px_5px_10px_#d1d9e6,inset_-5px_-5px_10px_#ffffff] overflow-hidden flex items-center justify-center relative bg-slate-200">
              {staff.profileImage?.url ? (
                <img
                  src={staff.profileImage.url}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-6xl font-bold text-slate-400 select-none">
                  {staff.name?.[0]?.toUpperCase()}
                </span>
              )}

              <div
                onClick={() => profileInputRef.current.click()}
                className="absolute inset-0 bg-black/30 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
              >
                <Camera className="w-12 h-12 text-white drop-shadow-md" />
              </div>

              {uploading && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10">
                  <Loader2 className="w-12 h-12 text-white animate-spin" />
                </div>
              )}
            </div>
            <input
              type="file"
              ref={profileInputRef}
              onChange={handleProfileImageChange}
              accept="image/*"
              className="hidden"
            />
          </div>

          <h1 className="text-3xl lg:text-4xl font-black text-slate-800 uppercase tracking-tight mb-2">
            {staff.name}
          </h1>
          <p className="text-lg lg:text-xl text-slate-500 font-medium mb-8">
            {staff.companyName || "STAFF MEMBER"}
          </p>

          {/* Intro Text / Bio Area (With Edit Button) */}
          <div className="w-full bg-white/60 p-6 rounded-2xl shadow-sm text-left space-y-4 backdrop-blur-sm relative group">
            {/* ✅ EDIT BUTTON for Code, Site, Date */}
            <button
              onClick={() => setIsEditModalOpen(true)}
              className="absolute top-4 right-4 p-2 bg-white rounded-full shadow-sm text-slate-400 hover:text-blue-600 transition-colors"
              title="Edit Details"
            >
              <Edit2 className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 text-slate-700">
              <Briefcase className="w-5 h-5 text-blue-600" />
              <span className="font-semibold">
                {staff.employeeCode || "No Employee Code"}
              </span>
            </div>
            <div className="flex items-center gap-3 text-slate-700">
              <MapPin className="w-5 h-5 text-blue-600" />
              <span className="font-semibold">
                {staff.site?.name || staff.site || "Unassigned Site"}
              </span>
            </div>
            <div className="flex items-center gap-3 text-slate-700">
              <Calendar className="w-5 h-5 text-blue-600" />
              <span className="font-semibold">
                Joined: {formatDate(staff.joiningDate)}
              </span>
            </div>
          </div>
        </div>

        {/* === RIGHT COLUMN (The "Boxes" Layout) === */}
        <div className="w-full lg:w-[60%] p-6 lg:p-12 bg-transparent flex flex-col justify-center gap-8">
          <div className="mb-4">
            <h2 className="text-2xl font-bold text-slate-700">
              Official Documents & Info
            </h2>
            <p className="text-slate-500 text-sm">
              Manage staff documents and contact details
            </p>
          </div>

          {/* 01: PASSPORT */}
          <SkillBox
            number="01"
            title="PASSPORT DETAILS"
            hasDoc={!!staff.passportDocument?.url}
            docUrl={staff.passportDocument?.url}
            onUpload={(f) => handleDocUpload(f, "Passport")}
          >
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="block text-blue-200 text-[10px] font-bold uppercase">
                  Passport No.
                </span>
                <span className="font-bold text-white tracking-wide">
                  {staff.passportNumber || "N/A"}
                </span>
              </div>
              <div>
                <span className="block text-blue-200 text-[10px] font-bold uppercase">
                  Expiry
                </span>
                <span className="font-bold text-white flex items-center gap-2">
                  {formatDate(staff.passportExpiry)}
                  {isExpired(staff.passportExpiry) && (
                    <AlertCircle className="w-4 h-4 text-red-300 animate-pulse" />
                  )}
                </span>
              </div>
            </div>
          </SkillBox>

          {/* 02: VISA */}
          <SkillBox
            number="02"
            title="VISA INFORMATION"
            hasDoc={!!staff.visaDocument?.url}
            docUrl={staff.visaDocument?.url}
            onUpload={(f) => handleDocUpload(f, "Visa")}
          >
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                {/* ✅ VISA NUMBER ADDED */}
                <span className="block text-blue-200 text-[10px] font-bold uppercase">
                  Visa No.
                </span>
                <span className="font-bold text-white tracking-wide">
                  {staff.visaNumber || "N/A"}
                </span>
              </div>
              <div>
                <span className="block text-blue-200 text-[10px] font-bold uppercase">
                  Expiry
                </span>
                <span className="font-bold text-white">
                  {formatDate(staff.visaExpiry)}
                </span>
              </div>
            </div>
          </SkillBox>

          {/* 03: EMIRATES ID */}
          <SkillBox
            number="03"
            title="EMIRATES ID"
            hasDoc={!!staff.emiratesIdDocument?.url}
            docUrl={staff.emiratesIdDocument?.url}
            onUpload={(f) => handleDocUpload(f, "Emirates ID")}
          >
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="block text-blue-200 text-[10px] font-bold uppercase">
                  EID Number
                </span>
                <span className="font-bold text-white tracking-wide">
                  {staff.emiratesId || "N/A"}
                </span>
              </div>
              <div>
                <span className="block text-blue-200 text-[10px] font-bold uppercase">
                  Expiry
                </span>
                <span className="font-bold text-white">
                  {formatDate(staff.emiratesIdExpiry)}
                </span>
              </div>
            </div>
          </SkillBox>

          {/* 04: CONTACT */}
          <SkillBox number="04" title="CONTACT INFO" hideUpload={true}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-3">
                <div className="p-1.5 bg-blue-700/50 rounded-lg">
                  <Phone className="w-4 h-4 text-white" />
                </div>
                <div>
                  <span className="block text-blue-200 text-[10px] font-bold uppercase">
                    Mobile
                  </span>
                  <span className="font-bold text-white">
                    {staff.mobile || "-"}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-1.5 bg-blue-700/50 rounded-lg">
                  <Mail className="w-4 h-4 text-white" />
                </div>
                <div>
                  <span className="block text-blue-200 text-[10px] font-bold uppercase">
                    Email
                  </span>
                  <span className="font-bold text-white">
                    {staff.email || "-"}
                  </span>
                </div>
              </div>
            </div>
          </SkillBox>
        </div>
      </div>

      {/* ✅ STAFF MODAL FOR EDITING */}
      <StaffModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        editData={staff}
        onSuccess={() => {
          fetchStaff(); // Refresh data after edit
          setIsEditModalOpen(false);
        }}
      />
    </div>
  );
};

// Box Component (Same as before)
const SkillBox = ({
  number,
  title,
  children,
  hasDoc,
  docUrl,
  onUpload,
  hideUpload,
}) => {
  const fileRef = useRef(null);
  return (
    <div className="relative pl-12 sm:pl-16 group">
      <div className="absolute left-0 top-3 text-4xl sm:text-5xl font-black text-slate-800 select-none opacity-80">
        {number}
      </div>
      <div className="relative z-10 ml-2">
        <div className="absolute -top-3 left-4 z-20 bg-white px-4 py-1 rounded shadow-md border border-slate-100">
          <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-slate-800">
            {title}
          </span>
        </div>
        <div className="relative bg-gradient-to-r from-[#1e4b85] to-[#3a7bd5] rounded-r-2xl rounded-bl-2xl shadow-lg p-5 pt-7 text-white transition-transform transform group-hover:scale-[1.01]">
          <div className="absolute top-0 right-0 w-24 h-full bg-white/5 skew-x-12 rounded-r-2xl pointer-events-none"></div>
          <div className="relative z-10">{children}</div>
          {!hideUpload && (
            <div className="absolute top-3 right-3 flex gap-2 z-30">
              {hasDoc ? (
                <>
                  <a
                    href={docUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 bg-white/20 hover:bg-white/40 rounded-md backdrop-blur-sm text-white"
                  >
                    <Eye className="w-4 h-4" />
                  </a>
                  <button
                    onClick={() => fileRef.current.click()}
                    className="p-1.5 bg-white/20 hover:bg-white/40 rounded-md backdrop-blur-sm text-white"
                  >
                    <UploadCloud className="w-4 h-4" />
                  </button>
                </>
              ) : (
                <button
                  onClick={() => fileRef.current.click()}
                  className="flex items-center gap-1 px-3 py-1 bg-white text-[#1e4b85] text-[10px] font-bold rounded shadow-sm hover:bg-slate-100"
                >
                  <UploadCloud className="w-3 h-3" /> Upload
                </button>
              )}
              <input
                type="file"
                ref={fileRef}
                onChange={(e) => onUpload(e.target.files[0])}
                accept="image/png, image/jpeg, image/jpg, application/pdf"
                className="hidden"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StaffProfile;
