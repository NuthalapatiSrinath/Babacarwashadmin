import { useNavigate } from "react-router-dom";
import { useLocation } from "react-router-dom";
import { Menu, Moon, Sun, LogOut } from "lucide-react";
import toast from "react-hot-toast";
import { routes } from "../routes";

const Header = ({ onMenuClick, theme, toggleTheme }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const currentRoute = routes.find((route) => route.path === location.pathname);
  const pageTitle = currentRoute ? currentRoute.title : "Dashboard Overview";

  const handleLogout = () => {
    localStorage.removeItem("isAuthenticated");
    toast.success("Logged out successfully");
    navigate("/login");
  };

  return (
    <header className="h-header-h bg-card/80 backdrop-blur-md border-b border-border sticky top-0 z-30 flex items-center justify-between px-4 md:px-8 transition-colors duration-300">
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          className="p-2 text-text-sub hover:bg-page hover:text-text-main rounded-lg transition-colors cursor-pointer"
        >
          <Menu className="w-6 h-6" />
        </button>

        {/* Only Page Title now */}
        <div className="hidden md:block">
          <h2 className="text-xl font-bold text-text-main transition-all duration-300">
            {pageTitle}
          </h2>
        </div>
      </div>

      <div className="flex items-center gap-3 md:gap-4">
        <button
          onClick={toggleTheme}
          className="p-2.5 rounded-full text-text-sub hover:bg-page hover:text-primary transition-all active:scale-95"
          title="Toggle Theme"
        >
          {theme === "dark" ? (
            <Sun className="w-5 h-5" />
          ) : (
            <Moon className="w-5 h-5" />
          )}
        </button>

        <div className="h-8 w-[1px] bg-border mx-1 hidden sm:block"></div>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-tr from-primary to-primary-hover rounded-full flex items-center justify-center text-text-inverse font-bold text-sm shadow-md shadow-primary/20 cursor-default">
            A
          </div>
          <div className="hidden lg:block leading-tight">
            <p className="text-sm font-bold text-text-main">Admin</p>
            <p className="text-[10px] text-text-sub font-medium uppercase tracking-wider">
              Manager
            </p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="flex items-center justify-center p-2.5 text-danger bg-danger-bg hover:bg-danger hover:text-text-inverse rounded-full transition-all duration-200 ml-2"
          title="Logout"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
};

export default Header;
