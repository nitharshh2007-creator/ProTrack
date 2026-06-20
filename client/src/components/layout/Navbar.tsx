import { useState, useRef, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, FolderKanban, CheckSquare, Kanban,
  BarChart2, Users, Search, Plus, ChevronDown, LogOut,
  User, Menu, X, Bell, Settings,
} from "lucide-react";
import { useAuth } from "@/store/auth.store";

const baseNavItems = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/projects",  label: "Projects",  icon: FolderKanban   },
  { to: "/tasks",     label: "Tasks",     icon: CheckSquare    },
  { to: "/kanban",    label: "Kanban",    icon: Kanban         },
];

const adminNavItems = [
  { to: "/analytics", label: "Analytics", icon: BarChart2 },
  { to: "/team",      label: "Team",      icon: Users     },
];

export const Navbar = () => {
  const { user, logout, hasRole } = useAuth();
  const navigate = useNavigate();
  const isAdmin = hasRole("admin");
  const navItems = isAdmin ? [...baseNavItems, ...adminNavItems] : baseNavItems;

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileOpen, setMobileOpen]     = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);

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
    <>
      <header className="sticky top-0 z-50 w-full border-b border-white/8 bg-[#020617]/80 backdrop-blur-[20px]">
        <div className="mx-auto flex h-16 max-w-screen-xl items-center gap-4 px-4 md:px-6">

          {/* Logo */}
          <NavLink to="/dashboard" className="flex shrink-0 items-center gap-2.5 mr-4">
            <motion.div
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.95 }}
              className="flex h-8 w-8 items-center justify-center rounded-xl gradient-primary shadow-lg"
            >
              <span className="text-sm font-black text-white">P</span>
            </motion.div>
            <span className="hidden text-base font-extrabold text-white sm:block tracking-tight">ProTrack</span>
          </NavLink>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-0.5">
            {navItems.map(({ to, label, icon: Icon }) => (
              <NavLink key={to} to={to} className="group relative">
                {({ isActive }) => (
                  <>
                    <motion.div
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-semibold transition-all ${
                        isActive
                          ? "text-white bg-white/10"
                          : "text-slate-400 hover:text-white hover:bg-white/8"
                      }`}
                    >
                      <Icon className="h-3.5 w-3.5 shrink-0" />
                      {label}
                    </motion.div>
                    {isActive && (
                      <motion.div
                        layoutId="nav-indicator"
                        className="absolute -bottom-[1px] left-2 right-2 h-[2px] rounded-full gradient-primary shadow-[0_0_15px_rgba(37,99,235,1)]"
                        transition={{ type: "spring", stiffness: 500, damping: 40 }}
                      />
                    )}
                  </>
                )}
              </NavLink>
            ))}
          </nav>

          {/* Right side */}
          <div className="ml-auto flex items-center gap-2">

            {/* Search */}
            <motion.div
              animate={{ width: searchFocused ? 220 : 160 }}
              transition={{ type: "spring", stiffness: 400, damping: 35 }}
              className="hidden sm:flex items-center gap-2 rounded-xl border bg-white/5 px-3 py-2 transition-colors"
              style={{ borderColor: searchFocused ? "rgba(37,99,235,0.5)" : "rgba(255,255,255,0.08)" }}
            >
              <Search className="h-3.5 w-3.5 shrink-0 text-slate-500" />
              <input
                placeholder="Search..."
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setSearchFocused(false)}
                className="w-full bg-transparent text-sm text-white placeholder:text-slate-500 outline-none"
              />
            </motion.div>

            {/* Notification bell */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="hidden sm:flex relative items-center justify-center h-9 w-9 rounded-xl border border-white/8 bg-white/5 text-slate-400 hover:text-white hover:border-white/15 transition-all"
            >
              <Bell className="h-4 w-4" />
              <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-blue-500" />
            </motion.button>

            {/* New project button */}
            {isAdmin && (
              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => navigate("/projects/new")}
                className="hidden sm:flex items-center gap-1.5 rounded-xl gradient-primary px-3.5 py-2 text-xs font-bold text-white shadow-lg glow-blue transition-opacity hover:opacity-90"
              >
                <Plus className="h-3.5 w-3.5" />
                New
              </motion.button>
            )}

            {/* Profile dropdown */}
            <div ref={dropdownRef} className="relative">
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setDropdownOpen(p => !p)}
                className="flex items-center gap-2 rounded-xl border border-white/8 bg-white/5 px-2.5 py-1.5 hover:border-white/15 hover:bg-white/8 transition-all"
              >
                <div className="flex h-7 w-7 items-center justify-center rounded-full gradient-primary text-xs font-bold text-white shadow-sm">
                  {initials}
                </div>
                <span className="hidden max-w-[90px] truncate text-xs font-semibold text-slate-300 sm:block">{user?.name}</span>
                <motion.div animate={{ rotate: dropdownOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
                  <ChevronDown className="h-3 w-3 text-slate-500" />
                </motion.div>
              </motion.button>

              <AnimatePresence>
                {dropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.95 }}
                    transition={{ duration: 0.15, ease: "easeOut" }}
                    className="absolute right-0 top-full mt-2 w-52 overflow-hidden rounded-2xl glass-card"
                  >
                    <div className="gradient-card px-4 py-3 border-b border-white/8">
                      <p className="text-sm font-bold text-white truncate">{user?.name}</p>
                      <p className="text-[11px] text-slate-400 capitalize">{user?.role}</p>
                    </div>
                    <div className="py-1.5">
                      <button
                        onClick={() => { setDropdownOpen(false); navigate("/profile"); }}
                        className="flex w-full items-center gap-2.5 px-4 py-2 text-xs font-medium text-slate-400 hover:bg-white/5 hover:text-white transition-colors"
                      >
                        <User className="h-3.5 w-3.5" /> Profile
                      </button>
                      <button
                        onClick={() => { setDropdownOpen(false); navigate("/settings"); }}
                        className="flex w-full items-center gap-2.5 px-4 py-2 text-xs font-medium text-slate-400 hover:bg-white/5 hover:text-white transition-colors"
                      >
                        <Settings className="h-3.5 w-3.5" /> Settings
                      </button>
                      <div className="my-1 border-t border-white/6" />
                      <button
                        onClick={handleLogout}
                        className="flex w-full items-center gap-2.5 px-4 py-2 text-xs font-medium text-red-400 hover:bg-red-500/8 transition-colors"
                      >
                        <LogOut className="h-3.5 w-3.5" /> Sign out
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Mobile hamburger */}
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setMobileOpen(p => !p)}
              className="flex md:hidden items-center justify-center rounded-xl border border-white/8 p-2 text-slate-400 hover:bg-white/5 hover:text-white transition-colors"
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </motion.button>
          </div>
        </div>

        {/* Mobile nav */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.nav
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
              className="overflow-hidden border-t border-white/6 bg-[#081120]/95 backdrop-blur-xl md:hidden"
            >
              <div className="flex flex-col gap-1 p-3">
                {navItems.map(({ to, label, icon: Icon }) => (
                  <NavLink
                    key={to}
                    to={to}
                    onClick={() => setMobileOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-all ${
                        isActive ? "gradient-primary text-white shadow-lg" : "text-slate-400 hover:bg-white/5 hover:text-white"
                      }`
                    }
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    {label}
                  </NavLink>
                ))}
                <div className="mt-2 flex items-center gap-2 rounded-xl border border-white/8 bg-white/5 px-3 py-2">
                  <Search className="h-3.5 w-3.5 text-slate-500" />
                  <input placeholder="Search..." className="w-full bg-transparent text-sm text-white placeholder:text-slate-500 outline-none" />
                </div>
              </div>
            </motion.nav>
          )}
        </AnimatePresence>
      </header>
    </>
  );
};
