import React, { useState, useEffect } from "react";
import {
  Plus,
  Edit2,
  Trash2,
  Search,
  Users,
  Loader2,
  ShieldCheck,
  ShieldOff,
  Phone,
  Eye,
  EyeOff,
  X,
  ChevronDown,
  ChevronUp,
  LayoutGrid,
  MessageSquare,
  Shield,
} from "lucide-react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { adminStaffService } from "../../api/adminStaffService";

const AdminStaff = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [saving, setSaving] = useState(false);

  // Create/Edit form
  const [form, setForm] = useState({ name: "", number: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Fetch admin staff list
  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await adminStaffService.list({ search, limit: 100 });
      setData(response.data || []);
      setTotal(response.total || 0);
    } catch (error) {
      toast.error(error.message || "Failed to load staff");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [search]);

  // Create or Update Staff
  const handleSave = async () => {
    if (!form.name?.trim() || !form.number?.trim()) {
      toast.error("Name and phone number are required");
      return;
    }
    if (!isEditing && !form.password?.trim()) {
      toast.error("Password is required for new staff");
      return;
    }

    setSaving(true);
    try {
      if (isEditing && selectedStaff) {
        const payload = { name: form.name, number: form.number };
        if (form.password?.trim()) payload.password = form.password;
        await adminStaffService.update(selectedStaff._id, payload);
        toast.success("Staff updated successfully");
      } else {
        await adminStaffService.create(form);
        toast.success("Staff created successfully");
      }
      setIsCreateOpen(false);
      setForm({ name: "", number: "", password: "" });
      setSelectedStaff(null);
      setIsEditing(false);
      fetchData();
    } catch (error) {
      toast.error(error.message || "Failed to save staff");
    } finally {
      setSaving(false);
    }
  };

  // Open Edit
  const handleEdit = (staff) => {
    setSelectedStaff(staff);
    setForm({ name: staff.name, number: staff.number, password: "" });
    setIsEditing(true);
    setIsCreateOpen(true);
  };

  // Toggle Block/Unblock
  const handleToggleBlock = async (staff) => {
    try {
      await adminStaffService.update(staff._id, {
        isBlocked: !staff.isBlocked,
      });
      toast.success(staff.isBlocked ? "Staff unblocked" : "Staff blocked");
      fetchData();
    } catch (error) {
      toast.error(error.message || "Failed to update");
    }
  };

  // Delete
  const handleDelete = async () => {
    if (!selectedStaff) return;
    setSaving(true);
    try {
      await adminStaffService.delete(selectedStaff._id);
      toast.success("Staff deleted");
      setIsDeleteOpen(false);
      setSelectedStaff(null);
      fetchData();
    } catch (error) {
      toast.error(error.message || "Failed to delete");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text-main flex items-center gap-2">
            <Shield className="w-7 h-7 text-primary" />
            Admin Staff Management
          </h1>
          <p className="text-sm text-text-sub mt-1">
            Create and manage staff members who can access the admin panel with
            restricted permissions
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/admin-staff/access-requests")}
            className="flex items-center gap-2 px-4 py-2.5 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors font-medium text-sm"
          >
            <MessageSquare className="w-4 h-4" />
            Access Requests
          </button>
          <button
            onClick={() => {
              setIsEditing(false);
              setSelectedStaff(null);
              setForm({ name: "", number: "", password: "" });
              setIsCreateOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium text-sm"
          >
            <Plus className="w-4 h-4" />
            Add Staff
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-sub" />
          <input
            type="text"
            placeholder="Search by name or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-card border border-border rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
          />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Users className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-text-main">{total}</p>
              <p className="text-xs text-text-sub">Total Staff</p>
            </div>
          </div>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-emerald-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-text-main">
                {data.filter((s) => !s.isBlocked).length}
              </p>
              <p className="text-xs text-text-sub">Active</p>
            </div>
          </div>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center">
              <ShieldOff className="w-5 h-5 text-red-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-text-main">
                {data.filter((s) => s.isBlocked).length}
              </p>
              <p className="text-xs text-text-sub">Blocked</p>
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : data.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-text-sub">
            <Users className="w-12 h-12 mb-3 opacity-30" />
            <p className="text-sm">No admin staff found</p>
            <p className="text-xs mt-1">
              Click "Add Staff" to create a new staff member
            </p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-page">
                <th className="text-left py-3 px-4 font-semibold text-text-sub text-xs uppercase">
                  Name
                </th>
                <th className="text-left py-3 px-4 font-semibold text-text-sub text-xs uppercase">
                  Phone
                </th>
                <th className="text-left py-3 px-4 font-semibold text-text-sub text-xs uppercase">
                  Status
                </th>
                <th className="text-left py-3 px-4 font-semibold text-text-sub text-xs uppercase">
                  Created
                </th>
                <th className="text-right py-3 px-4 font-semibold text-text-sub text-xs uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {data.map((staff) => (
                <tr
                  key={staff._id}
                  className="border-b border-border/50 hover:bg-page/50 transition-colors"
                >
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-xs font-bold text-primary">
                          {staff.name?.charAt(0)?.toUpperCase()}
                        </span>
                      </div>
                      <span className="font-medium text-text-main">
                        {staff.name}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-1.5 text-text-sub">
                      <Phone className="w-3.5 h-3.5" />
                      {staff.number}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <button
                      onClick={() => handleToggleBlock(staff)}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-colors cursor-pointer ${
                        staff.isBlocked
                          ? "bg-red-50 text-red-600 hover:bg-red-100"
                          : "bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                      }`}
                    >
                      {staff.isBlocked ? (
                        <>
                          <ShieldOff className="w-3 h-3" /> Blocked
                        </>
                      ) : (
                        <>
                          <ShieldCheck className="w-3 h-3" /> Active
                        </>
                      )}
                    </button>
                  </td>
                  <td className="py-3 px-4 text-text-sub text-xs">
                    {staff.createdAt
                      ? new Date(staff.createdAt).toLocaleDateString("en-GB")
                      : "—"}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleEdit(staff)}
                        className="p-2 hover:bg-primary/10 text-text-sub hover:text-primary rounded-lg transition-colors"
                        title="Edit"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() =>
                          navigate(`/admin-staff/${staff._id}/page-permissions`)
                        }
                        className="p-2 hover:bg-indigo-50 text-text-sub hover:text-indigo-600 rounded-lg transition-colors"
                        title="Page Permissions (Columns, Actions, Toolbar)"
                      >
                        <LayoutGrid className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedStaff(staff);
                          setIsDeleteOpen(true);
                        }}
                        className="p-2 hover:bg-red-50 text-text-sub hover:text-red-500 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ======= CREATE/EDIT MODAL ======= */}
      {isCreateOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card rounded-2xl shadow-xl border border-border w-full max-w-md">
            <div className="p-6 border-b border-border">
              <h2 className="text-lg font-bold text-text-main">
                {isEditing ? "Edit Staff" : "Add New Staff"}
              </h2>
              <p className="text-xs text-text-sub mt-1">
                {isEditing
                  ? "Update staff member details"
                  : "Create a new admin panel staff member"}
              </p>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-main mb-1.5">
                  Full Name
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Enter full name"
                  className="w-full px-4 py-2.5 border border-border rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none bg-page"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-main mb-1.5">
                  Phone Number
                </label>
                <input
                  type="text"
                  value={form.number}
                  onChange={(e) => setForm({ ...form, number: e.target.value })}
                  placeholder="Enter phone number"
                  className="w-full px-4 py-2.5 border border-border rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none bg-page"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-main mb-1.5">
                  Password{" "}
                  {isEditing && (
                    <span className="text-text-sub font-normal">
                      (leave blank to keep current)
                    </span>
                  )}
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={form.password}
                    onChange={(e) =>
                      setForm({ ...form, password: e.target.value })
                    }
                    placeholder={
                      isEditing ? "Enter new password" : "Enter password"
                    }
                    className="w-full px-4 py-2.5 border border-border rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none bg-page pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-sub hover:text-text-main"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-border flex justify-end gap-3">
              <button
                onClick={() => {
                  setIsCreateOpen(false);
                  setForm({ name: "", number: "", password: "" });
                  setIsEditing(false);
                  setSelectedStaff(null);
                }}
                className="px-4 py-2.5 text-sm font-medium text-text-sub hover:text-text-main border border-border rounded-lg hover:bg-page transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2.5 text-sm font-medium bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                {isEditing ? "Update" : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======= DELETE CONFIRMATION ======= */}
      {isDeleteOpen && selectedStaff && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card rounded-2xl shadow-xl border border-border w-full max-w-sm">
            <div className="p-6 text-center">
              <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-7 h-7 text-red-500" />
              </div>
              <h3 className="text-lg font-bold text-text-main">
                Delete Staff Member?
              </h3>
              <p className="text-sm text-text-sub mt-2">
                Are you sure you want to delete{" "}
                <strong>{selectedStaff.name}</strong>? They will no longer be
                able to access the admin panel.
              </p>
            </div>
            <div className="p-4 border-t border-border flex gap-3">
              <button
                onClick={() => {
                  setIsDeleteOpen(false);
                  setSelectedStaff(null);
                }}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-text-sub border border-border rounded-lg hover:bg-page transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={saving}
                className="flex-1 px-4 py-2.5 text-sm font-medium bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminStaff;
