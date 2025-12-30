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
import { Loader2, TrendingUp, DollarSign, Car } from "lucide-react";
import { analyticsService } from "../api/analyticsService";

// --- CUSTOM TOOLTIP ---
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 border border-slate-100 shadow-xl rounded-lg text-xs z-50">
        <p className="font-bold text-slate-700 mb-2 uppercase tracking-wider">
          {label}
        </p>

        {payload.map((entry, index) => (
          <div key={index} className="flex items-center gap-2 mb-1">
            <span
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: entry.stroke }}
            ></span>

            <span className="font-medium text-slate-600 capitalize">
              {entry.name}:
            </span>

            <span className="font-bold text-slate-800">{entry.value}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

const Dashboard = () => {
  const [loading, setLoading] = useState(true);

  const [stats, setStats] = useState({
    jobs: { pending: 0, completed: 0 },
    payments: { pending: 0, completed: 0 },
  });

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

  // MAP API DATA → RECHARTS FORMAT
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
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-[#009ef7] animate-spin" />
          <span className="text-sm font-medium text-slate-500">
            Loading Dashboard...
          </span>
        </div>
      </div>
    );
  }

  // --- CHART WIDGET ---
  const ChartWidget = ({ title, data }) => (
    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm h-[380px] flex flex-col hover:shadow-md transition-all">
      {/* Header + Legend */}
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wide">
          {title}
        </h3>

        <div className="flex gap-4 text-[10px] font-bold uppercase tracking-wider">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#2563eb]"></span>
            <span className="text-slate-600">Completed</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#e11d48]"></span>
            <span className="text-slate-600">Pending</span>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="flex-1 w-full min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
          >
            <defs>
              {/* BLUE GRADIENT */}
              <linearGradient
                id={`grad-blue-${title}`}
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop offset="5%" stopColor="#2563eb" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#2563eb" stopOpacity={0.05} />
              </linearGradient>

              {/* RED GRADIENT */}
              <linearGradient
                id={`grad-red-${title}`}
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop offset="5%" stopColor="#e11d48" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#e11d48" stopOpacity={0.05} />
              </linearGradient>
            </defs>

            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="#eef2f6"
            />

            <XAxis
              dataKey="name"
              tick={{ fontSize: 11, fill: "#94a3b8", fontWeight: 600 }}
              axisLine={false}
              tickLine={false}
              dy={10}
            />

            <YAxis
              tick={{ fontSize: 11, fill: "#94a3b8" }}
              axisLine={false}
              tickLine={false}
            />

            <Tooltip
              content={<CustomTooltip />}
              cursor={{
                stroke: "#cbd5e1",
                strokeWidth: 1,
                strokeDasharray: "4 4",
              }}
            />

            {/* COMPLETED */}
            <Area
              type="monotone"
              dataKey="Completed"
              stroke="#2563eb"
              strokeWidth={3}
              fill={`url(#grad-blue-${title})`}
              dot={{ r: 4, strokeWidth: 2, stroke: "#fff", fill: "#2563eb" }}
              activeDot={{ r: 6, fill: "#2563eb" }}
            />

            {/* PENDING */}
            <Area
              type="monotone"
              dataKey="Pending"
              stroke="#e11d48"
              strokeWidth={3}
              fill={`url(#grad-red-${title})`}
              dot={{ r: 4, strokeWidth: 2, stroke: "#fff", fill: "#e11d48" }}
              activeDot={{ r: 6, fill: "#e11d48" }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );

  return (
    <div className="p-6 w-full min-h-screen bg-[#f9f9fa] font-sans space-y-8 pb-20">
      {/* ------------ TOP TOTAL CARDS (UNCHANGED) ------------ */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* TOTAL CARWASHES */}
        <div className="bg-[#009ef7] text-white p-6 rounded-xl shadow-lg shadow-blue-200 relative overflow-hidden transition-transform hover:-translate-y-1 duration-300">
          <div className="relative z-10">
            <h3 className="text-xs font-bold opacity-80 uppercase tracking-widest mb-1">
              Total Carwashes
            </h3>

            <span className="text-4xl font-extrabold">
              {stats.jobs.completed + stats.jobs.pending}
            </span>

            <div className="mt-4 flex gap-3 text-xs font-bold">
              <span className="bg-white/20 px-2 py-1 rounded">
                Pending {stats.jobs.pending}
              </span>
              <span className="bg-white/20 px-2 py-1 rounded">
                Completed {stats.jobs.completed}
              </span>
            </div>
          </div>

          <Car className="absolute -right-2 -top-2 w-24 h-24 opacity-10" />
        </div>

        {/* TOTAL PAYMENTS */}
        <div className="bg-[#009ef7] text-white p-6 rounded-xl shadow-lg shadow-blue-200 relative overflow-hidden transition-transform hover:-translate-y-1 duration-300">
          <div className="relative z-10">
            <h3 className="text-xs font-bold opacity-80 uppercase tracking-widest mb-1">
              Total Payments
            </h3>

            <span className="text-4xl font-extrabold">
              {stats.payments.pending + stats.payments.completed}
            </span>

            <div className="mt-4 flex gap-3 text-xs font-bold">
              <span className="bg-white/20 px-2 py-1 rounded">
                Pending {stats.payments.pending}
              </span>
              <span className="bg-white/20 px-2 py-1 rounded">
                Completed {stats.payments.completed}
              </span>
            </div>
          </div>

          <DollarSign className="absolute -right-2 -top-2 w-24 h-24 opacity-10" />
        </div>

        {/* COLLECTED PAYMENTS */}
        <div className="bg-[#009ef7] text-white p-6 rounded-xl shadow-lg shadow-blue-200 relative overflow-hidden transition-transform hover:-translate-y-1 duration-300">
          <div className="relative z-10">
            <h3 className="text-xs font-bold opacity-80 uppercase tracking-widest mb-1">
              Collected Payments
            </h3>

            <span className="text-4xl font-extrabold">0</span>

            <div className="mt-4 flex gap-3 text-xs font-bold">
              <span className="bg-white/20 px-2 py-1 rounded">Pending 0</span>
              <span className="bg-white/20 px-2 py-1 rounded">Completed 0</span>
            </div>
          </div>

          <TrendingUp className="absolute -right-2 -top-2 w-24 h-24 opacity-10" />
        </div>
      </div>

      {/* ------------ RESIDENCE ANALYTICS ------------ */}
      <div className="space-y-4">
        <SectionTitle text="Residence Analytics" />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartWidget
            title="Residence Jobs"
            data={transformData(charts.residence.jobs)}
          />
          <ChartWidget
            title="Residence Payments"
            data={transformData(charts.residence.payments)}
          />
        </div>
      </div>

      {/* ------------ ONEWASH ANALYTICS ------------ */}
      <div className="space-y-4">
        <SectionTitle text="Onewash Analytics" />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartWidget
            title="Onewash Jobs"
            data={transformData(charts.onewash.jobs)}
          />
          <ChartWidget
            title="Onewash Payments"
            data={transformData(charts.onewash.payments)}
          />
        </div>
      </div>
    </div>
  );
};

const SectionTitle = ({ text }) => (
  <div className="flex items-center gap-4">
    <div className="h-px bg-slate-200 flex-1"></div>
    <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest">
      {text}
    </h2>
    <div className="h-px bg-slate-200 flex-1"></div>
  </div>
);

export default Dashboard;
