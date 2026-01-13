import React, { useState, useEffect, useMemo } from "react";
import {
  Calendar,
  Download,
  User,
  Users,
  MapPin,
  Building,
  ShoppingBag,
  CheckCircle,
} from "lucide-react";
import toast from "react-hot-toast";

// Components
import DataTable from "../../components/DataTable";
import RichDateRangePicker from "../../components/inputs/RichDateRangePicker";
import CustomDropdown from "../../components/ui/CustomDropdown"; // ✅ Import CustomDropdown

// APIs
import { attendanceService } from "../../api/attendanceService";
import { mallService } from "../../api/mallService";
import { siteService } from "../../api/siteService";
import { buildingService } from "../../api/buildingService";

const Attendance = () => {
  // --- DATE HELPERS ---
  const formatDateLocal = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const getToday = () => formatDateLocal(new Date());

  const getLast10Days = () => {
    const d = new Date();
    d.setDate(d.getDate() - 10);
    return formatDateLocal(d);
  };

  // --- STATE ---
  const [loading, setLoading] = useState(false);
  const [allData, setAllData] = useState([]); // Master list from API

  // Filters
  const [dateRange, setDateRange] = useState({
    startDate: getLast10Days(),
    endDate: getToday(),
  });
  const [activePremise, setActivePremise] = useState("all");
  const [selectedEmployee, setSelectedEmployee] = useState("");
  const [selectedMall, setSelectedMall] = useState("");
  const [selectedSite, setSelectedSite] = useState("");
  const [selectedBuilding, setSelectedBuilding] = useState("");

  // Search (Local)
  const [searchTerm, setSearchTerm] = useState("");

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 1,
  });

  // Dropdown Options
  const [employees, setEmployees] = useState([]);
  const [malls, setMalls] = useState([]);
  const [sites, setSites] = useState([]);
  const [buildings, setBuildings] = useState([]);

  // --- 1. INITIAL LOAD ---
  useEffect(() => {
    const loadOptions = async () => {
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
        console.error("Failed to load options", error);
      }
    };
    loadOptions();
    // Also trigger initial data fetch
    fetchRecords();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- 2. FETCH DATA (API) ---
  const fetchRecords = async () => {
    setLoading(true);
    try {
      const start = new Date(dateRange.startDate);
      const end = new Date(dateRange.endDate);

      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        console.warn("Invalid dates selected");
        setLoading(false);
        return;
      }

      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);

      const params = {
        startDate: start.toISOString(),
        endDate: end.toISOString(),
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

      const response = await attendanceService.list(params);
      const fullList = Array.isArray(response.data) ? response.data : [];

      // Sort Newest First
      fullList.sort((a, b) => new Date(b.date) - new Date(a.date));

      setAllData(fullList);
    } catch (error) {
      console.error(error);
      setAllData([]);
    } finally {
      setLoading(false);
    }
  };

  // --- 3. AUTO-FETCH ON FILTER CHANGE ---
  useEffect(() => {
    setPagination((prev) => ({ ...prev, page: 1 }));
    fetchRecords();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    dateRange,
    activePremise,
    selectedEmployee,
    selectedMall,
    selectedSite,
    selectedBuilding,
  ]);

  // --- 4. CLIENT-SIDE SEARCH & PAGINATION ---
  const filteredData = useMemo(() => {
    if (!searchTerm) return allData;

    const lowerTerm = searchTerm.toLowerCase();
    return allData.filter((item) => {
      const workerName = item.worker?.name?.toLowerCase() || "";
      const staffName = item.staff?.name?.toLowerCase() || "";
      const notes = item.notes?.toLowerCase() || "";
      const employeeId =
        item.worker?.employeeCode?.toLowerCase() ||
        item.staff?.employeeCode?.toLowerCase() ||
        "";

      return (
        workerName.includes(lowerTerm) ||
        staffName.includes(lowerTerm) ||
        notes.includes(lowerTerm) ||
        employeeId.includes(lowerTerm)
      );
    });
  }, [allData, searchTerm]);

  // Slice for current page
  const displayedData = useMemo(() => {
    const startIndex = (pagination.page - 1) * pagination.limit;
    return filteredData.slice(startIndex, startIndex + pagination.limit);
  }, [filteredData, pagination.page, pagination.limit]);

  // Update total counts
  useEffect(() => {
    setPagination((prev) => ({
      ...prev,
      total: filteredData.length,
      totalPages: Math.ceil(filteredData.length / prev.limit) || 1,
    }));
  }, [filteredData.length, pagination.limit]);

  // --- 5. HANDLERS ---

  const handleDateChange = (field, value) => {
    if (field === "clear") {
      setDateRange({ startDate: getLast10Days(), endDate: getToday() });
    } else {
      setDateRange((prev) => ({ ...prev, [field]: value }));
    }
  };

  const handlePremiseChange = (newPremise) => {
    setActivePremise(newPremise);
    setSelectedMall("");
    setSelectedSite("");
    setSelectedBuilding("");
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
      fetchRecords(); // Revert
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
      const start = new Date(dateRange.startDate);
      const end = new Date(dateRange.endDate);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);

      const params = {
        startDate: start.toISOString(),
        endDate: end.toISOString(),
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
      link.setAttribute("download", `Attendance_Export.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.dismiss();
      toast.success("Export successful");
    } catch (error) {
      toast.dismiss();
      toast.error("Export failed");
    }
  };

  // --- PREPARE DROPDOWN OPTIONS ---
  const employeeOptions = useMemo(
    () => [
      { value: "", label: "All Employees" },
      ...employees.map((emp) => ({
        value: emp._id,
        label: `${emp.name} (${emp.mobile || emp.employeeCode})`,
      })),
    ],
    [employees]
  );

  const mallOptions = useMemo(
    () => [
      { value: "", label: "All Malls" },
      ...malls.map((m) => ({ value: m._id, label: m.name })),
    ],
    [malls]
  );

  const siteOptions = useMemo(
    () => [
      { value: "", label: "All Sites" },
      ...sites.map((s) => ({ value: s._id, label: s.name })),
    ],
    [sites]
  );

  const buildingOptions = useMemo(
    () => [
      { value: "", label: "All Buildings" },
      ...buildings.map((b) => ({ value: b._id, label: b.name })),
    ],
    [buildings]
  );

  // --- COLUMNS ---
  const columns = [
    {
      header: "Date",
      accessor: "date",
      className: "w-32",
      render: (row) => (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
            <Calendar className="w-4 h-4" />
          </div>
          <span className="text-slate-700 text-xs font-bold">
            {new Date(row.date).toLocaleDateString()}
          </span>
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
            <span className="font-bold text-slate-800 text-sm">
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
                ? "bg-emerald-500 text-white shadow-md scale-105"
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
        <div className="relative group w-full max-w-xs">
          <input
            type="text"
            defaultValue={row.notes || ""}
            onBlur={(e) => handleNoteBlur(row, e.target.value)}
            placeholder="Add note..."
            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 transition-all text-slate-700 placeholder:text-slate-400"
          />
        </div>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6 font-sans">
      {/* --- HEADER --- */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-200">
            <CheckCircle className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-slate-800 to-indigo-800 bg-clip-text text-transparent">
              Attendance
            </h1>
            <p className="text-sm text-slate-500 font-medium">
              Manage daily logs
            </p>
          </div>
        </div>

        <button
          onClick={handleExport}
          className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 shadow-sm transition-all active:scale-95"
        >
          <Download className="w-4 h-4 text-emerald-600" />
          <span>Export Excel</span>
        </button>
      </div>

      {/* --- FILTERS --- */}
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden flex flex-col">
        <div className="p-5 border-b border-gray-100 bg-slate-50/50 space-y-5">
          <div className="flex flex-col xl:flex-row gap-5 justify-between items-start xl:items-end">
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-bold text-slate-500 uppercase ml-1">
                Premise Type
              </span>
              <div className="flex p-1 bg-white border border-slate-200 rounded-lg w-fit shadow-sm">
                {[
                  { id: "all", label: "All", icon: Users },
                  { id: "residence", label: "Residence", icon: Building },
                  { id: "mall", label: "Mall", icon: ShoppingBag },
                  { id: "site", label: "Site", icon: MapPin },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => handlePremiseChange(tab.id)}
                    className={`px-4 py-2 text-sm font-bold rounded-md transition-all flex items-center gap-2 ${
                      activePremise === tab.id
                        ? "bg-slate-800 text-white shadow-md"
                        : "text-slate-500 hover:text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    <tab.icon className="w-3.5 h-3.5" />
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="w-full xl:w-auto">
              <span className="text-xs font-bold text-slate-500 uppercase mb-1.5 block ml-1">
                Date Range
              </span>
              <RichDateRangePicker
                startDate={dateRange.startDate}
                endDate={dateRange.endDate}
                onChange={handleDateChange}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-4 border-t border-slate-200/60">
            {/* Employee Dropdown - Using CustomDropdown */}
            <div className="relative">
              <CustomDropdown
                value={selectedEmployee}
                onChange={setSelectedEmployee}
                options={employeeOptions}
                icon={User}
                placeholder="All Employees"
                searchable={true}
              />
            </div>

            {/* Dynamic Dropdowns - Using CustomDropdown */}
            <div className="relative col-span-1 md:col-span-2">
              {activePremise === "mall" && (
                <CustomDropdown
                  value={selectedMall}
                  onChange={setSelectedMall}
                  options={mallOptions}
                  icon={ShoppingBag}
                  placeholder="All Malls"
                  searchable={true}
                />
              )}
              {activePremise === "site" && (
                <CustomDropdown
                  value={selectedSite}
                  onChange={setSelectedSite}
                  options={siteOptions}
                  icon={MapPin}
                  placeholder="All Sites"
                  searchable={true}
                />
              )}
              {activePremise === "residence" && (
                <CustomDropdown
                  value={selectedBuilding}
                  onChange={setSelectedBuilding}
                  options={buildingOptions}
                  icon={Building}
                  placeholder="All Buildings"
                  searchable={true}
                />
              )}
              {activePremise === "all" && (
                <div className="w-full py-2.5 px-4 text-sm text-slate-400 italic bg-slate-50 border border-slate-200 rounded-xl select-none">
                  (Select a premise type above to filter further)
                </div>
              )}
            </div>
          </div>
        </div>

        {/* --- DATA TABLE --- */}
        <DataTable
          columns={columns}
          data={displayedData}
          loading={loading}
          pagination={pagination}
          onPageChange={(page) => setPagination((prev) => ({ ...prev, page }))}
          onLimitChange={(limit) =>
            setPagination((prev) => ({ ...prev, limit, page: 1 }))
          }
          // Enabling the DataTable's built-in search bar
          onSearch={(term) => {
            setSearchTerm(term);
            setPagination((prev) => ({ ...prev, page: 1 }));
          }}
          searchPlaceholder="Search Name or ID..."
        />
      </div>
    </div>
  );
};

export default Attendance;
