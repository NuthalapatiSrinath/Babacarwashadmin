import {
  DollarSign,
  CalendarCheck,
  TrendingUp,
  Users,
  ArrowUpRight,
} from "lucide-react";

const StatCard = ({
  title,
  value,
  subtext,
  trend,
  icon: Icon,
  iconColor,
  bgIconColor,
}) => {
  return (
    <div className="bg-card p-6 rounded-card shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300 group">
      <div className="flex justify-between items-start mb-4">
        <div
          className={`p-3 rounded-DEFAULT ${bgIconColor} ${iconColor} group-hover:scale-110 transition-transform`}
        >
          <Icon className="w-6 h-6" />
        </div>
        {trend && (
          <span className="flex items-center text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-full">
            <ArrowUpRight className="w-3 h-3 mr-1" /> {trend}
          </span>
        )}
      </div>

      <div>
        <h3 className="text-3xl font-bold text-textMain mb-1 tracking-tight">
          {value}
        </h3>
        <p className="text-sm font-medium text-textSub">{title}</p>
        <p className="text-xs text-textSub/80 mt-2 border-t border-gray-50 pt-2">
          {subtext}
        </p>
      </div>
    </div>
  );
};

const Dashboard = () => {
  const stats = [
    {
      title: "Total Revenue",
      value: "₹2,28,103",
      subtext: "Lifetime Earnings",
      trend: "+12.5%",
      icon: DollarSign,
      iconColor: "text-primary",
      bgIconColor: "bg-primary-light",
    },
    {
      title: "Monthly Revenue",
      value: "₹25,010",
      subtext: "Current Month",
      trend: "+4.3%",
      icon: TrendingUp,
      iconColor: "text-green-600",
      bgIconColor: "bg-green-50",
    },
    {
      title: "Total Bookings",
      value: "183",
      subtext: "Completed Washes",
      icon: CalendarCheck,
      iconColor: "text-blue-600",
      bgIconColor: "bg-blue-50",
    },
    {
      title: "Active Customers",
      value: "1,204",
      subtext: "Verified Users",
      icon: Users,
      iconColor: "text-purple-600",
      bgIconColor: "bg-purple-50",
    },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-bold text-textMain tracking-tight">
            Welcome back, Admin! 👋
          </h1>
          <p className="text-textSub mt-2">
            Here is your daily performance summary.
          </p>
        </div>
        <button className="bg-primary hover:bg-primary-dark text-white px-6 py-2.5 rounded-DEFAULT font-semibold shadow-lg shadow-primary/30 transition-all hover:-translate-y-0.5">
          + New Booking
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <StatCard key={index} {...stat} />
        ))}
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Chart Area (Placeholder) */}
        <div className="lg:col-span-2 bg-card rounded-card border border-gray-100 p-6 h-80 shadow-sm flex items-center justify-center text-textSub">
          Chart Area (Recharts will go here)
        </div>

        {/* Side Info */}
        <div className="bg-card rounded-card border border-gray-100 p-6 h-80 shadow-sm">
          <h3 className="font-bold text-lg mb-4">Popular Services</h3>
          <ul className="space-y-4">
            <li className="flex justify-between items-center p-3 hover:bg-bgPage rounded-DEFAULT transition-colors cursor-pointer">
              <span className="font-medium">Foam Wash</span>
              <span className="text-primary font-bold">45%</span>
            </li>
            <li className="flex justify-between items-center p-3 hover:bg-bgPage rounded-DEFAULT transition-colors cursor-pointer">
              <span className="font-medium">Interior Cleaning</span>
              <span className="text-primary font-bold">30%</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
