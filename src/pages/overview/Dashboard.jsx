import React, { useState, useEffect } from "react";
import { analyticsService } from "../../api/analyticsService";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
  ComposedChart,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Briefcase,
  Users,
  Car,
  CheckCircle,
  Clock,
  XCircle,
  Building,
  Calendar,
  ArrowUp,
  ArrowDown,
  Award,
  Target,
  Zap,
  BarChart3,
  PieChart as PieChartIcon,
  Download,
  RefreshCw,
  Sparkles,
  Home,
  ShoppingBag,
  Loader2,
  FileDown,
  Clock as ClockIcon,
  Package,
  Activity,
} from "lucide-react";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import DataTable from "../../components/DataTable";
import usePagePermissions from "../../utils/usePagePermissions";

const Dashboard = () => {
  const pp = usePagePermissions("dashboard");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // State for all analytics data
  const [adminStats, setAdminStats] = useState(null);
  const [charts, setCharts] = useState(null);
  const [revenueTrends, setRevenueTrends] = useState([]);
  const [topWorkers, setTopWorkers] = useState([]);
  const [performanceHighlights, setPerformanceHighlights] = useState(null);
  const [serviceDistribution, setServiceDistribution] = useState([]);
  const [buildingAnalytics, setBuildingAnalytics] = useState([]);
  const [comparativeData, setComparativeData] = useState(null);
  const [cacheInfo, setCacheInfo] = useState(null);

  // UI State
  const [showAdvancedCharts, setShowAdvancedCharts] = useState(true);

  // Fetch all dashboard data
  const fetchDashboardData = async (showLoader = true) => {
    if (showLoader) setLoading(true);
    else setRefreshing(true);

    try {
      // ✅ Single API call instead of 7 separate calls - SUPER FAST!
      const response = await analyticsService.getDashboardAll({
        limit: 10,
      });
      const data = response.data;

      // Set all data from unified response
      if (data.adminStats) {
        setAdminStats(data.adminStats);
      }

      if (data.charts) {
        setCharts(data.charts);
      }

      if (data.revenueTrends) {
        setRevenueTrends(data.revenueTrends);
      }

      if (data.topWorkers) {
        console.log("✅ Top Workers Data:", data.topWorkers);
        setTopWorkers(data.topWorkers);
      }

      if (data.serviceDistribution) {
        console.log(
          "📊 Service Distribution received:",
          data.serviceDistribution,
        );
        setServiceDistribution(data.serviceDistribution);
      }

      if (data.buildingAnalytics) {
        console.log("✅ Building Analytics Data:", data.buildingAnalytics);
        // Normalize building data to ensure buildingName field exists
        const normalizedBuildings = data.buildingAnalytics.map((building) => ({
          ...building,
          buildingName:
            building.buildingName ||
            building.building_name ||
            building.name ||
            building.buildingId ||
            "Unknown Building",
        }));
        setBuildingAnalytics(normalizedBuildings);
      }

      if (data.comparativeData) {
        setComparativeData(data.comparativeData);
      }

      // Store cache metadata
      if (data._meta) {
        setCacheInfo(data._meta);
      }

      // Calculate performance highlights from unified data
      if (data.adminStats) {
        const stats = data.adminStats;

        console.log("📊 Admin Stats received:", stats);
        console.log("📊 Performance data:", stats.performance);

        // Use new performance object from backend if available
        if (stats.performance) {
          setPerformanceHighlights({
            avgJobsPerWorker: stats.performance.avgJobsPerWorker || 0,
            completionRate: stats.performance.completionRate || 0,
            avgRevenuePerJob: stats.performance.avgRevenuePerJob,
            collectionRate: stats.performance.collectionRate || 0,
            activeWorkersPercent:
              stats.performance.activeWorkersPercentage || 0,
            totalCustomerVehicles: stats.performance.totalVehicles || 0,
          });
          console.log("✅ Performance highlights set:", {
            avgJobsPerWorker: stats.performance.avgJobsPerWorker,
            completionRate: stats.performance.completionRate,
          });
        } else {
          // Fallback to calculating from old structure
          const workers = data.topWorkers || [];
          setPerformanceHighlights({
            avgJobsPerWorker:
              workers.length > 0
                ? Math.round(stats.jobs.total / stats.workers.active)
                : 0,
            completionRate:
              stats.jobs.total > 0
                ? Math.round((stats.jobs.completed / stats.jobs.total) * 100)
                : 0,
            avgRevenuePerJob: stats.payments.averagePerJob || null,
            collectionRate: stats.payments.collectionRate || 0,
            activeWorkersPercent:
              stats.workers.total > 0
                ? Math.round((stats.workers.active / stats.workers.total) * 100)
                : 0,
            totalCustomerVehicles: stats.customers.vehicles || 0,
          });
        }
      }

      if (!showLoader) {
        toast.success("Dashboard refreshed successfully");
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleRefresh = () => {
    fetchDashboardData(false);
  };

  // Export dashboard data to JSON
  const handleExportData = () => {
    try {
      const exportData = {
        adminStats,
        comparativeData,
        topWorkers,
        buildingAnalytics: buildingAnalytics.slice(0, 10),
        exportedAt: new Date().toISOString(),
      };

      const dataStr = JSON.stringify(exportData, null, 2);
      const dataBlob = new Blob([dataStr], { type: "application/json" });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `dashboard-export-${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success("Dashboard data exported successfully!");
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Failed to export data");
    }
  };

  // Format currency using global currency from settings
  const formatCurrency = (amount) => {
    const currencySymbol = localStorage.getItem("app_currency") || "AED";

    // Handle symbol-based currencies (like $, €, £, ₹)
    if (currencySymbol.length === 1 || currencySymbol === "₹") {
      return `${currencySymbol} ${new Intl.NumberFormat("en-US", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(amount || 0)}`;
    }

    // Handle code-based currencies (like AED, SAR, QAR, etc.)
    return `${new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount || 0)} ${currencySymbol}`;
  };

  // Format number with commas
  const formatNumber = (num) => {
    return new Intl.NumberFormat("en-IN").format(num || 0);
  };

  // Colors for charts
  const COLORS = {
    primary: "#6366f1",
    secondary: "#8b5cf6",
    success: "#10b981",
    warning: "#f59e0b",
    danger: "#ef4444",
    info: "#06b6d4",
    pink: "#ec4899",
    teal: "#14b8a6",
  };

  const CHART_COLORS = [
    "#6366f1",
    "#8b5cf6",
    "#ec4899",
    "#f59e0b",
    "#10b981",
    "#06b6d4",
    "#14b8a6",
    "#f43f5e",
  ];

  // Service type icons
  const SERVICE_ICONS = {
    residence: Home,
    commercial: Building,
    mall: ShoppingBag,
    onewash: Package,
  };

  // Animated Stat Card Component with Consistent Styling
  const StatCard = ({
    title,
    value,
    subtitle,
    icon: Icon,
    trend,
    trendValue,
    color,
    delay = 0,
  }) => {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay }}
        whileHover={{ y: -5, scale: 1.02 }}
        className="group relative bg-white/80 backdrop-blur-xl rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-500 overflow-hidden border border-slate-200/50"
      >
        {/* Background gradient on hover */}
        <div
          className={`absolute inset-0 bg-gradient-to-br ${color} opacity-0 group-hover:opacity-10 transition-opacity duration-500`}
        ></div>

        <div className="relative p-6">
          {/* Icon and Title Row */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <motion.div
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.6 }}
                className={`p-3 rounded-xl bg-gradient-to-br ${color} shadow-lg`}
              >
                <Icon className="w-5 h-5 text-white" />
              </motion.div>
              <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide">
                {title}
              </h3>
            </div>
          </div>

          {/* Count and Percentage Badge Row */}
          <div className="flex items-center justify-between mb-2">
            {loading ? (
              <div className="h-10 w-24 bg-gradient-to-r from-slate-100 via-slate-200 to-slate-100 rounded-lg animate-pulse"></div>
            ) : (
              <motion.p
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                className="text-3xl font-black text-slate-900"
              >
                {value}
              </motion.p>
            )}
            {trend && trendValue && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: delay + 0.2, type: "spring" }}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold shadow-md ${
                  trend === "up"
                    ? "bg-gradient-to-r from-green-400 to-emerald-500 text-white"
                    : "bg-gradient-to-r from-red-400 to-rose-500 text-white"
                }`}
              >
                {trend === "up" ? (
                  <ArrowUp className="w-3 h-3" />
                ) : (
                  <ArrowDown className="w-3 h-3" />
                )}
                {trendValue}%
              </motion.div>
            )}
          </div>

          {/* Description */}
          {subtitle && (
            <p className="text-sm font-medium text-slate-500">{subtitle}</p>
          )}
        </div>

        {/* Bottom accent bar */}
        <div
          className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${color} opacity-50 group-hover:opacity-100 transition-opacity`}
        ></div>
      </motion.div>
    );
  };

  // Top Worker Row Component
  const TopWorkerRow = ({ worker, index }) => {
    const medals = ["🥇", "🥈", "🥉"];

    // Extract worker name with fallbacks
    const workerName =
      worker.name ||
      worker.workerName ||
      worker.worker?.name ||
      worker.workerId ||
      "Unknown Worker";
    const workerPhone =
      worker.phone ||
      worker.mobile ||
      worker.phoneNumber ||
      worker.worker?.phone ||
      "N/A";

    return (
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: index * 0.1 }}
        whileHover={{ scale: 1.02, x: 8 }}
        className="flex items-center justify-between p-6 bg-gradient-to-r from-white via-slate-50 to-white rounded-2xl hover:from-indigo-50 hover:via-purple-50 hover:to-pink-50 transition-all duration-300 border-2 border-slate-100 hover:border-indigo-200 group shadow-md hover:shadow-xl"
      >
        <div className="flex items-center gap-4 flex-1">
          <motion.div
            whileHover={{ rotate: 360, scale: 1.1 }}
            transition={{ duration: 0.5 }}
            className={`flex items-center justify-center w-14 h-14 rounded-2xl font-black text-2xl shadow-xl transition-all ${
              index === 0
                ? "bg-gradient-to-br from-yellow-400 via-yellow-500 to-amber-600 text-white animate-pulse"
                : index === 1
                  ? "bg-gradient-to-br from-slate-300 via-slate-400 to-slate-500 text-white"
                  : index === 2
                    ? "bg-gradient-to-br from-orange-400 via-orange-500 to-orange-600 text-white"
                    : "bg-gradient-to-br from-indigo-400 via-indigo-500 to-indigo-600 text-white"
            }`}
          >
            {index < 3 ? medals[index] : index + 1}
          </motion.div>
          <div className="flex-1">
            <h4 className="font-black text-slate-900 text-xl group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-indigo-600 group-hover:to-purple-600 transition-all">
              {workerName}
            </h4>
            <p className="text-sm text-slate-500 font-semibold flex items-center gap-1">
              <span>📞</span> {workerPhone}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-8">
          <div className="text-right">
            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">
              Jobs
            </p>
            <p className="text-2xl font-black bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
              {formatNumber(worker.totalJobs)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-emerald-600 font-bold uppercase tracking-wider mb-1">
              Revenue
            </p>
            <p className="text-2xl font-black bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">
              {formatCurrency(worker.totalRevenue)}
            </p>
          </div>
        </div>
      </motion.div>
    );
  };

  if (loading && !adminStats) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="inline-block"
          >
            <Loader2 className="w-16 h-16 text-indigo-600" />
          </motion.div>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="mt-4 text-slate-600 font-semibold text-lg"
          >
            Loading dashboard...
          </motion.p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 p-6 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-indigo-400/20 to-purple-400/20 rounded-full blur-3xl animate-pulse"></div>
        <div
          className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "1s" }}
        ></div>
        <div
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-blue-400/10 to-cyan-400/10 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "2s" }}
        ></div>
      </div>

      <div className="max-w-[1920px] mx-auto space-y-8 relative z-10">
        {/* Quick Action Bar */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between bg-white/60 backdrop-blur-xl rounded-2xl px-6 py-3 shadow-lg border border-white/50"
        >
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-black bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              Dashboard
            </h1>
            {cacheInfo && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-lg text-xs">
                <ClockIcon className="w-3 h-3 text-slate-500" />
                <span className="text-slate-600 font-semibold">
                  {cacheInfo.cached
                    ? `Cached ${cacheInfo.cacheAge}s ago`
                    : `Loaded in ${cacheInfo.loadTime}`}
                </span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-3">
            {pp.isToolbarVisible("exportData") && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleExportData}
              disabled={!adminStats}
              className="px-4 py-2 rounded-xl font-bold text-sm bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:shadow-lg transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FileDown className="w-4 h-4" />
              Export
            </motion.button>
            )}
            {pp.isToolbarVisible("refresh") && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleRefresh}
              disabled={refreshing}
              className="px-4 py-2 rounded-xl font-bold text-sm bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:shadow-lg transition-all flex items-center gap-2 disabled:opacity-50"
            >
              <RefreshCw
                className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`}
              />
              Refresh
            </motion.button>
            )}
            {pp.isToolbarVisible("advancedCharts") && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowAdvancedCharts(!showAdvancedCharts)}
              className="px-4 py-2 rounded-xl font-bold text-sm bg-white border-2 border-slate-300 text-slate-700 hover:bg-slate-50 transition-all flex items-center gap-2"
            >
              <BarChart3 className="w-4 h-4" />
              {showAdvancedCharts ? "Hide" : "Show"} Charts
            </motion.button>
            )}
          </div>
        </motion.div>
        {/* Comparative Stats - Period Over Period */}
        {comparativeData && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="flex items-center gap-3 mb-6 group">
              <motion.div
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.6 }}
                className="p-3 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-600 shadow-xl"
              >
                <Activity className="w-7 h-7 text-white" />
              </motion.div>
              <div>
                <h2 className="text-3xl font-extrabold bg-gradient-to-r from-indigo-600 via-blue-600 to-cyan-600 bg-clip-text text-transparent flex items-center gap-2">
                  Performance Comparison
                  <Sparkles className="w-5 h-5 text-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                </h2>
                <p className="text-sm text-slate-500 font-medium mt-1">
                  Period over period analysis
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Today vs Yesterday */}
              <motion.div
                whileHover={{ scale: 1.03, y: -8 }}
                transition={{ duration: 0.3 }}
                className="relative bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 rounded-3xl shadow-2xl p-8 text-white overflow-hidden group"
              >
                <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -mr-20 -mt-20 group-hover:scale-150 transition-transform duration-500"></div>
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full -ml-16 -mb-16 group-hover:scale-150 transition-transform duration-500"></div>
                <div className="relative">
                  <h3 className="text-xl font-black mb-6 flex items-center gap-2">
                    <Calendar className="w-6 h-6" />
                    Today vs Yesterday
                  </h3>
                  <div className="space-y-4">
                    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                      <p className="text-sm opacity-90 mb-1">Jobs</p>
                      <div className="flex items-center justify-between">
                        <p className="text-2xl font-bold">
                          {comparativeData.daily.today.jobs}
                        </p>
                        <span
                          className={`flex items-center gap-1 text-sm font-bold px-2 py-1 rounded-lg ${
                            comparativeData.daily.change.jobs >= 0
                              ? "bg-green-500/30"
                              : "bg-red-500/30"
                          }`}
                        >
                          {comparativeData.daily.change.jobs >= 0 ? (
                            <ArrowUp className="w-4 h-4" />
                          ) : (
                            <ArrowDown className="w-4 h-4" />
                          )}
                          {Math.abs(
                            comparativeData.daily.change.jobsPercentage,
                          )}
                          %
                        </span>
                      </div>
                    </div>
                    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                      <p className="text-sm opacity-90 mb-1">Revenue</p>
                      <div className="flex items-center justify-between">
                        <p className="text-2xl font-bold">
                          {formatCurrency(comparativeData.daily.today.revenue)}
                        </p>
                        <span
                          className={`flex items-center gap-1 text-sm font-bold px-2 py-1 rounded-lg ${
                            comparativeData.daily.change.revenue >= 0
                              ? "bg-green-500/30"
                              : "bg-red-500/30"
                          }`}
                        >
                          {comparativeData.daily.change.revenue >= 0 ? (
                            <ArrowUp className="w-4 h-4" />
                          ) : (
                            <ArrowDown className="w-4 h-4" />
                          )}
                          {Math.abs(
                            comparativeData.daily.change.revenuePercentage,
                          )}
                          %
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* This Week vs Last Week */}
              <motion.div
                whileHover={{ scale: 1.03, y: -8 }}
                transition={{ duration: 0.3 }}
                className="relative bg-gradient-to-br from-purple-500 via-purple-600 to-fuchsia-600 rounded-3xl shadow-2xl p-8 text-white overflow-hidden group"
              >
                <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -mr-20 -mt-20 group-hover:scale-150 transition-transform duration-500"></div>
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full -ml-16 -mb-16 group-hover:scale-150 transition-transform duration-500"></div>
                <div className="relative">
                  <h3 className="text-xl font-black mb-6 flex items-center gap-2">
                    <Calendar className="w-6 h-6" />
                    This Week vs Last Week
                  </h3>
                  <div className="space-y-4">
                    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                      <p className="text-sm opacity-90 mb-1">Jobs</p>
                      <div className="flex items-center justify-between">
                        <p className="text-2xl font-bold">
                          {comparativeData.weekly.thisWeek.jobs}
                        </p>
                        <span
                          className={`flex items-center gap-1 text-sm font-bold px-2 py-1 rounded-lg ${
                            comparativeData.weekly.change.jobs >= 0
                              ? "bg-green-500/30"
                              : "bg-red-500/30"
                          }`}
                        >
                          {comparativeData.weekly.change.jobs >= 0 ? (
                            <ArrowUp className="w-4 h-4" />
                          ) : (
                            <ArrowDown className="w-4 h-4" />
                          )}
                          {Math.abs(
                            comparativeData.weekly.change.jobsPercentage,
                          )}
                          %
                        </span>
                      </div>
                    </div>
                    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                      <p className="text-sm opacity-90 mb-1">Revenue</p>
                      <div className="flex items-center justify-between">
                        <p className="text-2xl font-bold">
                          {formatCurrency(
                            comparativeData.weekly.thisWeek.revenue,
                          )}
                        </p>
                        <span
                          className={`flex items-center gap-1 text-sm font-bold px-2 py-1 rounded-lg ${
                            comparativeData.weekly.change.revenue >= 0
                              ? "bg-green-500/30"
                              : "bg-red-500/30"
                          }`}
                        >
                          {comparativeData.weekly.change.revenue >= 0 ? (
                            <ArrowUp className="w-4 h-4" />
                          ) : (
                            <ArrowDown className="w-4 h-4" />
                          )}
                          {Math.abs(
                            comparativeData.weekly.change.revenuePercentage,
                          )}
                          %
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}

        {/* Main Stats Grid */}
        {adminStats && (
          <>
            {/* Financial Overview */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <div className="flex items-center gap-3 mb-6 group">
                <motion.div
                  whileHover={{ rotate: 360 }}
                  transition={{ duration: 0.6 }}
                  className="p-3 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 shadow-xl"
                >
                  <DollarSign className="w-7 h-7 text-white" />
                </motion.div>
                <div>
                  <h2 className="text-3xl font-extrabold bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 bg-clip-text text-transparent flex items-center gap-2">
                    Financial Overview
                    <Sparkles className="w-5 h-5 text-green-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </h2>
                  <p className="text-sm text-slate-500 font-medium mt-1">
                    Revenue and payment metrics
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                  title="Total Revenue"
                  value={formatCurrency(adminStats.payments.total)}
                  subtitle={`${formatNumber(adminStats.payments.count)} transactions`}
                  icon={DollarSign}
                  color="from-green-500 to-emerald-600"
                  delay={0}
                />
                <StatCard
                  title="Collected"
                  value={formatCurrency(adminStats.payments.collected)}
                  subtitle={`${adminStats.payments.collectionRate.toFixed(1)}% collection rate`}
                  icon={CheckCircle}
                  trend="up"
                  trendValue={adminStats.payments.collectionRate.toFixed(1)}
                  color="from-blue-500 to-blue-600"
                  delay={0.1}
                />
                <StatCard
                  title="Pending"
                  value={formatCurrency(adminStats.payments.pending)}
                  subtitle="Awaiting payment"
                  icon={Clock}
                  color="from-yellow-500 to-orange-500"
                  delay={0.2}
                />
                <StatCard
                  title="Overdue"
                  value={formatCurrency(adminStats.payments.overdue)}
                  subtitle="Requires attention"
                  icon={XCircle}
                  color="from-red-500 to-rose-600"
                  delay={0.3}
                />
              </div>
            </motion.div>

            {/* Jobs & Services */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <div className="flex items-center gap-3 mb-6 group">
                <motion.div
                  whileHover={{ rotate: 360 }}
                  transition={{ duration: 0.6 }}
                  className="p-3 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-600 shadow-xl"
                >
                  <Briefcase className="w-7 h-7 text-white" />
                </motion.div>
                <div>
                  <h2 className="text-3xl font-extrabold bg-gradient-to-r from-indigo-600 via-blue-600 to-cyan-600 bg-clip-text text-transparent flex items-center gap-2">
                    Jobs & Services
                    <Sparkles className="w-5 h-5 text-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </h2>
                  <p className="text-sm text-slate-500 font-medium mt-1">
                    Task completion and service status
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                  title="Total Jobs"
                  value={formatNumber(adminStats.jobs.total)}
                  subtitle={`${adminStats.jobs.completionRate.toFixed(1)}% completion rate`}
                  icon={Briefcase}
                  color="from-indigo-500 to-indigo-600"
                  delay={0}
                />
                <StatCard
                  title="Completed"
                  value={formatNumber(adminStats.jobs.completed)}
                  subtitle="Successfully finished"
                  icon={CheckCircle}
                  trend="up"
                  trendValue={adminStats.jobs.completionRate.toFixed(1)}
                  color="from-green-500 to-emerald-600"
                  delay={0.1}
                />
                <StatCard
                  title="Pending"
                  value={formatNumber(adminStats.jobs.pending)}
                  subtitle="In progress"
                  icon={Clock}
                  color="from-yellow-500 to-orange-500"
                  delay={0.2}
                />
                <StatCard
                  title="Rejected"
                  value={formatNumber(adminStats.jobs.cancelled)}
                  subtitle="Not completed"
                  icon={XCircle}
                  color="from-red-500 to-rose-600"
                  delay={0.3}
                />
                <StatCard
                  title="Mall Services"
                  value={formatNumber(adminStats.serviceTypes.mall)}
                  subtitle="Commercial malls"
                  icon={ShoppingBag}
                  color="from-blue-500 to-cyan-600"
                  delay={0.4}
                />
                <StatCard
                  title="Residence Services"
                  value={formatNumber(adminStats.serviceTypes.residence)}
                  subtitle="Residential areas"
                  icon={Home}
                  color="from-teal-500 to-green-600"
                  delay={0.5}
                />
              </div>
            </motion.div>

            {/* Customers & Resources */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <div className="flex items-center gap-3 mb-6 group">
                <motion.div
                  whileHover={{ rotate: 360 }}
                  transition={{ duration: 0.6 }}
                  className="p-3 rounded-2xl bg-gradient-to-br from-purple-500 to-purple-600 shadow-xl"
                >
                  <Users className="w-7 h-7 text-white" />
                </motion.div>
                <div>
                  <h2 className="text-3xl font-extrabold bg-gradient-to-r from-purple-600 via-pink-600 to-rose-600 bg-clip-text text-transparent flex items-center gap-2">
                    Customers & Resources
                    <Sparkles className="w-5 h-5 text-purple-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </h2>
                  <p className="text-sm text-slate-500 font-medium mt-1">
                    Customer base and resource allocation
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                  title="Total Customers"
                  value={formatNumber(adminStats.customers.total)}
                  subtitle={`${formatNumber(adminStats.customers.active)} active`}
                  icon={Users}
                  color="from-purple-500 to-purple-600"
                  delay={0}
                />
                <StatCard
                  title="Vehicles"
                  value={formatNumber(adminStats.customers.vehicles)}
                  subtitle="Registered vehicles"
                  icon={Car}
                  color="from-pink-500 to-pink-600"
                  delay={0.1}
                />
                <StatCard
                  title="Total Workers"
                  value={formatNumber(adminStats.workers.total)}
                  subtitle={`${formatNumber(adminStats.workers.active)} active`}
                  icon={Users}
                  color="from-cyan-500 to-cyan-600"
                  delay={0.2}
                />
                <StatCard
                  title="Buildings"
                  value={formatNumber(adminStats.buildings.total)}
                  subtitle="Service locations"
                  icon={Building}
                  color="from-orange-500 to-orange-600"
                  delay={0.3}
                />
              </div>
            </motion.div>
          </>
        )}

        {/* Charts Section */}
        <AnimatePresence>
          {showAdvancedCharts && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              {/* Monthly Jobs Overview - Residence & OneWash */}
              {charts && charts.residence && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 }}
                  className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl p-8 border border-white/50 col-span-2 hover:shadow-3xl transition-all duration-500"
                >
                  <div className="flex items-center gap-3 mb-8">
                    <motion.div
                      whileHover={{ rotate: 360 }}
                      transition={{ duration: 0.6 }}
                      className="p-3 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-600 shadow-xl"
                    >
                      <BarChart3 className="w-7 h-7 text-white" />
                    </motion.div>
                    <div>
                      <h3 className="text-2xl font-black bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent flex items-center gap-2">
                        Monthly Jobs Overview
                        <Sparkles className="w-5 h-5 text-indigo-500\" />
                      </h3>
                      <p className="text-sm text-slate-500 font-medium mt-1">
                        Yearly job trends and statistics
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Residence Jobs */}
                    <div>
                      <h4 className="text-sm font-semibold text-slate-600 mb-3 flex items-center gap-2">
                        <Home className="w-4 h-4" />
                        Residence Jobs
                      </h4>
                      <ResponsiveContainer width="100%" height={300}>
                        <ComposedChart
                          data={charts.residence.jobs.labels.map(
                            (label, index) => ({
                              month: label,
                              completed: charts.residence.jobs.completed[index],
                              pending: charts.residence.jobs.pending[index],
                              total:
                                charts.residence.jobs.completed[index] +
                                charts.residence.jobs.pending[index],
                            }),
                          )}
                        >
                          <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="#f0f0f0"
                          />
                          <XAxis
                            dataKey="month"
                            stroke="#94a3b8"
                            fontSize={11}
                          />
                          <YAxis stroke="#94a3b8" fontSize={11} />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "#fff",
                              border: "1px solid #e2e8f0",
                              borderRadius: "12px",
                              boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
                            }}
                          />
                          <Legend />
                          <Bar
                            dataKey="completed"
                            fill={COLORS.success}
                            radius={[8, 8, 0, 0]}
                          />
                          <Bar
                            dataKey="pending"
                            fill={COLORS.warning}
                            radius={[8, 8, 0, 0]}
                          />
                          <Line
                            type="monotone"
                            dataKey="total"
                            stroke={COLORS.primary}
                            strokeWidth={2}
                          />
                        </ComposedChart>
                      </ResponsiveContainer>
                    </div>

                    {/* OneWash Jobs */}
                    {charts.onewash && (
                      <div>
                        <h4 className="text-sm font-semibold text-slate-600 mb-3 flex items-center gap-2">
                          <Package className="w-4 h-4" />
                          OneWash Jobs
                        </h4>
                        <ResponsiveContainer width="100%" height={300}>
                          <ComposedChart
                            data={charts.onewash.jobs.labels.map(
                              (label, index) => ({
                                month: label,
                                completed: charts.onewash.jobs.completed[index],
                                pending: charts.onewash.jobs.pending[index],
                                total:
                                  charts.onewash.jobs.completed[index] +
                                  charts.onewash.jobs.pending[index],
                              }),
                            )}
                          >
                            <CartesianGrid
                              strokeDasharray="3 3"
                              stroke="#f0f0f0"
                            />
                            <XAxis
                              dataKey="month"
                              stroke="#94a3b8"
                              fontSize={11}
                            />
                            <YAxis stroke="#94a3b8" fontSize={11} />
                            <Tooltip
                              contentStyle={{
                                backgroundColor: "#fff",
                                border: "1px solid #e2e8f0",
                                borderRadius: "12px",
                                boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
                              }}
                            />
                            <Legend />
                            <Bar
                              dataKey="completed"
                              fill="#10b981"
                              radius={[8, 8, 0, 0]}
                            />
                            <Bar
                              dataKey="pending"
                              fill="#f59e0b"
                              radius={[8, 8, 0, 0]}
                            />
                            <Line
                              type="monotone"
                              dataKey="total"
                              stroke="#8b5cf6"
                              strokeWidth={2}
                            />
                          </ComposedChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {/* Building Performance */}
              {buildingAnalytics.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.9 }}
                  className="bg-white rounded-2xl shadow-xl p-6 border border-slate-200"
                >
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                      <Building className="w-5 h-5 text-orange-600" />
                      Top Buildings Performance
                    </h3>
                  </div>
                  <ResponsiveContainer width="100%" height={380}>
                    <BarChart data={buildingAnalytics.slice(0, 10)}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis
                        dataKey="buildingName"
                        stroke="#94a3b8"
                        fontSize={11}
                        angle={-35}
                        textAnchor="end"
                        height={120}
                      />
                      <YAxis stroke="#94a3b8" fontSize={12} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#fff",
                          border: "1px solid #e2e8f0",
                          borderRadius: "12px",
                          boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
                        }}
                      />
                      <Legend />
                      <Bar
                        dataKey="totalJobs"
                        fill={COLORS.primary}
                        radius={[8, 8, 0, 0]}
                        name="Total Jobs"
                      />
                      <Bar
                        dataKey="completedJobs"
                        fill={COLORS.success}
                        radius={[8, 8, 0, 0]}
                        name="Completed"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Top Workers */}
        {topWorkers.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.0 }}
            className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl p-8 border border-white/50 hover:shadow-3xl transition-all duration-500"
          >
            <div className="flex items-center gap-3 mb-8">
              <motion.div
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.6 }}
                className="p-3 rounded-2xl bg-gradient-to-br from-yellow-500 to-amber-600 shadow-xl"
              >
                <Award className="w-7 h-7 text-white" />
              </motion.div>
              <div className="flex-1">
                <h3 className="text-2xl font-black bg-gradient-to-r from-yellow-600 via-amber-600 to-orange-600 bg-clip-text text-transparent flex items-center gap-2">
                  Top Performing Workers
                  <Sparkles className="w-5 h-5 text-yellow-500" />
                </h3>
                <p className="text-sm text-slate-500 font-medium mt-1">
                  Highest achievers of the month
                </p>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-yellow-400 to-amber-500 rounded-xl text-white font-bold shadow-lg">
                <Trophy className="w-5 h-5" />
                <span>Top 10</span>
              </div>
            </div>
            <div className="space-y-3">
              {topWorkers.map((worker, index) => (
                <TopWorkerRow
                  key={worker.workerId}
                  worker={worker}
                  index={index}
                />
              ))}
            </div>
          </motion.div>
        )}

        {/* Performance Highlights */}
        {performanceHighlights && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.1 }}
            className="bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 rounded-2xl shadow-xl p-8 text-white"
          >
            <div className="flex items-center gap-3 mb-8">
              <Sparkles className="w-7 h-7" />
              <h3 className="text-2xl font-bold">Performance Highlights</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Completion Rate */}
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 bg-white/20 rounded-lg">
                    <Target className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm opacity-90">Completion Rate</p>
                    <p className="text-3xl font-bold">
                      {performanceHighlights.completionRate}%
                    </p>
                  </div>
                </div>
                <p className="text-sm opacity-75">
                  Jobs successfully completed
                </p>
              </motion.div>

              {/* Jobs per Worker */}
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 bg-white/20 rounded-lg">
                    <Users className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm opacity-90">Jobs per Worker</p>
                    <p className="text-3xl font-bold">
                      {performanceHighlights.avgJobsPerWorker
                        ? Math.round(performanceHighlights.avgJobsPerWorker)
                        : 0}
                    </p>
                  </div>
                </div>
                <p className="text-sm opacity-75">
                  Average workload distribution
                </p>
              </motion.div>

              {/* Active Workers */}
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 bg-white/20 rounded-lg">
                    <Zap className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm opacity-90">Active Workers</p>
                    <p className="text-3xl font-bold">
                      {performanceHighlights.activeWorkersPercent}%
                    </p>
                  </div>
                </div>
                <p className="text-sm opacity-75">Currently active workforce</p>
              </motion.div>

              {/* Total Vehicles */}
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 bg-white/20 rounded-lg">
                    <Car className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm opacity-90">Total Vehicles</p>
                    <p className="text-3xl font-bold">
                      {formatNumber(
                        performanceHighlights.totalCustomerVehicles,
                      )}
                    </p>
                  </div>
                </div>
                <p className="text-sm opacity-75">
                  Registered customer vehicles
                </p>
              </motion.div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

// Trophy icon component (since lucide-react might not have it)
const Trophy = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
    <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
    <path d="M4 22h16" />
    <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
    <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
    <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
  </svg>
);

export default Dashboard;
