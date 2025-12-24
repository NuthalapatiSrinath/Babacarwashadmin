import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Outlet,
} from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { Suspense, useState, useEffect } from "react";
import MainLayout from "./layouts/MainLayout";
import Login from "./pages/Login";
import { routes } from "./routes";

const LoadingScreen = () => (
  <div className="fixed inset-0 bg-page flex flex-col items-center justify-center z-[9999]">
    <div className="relative">
      <div className="w-24 h-24 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
      <div className="absolute inset-0 flex items-center justify-center animate-pulse">
        <img
          src="/logo-icon.png"
          className="w-10 h-10 object-contain"
          alt="Loading..."
        />
      </div>
    </div>
    <p className="mt-4 text-text-sub font-medium text-sm tracking-widest uppercase animate-pulse">
      Loading Baba Car Wash...
    </p>
  </div>
);

const ProtectedRoute = () => {
  const isAuthenticated = localStorage.getItem("isAuthenticated") === "true";
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
};

function App() {
  const [appReady, setAppReady] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setAppReady(true), 1000);
    return () => clearTimeout(timer);
  }, []);

  if (!appReady) return <LoadingScreen />;

  return (
    <BrowserRouter>
      {/* --- MASTER TOASTER CONFIGURATION --- */}
      <Toaster
        position="top-right"
        reverseOrder={false}
        gutter={8}
        toastOptions={{
          // Define default duration (2 seconds = fast disappear)
          duration: 2000,

          style: {
            background: "var(--color-card)",
            color: "var(--color-text-main)",
            border: "1px solid var(--color-border)",
            padding: "12px 20px",
            borderRadius: "12px",
            fontSize: "14px",
            fontWeight: "500",
            boxShadow:
              "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
          },

          // Success Toast Style
          success: {
            duration: 2000,
            iconTheme: { primary: "#10B981", secondary: "white" },
            style: {
              borderLeft: "4px solid #10B981",
            },
          },

          // Error Toast Style
          error: {
            duration: 3000, // Errors stay a bit longer (3s)
            iconTheme: { primary: "#EF4444", secondary: "white" },
            style: {
              borderLeft: "4px solid #EF4444",
            },
          },
        }}
      />

      <Routes>
        <Route path="/login" element={<Login />} />

        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<MainLayout />}>
            <Route
              path="/"
              element={
                <Suspense fallback={<LoadingScreen />}>
                  {routes.find((r) => r.path === "/")?.component}
                </Suspense>
              }
            />

            {routes.map((route) => (
              <Route
                key={route.path}
                path={route.path}
                element={
                  <Suspense fallback={<LoadingScreen />}>
                    {route.component}
                  </Suspense>
                }
              />
            ))}
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
