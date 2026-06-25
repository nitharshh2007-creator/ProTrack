import { useState, useRef, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, FolderKanban, CheckSquare, Kanban,
  BarChart2, Users, Settings, LogOut, User
} from "lucide-react";
import { useAuth } from "@/store/auth.store";

const sidebarItems = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/projects",  label: "Projects",  icon: FolderKanban   },
  { to: "/tasks",     label: "Tasks",     icon: CheckSquare    },
  { to: "/kanban",    label: "Kanban",    icon: Kanban         },
  { to: "/analytics", label: "Analytics", icon: BarChart2 },
  { to: "/team",      label: "Team",      icon: Users     },
  { to: "/settings",  label: "Settings",  icon: Settings     },
];

export const Sidebar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node))
        setDropdownOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleLogout = () => { logout(); navigate("/login"); };
  const initials = user?.name?.split(" ").map(n => n[0]).slice(0,2).join("").toUpperCase() ?? "U";

  return (
    <div className="fixed left-0 top-0 h-screen w-[260px] z-50">
      <div className="h-full sidebar-bg m-4 rounded-[28px] flex flex-col">
        
        {/* Logo */}
        <div className="p-6">
          <NavLink to="/dashboard" className="flex items-center gap-3">
            <motion.div 
              animate={{ scale: [1, 1.05, 1] }} 
              transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }} 
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg"
            >
              <span className="text-sm font-black">P</span>
            </motion.div>
            <span className="text-white font-bold tracking-tight text-lg">ProTrack</span>
          </NavLink>
        </div>
        
        {/* Navigation */}
        <nav className="flex-1 px-4 space-y-1">
          {sidebarItems.map(({ to, label, icon: Icon }) => (
            <NavLink 
              key={to} 
              to={to} 
              className={({ isActive }) => 
                `sidebar-link group flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                  isActive ? 'sidebar-link-active' : 'hover:bg-white/5'
                }`
              }
            >
              <Icon className="h-5 w-5 shrink-0" />
              <span className="font-semibold">{label}</span>
            </NavLink>
          ))}
        </nav>
        
        {/* User Profile */}
        <div className="p-4">
          <div ref={dropdownRef} className="relative">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setDropdownOpen(p => !p)}
              className="w-full flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-3 hover:border-white/20 hover:bg-white/10 transition-all"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 text-sm font-bold text-white">
                {initials}
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-semibold text-white truncate">{user?.name}</p>
                <p className="text-xs text-slate-400 capitalize">{user?.role}</p>
              </div>
            </motion.button>

            <AnimatePresence>
              {dropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.95 }}
                  transition={{ duration: 0.15, ease: "easeOut" }}
                  className="absolute bottom-full mb-2 w-full overflow-hidden rounded-xl bg-[#111827] backdrop-blur-xl border border-white/5"
                >
                  <div className="py-2">
                    <button
                      onClick={() => { setDropdownOpen(false); navigate("/profile"); }}
                      className="flex w-full items-center gap-3 px-4 py-2 text-sm font-medium text-slate-400 hover:bg-white/5 hover:text-white transition-colors"
                    >
                      <User className="h-4 w-4" /> Profile
                    </button>
                    <div className="my-1 border-t border-white/10" />
                    <button
                      onClick={handleLogout}
                      className="flex w-full items-center gap-3 px-4 py-2 text-sm font-medium text-red-400 hover:bg-red-500/10 transition-colors"
                    >
                      <LogOut className="h-4 w-4" /> Sign out
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};
