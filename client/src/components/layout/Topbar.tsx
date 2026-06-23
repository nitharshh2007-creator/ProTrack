import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Plus, ChevronDown, LogOut, User } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/store/auth.store";

export const Topbar = () => {
  const { user, logout, hasRole } = useAuth();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setDropdownOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleLogout = () => { logout(); navigate("/login"); };
  const isAdmin = hasRole("admin");

  return (
    <header className="sticky top-0 z-40 flex h-14 items-center gap-3 border-b border-blue-100 bg-white/90 px-4 backdrop-blur-xl shadow-sm md:px-6">
      {/* Search */}
      <div className="flex flex-1 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 max-w-xs focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
        <Search className="h-3.5 w-3.5 shrink-0 text-slate-400" />
        <input
          placeholder="Search..."
          className="w-full bg-transparent text-sm text-slate-700 placeholder:text-slate-400 outline-none"
        />
      </div>

      <div className="ml-auto flex items-center gap-2">
        {isAdmin && (
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate("/projects/new")}
            className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 transition-colors shadow-sm"
          >
            <Plus className="h-3.5 w-3.5" />
            New
          </motion.button>
        )}

        {/* User dropdown */}
        <div ref={ref} className="relative">
          <button
            onClick={() => setDropdownOpen((p) => !p)}
            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-600 hover:border-blue-300 hover:bg-blue-50 transition-colors"
          >
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
              {user?.name?.[0]?.toUpperCase() ?? "U"}
            </div>
            <span className="hidden max-w-[100px] truncate text-xs font-medium sm:block">{user?.name}</span>
            <ChevronDown className="h-3 w-3 text-slate-400" />
          </button>

          <AnimatePresence>
            {dropdownOpen && (
              <motion.div
                initial={{ opacity: 0, y: -6, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.96 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-full mt-2 w-44 rounded-2xl border border-slate-200 bg-white py-1 shadow-xl"
              >
                <div className="border-b border-slate-100 px-3 py-2">
                  <p className="text-xs font-semibold text-slate-700 truncate">{user?.name}</p>
                  <p className="text-[10px] text-slate-400 truncate capitalize">{user?.role}</p>
                </div>
                <button
                  onClick={() => { setDropdownOpen(false); navigate("/dashboard"); }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-xs text-slate-500 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                >
                  <User className="h-3.5 w-3.5" /> Profile
                </button>
                <button
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2 px-3 py-2 text-xs text-red-500 hover:bg-red-50 transition-colors"
                >
                  <LogOut className="h-3.5 w-3.5" /> Logout
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
};
