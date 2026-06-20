import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  FolderKanban, CheckSquare, Kanban, BarChart2,
  TrendingUp, Clock, Zap, ArrowRight, Target,
} from "lucide-react";
import { dashboardService } from "@/services";
import type { DashboardStats } from "@/types";
import { Spinner } from "@/components/ui/Spinner";
import { useAuth } from "@/store/auth.store";

const Counter = ({ to }: { to: number }) => {
  const [value, setValue] = useState(0);
  const raf = useRef<number>(0);
  useEffect(() => {
    const start = performance.now();
    const duration = 1000;
    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(ease * to));
      if (progress < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [to]);
  return <>{value}</>;
};

const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } };
const fadeUp = { hidden: { opacity: 0, y: 18 }, show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" } } };

const quickActions = [
  { label: "Projects",  icon: FolderKanban, to: "/projects",  desc: "Browse all projects"    },
  { label: "Tasks",     icon: CheckSquare,  to: "/tasks",     desc: "Manage your tasks"      },
  { label: "Kanban",    icon: Kanban,       to: "/kanban",    desc: "Visual board view"      },
  { label: "Analytics", icon: BarChart2,    to: "/analytics", desc: "View reports & metrics" },
];

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export const DashboardPage = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    dashboardService.getStats().then(setStats).finally(() => setLoading(false));
  }, []);

  if (loading)
    return (
      <div className="flex justify-center pt-24">
        <Spinner className="h-7 w-7 text-blue-500" />
      </div>
    );

  const completionPct = stats && stats.totalTasks > 0
    ? Math.round((stats.completedTasks / stats.totalTasks) * 100) : 0;

  const statCards = stats ? [
    { label: "Total Projects",     value: stats.totalProjects,     icon: FolderKanban, color: "text-blue-400",    bg: "bg-blue-500/10",    border: "border-blue-500/20"    },
    { label: "Active Projects",    value: stats.activeProjects,    icon: TrendingUp,   color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
    { label: "Completed Projects", value: stats.completedProjects, icon: Target,       color: "text-sky-400",     bg: "bg-sky-500/10",     border: "border-sky-500/20"     },
    { label: "Total Tasks",        value: stats.totalTasks,        icon: Zap,          color: "text-violet-400",  bg: "bg-violet-500/10",  border: "border-violet-500/20"  },
    { label: "Completed Tasks",    value: stats.completedTasks,    icon: CheckSquare,  color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
    { label: "Pending Tasks",      value: stats.pendingTasks,      icon: Clock,        color: "text-amber-400",   bg: "bg-amber-500/10",   border: "border-amber-500/20"   },
  ] : [];

  return (
    <div className="mx-auto max-w-6xl space-y-8">

      {/* Hero welcome */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="glass-card rounded-2xl p-6 md:p-8 overflow-hidden relative"
      >
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-12 -right-12 h-48 w-48 rounded-full bg-blue-600/10 blur-3xl" />
          <div className="absolute bottom-0 left-1/4 h-32 w-32 rounded-full bg-violet-600/8 blur-2xl" />
        </div>
        <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm text-slate-400 mb-1">{getGreeting()},</p>
            <h1 className="text-3xl font-extrabold text-slate-950">{user?.name?.split(" ")[0]} 👋</h1>
            <p className="mt-2 text-sm text-slate-400">Here's what's happening with your workspace today.</p>
          </div>
          {stats && (
            <div className="flex items-center gap-6">
              <div className="text-center">
                <p className="text-3xl font-extrabold text-slate-950"><Counter to={completionPct} />%</p>
                <p className="text-xs text-slate-400 mt-0.5">Completion</p>
              </div>
              <div className="h-12 w-px bg-slate-200" />
              <div className="text-center">
                <p className="text-3xl font-extrabold text-slate-950"><Counter to={stats.totalProjects} /></p>
                <p className="text-xs text-slate-400 mt-0.5">Projects</p>
              </div>
              <div className="h-12 w-px bg-slate-200" />
              <div className="text-center">
                <p className="text-3xl font-extrabold text-slate-950"><Counter to={stats.totalTasks} /></p>
                <p className="text-xs text-slate-400 mt-0.5">Tasks</p>
              </div>
            </div>
          )}
        </div>
        {/* Progress bar */}
        {stats && (
          <div className="relative mt-6">
            <div className="mb-1.5 flex items-center justify-between text-xs">
              <span className="text-slate-400">Overall progress</span>
              <span className="font-bold text-slate-950">{completionPct}%</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${completionPct}%` }}
                transition={{ duration: 1.2, delay: 0.3, ease: "easeOut" }}
                className="h-full rounded-full gradient-primary"
              />
            </div>
          </div>
        )}
      </motion.div>

      {/* Stat cards */}
      <motion.div variants={stagger} initial="hidden" animate="show" className="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-3">
        {statCards.map(({ label, value, icon: Icon, color, bg, border }) => (
          <motion.div
            key={label}
            variants={fadeUp}
            whileHover={{ y: -4, scale: 1.01, transition: { duration: 0.2 } }}
            className="glass-card glass-hover rounded-2xl p-5"
          >
            <div className={`mb-3 inline-flex rounded-xl p-2.5 ${bg} border ${border}`}>
              <Icon className={`h-4 w-4 ${color}`} />
            </div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">{label}</p>
            <p className="mt-1 text-3xl font-extrabold text-slate-950">
              <Counter to={value} />
            </p>
          </motion.div>
        ))}
      </motion.div>

      {/* Quick Actions */}
      <div>
        <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-500">Quick Actions</p>
        <motion.div variants={stagger} initial="hidden" animate="show" className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {quickActions.map(({ label, icon: Icon, to, desc }) => (
            <motion.button
              key={to}
              variants={fadeUp}
              whileHover={{ y: -4, scale: 1.02, transition: { duration: 0.15 } }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate(to)}
              className="glass-card glass-hover group flex flex-col items-start gap-2 rounded-2xl p-4 text-left"
            >
              <div className="flex w-full items-center justify-between">
                <div className="rounded-xl bg-blue-500/10 border border-blue-500/20 p-2">
                  <Icon className="h-4 w-4 text-blue-400" />
                </div>
                <ArrowRight className="h-3.5 w-3.5 text-slate-600 transition-all group-hover:translate-x-1 group-hover:text-blue-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-950">{label}</p>
                <p className="text-[11px] text-slate-500">{desc}</p>
              </div>
            </motion.button>
          ))}
        </motion.div>
      </div>

      {/* Task progress detail */}
      {stats && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.35 }}
          className="glass-card rounded-2xl p-6"
        >
          <p className="mb-5 text-xs font-semibold uppercase tracking-widest text-slate-500">Task Progress Breakdown</p>
          <div className="space-y-4">
            {[
              { label: "Completed", value: stats.completedTasks, total: stats.totalTasks, color: "bg-emerald-500" },
              { label: "Pending",   value: stats.pendingTasks,   total: stats.totalTasks, color: "bg-amber-400"   },
            ].map(({ label, value, total, color }) => {
              const pct = total > 0 ? Math.round((value / total) * 100) : 0;
              return (
                <div key={label}>
                  <div className="mb-2 flex items-center justify-between text-xs">
                    <span className="text-slate-400">{label}</span>
                    <span className="font-bold text-slate-950">{value} <span className="text-slate-500 font-normal">/ {total}</span></span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 1, delay: 0.5, ease: "easeOut" }}
                      className={`h-full rounded-full ${color}`}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}
    </div>
  );
};

