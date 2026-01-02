import React, { useState, useEffect } from "react";
import { Plus, Trash2, Edit2 } from "lucide-react";
import toast from "react-hot-toast";

// Components
import DataTable from "../components/DataTable";
import PricingModal from "../components/modals/PricingModal";

// API
import { pricingService } from "../api/pricingService";

const Pricing = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPricing, setSelectedPricing] = useState(null);

  const fetchData = async (page = 1, limit = 10) => {
    setLoading(true);
    try {
      const res = await pricingService.list(page, limit);

      setData(res.data || []);
      setPagination({
        page: Number(page),
        limit: Number(limit),
        total: res.total || 0,
        totalPages: Math.ceil((res.total || 0) / Number(limit)) || 1,
      });
    } catch (e) {
      toast.error("Failed to load pricing");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(1, 10);
  }, []);

  const handleCreate = () => {
    setSelectedPricing(null);
    setIsModalOpen(true);
  };

  const handleEdit = (row) => {
    setSelectedPricing(row);
    setIsModalOpen(true);
  };

  const handleDelete = async (row) => {
    if (!window.confirm("Delete this pricing?")) return;
    try {
      await pricingService.delete(row._id);
      toast.success("Deleted");
      fetchData(pagination.page, pagination.limit);
    } catch {
      toast.error("Delete failed");
    }
  };

  const PriceItem = ({ label, value }) => {
    if (!value) return null;
    return (
      <span className="mr-3">
        <span className="font-bold text-slate-900">{label}</span>{" "}
        <span className="text-slate-600">{value}</span>
      </span>
    );
  };

  const columns = [
    {
      header: "Service Type",
      accessor: "service_type",
      className: "w-40 align-top py-4",
      render: (row) => (
        <span className="text-slate-700 uppercase font-medium text-sm">
          {row.service_type}
        </span>
      ),
    },

    {
      header: "Premise",
      accessor: "mall",
      className: "w-48 align-top py-4",
      render: (row) => (
        <span className="text-slate-600 uppercase text-sm">
          {row.service_type === "mall" ? row.mall?.name || "-" : "-"}
        </span>
      ),
    },

    {
      header: "Pricing",
      accessor: "pricing",
      className: "align-top py-3",
      render: (row) => {
        const sedan = row.sedan || {};
        const suv = row["4x4"] || {};

        return (
          <div className="flex flex-col gap-1.5 text-sm">
            <div className="flex flex-wrap items-center">
              <span className="font-bold text-slate-900 border-b mr-2">
                SEDAN
              </span>
              <PriceItem label="Onetime" value={sedan.onetime} />
              <PriceItem label="Once" value={sedan.once} />
              <PriceItem label="Twice" value={sedan.twice} />
              <PriceItem label="Thrice" value={sedan.thrice} />
              <PriceItem label="Daily" value={sedan.daily} />
            </div>

            <div className="flex flex-wrap items-center">
              <span className="font-bold text-slate-900 border-b mr-2">
                4×4
              </span>
              <PriceItem label="Onetime" value={suv.onetime} />
              <PriceItem label="Once" value={suv.once} />
              <PriceItem label="Twice" value={suv.twice} />
              <PriceItem label="Thrice" value={suv.thrice} />
              <PriceItem label="Daily" value={suv.daily} />
            </div>
          </div>
        );
      },
    },

    {
      header: "Actions",
      className: "text-right w-24 align-top py-4",
      render: (row) => (
        <div className="flex justify-end gap-3">
          <button
            onClick={() => handleEdit(row)}
            className="text-slate-700 hover:text-black transition"
          >
            <Edit2 className="w-5 h-5" />
          </button>

          <button
            onClick={() => handleDelete(row)}
            className="text-red-500 hover:text-red-700 transition"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="w-full min-h-screen p-3 font-sans bg-slate-50/30">
      {/* HEADER */}
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-800">Pricing</h1>

        <button
          onClick={handleCreate}
          className="px-5 py-2.5 bg-[#009ef7] text-white rounded-lg font-bold text-sm flex items-center gap-2 hover:bg-[#0095e8]"
        >
          <Plus className="w-5 h-5" /> Add Pricing
        </button>
      </div>

      {/* TABLE — natural height (NO STRETCH) */}
      <DataTable
        title="Data List"
        columns={columns}
        data={data}
        loading={loading}
        pagination={pagination}
        onPageChange={(p) => fetchData(p, pagination.limit)}
        onLimitChange={(l) => fetchData(1, l)}
      />

      <PricingModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        pricing={selectedPricing}
        onSuccess={() => fetchData(pagination.page, pagination.limit)}
      />
    </div>
  );
};

export default Pricing;
