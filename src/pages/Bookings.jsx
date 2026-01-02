import React, { useState, useEffect } from "react";
import { UserPlus, Trash2, CheckCircle, User, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

// Components
import DataTable from "../components/DataTable";
import AssignWorkerModal from "../components/modals/AssignWorkerModal";

// API
import { bookingService } from "../api/bookingService";

const Bookings = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);

  // Pagination
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 1,
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);

  // --- Fetch Data ---
  const fetchData = async (page = 1, limit = 50, search = "") => {
    setLoading(true);
    try {
      const response = await bookingService.list(page, limit, search);
      const records = response.data || [];
      const totalRecords = response.total || 0;

      setData(records);
      setPagination({
        page: Number(page),
        limit: Number(limit),
        total: totalRecords,
        totalPages: Math.ceil(totalRecords / Number(limit)) || 1,
      });
    } catch (error) {
      toast.error("Failed to load bookings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(1, 50);
  }, []);

  // --- Handlers ---
  const handleSearch = (term) => {
    setSearchTerm(term);
    fetchData(1, pagination.limit, term);
  };

  const handleOpenAssign = (booking) => {
    setSelectedBooking(booking);
    setIsModalOpen(true);
  };

  const handleAccept = async (booking) => {
    if (!window.confirm("Accept booking? This will create a Job.")) return;
    try {
      await bookingService.accept(booking._id);
      toast.success("Booking Accepted");
      fetchData(pagination.page, pagination.limit, searchTerm);
    } catch (error) {
      toast.error("Failed to accept");
    }
  };

  const handleDelete = async (booking) => {
    if (!window.confirm("Delete this booking?")) return;
    try {
      await bookingService.delete(booking._id);
      toast.success("Deleted");
      fetchData(pagination.page, pagination.limit, searchTerm);
    } catch (error) {
      toast.error("Delete failed");
    }
  };

  // --- Columns ---
  const columns = [
    {
      header: "#",
      accessor: "id",
      className: "w-16 text-center",
      render: (row, idx) => {
        // Fix: Use actual ID if available, else calc index
        if (row.id)
          return (
            <span className="text-slate-500 font-mono text-xs">#{row.id}</span>
          );

        const p = Number(pagination.page) || 1;
        const l = Number(pagination.limit) || 10;
        return (
          <span className="text-slate-400 font-mono text-xs">
            {(p - 1) * l + idx + 1}
          </span>
        );
      },
    },
    {
      header: "Customer",
      accessor: "customer",
      render: (row) => (
        <span className="text-slate-700 font-semibold text-sm whitespace-nowrap">
          {row.customer?.mobile || row.customer?.name || "---"}
        </span>
      ),
    },
    {
      header: "Date",
      accessor: "date",
      render: (row) => (
        <span className="text-slate-600 text-sm whitespace-nowrap">
          {row.date
            ? new Date(row.date).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              })
            : "-"}
        </span>
      ),
    },
    {
      header: "Time",
      accessor: "time",
      render: (row) => (
        <span className="text-slate-600 text-sm whitespace-nowrap">
          {row.time ||
            (row.date
              ? new Date(row.date).toLocaleTimeString("en-US", {
                  hour: "numeric",
                  hour12: true,
                })
              : "-")}
        </span>
      ),
    },
    {
      header: "Worker",
      accessor: "worker",
      render: (row) => (
        <span
          className={`text-sm whitespace-nowrap font-medium ${
            row.worker ? "text-indigo-600" : "text-slate-400 italic"
          }`}
        >
          {row.worker?.name || "Unassigned"}
        </span>
      ),
    },
    {
      header: "Premise / Address",
      accessor: "premise",
      render: (row) => {
        let premiseName = "-";
        if (row.service_type === "mall" && row.mall) {
          premiseName = row.mall.name;
        } else {
          premiseName =
            row.address ||
            row.customer?.location ||
            row.customer?.building ||
            row.customer?.city;
        }

        return (
          <div className="text-slate-600 text-sm min-w-[200px] max-w-[300px] whitespace-normal break-words leading-tight">
            {premiseName}
          </div>
        );
      },
    },
    {
      header: "Service",
      accessor: "service_type",
      render: (row) => (
        <span className="text-slate-600 text-sm capitalize font-medium whitespace-nowrap">
          {row.service_type || "-"}
        </span>
      ),
    },
    {
      header: "Vehicle Type",
      accessor: "vehicle",
      render: (row) => {
        // FIX: If backend returns a raw string ID (unpopulated), we can't show type
        if (typeof row.vehicle === "string")
          return <span className="text-slate-400 text-xs italic">Unknown</span>;

        const v = row.vehicle || {};
        const vType =
          v.type ||
          v.vehicleType ||
          v.vehicle_type ||
          v.bodyType ||
          v.model ||
          "-";

        return (
          <span className="text-slate-600 text-sm capitalize font-medium whitespace-nowrap">
            {vType}
          </span>
        );
      },
    },
    {
      header: "Vehicle No",
      accessor: "vehicle.registration_no",
      render: (row) => (
        <span className="text-slate-800 font-mono font-medium text-sm whitespace-nowrap bg-slate-100 px-2 py-0.5 rounded">
          {row.vehicle?.registration_no || "-"}
        </span>
      ),
    },
    {
      header: "Status",
      accessor: "status",
      render: (row) => {
        const status = (row.status || "PENDING").toUpperCase();

        let badgeClass = "bg-amber-50 text-amber-600 border-amber-100";
        if (status === "ACCEPTED")
          badgeClass = "bg-green-50 text-green-600 border-green-100";
        if (status === "COMPLETED")
          badgeClass = "bg-emerald-50 text-emerald-600 border-emerald-100";

        return (
          <span
            className={`px-2.5 py-1 rounded-full text-[10px] font-bold border tracking-wide whitespace-nowrap ${badgeClass}`}
          >
            {status}
          </span>
        );
      },
    },
    {
      header: "Actions",
      className: "text-right",
      render: (row) => (
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={() => handleOpenAssign(row)}
            className="p-1.5 bg-slate-50 hover:bg-indigo-50 text-slate-500 hover:text-indigo-600 rounded transition-colors border border-slate-200"
            title="Assign Worker"
          >
            <UserPlus className="w-4 h-4" />
          </button>

          {row.status !== "accepted" && (
            <button
              onClick={() => handleAccept(row)}
              className="p-1.5 bg-slate-50 hover:bg-emerald-50 text-slate-500 hover:text-emerald-600 rounded transition-colors border border-slate-200"
              title="Accept"
            >
              <CheckCircle className="w-4 h-4" />
            </button>
          )}

          <button
            onClick={() => handleDelete(row)}
            className="p-1.5 bg-slate-50 hover:bg-red-50 text-slate-500 hover:text-red-600 rounded transition-colors border border-slate-200"
            title="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="p-3 w-full">
      <div className="mb-6 flex-shrink-0">
        {/* <h1 className="text-2xl font-bold text-slate-800">Bookings</h1> */}
        {/* <p className="text-slate-500 text-sm mt-1">
          Manage customer booking requests
        </p> */}
      </div>

      <div className="flex-1 w-full bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
        <DataTable
          columns={columns}
          data={data}
          loading={loading}
          pagination={pagination}
          onPageChange={(p) => fetchData(p, pagination.limit, searchTerm)}
          onLimitChange={(l) => fetchData(1, l, searchTerm)}
          onSearch={handleSearch}
        />
      </div>

      <AssignWorkerModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        booking={selectedBooking}
        onSuccess={() =>
          fetchData(pagination.page, pagination.limit, searchTerm)
        }
      />
    </div>
  );
};

export default Bookings;
