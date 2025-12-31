import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Lock, Smartphone, ArrowRight, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { authService } from "../api/authService";

const Login = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState(null);

  const [formData, setFormData] = useState({
    number: "",
    password: "",
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!formData.number || !formData.password) {
      toast.error("Please enter credentials");
      return;
    }

    setLoading(true);

    try {
      const payload = {
        number: String(formData.number).trim(),
        password: formData.password,
      };

      console.log("Sending Login Payload:", payload);

      const response = await authService.login(payload);

      if (response.statusCode === 200 && response.data.token) {
        localStorage.setItem("token", response.data.token);
        localStorage.setItem("user", JSON.stringify(response.data));

        toast.success(`Welcome back, ${response.data.name || "Admin"}!`);

        setTimeout(() => {
          navigate("/");
        }, 800);
      } else {
        throw new Error(response.message || "Access Denied");
      }
    } catch (error) {
      console.error("Login Error:", error);
      toast.error(error.message || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#0f172a] relative overflow-hidden font-sans">
      {/* --- CSS FIX FOR AUTOFILL BACKGROUND --- */}
      <style>{`
        input:-webkit-autofill,
        input:-webkit-autofill:hover, 
        input:-webkit-autofill:focus, 
        input:-webkit-autofill:active {
            -webkit-background-clip: text;
            -webkit-text-fill-color: #ffffff !important;
            transition: background-color 5000s ease-in-out 0s;
            box-shadow: inset 0 0 20px 20px #23232329;
        }
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .animate-blob {
          animation: blob 10s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>

      {/* Background Effects with Animation */}
      <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-indigo-600/30 rounded-full blur-[120px] pointer-events-none animate-blob" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-purple-600/30 rounded-full blur-[120px] pointer-events-none animate-blob animation-delay-2000" />
      <div className="absolute bottom-[20%] left-[20%] w-[400px] h-[400px] bg-pink-600/20 rounded-full blur-[120px] pointer-events-none animate-blob animation-delay-4000" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-[420px] mx-4 relative z-10"
      >
        <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-2xl p-8 md:p-10">
          <div className="text-center mb-10">
            {/* Circular Logo with Animation & Gradient Border */}
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 200, damping: 20 }}
              className="relative w-24 h-24 mx-auto mb-6"
            >
              <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-full animate-[spin_4s_linear_infinite] blur-sm opacity-70"></div>
              <div className="relative w-full h-full rounded-full flex items-center justify-center overflow-hidden bg-slate-900 border-2 border-white/20 shadow-lg shadow-indigo-500/25 p-1">
                <img
                  src="/carwash.jpeg"
                  alt="Car Wash Logo"
                  className="w-full h-full object-cover rounded-full animate-[spin_10s_linear_infinite]"
                />
              </div>
            </motion.div>
            <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-200 to-purple-200 tracking-tight mb-2">
              Admin Portal
            </h1>
            <p className="text-slate-400 text-sm">
              Secure Authentication Required
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider ml-1">
                Phone ID
              </label>
              <div
                className={`group relative flex items-center bg-slate-900/50 border rounded-xl transition-all duration-300 ${
                  focusedField === "number"
                    ? "border-indigo-500 ring-2 ring-indigo-500/20 shadow-lg shadow-indigo-500/10"
                    : "border-white/10 hover:border-white/20"
                }`}
              >
                <div
                  className={`pl-4 transition-colors duration-300 ${
                    focusedField === "number"
                      ? "text-indigo-400"
                      : "text-slate-500"
                  }`}
                >
                  <Smartphone className="w-5 h-5" />
                </div>
                <input
                  type="text"
                  name="number"
                  value={formData.number}
                  onChange={handleChange}
                  onFocus={() => setFocusedField("number")}
                  onBlur={() => setFocusedField(null)}
                  className="w-full bg-transparent text-white px-4 py-3.5 outline-none placeholder-slate-600"
                  placeholder="Enter registered number"
                  autoComplete="off"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider ml-1">
                Password
              </label>
              <div
                className={`group relative flex items-center bg-slate-900/50 border rounded-xl transition-all duration-300 ${
                  focusedField === "password"
                    ? "border-indigo-500 ring-2 ring-indigo-500/20 shadow-lg shadow-indigo-500/10"
                    : "border-white/10 hover:border-white/20"
                }`}
              >
                <div
                  className={`pl-4 transition-colors duration-300 ${
                    focusedField === "password"
                      ? "text-indigo-400"
                      : "text-slate-500"
                  }`}
                >
                  <Lock className="w-5 h-5" />
                </div>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  onFocus={() => setFocusedField("password")}
                  onBlur={() => setFocusedField(null)}
                  className="w-full bg-transparent text-white px-4 py-3.5 outline-none placeholder-slate-600"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-indigo-600/25 flex items-center justify-center gap-2 transition-all disabled:opacity-70 disabled:cursor-not-allowed mt-8 border border-white/10"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </motion.button>
          </form>

          <div className="mt-8 text-center border-t border-white/5 pt-6">
            <p className="text-slate-500 text-xs">
              Authorized personnel only. <br /> Access is monitored and logged.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
