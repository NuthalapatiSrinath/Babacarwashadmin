import { useNavigate, useLocation } from "react-router-dom";
import { Menu, Moon, Sun, LogOut } from "lucide-react";
import toast from "react-hot-toast";
import { routes } from "../routes";

const Header = ({ onMenuClick, theme, toggleTheme }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const currentRoute = routes.find((route) => route.path === location.pathname);
  const pageTitle = currentRoute ? currentRoute.title : "Dashboard Overview";

  // --- User Data Logic ---
  const userString = localStorage.getItem("user");
  const user = userString ? JSON.parse(userString) : {};
  const userName = user.firstName || "Admin";
  const userRole = user.role || "Manager";
  const userInitial = userName.charAt(0).toUpperCase();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("isAuthenticated");
    toast.success("Logged out successfully");
    navigate("/login", { replace: true });
  };

  return (
    // UPDATED STYLE:
    // 1. Removed 'border-b-2 border-indigo-500' (The blue line)
    // 2. Added 'border-b border-slate-200' (Subtle separator)
    // 3. Kept 'shadow-md' and 'backdrop-blur' for the premium feel
    <header
      className="
      sticky top-0 z-30 
      flex items-center justify-between 
      h-14 md:h-header-h 
      px-4 md:px-8 
      bg-white/80 dark:bg-slate-900/80 backdrop-blur-md 
      border-b border-slate-200 dark:border-slate-800
      shadow-sm
      transition-all duration-300
    "
    >
      {/* Left Side */}
      <div className="flex items-center gap-4">
        {/* Mobile Hamburger */}
        <button
          onClick={onMenuClick}
          className="p-2 text-slate-500 hover:bg-slate-100 hover:text-indigo-600 rounded-lg transition-colors lg:hidden"
        >
          <Menu className="w-6 h-6" />
        </button>

        <div className="hidden md:block">
          <h2 className="text-xl font-bold text-slate-800 dark:text-white transition-all duration-300 tracking-tight">
            {pageTitle}
          </h2>
        </div>
      </div>

      {/* Right Side */}
      <div className="flex items-center gap-2 md:gap-4">
        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 md:p-2.5 rounded-full text-slate-500 hover:bg-slate-100 hover:text-indigo-600 dark:text-slate-400 dark:hover:bg-slate-800 transition-all active:scale-95"
        >
          {theme === "dark" ? (
            <Sun className="w-5 h-5" />
          ) : (
            <Moon className="w-5 h-5" />
          )}
        </button>

        {/* Divider */}
        <div className="h-6 md:h-8 w-[1px] bg-slate-200 dark:bg-slate-700 mx-1 hidden sm:block"></div>

        {/* User Profile */}
        <div className="flex items-center gap-2 md:gap-3 group cursor-pointer">
          <div className="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-xs md:text-sm shadow-md shadow-indigo-500/30 group-hover:shadow-lg group-hover:shadow-indigo-500/40 transition-all transform group-hover:scale-105">
            {userInitial}
          </div>

          <div className="hidden lg:block leading-tight">
            <p className="text-sm font-bold text-slate-800 dark:text-white group-hover:text-indigo-600 transition-colors">
              {userName}
            </p>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
              {userRole}
            </p>
          </div>
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="flex items-center justify-center p-2 md:p-2.5 text-red-500 bg-red-50 hover:bg-red-500 hover:text-white rounded-full transition-all duration-300 ml-1 md:ml-2 shadow-sm hover:shadow-red-200"
          title="Logout"
        >
          <LogOut className="w-4 h-4 md:w-5 md:h-5" />
        </button>
      </div>
    </header>
  );
};

export default Header;
