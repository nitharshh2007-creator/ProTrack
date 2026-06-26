import { useEffect, useState } from "react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { Activity, Briefcase, Users, CheckCircle, Clock, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Spinner } from "@/components/ui/Spinner";
import { useAuth } from "@/store/auth.store";
import { dashboardService, analyticsService } from "@/services";
import type { AdminDashboardStats } from "@/types";
import { formatDistanceToNow } from "date-fns";

const chartColors: Record<string, string> = {
  Todo: "#a78bfa",
  "In Progress": "#ec4899",
  Review: "#3b82f6",
  Blocked: "#ef4444",
  Completed: "#22c55e",
};

export const AdminDashboardPage = () => {
  const { isAuthenticated, isLoading, hasRole } = useAuth();
  const navigate = useNavigate();
  const [statsData, setStatsData] = useState<AdminDashboardStats | null>(null);
  const [analyticsData, setAnalyticsData] = useState<any | null>(null);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        navigate("/login");
      } else if (!hasRole("admin")) {
        navigate("/employee/dashboard");
      } else {
        Promise.all([
          dashboardService.getStats(),
          analyticsService.getData()
        ])
          .then(([stats, analytics]) => {
            setStatsData(stats as AdminDashboardStats);
            setAnalyticsData(analytics);
          })
          .catch((err) => console.error("Error loading dashboard data:", err))
          .finally(() => setFetching(false));
      }
    }
  }, [hasRole, isAuthenticated, isLoading, navigate]);

  if (isLoading || fetching || !statsData) {
    return (
      <div className="flex min-h-[calc(100vh-160px)] items-center justify-center">
        <Spinner className="h-10 w-10" />
      </div>
    );
  }

  const stats = [
    { label: "Total Projects", value: statsData.totalProjects, icon: Briefcase, accent: "from-violet-500 to-fuchsia-500" },
    { label: "Active Projects", value: statsData.activeProjects, icon: Activity, accent: "from-fuchsia-500 to-pink-500" },
    { label: "Employees", value: statsData.activeMembers ?? 0, icon: Users, accent: "from-cyan-400 to-blue-500" },
    { label: "Tasks Completed", value: statsData.completedTasks, icon: CheckCircle, accent: "from-emerald-400 to-teal-500" },
  ];

  const progressData = analyticsData?.completionTrend?.map((item: any) => ({
    name: item.date,
    progress: item.count,
  })) || [
    { name: "Week 1", progress: 0 },
    { name: "Week 2", progress: 0 },
    { name: "Week 3", progress: 0 },
    { name: "Week 4", progress: 0 },
  ];

  const statusData = statsData.taskStatusDistribution.map((item) => ({
    name: item.status,
    value: item.count,
    color: chartColors[item.status] || "#94a3b8",
  })).filter((item) => item.value > 0);

  const recentActivities = statsData.recentActivities || [];


  return (
    <div className="space-y-8">
      <div className="rounded-[32px] border border-white/8 bg-white dark:bg-slate-900/75 p-8 shadow-2xl backdrop-blur-[20px]">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="mb-2 text-sm uppercase tracking-[0.3em] font-bold text-blue-400">Admin dashboard</p>
            <h1 className="text-4xl font-semibold text-slate-900 dark:text-slate-100">Welcome back, lead manager.</h1>
            <p className="mt-3 max-w-2xl text-sm text-slate-400">
              Track project velocity, team health and executive metrics in a single premium command center.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button className="rounded-3xl bg-gradient-primary px-6 py-3 text-sm font-semibold text-white shadow-glow transition hover:brightness-110">
              Create project
            </button>
            <button className="rounded-3xl border border-white/10 bg-white/5 px-6 py-3 text-sm font-semibold text-slate-100 transition hover:bg-white/10">
              Export report
            </button>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-4">
        {stats.map((item) => {
          const Icon = item.icon;
          return (
            <Card key={item.label} className="p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_40px_rgba(37,99,235,0.15)]">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm uppercase tracking-[0.24em] text-slate-400">{item.label}</p>
                  <p className="mt-3 text-3xl font-semibold text-slate-900 dark:text-slate-100">{item.value}</p>
                </div>
                <div className={`rounded-3xl bg-gradient-to-br ${item.accent} p-4 text-white shadow-glow`}>
                  <Icon className="h-6 w-6" />
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.4fr_0.9fr]">
        <Card className="space-y-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_40px_rgba(37,99,235,0.15)]">
          <div className="flex items-center justify-between gap-6">
            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-slate-400">Project progress</p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-900 dark:text-slate-100">Delivery velocity</h2>
            </div>
            <Badge variant="info">Rolling 30d</Badge>
          </div>
          <div className="h-[320px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={progressData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="progressGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#a78bfa" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#a78bfa" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fill: "#94a3b8", fontSize: 12 }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fill: "#94a3b8", fontSize: 12 }} />
                <Tooltip contentStyle={{ backgroundColor: "rgba(15,23,42,0.95)", border: "1px solid rgba(148,163,184,0.15)", borderRadius: 16 }} />
                <Area type="monotone" dataKey="progress" stroke="#a78bfa" strokeWidth={3} fill="url(#progressGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="space-y-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_40px_rgba(37,99,235,0.15)]">
          <div className="flex items-center justify-between gap-6">
            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-slate-400">Team productivity</p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-900 dark:text-slate-100">Monthly performance</h2>
            </div>
            <Badge variant="success">High impact</Badge>
          </div>
          <div className="h-[320px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={statusData} dataKey="value" innerRadius={70} outerRadius={110} paddingAngle={4} stroke="transparent">
                  {statusData.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: "rgba(15,23,42,0.95)", border: "1px solid rgba(148,163,184,0.15)", borderRadius: 16 }} />
                <Legend verticalAlign="bottom" height={36} iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_0.7fr]">
        <Card className="space-y-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_40px_rgba(37,99,235,0.15)]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-slate-400">Overview</p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-900 dark:text-slate-100">Project health feed</h2>
            </div>
            <div className="inline-flex items-center gap-2 rounded-3xl bg-white dark:bg-slate-900/80 px-4 py-2 text-sm text-slate-900 dark:text-slate-300">
              <Clock className="h-4 w-4 text-slate-300" /> Live updates
            </div>
          </div>
          <div className="space-y-4">
            {recentActivities.length > 0 ? (
              recentActivities.slice(0, 4).map((activity) => (
                <div key={activity.id} className="rounded-3xl border border-white/8 bg-white dark:bg-slate-950/40 px-5 py-4 transition hover:border-violet-400/30 dark:hover:bg-slate-900/80">
                  <p className="text-sm text-slate-900 dark:text-slate-100">
                    <span className="font-semibold text-violet-400">{activity.title}</span> {activity.message}
                  </p>
                  <p className="mt-2 text-xs uppercase tracking-[0.24em] text-slate-500">
                    {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
                  </p>
                </div>
              ))
            ) : (
              <div className="text-sm text-slate-400 py-4 text-center">No recent activity</div>
            )}
          </div>
        </Card>

        <Card className="space-y-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_40px_rgba(37,99,235,0.15)]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-slate-400">Effort score</p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-900 dark:text-slate-100">Global Progress</h2>
            </div>
            <Sparkles className="h-6 w-6 text-fuchsia-400" />
          </div>
          <div className="rounded-[28px] bg-white dark:bg-slate-950/70 p-6">
            <div className="mb-6 flex items-center justify-between gap-4">
              <p className="text-xl font-semibold text-slate-900 dark:text-slate-100">{statsData.completionRate}%</p>
              <Badge variant={statsData.completionRate >= 80 ? "success" : statsData.completionRate >= 50 ? "info" : "warning"}>
                {statsData.completionRate >= 80 ? "Strong" : statsData.completionRate >= 50 ? "Steady" : "Behind"}
              </Badge>
            </div>
            <div className="space-y-4 text-sm text-slate-400">
              <p>Overall task completion rate across the active workspace stands at {statsData.completionRate}%.</p>
              <p>Keep tracking sprint cycles and active backlogs to optimize delivery velocities.</p>
            </div>
          </div>
            <div className="grid gap-3">
            <div className="flex items-center justify-between rounded-3xl border border-white/10 bg-white dark:bg-slate-900/70 px-4 py-3">
              <span className="text-sm text-slate-400">Cycle time</span>
              <span className="font-semibold text-slate-900 dark:text-slate-100">2.8 days</span>
            </div>
            <div className="flex items-center justify-between rounded-3xl border border-white/10 bg-white dark:bg-slate-900/70 px-4 py-3">
              <span className="text-sm text-slate-400">Review speed</span>
              <span className="font-semibold text-slate-900 dark:text-slate-100">78%</span>
            </div>
            <div className="flex items-center justify-between rounded-3xl border border-white/10 bg-white dark:bg-slate-900/70 px-4 py-3">
              <span className="text-sm text-slate-400">Client satisfaction</span>
              <span className="font-semibold text-slate-900 dark:text-slate-100">4.9 / 5</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
