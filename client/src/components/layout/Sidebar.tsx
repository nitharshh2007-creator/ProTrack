import { useState } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/store/auth.store";

const baseNavItems = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/projects",  label: "Projects"  },
  { to: "/tasks",     label: "Tasks"     },
  { to: "/kanban",    label: "Kanban"    },
];

const adminNavItems = [
  { to: "/analytics", label: "Analytics" },
];

const NavItems = ({ onNavigate, isAdmin }: { onNavigate?: () => void; isAdmin: boolean }) => {
  const items = isAdmin ? [...baseNavItems, ...adminNavItems] : baseNavItems;
  return (
    <>
      {items.map(({ to, label }) => (
        <NavLink
          key={to}
          to={to}
          onClick={onNavigate}
          className={({ isActive }) =>
            `rounded-md px-3 py-2 text-sm font-medium transition ${
              isActive ? "bg-blue-50 text-blue-600" : "text-gray-600 hover:bg-gray-100"
            }`
          }
        >
          {label}
        </NavLink>
      ))}
    </>
  );
};

export const Sidebar = () => {
  const { logout, user, hasRole } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const isAdmin = hasRole("admin");

  const allItems = isAdmin ? [...baseNavItems, ...adminNavItems] : baseNavItems;

  // Close drawer on route change
  const handleNavigate = () => setOpen(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  // Current page title for mobile header
  const currentLabel =
    allItems.find((n) => location.pathname.startsWith(n.to))?.label ?? "ProTrack";

  return (
    <>
      {/* ── Desktop sidebar ── */}
      <aside className="hidden md:flex h-screen w-60 shrink-0 flex-col border-r border-gray-200 bg-white px-4 py-6">
        <div className="mb-8 text-xl font-bold text-blue-600">ProTrack</div>
        <nav className="flex flex-1 flex-col gap-1">
          <NavItems isAdmin={isAdmin} />
        </nav>
        <div className="mt-auto border-t border-gray-200 pt-4">
          <div className="mb-2 text-sm text-gray-500">{user?.name}</div>
          <button
            onClick={handleLogout}
            className="w-full rounded-md px-3 py-2 text-left text-sm text-red-500 hover:bg-red-50"
          >
            Logout
          </button>
        </div>
      </aside>

      {/* ── Mobile top bar ── */}
      <header className="fixed inset-x-0 top-0 z-30 flex h-14 items-center justify-between border-b border-gray-200 bg-white px-4 md:hidden">
        <span className="text-base font-bold text-blue-600">ProTrack</span>
        <span className="text-sm font-medium text-gray-700">{currentLabel}</span>
        <button
          onClick={() => setOpen(true)}
          aria-label="Open menu"
          className="rounded-md p-2 text-gray-500 hover:bg-gray-100"
        >
          {/* Hamburger icon */}
          <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </header>

      {/* ── Mobile drawer backdrop ── */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* ── Mobile drawer panel ── */}
      <div
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-white px-4 py-6 shadow-xl transition-transform duration-300 md:hidden ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="mb-8 flex items-center justify-between">
          <span className="text-xl font-bold text-blue-600">ProTrack</span>
          <button
            onClick={() => setOpen(false)}
            aria-label="Close menu"
            className="rounded-md p-1 text-gray-400 hover:bg-gray-100"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <nav className="flex flex-1 flex-col gap-1">
          <NavItems onNavigate={handleNavigate} isAdmin={isAdmin} />
        </nav>
        <div className="mt-auto border-t border-gray-200 pt-4">
          <div className="mb-2 text-sm text-gray-500">{user?.name}</div>
          <button
            onClick={handleLogout}
            className="w-full rounded-md px-3 py-2 text-left text-sm text-red-500 hover:bg-red-50"
          >
            Logout
          </button>
        </div>
      </div>
    </>
  );
};
