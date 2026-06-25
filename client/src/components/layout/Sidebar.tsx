import { useState, useRef, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, FolderKanban, CheckSquare, Kanban,
  BarChart2, Users, Settings, LogOut, User, Bell
} from "lucide-react";
import { useAuth } from "@/store/auth.store";
import { useNotifications } from "@/store/notification.store";

const navigationItems = [
  { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { title: "Projects", href: "/projects", icon: FolderKanban },
  { title: "Tasks", href: "/tasks", icon: CheckSquare },
  { title: "Kanban", href: "/kanban", icon: Kanban },
  { title: "Analytics", href: "/analytics", icon: BarChart2 },
  { title: "Notifications", href: "/notifications", icon: Bell },
];

const adminItems = [
  { title: "Team", href: "/team", icon: Users },
];

export const Sidebar = () => {
  const { user, logout } = useAuth();
  const { unreadCount } = useNotifications();
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

  const handleLogout = () => { logout(); navigate("/signin"); };
  const initials = user?.name?.split(" ").map(n => n[0]).slice(0,2).join("").toUpperCase() ?? "U";

  return (
    <div className="fixed left-0 top-0 h-screen w-[260px] z-50">
      <div className="h-full sidebar-bg m-4 rounded-[28px] flex flex-col">
        {/* Logo */}
        <div className="p-4">
          <NavLink to="/dashboard" className="flex items-center gap-2">
            <motion.div 
              animate={{ scale: [1, 1.05, 1] }} 
              transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }} 
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg"
            >
              <span className="text-xs font-black">P</span>
            </motion.div>
            <span className="text-white font-bold tracking-tight text-base">ProTrack</span>
          </NavLink>
        </div>
        
        {/* Navigation */}
        <nav className="flex-1 px-3 space-y-1">
          {navigationItems.map(({ title, href, icon: Icon }) => (
            <NavLink
              key={title}
              to={href}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 ${
                  isActive
                    ? "sidebar-link-active"
                    : "sidebar-link hover:bg-white/5 hover:text-white"
                }`
              }
            >
              <Icon className="h-5 w-5" />
              <span className="flex-1 font-medium text-sm">{title}</span>
              {title === "Notifications" && unreadCount > 0 && (
                <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-blue-600 px-1.5 py-0.5 text-[10px] font-bold text-white shadow-sm">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </NavLink>
          ))}
          
          {/* Admin Section */}
          {user?.role === "admin" && (
            <>
              <div className="my-4 border-t border-white/5" />
              {adminItems.map(({ title, href, icon: Icon }) => (
                <NavLink
                  key={title}
                  to={href}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 ${
                      isActive
                        ? "sidebar-link-active"
                        : "sidebar-link hover:bg-white/5 hover:text-white"
                    }`
                  }
                >
                  <Icon className="h-5 w-5" />
                  <span className="flex-1 font-medium text-sm">{title}</span>
                </NavLink>
              ))}
            </>
          )}
          
          {/* Divider */}
          <div className="my-4 border-t border-white/5" />
          
          {/* Settings */}
          <NavLink
            to="/settings"
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 ${
                isActive
                  ? "sidebar-link-active"
                  : "sidebar-link hover:bg-white/5 hover:text-white"
              }`
            }
          >
            <Settings className="h-5 w-5" />
            <span className="font-medium text-sm">Settings</span>
          </NavLink>
        </nav>
        
        {/* User Profile Card */}
        <div className="p-3">
          <div ref={dropdownRef} className="relative">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setDropdownOpen(p => !p)}
              className="w-full flex items-center gap-2 rounded-xl border border-white/5 bg-[#131B2E] p-2 hover:bg-[#1E293B] transition-all duration-200"
            >
              <div className="relative">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-700 text-xs font-bold text-white">
                  {initials}
                </div>
                <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-[#090D1A]" />
              </div>
              <div className="flex-1 text-left min-w-0">
                <p className="text-xs font-semibold text-white truncate">{user?.name}</p>
                <p className="text-[10px] text-slate-400 capitalize">{user?.role} · <span className="text-emerald-400">Online</span></p>
              </div>
            </motion.button>

            <AnimatePresence>
              {dropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.95 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                  className="absolute bottom-full mb-2 w-full overflow-hidden rounded-xl bg-[#131B2E] border border-white/10 shadow-2xl"
                >
                  <div className="py-1">
                    <button
                      onClick={() => { setDropdownOpen(false); navigate("/profile"); }}
                      className="flex w-full items-center gap-3 px-4 py-2.5 text-sm font-medium text-slate-300 hover:bg-white/5 hover:text-white transition-colors"
                    >
                      <User className="h-4 w-4 text-slate-400" /> Profile
                    </button>
                    <div className="border-t border-white/5" />
                    <button
                      onClick={handleLogout}
                      className="flex w-full items-center gap-3 px-4 py-2.5 text-sm font-medium text-red-400 hover:bg-red-500/10 transition-colors"
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
