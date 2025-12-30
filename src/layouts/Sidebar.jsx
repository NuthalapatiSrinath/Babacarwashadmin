import { useState, useEffect } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

import {
  LayoutDashboard,
  MapPin,
  Building2,
  ShoppingBag,
  LocateFixed,
  Users,
  UserCheck,
  Droplets,
  DollarSign,
  FileText,
  Receipt,
  Wallet,
  Tags,
  HelpCircle,
  Briefcase,
  ChevronRight,
  LogOut,
  X,
  ClipboardCheck, // Bookings
  Settings, // Settings
} from "lucide-react";

const Sidebar = ({ isOpen, isMobile, onClose }) => {
  const location = useLocation();

  const [openMenus, setOpenMenus] = useState({
    workers: false,
    washes: false,
    payments: false,
  });

  // Auto-open menus based on current URL
  useEffect(() => {
    if (location.pathname.startsWith("/workers")) {
      setOpenMenus((prev) => ({ ...prev, workers: true }));
    }
    if (location.pathname.startsWith("/washes")) {
      setOpenMenus((prev) => ({ ...prev, washes: true }));
    }
  }, [location.pathname]);

  const toggleMenu = (menu) => {
    setOpenMenus((prev) => ({ ...prev, [menu]: !prev[menu] }));
  };

  const isActiveParent = (paths) =>
    paths.some((path) => location.pathname.startsWith(path));

  const handleLinkClick = () => {
    if (isMobile && onClose) onClose();
  };

  const sidebarClasses = `
    fixed top-0 left-0 h-full
    bg-card text-text-main
    border-r border-border
    transition-transform duration-300 ease-in-out z-50
    w-[280px] max-w-[85vw] flex flex-col
    ${isOpen ? "translate-x-0" : "-translate-x-full"}
    ${isMobile ? "shadow-2xl" : ""}
  `;

  return (
    <>
      {/* Mobile Overlay */}
      <AnimatePresence>
        {isMobile && isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 z-40 backdrop-blur-sm"
          />
        )}
      </AnimatePresence>

      <aside className={sidebarClasses}>
        {/* Header */}
        <div className="h-header-h flex items-center px-5 border-b border-border/50 shrink-0 gap-3 relative bg-card">
          <img
            src="/carwash.jpeg"
            alt="Logo"
            className="w-10 h-10 object-contain shrink-0"
          />
          <img
            src="/logo-text.png"
            alt="Baba Car Wash"
            className="h-8 max-w-[140px] object-contain"
          />

          {isMobile && (
            <button
              onClick={onClose}
              className="absolute right-4 p-2 rounded-full text-text-sub hover:text-danger bg-page hover:bg-red-50 transition-colors"
            >
              <X size={20} />
            </button>
          )}
        </div>

        {/* Navigation */}
        <nav
          className="flex-1 px-4 py-6 overflow-y-auto no-scrollbar"
          aria-label="Main Navigation"
        >
          <ul className="space-y-1">
            {/* Overview */}
            <li className="px-4 text-[11px] font-extrabold text-text-muted uppercase tracking-widest mb-2 mt-1">
              Overview
            </li>

            <NavItem
              to="/"
              icon={LayoutDashboard}
              label="Dashboard"
              onClick={handleLinkClick}
            />

            {/* Management */}
            <li className="px-4 text-[11px] font-extrabold text-text-muted uppercase tracking-widest mb-2 mt-6">
              Management
            </li>

            <NavItem
              to="/locations"
              icon={MapPin}
              label="Locations"
              onClick={handleLinkClick}
            />
            <NavItem
              to="/buildings"
              icon={Building2}
              label="Buildings"
              onClick={handleLinkClick}
            />
            <NavItem
              to="/malls"
              icon={ShoppingBag}
              label="Malls"
              onClick={handleLinkClick}
            />
            <NavItem
              to="/sites"
              icon={LocateFixed}
              label="Sites"
              onClick={handleLinkClick}
            />

            {/* Workers */}
            <li>
              <MenuButton
                label="Workers Management"
                icon={Briefcase}
                isOpen={openMenus.workers}
                isActive={isActiveParent(["/workers"])}
                onClick={() => toggleMenu("workers")}
              />

              <SubMenu isOpen={openMenus.workers}>
                <SubNavItem
                  to="/workers/list"
                  label="Workers"
                  onClick={handleLinkClick}
                />
                <SubNavItem
                  to="/workers/staff"
                  label="Staff"
                  onClick={handleLinkClick}
                />
                <SubNavItem
                  to="/workers/attendance"
                  label="Attendance"
                  onClick={handleLinkClick}
                />
              </SubMenu>
            </li>

            <NavItem
              to="/supervisors"
              icon={UserCheck}
              label="Supervisors"
              onClick={handleLinkClick}
            />
            <NavItem
              to="/customers"
              icon={Users}
              label="Customers"
              onClick={handleLinkClick}
            />

            {/* Washes */}
            <li>
              <MenuButton
                label="Washes"
                icon={Droplets}
                isOpen={openMenus.washes}
                isActive={isActiveParent(["/washes"])}
                onClick={() => toggleMenu("washes")}
              />

              <SubMenu isOpen={openMenus.washes}>
                <SubNavItem
                  to="/washes/onewash"
                  label="One Wash"
                  onClick={handleLinkClick}
                />
                <SubNavItem
                  to="/washes/residence"
                  label="Residence"
                  onClick={handleLinkClick}
                />
              </SubMenu>
            </li>

            {/* Finance */}
            <li className="px-4 text-[11px] font-extrabold text-text-muted uppercase tracking-widest mb-2 mt-6">
              Finance
            </li>
            <li>
              <MenuButton
                label="Payments"
                icon={DollarSign}
                isOpen={openMenus.payments}
                isActive={isActiveParent(["/payments"])}
                onClick={() => toggleMenu("payments")}
              />

              <SubMenu isOpen={openMenus.payments}>
                {/* 🟣 NEW — One Wash Payments */}
                <SubNavItem
                  to="/payments/onewash"
                  label="One Wash"
                  onClick={handleLinkClick}
                />

                {/* 🟣 NEW — Residence Payments */}
                <SubNavItem
                  to="/payments/residence"
                  label="Residence"
                  onClick={handleLinkClick}
                />
              </SubMenu>
            </li>

            <NavItem
              to="/work-records"
              icon={FileText}
              label="Work Records"
              onClick={handleLinkClick}
            />
            <NavItem
              to="/collection-sheet"
              icon={Receipt}
              label="Collection Sheet"
              onClick={handleLinkClick}
            />
            <NavItem
              to="/settlements"
              icon={Wallet}
              label="Settlements"
              onClick={handleLinkClick}
            />
            <NavItem
              to="/pricing"
              icon={Tags}
              label="Pricing"
              onClick={handleLinkClick}
            />

            {/* Support */}
            <li className="px-4 text-[11px] font-extrabold text-text-muted uppercase tracking-widest mb-2 mt-6">
              Support
            </li>

            <NavItem
              to="/enquiry"
              icon={HelpCircle}
              label="Enquiry"
              onClick={handleLinkClick}
            />

            <NavItem
              to="/bookings"
              icon={ClipboardCheck}
              label="Bookings"
              onClick={handleLinkClick}
            />

            <NavItem
              to="/import-logs"
              icon={FileText}
              label="Import Logs"
              onClick={handleLinkClick}
            />

            <NavItem
              to="/settings"
              icon={Settings}
              label="Settings"
              onClick={handleLinkClick}
            />
          </ul>
        </nav>

        {/* Footer */}
        <div className="p-6 border-t border-border/50 shrink-0 bg-card">
          <button className="w-full flex items-center justify-center gap-2 text-danger bg-danger/10 hover:bg-danger/20 py-3 rounded-lg font-bold transition-colors text-sm">
            <LogOut size={18} />
            Logout Account
          </button>
        </div>
      </aside>
    </>
  );
};

/* Helper Components */

const NavItem = ({ to, icon: Icon, label, onClick }) => (
  <li>
    <NavLink
      to={to}
      onClick={onClick}
      className={({ isActive }) =>
        `flex items-center px-4 py-3.5 rounded-lg mb-1 transition-all duration-200 group relative overflow-hidden ${
          isActive
            ? "bg-primary-light text-primary-text font-semibold shadow-sm"
            : "text-text-sub hover:bg-page hover:text-text-main"
        }`
      }
    >
      {({ isActive }) => (
        <>
          {isActive && (
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary rounded-r-full" />
          )}
          <Icon
            className={`w-5 h-5 mr-3 transition-colors ${
              isActive
                ? "text-primary"
                : "text-text-sub group-hover:text-primary"
            }`}
          />
          <span className="truncate">{label}</span>
        </>
      )}
    </NavLink>
  </li>
);

const MenuButton = ({ label, icon: Icon, isOpen, isActive, onClick }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center justify-between px-4 py-3.5 rounded-lg mb-1 transition-all duration-200 group ${
      isActive
        ? "bg-page text-text-main font-medium shadow-sm"
        : "text-text-sub hover:bg-page hover:text-text-main"
    }`}
  >
    <div className="flex items-center">
      <Icon
        className={`w-5 h-5 mr-3 transition-colors ${
          isActive ? "text-primary" : "text-text-sub group-hover:text-primary"
        }`}
      />
      <span className="truncate">{label}</span>
    </div>

    <ChevronRight
      className={`w-4 h-4 text-text-sub transition-transform duration-300 ${
        isOpen ? "rotate-90" : ""
      }`}
    />
  </button>
);

const SubMenu = ({ isOpen, children }) => (
  <AnimatePresence>
    {isOpen && (
      <motion.ul
        initial={{ height: 0, opacity: 0 }}
        animate={{ height: "auto", opacity: 1 }}
        exit={{ height: 0, opacity: 0 }}
        className="ml-5 pl-3 border-l-2 border-primary/20 overflow-hidden"
      >
        {children}
      </motion.ul>
    )}
  </AnimatePresence>
);

const SubNavItem = ({ to, label, onClick }) => (
  <li>
    <NavLink
      to={to}
      onClick={onClick}
      className={({ isActive }) =>
        `block px-4 py-2.5 text-[13px] rounded-r-lg transition-all duration-200 ${
          isActive
            ? "text-primary font-bold bg-primary-light/50 border-l-2 border-primary -ml-[2px]"
            : "text-text-sub hover:text-text-main hover:bg-page"
        }`
      }
    >
      {label}
    </NavLink>
  </li>
);

export default Sidebar;
