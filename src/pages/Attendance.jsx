import React, { useState, useEffect } from "react";
import {
  Search,
  Calendar,
  Download,
  User,
  Users,
  MapPin,
  Building,
  ShoppingBag,
  Filter,
  CheckCircle,
  XCircle,
  Loader2,
} from "lucide-react";
import toast from "react-hot-toast";

// Components
import DataTable from "../components/DataTable";

// APIs
import { attendanceService } from "../api/attendanceService";
import { mallService } from "../api/mallService";
import { siteService } from "../api/siteService";
import { buildingService } from "../api/buildingService";

const Attendance = () => {
  const [loading, setLoading] = useState(false);
  const [allData, setAllData] = useState([]); // Store ALL fetched data
  const [displayedData, setDisplayedData] = useState([]); // Store current page data

  // --- Filter States ---

  // Helper: Get Date String (YYYY-MM-DD)
  const getDateString = (daysOffset = 0) => {
    const date = new Date();
    date.setDate(date.getDate() + daysOffset);
    return date.toISOString().split("T")[0];
  };

  // UPDATED: Default is Yesterday (Start) to Today (End)
  const [dateRange, setDateRange] = useState({
    start: getDateString(-1), // Yesterday
    end: getDateString(0), // Today
  });

  const [activePremise, setActivePremise] = useState("all");

  // Dropdown Selections
  const [selectedEmployee, setSelectedEmployee] = useState("");
  const [selectedMall, setSelectedMall] = useState("");
  const [selectedSite, setSelectedSite] = useState("");
  const [selectedBuilding, setSelectedBuilding] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  // Pagination State (Client-Side)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 1,
  });

  // Options Data
  const [employees, setEmployees] = useState([]);
  const [malls, setMalls] = useState([]);
  const [sites, setSites] = useState([]);
  const [buildings, setBuildings] = useState([]);

  // --- 1. Load Filter Options ---
  useEffect(() => {
    const loadFilters = async () => {
      try {
        const [orgRes, mallsRes, sitesRes, bldgsRes] = await Promise.all([
          attendanceService.getOrgList(),
          mallService.list(1, 1000),
          siteService.list(1, 1000),
          buildingService.list(1, 1000),
        ]);

        setEmployees(orgRes.data || []);
        setMalls(mallsRes.data || []);
        setSites(sitesRes.data || []);
        setBuildings(bldgsRes.data || []);
      } catch (error) {
        console.error("Failed to load filter options", error);
      }
    };
    loadFilters();
  }, []);

  // --- 2. Fetch Data ---
  const fetchData = async () => {
    setLoading(true);
    try {
      const params = {
        startDate: dateRange.start,
        endDate: dateRange.end,
        search: searchTerm,
      };

      if (selectedEmployee) params.worker = selectedEmployee;

      if (activePremise !== "all") {
        params.premise = activePremise;
        if (activePremise === "mall" && selectedMall)
          params.mall = [selectedMall];
        if (activePremise === "site" && selectedSite)
          params.site = selectedSite;
        if (activePremise === "residence" && selectedBuilding)
          params.building = [selectedBuilding];
      }

      // API Call
      const response = await attendanceService.list(params);
      const fullList = response.data || [];

      // Store ALL data
      setAllData(fullList);

      // Reset to Page 1
      setPagination((prev) => ({
        ...prev,
        page: 1,
        total: fullList.length,
        totalPages: Math.ceil(fullList.length / prev.limit) || 1,
      }));
    } catch (error) {
      console.error(error);
      toast.error("Failed to load attendance records");
    } finally {
      setLoading(false);
    }
  };

  // --- 3. Handle Pagination (Slicing Data) ---
  useEffect(() => {
    const startIndex = (pagination.page - 1) * pagination.limit;
    const endIndex = startIndex + pagination.limit;
    setDisplayedData(allData.slice(startIndex, endIndex));
  }, [pagination.page, pagination.limit, allData]);

  // Trigger fetch when filters change
  useEffect(() => {
    fetchData();
  }, [
    dateRange,
    activePremise,
    selectedEmployee,
    selectedMall,
    selectedSite,
    selectedBuilding,
  ]);

  // Handle Search on Enter
  const handleSearchSubmit = (e) => {
    if (e.key === "Enter") fetchData();
  };

  // --- 4. Handlers ---

  const handlePageChange = (newPage) => {
    setPagination((prev) => ({ ...prev, page: newPage }));
  };

  const handleLimitChange = (newLimit) => {
    setPagination((prev) => ({
      ...prev,
      limit: newLimit,
      page: 1, // Reset to page 1 on limit change
      totalPages: Math.ceil(allData.length / newLimit) || 1,
    }));
  };

  const handleStatusToggle = async (row, statusType) => {
    const isPresent = statusType === "P";
    if (row.present === isPresent) return;

    // Optimistic Update
    const updatedList = allData.map((item) =>
      item._id === row._id
        ? { ...item, present: isPresent, type: isPresent ? "" : "AB" }
        : item
    );
    setAllData(updatedList);

    try {
      await attendanceService.update({
        ids: [row._id],
        present: isPresent,
        type: isPresent ? "" : "AB",
        notes: row.notes,
      });
      toast.success(isPresent ? "Marked Present" : "Marked Absent");
    } catch (error) {
      toast.error("Update failed");
      fetchData(); // Revert on error
    }
  };

  const handleNoteBlur = async (row, newNote) => {
    if (row.notes === newNote) return;
    try {
      await attendanceService.update({
        ids: [row._id],
        present: row.present,
        type: row.type,
        notes: newNote,
      });
      toast.success("Note saved");
    } catch (error) {
      toast.error("Failed to save note");
    }
  };

  const handleExport = async () => {
    try {
      toast.loading("Exporting...");
      const params = {
        startDate: dateRange.start,
        endDate: dateRange.end,
        premise: activePremise !== "all" ? activePremise : undefined,
        worker: selectedEmployee || undefined,
      };

      if (activePremise === "mall" && selectedMall)
        params.mall = [selectedMall];
      if (activePremise === "site" && selectedSite) params.site = selectedSite;
      if (activePremise === "residence" && selectedBuilding)
        params.building = [selectedBuilding];

      const blob = await attendanceService.exportData(params);
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `Attendance_${dateRange.start}_to_${dateRange.end}.xlsx`
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.dismiss();
      toast.success("Export successful");
    } catch (error) {
      console.error(error);
      toast.dismiss();
      toast.error("Export failed");
    }
  };

  // --- Columns Configuration ---
  const columns = [
    {
      header: "Date",
      accessor: "date",
      className: "w-32",
      render: (row) => (
        <div className="flex items-center gap-2 text-slate-600 text-xs font-medium">
          <Calendar className="w-3.5 h-3.5 text-slate-400" />
          {new Date(row.date).toLocaleDateString()}
        </div>
      ),
    },
    {
      header: "Employee Details",
      accessor: "worker",
      render: (row) => {
        const person = row.worker || row.staff || {};
        const isWorker = !!row.worker;
        return (
          <div className="flex flex-col">
            <span className="font-semibold text-slate-800 text-sm">
              {person.name || "Unknown"}
            </span>
            <div className="flex items-center gap-2 mt-1">
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded border uppercase font-bold tracking-wide ${
                  isWorker
                    ? "bg-blue-50 text-blue-600 border-blue-100"
                    : "bg-purple-50 text-purple-600 border-purple-100"
                }`}
              >
                {isWorker ? "Worker" : "Staff"}
              </span>
              <span className="text-[11px] text-slate-400 font-mono">
                {person.mobile || person.employeeCode || "No ID"}
              </span>
            </div>
          </div>
        );
      },
    },
    {
      header: "Attendance",
      accessor: "present",
      className: "w-40",
      render: (row) => (
        <div className="flex bg-slate-100 p-1 rounded-lg w-fit shadow-inner gap-1">
          <button
            onClick={() => handleStatusToggle(row, "P")}
            className={`w-8 h-8 rounded-md flex items-center justify-center text-sm font-bold transition-all duration-200 ${
              row.present
                ? "bg-green-500 text-white shadow-md scale-105"
                : "text-slate-400 hover:text-slate-600 hover:bg-slate-200"
            }`}
            title="Mark Present"
          >
            P
          </button>

          <button
            onClick={() => handleStatusToggle(row, "A")}
            className={`w-8 h-8 rounded-md flex items-center justify-center text-sm font-bold transition-all duration-200 ${
              !row.present
                ? "bg-red-500 text-white shadow-md scale-105"
                : "text-slate-400 hover:text-slate-600 hover:bg-slate-200"
            }`}
            title="Mark Absent"
          >
            A
          </button>
        </div>
      ),
    },
    {
      header: "Remark / Notes",
      accessor: "notes",
      render: (row) => (
        <div className="relative group">
          <input
            type="text"
            defaultValue={row.notes || ""}
            onBlur={(e) => handleNoteBlur(row, e.target.value)}
            placeholder="Add note..."
            className="w-full bg-transparent border-b border-transparent group-hover:border-slate-200 focus:border-blue-500 px-2 py-1 text-sm outline-none transition-all text-slate-600 placeholder:text-slate-300"
          />
        </div>
      ),
    },
  ];

  return (
    <div className="p-2 max-w-7xl mx-auto min-h-screen font-sans bg-slate-50/30">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
        {/* <div>
          <h1 className="text-2xl font-bold text-slate-800">Attendance</h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage daily logs for Workers and Staff
          </p>
        </div> */}
        <button
          onClick={handleExport}
          className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-4 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2 shadow-sm transition-all active:scale-95"
        >
          <Download className="w-4 h-4 text-green-600" />
          <span>Export Excel</span>
        </button>
      </div>

      {/* Filter Control Panel */}
      <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 mb-6 space-y-5">
        {/* Row 1: Premise Tabs & Date */}
        <div className="flex flex-col lg:flex-row gap-5 justify-between">
          <div className="flex p-1 bg-slate-100 rounded-lg w-fit">
            {[
              { id: "all", label: "All", icon: Users },
              { id: "residence", label: "Residence", icon: Building },
              { id: "mall", label: "Mall", icon: ShoppingBag },
              { id: "site", label: "Site", icon: MapPin },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActivePremise(tab.id);
                  setSelectedMall("");
                  setSelectedSite("");
                  setSelectedBuilding("");
                }}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-all flex items-center gap-2 ${
                  activePremise === tab.id
                    ? "bg-white text-blue-600 shadow-sm ring-1 ring-black/5"
                    : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
                }`}
              >
                <tab.icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-2 shadow-sm">
            <Calendar className="w-4 h-4 text-slate-400" />
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) =>
                setDateRange({ ...dateRange, start: e.target.value })
              }
              className="bg-transparent text-sm text-slate-700 outline-none w-32 cursor-pointer"
            />
            <span className="text-slate-300 text-xs">to</span>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) =>
                setDateRange({ ...dateRange, end: e.target.value })
              }
              className="bg-transparent text-sm text-slate-700 outline-none w-32 cursor-pointer"
            />
          </div>
        </div>

        {/* Row 2: Dynamic Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-slate-100">
          <div className="relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={handleSearchSubmit}
              className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-100 outline-none"
            />
          </div>

          <div className="relative">
            <User className="absolute left-3 top-3 w-4 h-4 text-slate-400 pointer-events-none" />
            <select
              value={selectedEmployee}
              onChange={(e) => setSelectedEmployee(e.target.value)}
              className="w-full pl-9 pr-8 py-2.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-100 outline-none appearance-none bg-white cursor-pointer"
            >
              <option value="">All Employees</option>
              {employees.map((emp) => (
                <option key={emp._id} value={emp._id}>
                  {emp.name} ({emp.mobile || emp.employeeCode})
                </option>
              ))}
            </select>
          </div>

          {activePremise === "mall" && (
            <div className="relative">
              <ShoppingBag className="absolute left-3 top-3 w-4 h-4 text-slate-400 pointer-events-none" />
              <select
                value={selectedMall}
                onChange={(e) => setSelectedMall(e.target.value)}
                className="w-full pl-9 pr-8 py-2.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-100 outline-none appearance-none bg-white cursor-pointer"
              >
                <option value="">All Malls</option>
                {malls.map((m) => (
                  <option key={m._id} value={m._id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {activePremise === "site" && (
            <div className="relative">
              <MapPin className="absolute left-3 top-3 w-4 h-4 text-slate-400 pointer-events-none" />
              <select
                value={selectedSite}
                onChange={(e) => setSelectedSite(e.target.value)}
                className="w-full pl-9 pr-8 py-2.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-100 outline-none appearance-none bg-white cursor-pointer"
              >
                <option value="">All Sites</option>
                {sites.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {activePremise === "residence" && (
            <div className="relative">
              <Building className="absolute left-3 top-3 w-4 h-4 text-slate-400 pointer-events-none" />
              <select
                value={selectedBuilding}
                onChange={(e) => setSelectedBuilding(e.target.value)}
                className="w-full pl-9 pr-8 py-2.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-100 outline-none appearance-none bg-white cursor-pointer"
              >
                <option value="">All Buildings</option>
                {buildings.map((b) => (
                  <option key={b._id} value={b._id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <button
            onClick={fetchData}
            className="bg-slate-800 hover:bg-slate-900 text-white px-6 py-2.5 rounded-lg text-sm font-medium transition-colors shadow-sm flex items-center justify-center gap-2"
          >
            <Filter className="w-4 h-4" /> Filter
          </button>
        </div>
      </div>

      {/* --- Data Table with Client-Side Pagination --- */}
      <DataTable
        title="Attendance Records"
        columns={columns}
        data={displayedData} // Pass sliced data
        loading={loading}
        pagination={pagination}
        onPageChange={handlePageChange}
        onLimitChange={handleLimitChange}
      />
    </div>
  );
};

export default Attendance;
