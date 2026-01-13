import React, { useState, useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Download,
  Search,
  Filter,
  User,
  Building,
  Banknote,
  CreditCard,
  Landmark,
  FileText,
  Edit2,
  Trash2,
  Eye,
  Receipt,
  Wallet,
  Calendar,
  CheckCircle2, // Settle Icon
  CheckSquare, // Mark Paid Icon
  Clock,
} from "lucide-react";
import toast from "react-hot-toast";

// Components
import DataTable from "../../components/DataTable";
import ReceiptModal from "../../components/modals/ReceiptModal";
import ResidenceReceiptModal from "../../components/modals/ResidenceReceiptModal";
import ViewPaymentModal from "../../components/modals/ViewPaymentModal";
import DeleteModal from "../../components/modals/DeleteModal";
import PaymentModal from "../../components/modals/PaymentModal";
import RichDateRangePicker from "../../components/inputs/RichDateRangePicker";
import CustomDropdown from "../../components/ui/CustomDropdown"; // Import CustomDropdown

// Redux
import {
  fetchResidencePayments,
  deleteResidencePayment,
} from "../../redux/slices/residencePaymentSlice";
import { fetchWorkers } from "../../redux/slices/workerSlice";
import {
  exportPayments,
  settlePaymentsBulk,
  bulkUpdatePaymentStatus,
} from "../../redux/slices/paymentSlice";

const ResidencePayments = () => {
  const dispatch = useDispatch();

  const { payments, stats, loading, total } = useSelector(
    (state) => state.residencePayment
  );
  const { workers } = useSelector((state) => state.worker);

  const [currency, setCurrency] = useState("AED"); // Default Currency

  // --- DATES & TABS LOGIC ---

  const getMonthNames = () => {
    const today = new Date();
    const thisMonth = today.toLocaleString("default", { month: "long" });

    const prevDate = new Date();
    prevDate.setMonth(prevDate.getMonth() - 1);
    const lastMonth = prevDate.toLocaleString("default", { month: "long" });

    return { thisMonth, lastMonth };
  };

  const { thisMonth, lastMonth } = getMonthNames();

  const getRangeForTab = (tab) => {
    const today = new Date();
    let start, end;

    if (tab === "this_month") {
      start = new Date(today.getFullYear(), today.getMonth(), 1);
      start.setDate(start.getDate() - 1);
      start.setUTCHours(18, 30, 0, 0);

      end = new Date();
      end.setUTCHours(18, 29, 59, 999);
    } else {
      start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      start.setDate(start.getDate() - 1);
      start.setUTCHours(18, 30, 0, 0);

      end = new Date(today.getFullYear(), today.getMonth(), 0);
      end.setUTCHours(18, 29, 59, 999);
    }

    return {
      startDate: start.toISOString(),
      endDate: end.toISOString(),
    };
  };

  const [activeTab, setActiveTab] = useState("this_month");
  const initialDates = getRangeForTab("this_month");

  const [filters, setFilters] = useState({
    startDate: initialDates.startDate,
    endDate: initialDates.endDate,
    worker: "",
    status: "",
    onewash: "false",
    building: "",
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 1,
  });

  // Modal States
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [activeModal, setActiveModal] = useState(null);
  const [viewPayment, setViewPayment] = useState(null);
  const [deletePayment, setDeletePayment] = useState(null);
  const [editPayment, setEditPayment] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSettling, setIsSettling] = useState(false);
  const [isMarkingPaid, setIsMarkingPaid] = useState(false);

  // Load Currency & Initial Data
  useEffect(() => {
    const savedCurrency = localStorage.getItem("app_currency");
    if (savedCurrency) setCurrency(savedCurrency);

    dispatch(fetchWorkers({ page: 1, limit: 1000, status: 1 }));
    fetchData(1, 50);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch]);

  useEffect(() => {
    fetchData(1, pagination.limit);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      const limit = searchTerm ? 3000 : 50;
      fetchData(1, limit);
    }, 500);
    return () => clearTimeout(delayDebounceFn);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm]);

  const fetchData = async (page = 1, limit = 50) => {
    try {
      const isSearching = searchTerm.trim().length > 0;
      const fetchLimit = isSearching ? 3000 : limit;

      const result = await dispatch(
        fetchResidencePayments({
          page,
          limit: fetchLimit,
          search: "",
          filters: filters,
        })
      ).unwrap();

      setPagination({
        page,
        limit: fetchLimit,
        total: result.total || 0,
        totalPages: Math.ceil((result.total || 0) / fetchLimit) || 1,
      });
    } catch (e) {
      toast.error("Failed to load payments");
    }
  };

  // --- CLIENT SIDE FILTERING ---
  const filteredPayments = payments.filter((row) => {
    if (!searchTerm) return true;
    const lowerTerm = searchTerm.toLowerCase().trim();

    const id = String(row.id || row._id || "").toLowerCase();
    const vehicleReg = row.vehicle?.registration_no?.toLowerCase() || "";
    const parkingNo = row.vehicle?.parking_no?.toString().toLowerCase() || "";
    const fName = row.customer?.firstName || "";
    const lName = row.customer?.lastName || "";
    const customerName = `${fName} ${lName}`.toLowerCase();
    const mobile = row.customer?.mobile?.toLowerCase() || "";
    const buildingName =
      row.customer?.building?.name?.toLowerCase() ||
      row.building?.name?.toLowerCase() ||
      "";
    const workerName = row.worker?.name ? row.worker.name.toLowerCase() : "";
    const amountTotal = String(row.total_amount || "").toLowerCase();
    const amountPaid = String(row.amount_paid || "").toLowerCase();
    const paymentMode = row.payment_mode?.toLowerCase() || "";
    const status = row.status?.toLowerCase() || "";
    const dateObj = new Date(row.createdAt);
    const dateStr = dateObj.toLocaleDateString().toLowerCase();
    const monthStr = dateObj
      .toLocaleString("default", { month: "long" })
      .toLowerCase();

    return (
      id.includes(lowerTerm) ||
      vehicleReg.includes(lowerTerm) ||
      parkingNo.includes(lowerTerm) ||
      customerName.includes(lowerTerm) ||
      mobile.includes(lowerTerm) ||
      buildingName.includes(lowerTerm) ||
      workerName.includes(lowerTerm) ||
      amountTotal.includes(lowerTerm) ||
      amountPaid.includes(lowerTerm) ||
      paymentMode.includes(lowerTerm) ||
      status.includes(lowerTerm) ||
      dateStr.includes(lowerTerm) ||
      monthStr.includes(lowerTerm)
    );
  });

  // --- HANDLERS ---

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    const newDates = getRangeForTab(tab);
    setFilters((prev) => ({
      ...prev,
      startDate: newDates.startDate,
      endDate: newDates.endDate,
    }));
  };

  const handleBulkSettle = async () => {
    const pendingIds = filteredPayments
      .filter((row) => (row.settled || "pending").toLowerCase() !== "completed")
      .map((row) => row._id || row.id);

    if (pendingIds.length === 0) {
      toast.success("All displayed payments are already settled!");
      return;
    }

    if (
      !window.confirm(
        `Mark ${pendingIds.length} payments as SETTLED for ${
          activeTab === "this_month" ? thisMonth : lastMonth
        }?`
      )
    )
      return;

    setIsSettling(true);
    try {
      await dispatch(settlePaymentsBulk(pendingIds)).unwrap();
      toast.success(`Successfully settled ${pendingIds.length} payments!`);
      fetchData(pagination.page, pagination.limit);
    } catch (e) {
      toast.error("Failed to settle payments");
    } finally {
      setIsSettling(false);
    }
  };

  const handleBulkMarkPaid = async () => {
    const pendingIds = filteredPayments
      .filter((row) => (row.status || "pending").toLowerCase() !== "completed")
      .map((row) => row._id || row.id);

    if (pendingIds.length === 0) {
      toast.success("All displayed payments are already marked as Paid!");
      return;
    }

    if (!window.confirm(`Mark ${pendingIds.length} payments as PAID?`)) return;

    setIsMarkingPaid(true);
    try {
      console.log("🚀 [FRONTEND] Sending Bulk Status Update for:", pendingIds);
      await dispatch(
        bulkUpdatePaymentStatus({ ids: pendingIds, status: "completed" })
      ).unwrap();
      toast.success(
        `Successfully marked ${pendingIds.length} payments as Paid!`
      );
      console.log("🔄 [FRONTEND] Refetching data...");
      await fetchData(pagination.page, pagination.limit);
    } catch (e) {
      console.error("❌ [FRONTEND] Error:", e);
      toast.error("Failed to update status");
    } finally {
      setIsMarkingPaid(false);
    }
  };

  const handleDateChange = (field, value) => {
    if (field === "clear") {
      // If clearing manually, revert to This Month
      handleTabChange("this_month");
    } else {
      setFilters((prev) => ({ ...prev, [field]: value }));
      setActiveTab("custom"); // If manual date pick, deselect tabs
    }
  };

  // ✅ UPDATED: Handle Open Doc with Serial Number Logic
  const handleOpenDoc = (row, type, serialNo = 0) => {
    // Generate clean ID: 140000 + serialNo (e.g. 140001, 140002)
    const receiptNumber = serialNo ? 140000 + serialNo : row._id || row.id;

    const docData = {
      id: receiptNumber, // Pass the generated Receipt Number here
      createdAt: row.createdAt,
      vehicle: row.vehicle || {},
      customer: row.customer || {},
      building: row.customer?.building || row.building,
      mall: row.mall,
      amount_paid: row.amount_paid,
      amount_charged: row.amount_charged,
      old_balance: row.old_balance,
      total_amount: row.total_amount,
      balance: row.balance,
      tip: row.tip_amount,
      payment_mode: row.payment_mode,
      status: row.status,
      settled: row.settled,
      worker: row.worker,
      service_type: "residence",
      billAmountDesc: row.createdAt
        ? `For the month of ${new Date(row.createdAt).toLocaleDateString(
            "en-US",
            { month: "long" }
          )}`
        : "",
    };
    setSelectedRecord(docData);
    setActiveModal(type === "Invoice" ? "invoice" : "receipt");
  };

  const handleCloseModals = () => {
    setActiveModal(null);
    setSelectedRecord(null);
  };

  const handleViewDetails = (row) => setViewPayment(row);
  const handleEdit = (row) => setEditPayment(row);

  const handleDelete = (row) => {
    setDeletePayment(row);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!deletePayment) return;
    setIsDeleting(true);
    try {
      await dispatch(deleteResidencePayment(deletePayment._id)).unwrap();
      toast.success("Payment deleted successfully!");
      fetchData(pagination.page, pagination.limit);
      setIsDeleteModalOpen(false);
      setDeletePayment(null);
    } catch (error) {
      toast.error("Failed to delete payment");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleExport = async () => {
    const toastId = toast.loading("Downloading report...");
    try {
      const result = await dispatch(
        exportPayments({ search: searchTerm, ...filters })
      ).unwrap();
      const blobData = result.blob || result;
      const blob = new Blob([blobData], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      const dateStr = new Date().toISOString().split("T")[0];
      link.href = url;
      link.setAttribute("download", `residence_payments_${dateStr}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success("Download complete", { id: toastId });
    } catch (e) {
      toast.error("Export failed", { id: toastId });
    }
  };

  // --- Prepare Dropdown Options ---
  const statusOptions = [
    { value: "", label: "All Status" },
    { value: "completed", label: "Completed" },
    { value: "pending", label: "Pending" },
    { value: "cancelled", label: "Cancelled" },
  ];

  const workerOptions = useMemo(() => {
    const options = [{ value: "", label: "All Workers" }];
    if (workers && workers.length > 0) {
      workers.forEach((w) => {
        options.push({ value: w._id, label: w.name });
      });
    }
    return options;
  }, [workers]);

  // --- RENDER EXPANDED ROW ---
  const renderExpandedRow = (row) => {
    const cust = row.customer || {};
    const vehicle = row.vehicle || {};
    const detailedVehicle =
      cust.vehicles?.find((v) => v._id === vehicle._id) || vehicle;

    return (
      <div className="bg-slate-50 p-4 border-t border-slate-200">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
          <div className="bg-white p-3 rounded border border-slate-200">
            <span className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
              Customer
            </span>
            <div className="font-bold text-slate-800">
              {cust.firstName || cust.lastName
                ? `${cust.firstName} ${cust.lastName}`
                : "Guest"}
            </div>
            <div className="text-xs text-slate-500 mt-0.5">
              {cust.mobile || "-"}
            </div>
          </div>
          <div className="bg-white p-3 rounded border border-slate-200">
            <span className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
              Location
            </span>
            <div className="flex items-center gap-1.5 font-medium text-slate-700">
              <Building className="w-3.5 h-3.5" />
              {row.building?.name || cust.building?.name || "-"}
            </div>
            <div className="text-xs text-slate-500 mt-1 pl-5">
              Flat: {cust.flat_no || "-"}
            </div>
          </div>
          <div className="bg-white p-3 rounded border border-slate-200">
            <span className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
              Vehicle Details
            </span>
            <div className="flex justify-between">
              <span className="text-slate-500 text-xs">Type:</span>
              <span className="font-medium text-slate-700 capitalize">
                {detailedVehicle.vehicle_type || "Sedan"}
              </span>
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-slate-500 text-xs">Parking:</span>
              <span className="font-medium text-slate-700">
                {detailedVehicle.parking_no || "-"}
              </span>
            </div>
          </div>
          <div className="bg-white p-3 rounded border border-slate-200">
            <span className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
              Timestamps
            </span>
            <div className="flex justify-between">
              <span className="text-slate-500 text-xs">Created:</span>
              <span className="font-mono text-xs">
                {new Date(row.createdAt).toLocaleDateString()}
              </span>
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-slate-500 text-xs">Updated:</span>
              <span className="font-mono text-xs">
                {new Date(row.updatedAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // --- COLUMNS ---
  const columns = [
    {
      header: "#", // Reverted to # to match Receipt Number logic
      accessor: "id",
      className: "w-12 text-center",
      render: (row, idx) => (
        <div className="flex justify-center">
          <span className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-xs font-mono border border-slate-200">
            {/* Show the Serial Number that matches the Receipt ID */}
            {(pagination.page - 1) * pagination.limit + idx + 1}
          </span>
        </div>
      ),
    },
    {
      header: "Date",
      accessor: "createdAt",
      className: "w-28",
      render: (row) => {
        if (!row.createdAt) return null;
        return (
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5 text-slate-700 font-medium text-sm">
              <Calendar className="w-3 h-3 text-indigo-500" />
              {new Date(row.createdAt).toLocaleDateString("en-GB", {
                day: "numeric",
                month: "short",
              })}
            </div>
            <span className="text-[10px] text-slate-400 pl-4.5">
              {new Date(row.createdAt).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>
        );
      },
    },
    {
      header: "Vehicle Info",
      accessor: "vehicle.registration_no",
      render: (row) => (
        <div className="flex flex-col gap-1">
          <span className="font-bold text-slate-700 text-xs bg-slate-100 px-2 py-1 rounded w-fit border border-slate-200">
            {row.vehicle?.registration_no || "N/A"}
          </span>
          {row.vehicle?.parking_no && (
            <span className="text-[10px] text-slate-500 ml-1">
              Slot: {row.vehicle.parking_no}
            </span>
          )}
        </div>
      ),
    },
    {
      header: "Actual",
      accessor: "amount_charged",
      className: "text-right",
      render: (row) => (
        <span className="font-medium text-slate-600 text-xs">
          {row.amount_charged}
        </span>
      ),
    },
    {
      header: "Last Bal",
      accessor: "old_balance",
      className: "text-right",
      render: (row) => (
        <span className="text-slate-400 text-xs">{row.old_balance}</span>
      ),
    },
    {
      header: "Total",
      accessor: "total_amount",
      className: "text-right",
      render: (row) => (
        <span className="font-bold text-indigo-600 text-sm">
          {row.total_amount}{" "}
          <span className="text-[10px] text-indigo-400">{currency}</span>
        </span>
      ),
    },
    {
      header: "Paid",
      accessor: "amount_paid",
      className: "text-right",
      render: (row) => (
        <span className="font-bold text-emerald-600 text-sm">
          {row.amount_paid}{" "}
          <span className="text-[10px] text-emerald-400">{currency}</span>
        </span>
      ),
    },
    {
      header: "Balance",
      accessor: "balance",
      className: "text-right",
      render: (row) => (
        <span
          className={`text-xs font-bold px-2 py-0.5 rounded-full border ${
            row.balance > 0
              ? "bg-rose-50 text-rose-600 border-rose-100"
              : "bg-slate-50 text-slate-400 border-slate-100"
          }`}
        >
          {row.balance}
        </span>
      ),
    },
    {
      header: "Mode",
      accessor: "payment_mode",
      className: "text-center",
      render: (row) =>
        row.payment_mode ? (
          <span className="text-[10px] font-bold uppercase text-slate-500 bg-gray-50 border border-gray-200 px-1.5 py-0.5 rounded">
            {row.payment_mode}
          </span>
        ) : null,
    },
    {
      header: "Status",
      accessor: "status",
      className: "text-center w-24",
      render: (row) => {
        const s = (row.status || "").toUpperCase();
        return (
          <span
            className={`text-[10px] font-bold px-2 py-1 rounded-full border ${
              s === "COMPLETED"
                ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                : "bg-amber-50 text-amber-600 border-amber-100"
            }`}
          >
            {s}
          </span>
        );
      },
    },
    {
      header: "Settle",
      accessor: "settled",
      className: "text-center w-24",
      render: (row) => {
        const s = (row.settled || "pending").toUpperCase();
        return (
          <span
            className={`text-[10px] font-bold uppercase ${
              s === "COMPLETED" ? "text-emerald-600" : "text-amber-500"
            }`}
          >
            {s}
          </span>
        );
      },
    },
    {
      header: "Worker",
      accessor: "worker.name",
      render: (row) => {
        if (!row.worker?.name) return null;
        return (
          <div className="flex items-start gap-1.5 min-w-[100px]">
            <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
              {row.worker.name[0]}
            </div>
            <span
              className="text-xs font-semibold text-slate-700 whitespace-normal break-words leading-tight"
              title={row.worker?.name}
            >
              {row.worker?.name}
            </span>
          </div>
        );
      },
    },
    // ✅ MODIFIED: Pass Serial Number to Invoice
    {
      header: "Invoice",
      className: "text-center w-16",
      render: (row, idx) => {
        const serialNo = (pagination.page - 1) * pagination.limit + idx + 1;
        return (
          <button
            onClick={() => handleOpenDoc(row, "Invoice", serialNo)}
            className="text-indigo-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all p-1.5 rounded-lg"
            title="View Tax Invoice"
          >
            <Receipt className="w-4 h-4 mx-auto" />
          </button>
        );
      },
    },
    // ✅ MODIFIED: Receipt only if Completed & Pass Serial Number
    {
      header: "Receipt",
      className: "text-center w-16",
      render: (row, idx) => {
        const isPaid = (row.status || "").toLowerCase() === "completed";
        if (!isPaid) return <span className="text-slate-300">-</span>;

        // Calculate Serial Number
        const serialNo = (pagination.page - 1) * pagination.limit + idx + 1;

        return (
          <button
            onClick={() => handleOpenDoc(row, "Receipt", serialNo)}
            className="text-emerald-400 hover:text-emerald-600 hover:bg-emerald-50 transition-all p-1.5 rounded-lg"
            title="View Receipt"
          >
            <FileText className="w-4 h-4 mx-auto" />
          </button>
        );
      },
    },
    {
      header: "Actions",
      className:
        "text-right w-24 sticky right-4 bg-white shadow-[-5px_0_10px_-5px_rgba(0,0,0,0.05)]",
      render: (row) => (
        <div className="flex items-center justify-end gap-1 px-2">
          <button
            onClick={() => handleViewDetails(row)}
            className="p-1.5 hover:bg-blue-50 rounded-lg text-slate-400 hover:text-blue-600 transition-colors"
          >
            <Eye className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => handleEdit(row)}
            className="p-1.5 hover:bg-indigo-50 rounded-lg text-slate-400 hover:text-indigo-600 transition-colors"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => handleDelete(row)}
            className="p-1.5 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-600 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 font-sans flex flex-col">
      {/* Use flex-1 to fill height, and padding on THIS container */}
      <div className="w-full flex-1 p-2 md:p-5">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-200">
                <Wallet className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-slate-800 to-indigo-800 bg-clip-text text-transparent">
                  Residence Payments
                </h1>
                <p className="text-sm text-slate-500 font-medium">
                  Monthly recurring payments & invoices
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* TAB SWITCHER */}
              <div className="bg-slate-100 p-1 rounded-xl flex">
                <button
                  onClick={() => handleTabChange("last_month")}
                  className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                    activeTab === "last_month"
                      ? "bg-white text-indigo-600 shadow-sm"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  {lastMonth}
                </button>
                <button
                  onClick={() => handleTabChange("this_month")}
                  className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                    activeTab === "this_month"
                      ? "bg-white text-indigo-600 shadow-sm"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  {thisMonth}
                </button>
              </div>

              {/* MARK ALL PAID BUTTON */}
              <button
                onClick={handleBulkMarkPaid}
                disabled={isMarkingPaid}
                className={`h-10 px-4 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-md hover:shadow-lg transition-all ${
                  isMarkingPaid ? "opacity-70 cursor-wait" : ""
                }`}
              >
                <CheckSquare className="w-4 h-4" />
                {isMarkingPaid ? "Updating..." : `Mark Status This Page Paid`}
              </button>

              {/* SETTLE ALL BUTTON */}
              <button
                onClick={handleBulkSettle}
                disabled={isSettling}
                className={`h-10 px-4 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-md hover:shadow-lg transition-all ${
                  isSettling ? "opacity-70 cursor-wait" : ""
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                {isSettling ? "Settling..." : `Mark Settle This Page Payments `}
              </button>

              <button
                onClick={handleExport}
                className="h-10 px-4 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-md hover:shadow-lg transition-all"
              >
                <Download className="w-4 h-4" /> Export
              </button>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-indigo-50 border border-indigo-100 flex flex-col justify-center">
              <p className="text-xs font-bold text-indigo-500 uppercase tracking-wider mb-1">
                Total Revenue
              </p>
              <h3 className="text-2xl font-bold text-indigo-700">
                {stats.totalAmount || 0}{" "}
                <span className="text-sm font-normal text-indigo-400">
                  {currency}
                </span>
              </h3>
            </div>
            {/* ... Other stats (Cash, Card, Bank) ... */}
            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                <Banknote className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase">
                  Cash
                </p>
                <p className="text-lg font-bold text-slate-700">
                  {stats.cash || 0}
                </p>
              </div>
            </div>
            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                <CreditCard className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase">
                  Card
                </p>
                <p className="text-lg font-bold text-slate-700">
                  {stats.card || 0}
                </p>
              </div>
            </div>
            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600">
                <Landmark className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase">
                  Bank
                </p>
                <p className="text-lg font-bold text-slate-700">
                  {stats.bank || 0}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* --- FILTERS --- */}
        <div className="bg-white p-5 rounded-2xl shadow-md border border-slate-100 mb-6">
          <div className="flex flex-col xl:flex-row gap-4 items-end">
            <div className="w-full xl:w-auto min-w-[280px]">
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 ml-1">
                Date Range
              </label>
              <RichDateRangePicker
                startDate={filters.startDate}
                endDate={filters.endDate}
                onChange={handleDateChange}
              />
            </div>

            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
              {/* Payment Status Dropdown (CustomDropdown) */}
              <div>
                <CustomDropdown
                  label="Payment Status"
                  value={filters.status}
                  onChange={(val) => setFilters({ ...filters, status: val })}
                  options={statusOptions}
                  icon={Filter}
                  placeholder="All Status"
                />
              </div>

              {/* Assigned Worker Dropdown (CustomDropdown) */}
              <div>
                <CustomDropdown
                  label="Assigned Worker"
                  value={filters.worker}
                  onChange={(val) => setFilters({ ...filters, worker: val })}
                  options={workerOptions}
                  icon={User}
                  placeholder="All Workers"
                  searchable={true}
                />
              </div>
            </div>

            <div className="w-full xl:w-64 relative">
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 ml-1">
                Search
              </label>
              <div className="relative">
                <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search All Columns..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full h-11 pl-10 pr-4 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 transition-all"
                />
              </div>
            </div>
          </div>
        </div>

        {/* --- TABLE --- */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden flex flex-col flex-1">
          <DataTable
            columns={columns}
            data={filteredPayments}
            loading={loading}
            pagination={pagination}
            onPageChange={(p) => fetchData(p, pagination.limit)}
            onLimitChange={(l) => fetchData(1, l)}
            renderExpandedRow={renderExpandedRow}
            hideSearch={true}
          />
        </div>

        {/* --- MODALS --- */}
        <ResidenceReceiptModal
          isOpen={!!selectedRecord && activeModal === "invoice"}
          onClose={handleCloseModals}
          data={selectedRecord}
          type="Invoice"
        />
        <ReceiptModal
          isOpen={!!selectedRecord && activeModal === "receipt"}
          onClose={handleCloseModals}
          data={selectedRecord}
        />
        <ViewPaymentModal
          isOpen={!!viewPayment}
          onClose={() => setViewPayment(null)}
          payment={viewPayment}
        />
        <DeleteModal
          isOpen={isDeleteModalOpen}
          onClose={() => {
            setIsDeleteModalOpen(false);
            setDeletePayment(null);
          }}
          onConfirm={confirmDelete}
          loading={isDeleting}
          title="Delete Payment?"
          message={`Are you sure you want to delete the payment?`}
        />
        <PaymentModal
          isOpen={!!editPayment}
          onClose={() => setEditPayment(null)}
          payment={editPayment}
          onSuccess={() => {
            fetchData(pagination.page, pagination.limit);
            setEditPayment(null);
          }}
        />
      </div>
    </div>
  );
};

export default ResidencePayments;
