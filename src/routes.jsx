import {
  LayoutDashboard,
  MapPin,
  Building2,
  ShoppingBag,
  LocateFixed,
  Droplets,
  DollarSign,
  FileText,
  Receipt,
  Wallet,
  Tags,
  HelpCircle,
  Briefcase,
  Users,
  ClipboardCheck,
  UserCheck,
} from "lucide-react";

// Page Imports
import Dashboard from "./pages/Dashboard";
import Locations from "./pages/Locations";
import Buildings from "./pages/Buildings";
import Malls from "./pages/Malls";
import Sites from "./pages/Sites";
import Supervisors from "./pages/Supervisors";
import Workers from "./pages/Workers";
import Staff from "./pages/Staff";
import Attendance from "./pages/Attendance";
import PlaceholderPage from "./pages/PlaceholderPage";
import Settings from "./pages/Settings";
import ImportLogs from "./pages/ImportLogs";
import Bookings from "./pages/Bookings";
import Enquiry from "./pages/Enquiry";
import Pricing from "./pages/Pricing";
import Customers from "./pages/Customers";
import CustomerHistory from "./pages/CustomerHistory"; // NEW IMPORT
import OneWash from "./pages/OneWash";
import Residence from "./pages/Residence";
import Payments from "./pages/Payments";
import OneWashPayments from "./pages/OneWashPayments";
import ResidencePayments from "./pages/ResidencePayments";
import WorkRecords from "./pages/WorkRecords";
import CollectionSheet from "./pages/CollectionSheet";

export const routes = [
  // --- OVERVIEW ---
  {
    path: "/",
    title: "Dashboard Overview",
    component: <Dashboard />,
    icon: LayoutDashboard,
  },

  // --- MANAGEMENT ---
  {
    path: "/locations",
    component: <Locations />,
  },
  {
    path: "/buildings",
    component: <Buildings />,
  },
  {
    path: "/malls",
    component: <Malls />,
  },
  {
    path: "/sites",
    component: <Sites />,
  },

  // --- WORKERS SECTION ---
  {
    path: "/workers/list",
    title: "Workers",
    component: <Workers />,
    icon: UserCheck,
  },
  {
    path: "/workers/staff",
    title: "Staff",
    component: <Staff />,
    icon: Users,
  },
  {
    path: "/workers/attendance",
    title: "Attendance",
    component: <Attendance />,
    icon: ClipboardCheck,
  },

  {
    path: "/supervisors",
    component: <Supervisors />,
  },

  // --- CUSTOMERS SECTION ---
  {
    path: "/customers",
    title: "Customer Database",
    component: <Customers />,
    icon: Users,
  },
  // Hidden Detail Route (No icon needed as it's not in sidebar)
  {
    path: "/customers/:id/history",
    title: "Customer History",
    component: <CustomerHistory />,
  },

  // --- WASHES ---
  {
    path: "/washes/onewash",
    title: "One Wash Service",
    component: <OneWash />,
    icon: Droplets,
  },
  {
    path: "/washes/residence",
    title: "Residence Service",
    component: <Residence />,
    icon: Droplets,
  },
  // --- FINANCE ---
  {
    path: "/payments",
    title: "Payment Transactions",
    component: <OneWashPayments />, // Transaction History (default)
    icon: DollarSign,
  },

  {
    path: "/payments/onewash",
    title: "One Wash Payments",
    component: <OneWashPayments />, // or different component if you prefer
    icon: DollarSign,
  },

  {
    path: "/payments/residence",
    title: "Residence Payments",
    component: <ResidencePayments />, // <-- use your Residence payments page
    icon: DollarSign,
  },

  {
    path: "/work-records",
    title: "Work Records",
    component: <WorkRecords />,
    icon: FileText,
  },
  {
    path: "/collection-sheet",
    title: "Collection Sheet",
    component: <CollectionSheet />,
    icon: Receipt,
  },
  {
    path: "/settlements",
    title: "Settlements",
    component: <PlaceholderPage title="Settlements" />,
    icon: Wallet,
  },
  {
    path: "/pricing",
    title: "Pricing Configuration",
    component: <Pricing />,
    icon: Tags,
  },

  // --- SUPPORT ---
  {
    path: "/enquiry",
    title: "Enquiries",
    component: <Enquiry />,
    icon: HelpCircle,
  },
  {
    path: "/bookings",
    title: "Bookings",
    component: <Bookings />,
  },
  {
    path: "/import-logs",
    title: "Import Logs",
    component: <ImportLogs />,
    icon: FileText,
  },
  {
    path: "/settings",
    title: "Settings",
    component: <Settings />,
  },
];
