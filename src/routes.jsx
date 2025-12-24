import {
  LayoutDashboard,
  MapPin,
  Building2,
  ShoppingBag,
  LocateFixed,
  Briefcase,
  UserCheck,
  Users,
  Droplets,
  DollarSign,
  FileText,
  Receipt,
  Wallet,
  Tags,
  HelpCircle,
} from "lucide-react";

// For now, we use a placeholder. Later you can import real pages like:
// import Dashboard from './pages/Dashboard';
import PlaceholderPage from "./pages/PlaceholderPage";
import Dashboard from "./pages/Dashboard"; // Keeping your existing Dashboard

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
    title: "Locations Management",
    component: <PlaceholderPage title="Locations" />,
    icon: MapPin,
  },
  {
    path: "/buildings",
    title: "Buildings Management",
    component: <PlaceholderPage title="Buildings" />,
    icon: Building2,
  },
  {
    path: "/malls",
    title: "Malls Management",
    component: <PlaceholderPage title="Malls" />,
    icon: ShoppingBag,
  },
  {
    path: "/sites",
    title: "Sites Management",
    component: <PlaceholderPage title="Sites" />,
    icon: LocateFixed,
  },

  // Workers (Sub-menu items mostly, but top level route needs definition too if clicked)
  {
    path: "/workers",
    title: "Workers List",
    component: <PlaceholderPage title="Workers" />,
    icon: Briefcase,
  },
  {
    path: "/supervisors",
    title: "Supervisors List",
    component: <PlaceholderPage title="Supervisors" />,
    icon: UserCheck,
  },
  {
    path: "/customers",
    title: "Customer Database",
    component: <PlaceholderPage title="Customers" />,
    icon: Users,
  },

  // --- WASHES ---
  {
    path: "/washes/onewash",
    title: "One Wash Service",
    component: <PlaceholderPage title="One Wash" />,
    icon: Droplets,
  },
  {
    path: "/washes/residence",
    title: "Residence Service",
    component: <PlaceholderPage title="Residence" />,
    icon: Droplets,
  },

  // --- FINANCE ---
  {
    path: "/payments",
    title: "Payment Transactions",
    component: <PlaceholderPage title="Payments" />,
    icon: DollarSign,
  },
  {
    path: "/work-records",
    title: "Work Records",
    component: <PlaceholderPage title="Work Records" />,
    icon: FileText,
  },
  {
    path: "/collection-sheet",
    title: "Collection Sheet",
    component: <PlaceholderPage title="Collection Sheet" />,
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
    component: <PlaceholderPage title="Pricing" />,
    icon: Tags,
  },

  // --- SUPPORT ---
  {
    path: "/enquiry",
    title: "Enquiries",
    component: <PlaceholderPage title="Enquiry" />,
    icon: HelpCircle,
  },
  {
    path: "/settings",
    title: "Settings",
    component: <PlaceholderPage title="Settings" />,
  },
];
