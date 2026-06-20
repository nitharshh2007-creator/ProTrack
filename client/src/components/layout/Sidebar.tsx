import { useState } from "react";
import { NavLink } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, FolderKanban, CheckSquare, Kanban,
  BarChart2, Users, ChevronLeft, ChevronRight, Menu, X,
} from "lucide-react";
import { useAuth } from "@/store/auth.store";

const baseNavItems = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/projects",  label: "Projects",  icon: FolderKanban  },
  { to: "/tasks",     label: "Tasks",     icon: CheckSquare   },
  { to: "/kanban",    label: "Kanban",    icon: Kanban        },
];

const adminNavItems = [
  { to: "/analytics", label: "Analytics", icon: BarChart2 },
  { to: "/team",      label: "Team",      icon: Users     },
];

interface NavItemProps {
  to: string;
  label: string;
  icon: React.ElementType;
  collapsed: boolean;
  onClick?: () => void;
}

const NavItem = ({ to, label, icon: Icon, collapsed, onClick }: NavItemProps) => (
  <NavLink
    to={to}
    onClick={onClick}
    title={collapsed ? label : undefined}
    className={({ isActive }) =>
      `relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
        isActive
          ? "bg-blue-600 text-white shadow-sm"
          : "text-slate-500 hover:bg-blue-50 hover:text-blue-600"
      }`
    }
  >
    {({ isActive }) => (
      <>
        {isActive && (
          <motion.span
            layoutId="sidebar-active"
            className="absolute inset-0 rounded-xl bg-blue-600"
            transition={{ type: "spring", stiffness: 400, damping: 35 }}
          />
        )}
        <Icon className="relative z-10 h-4 w-4 shrink-0" />
        <AnimatePresence initial={false}>
          {!collapsed && (
            <motion.span
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: "auto" }}
              exit={{ opacity: 0, width: 0 }}
              transition={{ duration: 0.2 }}
              className="relative z-10 overflow-hidden whitespace-nowrap"
            >
              {label}
            </motion.span>
          )}
        </AnimatePresence>
      </>
    )}
  </NavLink>
);

export const Sidebar = () => {
  const { user, hasRole } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const isAdmin = hasRole("admin");
  const items = isAdmin ? [...baseNavItems, ...adminNavItems] : baseNavItems;

  const SidebarContent = ({ mobile = false }: { mobile?: boolean }) => (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className={`flex h-14 items-center border-b border-blue-100 px-4 ${!collapsed || mobile ? "gap-2.5" : "justify-center"}`}>
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-600">
          <span className="text-xs font-black text-white">P</span>
        </div>
        <AnimatePresence initial={false}>
          {(!collapsed || mobile) && (
            <motion.span
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: "auto" }}
              exit={{ opacity: 0, width: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden whitespace-nowrap text-sm font-extrabold text-slate-800"
            >
              ProTrack
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {/* Nav */}
      <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto px-2 py-3">
        {items.map((item) => (
          <NavItem
            key={item.to}
            {...item}
            collapsed={!mobile && collapsed}
            onClick={mobile ? () => setMobileOpen(false) : undefined}
          />
        ))}
      </nav>

      {/* User footer */}
      <div className={`border-t border-blue-100 p-3 ${collapsed && !mobile ? "flex justify-center" : ""}`}>
        {collapsed && !mobile ? (
          <div
            title={user?.name}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white cursor-default"
          >
            {user?.name?.[0]?.toUpperCase() ?? "U"}
          </div>
        ) : (
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
              {user?.name?.[0]?.toUpperCase() ?? "U"}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-slate-700">{user?.name}</p>
              <p className="text-[10px] text-slate-400 capitalize">{user?.role}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <motion.aside
        animate={{ width: collapsed ? 64 : 220 }}
        transition={{ type: "spring", stiffness: 400, damping: 35 }}
        className="relative hidden h-screen shrink-0 border-r border-blue-100 bg-white md:flex md:flex-col shadow-sm"
      >
        <SidebarContent />
        <button
          onClick={() => setCollapsed((p) => !p)}
          className="absolute -right-3 top-16 flex h-6 w-6 items-center justify-center rounded-full border border-blue-100 bg-white text-slate-400 hover:text-blue-600 transition-colors shadow-md z-10"
        >
          {collapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
        </button>
      </motion.aside>

      {/* Mobile top bar */}
      <header className="fixed inset-x-0 top-0 z-50 flex h-14 items-center justify-between border-b border-blue-100 bg-white/90 px-4 backdrop-blur-xl md:hidden shadow-sm">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600">
            <span className="text-xs font-black text-white">P</span>
          </div>
          <span className="text-sm font-extrabold text-slate-800">ProTrack</span>
        </div>
        <button
          onClick={() => setMobileOpen(true)}
          className="rounded-lg p-2 text-slate-400 hover:bg-blue-50 hover:text-blue-600 transition-colors"
        >
          <Menu className="h-5 w-5" />
        </button>
      </header>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-slate-900/30 backdrop-blur-sm md:hidden"
              onClick={() => setMobileOpen(false)}
            />
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 400, damping: 40 }}
              className="fixed inset-y-0 left-0 z-50 w-64 border-r border-blue-100 bg-white md:hidden shadow-xl"
            >
              <button
                onClick={() => setMobileOpen(false)}
                className="absolute right-3 top-4 rounded-lg p-1.5 text-slate-400 hover:bg-blue-50 hover:text-blue-600"
              >
                <X className="h-4 w-4" />
              </button>
              <SidebarContent mobile />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};
