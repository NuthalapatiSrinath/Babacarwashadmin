import React, { useState, useEffect } from "react";
import {
  Save,
  Settings as SettingsIcon,
  Phone,
  Loader2,
  BarChart3,
  Info,
  RotateCcw, // Icon for Reset
} from "lucide-react";
import toast from "react-hot-toast";
import { configurationService } from "../api/configurationService";

// --- DEFAULT CONFIGURATION (Original Blue/Red) ---
const DEFAULT_GRAPH_SETTINGS = {
  residenceJobs: { completed: "#2563eb", pending: "#dc2626", point: "#ffffff" },
  residencePayments: {
    completed: "#2563eb",
    pending: "#dc2626",
    point: "#ffffff",
  },
  onewashJobs: { completed: "#2563eb", pending: "#dc2626", point: "#ffffff" },
  onewashPayments: {
    completed: "#2563eb",
    pending: "#dc2626",
    point: "#ffffff",
  },
};

const Settings = () => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Tabs for the 4 different graphs
  const [activeGraphTab, setActiveGraphTab] = useState("residenceJobs");

  const [formData, setFormData] = useState({
    contactNumber: "",
    primaryColor: "#2563eb",
    graphs: DEFAULT_GRAPH_SETTINGS,
  });

  useEffect(() => {
    const fetchSettings = async () => {
      setLoading(true);
      try {
        // 1. Fetch Server Settings
        const response = await configurationService.fetch();
        if (response.data) {
          setFormData((prev) => ({
            ...prev,
            contactNumber: response.data.contactNumber || "",
            primaryColor: response.data.primaryColor || "#2563eb",
          }));
          if (response.data.primaryColor) {
            document.documentElement.style.setProperty(
              "--color-primary",
              response.data.primaryColor
            );
          }
        }

        // 2. Fetch Local Storage Graph Settings
        const savedGraphs = localStorage.getItem("admin_graph_colors");
        if (savedGraphs) {
          setFormData((prev) => ({ ...prev, graphs: JSON.parse(savedGraphs) }));
        }
      } catch (error) {
        // Silent fail
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleGraphColorChange = (graphKey, colorType, value) => {
    setFormData((prev) => ({
      ...prev,
      graphs: {
        ...prev.graphs,
        [graphKey]: {
          ...prev.graphs[graphKey],
          [colorType]: value,
        },
      },
    }));
  };

  // --- NEW: RESET HANDLER ---
  const handleResetDefaults = () => {
    if (
      window.confirm(
        "Are you sure you want to reset all graph colors to default?"
      )
    ) {
      setFormData((prev) => ({
        ...prev,
        graphs: DEFAULT_GRAPH_SETTINGS,
      }));
      toast.success("Colors reset to default. Click Save to apply.");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.contactNumber) {
      toast.error("Contact number is required");
      return;
    }

    setSaving(true);
    try {
      // Save Server Data
      await configurationService.update({
        contactNumber: formData.contactNumber,
        primaryColor: formData.primaryColor,
      });

      // Save Graph Data to LocalStorage
      localStorage.setItem(
        "admin_graph_colors",
        JSON.stringify(formData.graphs)
      );

      toast.success("All settings saved successfully");
    } catch (error) {
      console.error(error);
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const graphTabs = [
    { id: "residenceJobs", label: "Res. Jobs" },
    { id: "residencePayments", label: "Res. Payments" },
    { id: "onewashJobs", label: "One. Jobs" },
    { id: "onewashPayments", label: "One. Payments" },
  ];

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#f8f9fa]">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 w-full min-h-screen bg-[#f8f9fa] font-sans pb-20">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800">System Settings</h1>
        <p className="text-slate-500 text-sm mt-1">
          Manage configurations and dashboard appearance
        </p>
      </div>

      <form onSubmit={handleSubmit} className="max-w-4xl grid gap-8">
        {/* --- 1. GENERAL SETTINGS --- */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
            <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
              <Info className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-bold text-slate-800">
              General Information
            </h2>
          </div>
          <div className="grid gap-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Support Contact Number
              </label>
              <div className="relative max-w-md">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Phone className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  type="text"
                  value={formData.contactNumber}
                  onChange={(e) =>
                    setFormData({ ...formData, contactNumber: e.target.value })
                  }
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 transition-all text-slate-700"
                />
              </div>
            </div>
          </div>
        </div>

        {/* --- 2. GRAPH APPEARANCE --- */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
            <div className="p-2 bg-purple-50 rounded-lg text-purple-600">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">
                Analytics Graphs
              </h2>
              <p className="text-xs text-slate-500">
                Customize colors for each chart individually
              </p>
            </div>
          </div>

          {/* Graph Tabs */}
          <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
            {graphTabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveGraphTab(tab.id)}
                className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap ${
                  activeGraphTab === tab.id
                    ? "bg-slate-800 text-white shadow-md"
                    : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Color Pickers for Active Tab */}
          <div className="grid md:grid-cols-3 gap-6 bg-slate-50 p-6 rounded-xl border border-dashed border-slate-300">
            {/* Completed Color */}
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">
                Completed Color
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={formData.graphs[activeGraphTab].completed}
                  onChange={(e) =>
                    handleGraphColorChange(
                      activeGraphTab,
                      "completed",
                      e.target.value
                    )
                  }
                  className="w-12 h-12 rounded cursor-pointer border-0 p-0"
                />
                <input
                  type="text"
                  value={formData.graphs[activeGraphTab].completed}
                  onChange={(e) =>
                    handleGraphColorChange(
                      activeGraphTab,
                      "completed",
                      e.target.value
                    )
                  }
                  className="w-24 px-2 py-1 text-xs border rounded bg-white font-mono uppercase"
                />
              </div>
            </div>

            {/* Pending Color */}
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">
                Pending Color
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={formData.graphs[activeGraphTab].pending}
                  onChange={(e) =>
                    handleGraphColorChange(
                      activeGraphTab,
                      "pending",
                      e.target.value
                    )
                  }
                  className="w-12 h-12 rounded cursor-pointer border-0 p-0"
                />
                <input
                  type="text"
                  value={formData.graphs[activeGraphTab].pending}
                  onChange={(e) =>
                    handleGraphColorChange(
                      activeGraphTab,
                      "pending",
                      e.target.value
                    )
                  }
                  className="w-24 px-2 py-1 text-xs border rounded bg-white font-mono uppercase"
                />
              </div>
            </div>

            {/* Point Color */}
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">
                Point (Dot) Color
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={formData.graphs[activeGraphTab].point}
                  onChange={(e) =>
                    handleGraphColorChange(
                      activeGraphTab,
                      "point",
                      e.target.value
                    )
                  }
                  className="w-12 h-12 rounded cursor-pointer border-0 p-0"
                />
                <input
                  type="text"
                  value={formData.graphs[activeGraphTab].point}
                  onChange={(e) =>
                    handleGraphColorChange(
                      activeGraphTab,
                      "point",
                      e.target.value
                    )
                  }
                  className="w-24 px-2 py-1 text-xs border rounded bg-white font-mono uppercase"
                />
              </div>
            </div>
          </div>
        </div>

        {/* --- ACTIONS BUTTONS --- */}
        <div className="flex justify-end pt-4 gap-3">
          {/* RESET BUTTON */}
          <button
            type="button"
            onClick={handleResetDefaults}
            disabled={saving}
            className="bg-white border border-slate-300 text-slate-700 px-6 py-3 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-slate-50 transition-all disabled:opacity-70"
          >
            <RotateCcw className="w-4 h-4" /> Reset Defaults
          </button>

          {/* SAVE BUTTON */}
          <button
            type="submit"
            disabled={saving}
            className="bg-indigo-600 text-white px-8 py-3 rounded-xl text-sm font-bold flex items-center gap-2 shadow-lg hover:opacity-90 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" /> Save Settings
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default Settings;
