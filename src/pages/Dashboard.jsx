import React, { useState, useEffect } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Loader2, Car, DollarSign, TrendingUp } from "lucide-react";
import { analyticsService } from "../api/analyticsService";

// --- DEFAULT COLORS (Fallback if no settings found) ---
const DEFAULT_STYLES = {
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

const Dashboard = () => {
  const [loading, setLoading] = useState(true);

  // State for Top Stats Cards
  const [stats, setStats] = useState({
    jobs: { pending: 0, completed: 0 },
    payments: { pending: 0, completed: 0 },
  });

  // State for Graph Styles (Loaded from Settings)
  const [graphStyles, setGraphStyles] = useState(DEFAULT_STYLES);

  // State for Chart Data
  const [charts, setCharts] = useState({
    residence: {
      jobs: { labels: [], completed: [], pending: [] },
      payments: { labels: [], completed: [], pending: [] },
    },
    onewash: {
      jobs: { labels: [], completed: [], pending: [] },
      payments: { labels: [], completed: [], pending: [] },
    },
  });

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        // 1. Load Graph Colors from Local Storage
        const savedStyles = localStorage.getItem("admin_graph_colors");
        if (savedStyles) {
          setGraphStyles({ ...DEFAULT_STYLES, ...JSON.parse(savedStyles) });
        }

        // 2. Fetch Data (Stats + Charts)
        const [statsRes, chartsRes] = await Promise.all([
          analyticsService.getAdminStats(),
          analyticsService.getCharts(),
        ]);

        if (statsRes?.data?.counts) setStats(statsRes.data.counts);
        if (chartsRes?.data) setCharts(chartsRes.data);
      } catch (e) {
        console.error("Dashboard load failed", e);
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  // Helper: Transform API data arrays into Recharts objects
  const transformData = (chartObj) => {
    if (!chartObj?.labels) return [];
    return chartObj.labels.map((label, i) => ({
      name: label,
      Completed: chartObj.completed?.[i] ?? 0,
      Pending: chartObj.pending?.[i] ?? 0,
    }));
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 w-full min-h-screen bg-[#f8f9fa] font-sans pb-20">
      {/* --- 1. TOP STATS CARDS --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <StatCard
          title="Total Carwashes"
          value={stats.jobs.completed + stats.jobs.pending}
          pending={stats.jobs.pending}
          completed={stats.jobs.completed}
          icon={Car}
        />
        <StatCard
          title="Total Payments"
          value={stats.payments.pending + stats.payments.completed}
          pending={stats.payments.pending}
          completed={stats.payments.completed}
          icon={DollarSign}
        />
        <StatCard
          title="Collected Payments"
          value={0} // Replace with actual collected field if available
          pending={0}
          completed={0}
          icon={TrendingUp}
        />
      </div>

      {/* --- 2. RESIDENCE SECTION --- */}
      <div className="mb-10">
        <h2 className="text-center text-xl font-medium text-slate-600 mb-6 uppercase tracking-wider">
          Residence Analytics
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <GraphWidget
            title="Residence Jobs"
            data={transformData(charts.residence.jobs)}
            type="Jobs"
            colors={graphStyles.residenceJobs}
            id="resJobs"
          />
          <GraphWidget
            title="Residence Payments"
            data={transformData(charts.residence.payments)}
            type="Payments"
            colors={graphStyles.residencePayments}
            id="resPay"
          />
        </div>
      </div>

      {/* --- 3. ONEWASH SECTION --- */}
      <div className="mb-10">
        <h2 className="text-center text-xl font-medium text-slate-600 mb-6 uppercase tracking-wider">
          Onewash Analytics
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <GraphWidget
            title="Onewash Jobs"
            data={transformData(charts.onewash.jobs)}
            type="Jobs"
            colors={graphStyles.onewashJobs}
            id="oneJobs"
          />
          <GraphWidget
            title="Onewash Payments"
            data={transformData(charts.onewash.payments)}
            type="Payments"
            colors={graphStyles.onewashPayments}
            id="onePay"
          />
        </div>
      </div>
    </div>
  );
};

// --- SUB-COMPONENT: STAT CARD ---
const StatCard = ({ title, value, pending, completed, icon: Icon }) => (
  <div className="bg-[#009ef7] text-white p-6 rounded-xl shadow-lg shadow-blue-200 relative overflow-hidden transition-transform hover:-translate-y-1 duration-300">
    <div className="relative z-10">
      <h3 className="text-xs font-bold opacity-80 uppercase tracking-widest mb-1">
        {title}
      </h3>
      <span className="text-4xl font-extrabold">{value}</span>
      <div className="mt-4 flex gap-3 text-xs font-bold">
        <span className="bg-white/20 px-2 py-1 rounded">Pending {pending}</span>
        <span className="bg-white/20 px-2 py-1 rounded">
          Completed {completed}
        </span>
      </div>
    </div>
    <Icon className="absolute -right-2 -top-2 w-24 h-24 opacity-10" />
  </div>
);

// --- SUB-COMPONENT: GRAPH WIDGET ---
const GraphWidget = ({ title, data, type, colors, id }) => {
  const labelCompleted =
    type === "Payments" ? "Completed Payments" : "Completed Jobs";
  const labelPending =
    type === "Payments" ? "Pending Payments" : "Pending Jobs";

  // Unique Gradient IDs per chart to prevent conflicts
  const gradComp = `gradComp-${id}`;
  const gradPend = `gradPend-${id}`;

  return (
    <div className="bg-white p-4 rounded shadow-sm border border-slate-200 h-[400px] flex flex-col relative">
      {/* CUSTOM LEGEND */}
      <div className="flex justify-center items-center gap-6 mb-2 absolute top-4 left-0 right-0 z-10">
        <div
          className="flex items-center gap-2 border px-2 py-0.5 rounded bg-white"
          style={{ borderColor: colors.completed }}
        >
          <div
            className="w-6 h-3"
            style={{ backgroundColor: colors.completed }}
          ></div>
          <span className="text-xs font-bold text-slate-600">
            {labelCompleted}
          </span>
        </div>
        <div
          className="flex items-center gap-2 border px-2 py-0.5 rounded bg-white"
          style={{ borderColor: colors.pending }}
        >
          <div
            className="w-6 h-3"
            style={{ backgroundColor: colors.pending }}
          ></div>
          <span className="text-xs font-bold text-slate-600">
            {labelPending}
          </span>
        </div>
      </div>

      <div className="flex-1 w-full mt-8">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 20, right: 10, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id={gradComp} x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor={colors.completed}
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor={colors.completed}
                  stopOpacity={0.1}
                />
              </linearGradient>
              <linearGradient id={gradPend} x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor={colors.pending}
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor={colors.pending}
                  stopOpacity={0.1}
                />
              </linearGradient>
            </defs>

            <CartesianGrid
              strokeDasharray="1 1"
              vertical={true}
              horizontal={true}
              stroke="#e5e7eb"
            />

            <XAxis
              dataKey="name"
              tick={{ fontSize: 11, fill: "#64748b" }}
              axisLine={false}
              tickLine={false}
              dy={10}
            />
            <YAxis
              tick={{ fontSize: 11, fill: "#64748b" }}
              axisLine={false}
              tickLine={false}
            />

            <Tooltip
              contentStyle={{
                borderRadius: "8px",
                border: "none",
                boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
              }}
              itemStyle={{ fontSize: "12px", fontWeight: "600" }}
            />

            {/* Completed Area */}
            <Area
              type="monotone"
              dataKey="Completed"
              stroke={colors.completed}
              fill={`url(#${gradComp})`}
              strokeWidth={3}
              dot={{
                r: 4,
                stroke: colors.completed,
                strokeWidth: 2,
                fill: colors.point,
              }}
              activeDot={{ r: 6 }}
            />

            {/* Pending Area */}
            <Area
              type="monotone"
              dataKey="Pending"
              stroke={colors.pending}
              fill={`url(#${gradPend})`}
              strokeWidth={3}
              dot={{
                r: 4,
                stroke: colors.pending,
                strokeWidth: 2,
                fill: colors.point,
              }}
              activeDot={{ r: 6 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default Dashboard;
