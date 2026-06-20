import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";
import { analyticsService, type AnalyticsOverview } from "@/services";
import { Spinner } from "@/components/ui/Spinner";
import { Card } from "@/components/ui/Card";
import { useAuth } from "@/store/auth.store";
import { Sparkles } from "lucide-react";

const STATUS_COLORS: Record<string, string> = {
  Todo:          "#94a3b8",
  "In Progress": "#3b82f6",
  Review:        "#f59e0b",
  Blocked:       "#ef4444",
  Completed:     "#22c55e",
};

const PROJECT_COLORS = [
  "#3b82f6", "#8b5cf6", "#ec4899", "#f59e0b",
  "#22c55e", "#06b6d4", "#f97316", "#6366f1",
  "#14b8a6", "#e11d48",
];

export const AnalyticsPage = () => {
  const { hasRole } = useAuth();

  const [data, setData] = useState<AnalyticsOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    analyticsService
      .getOverview()
      .then(setData)
      .catch(() => setError("Failed to load analytics data."))
      .finally(() => setLoading(false));
  }, []);

  if (!hasRole("admin")) return <Navigate to="/dashboard" replace />;

  if (loading) return (
    <div className="flex justify-center pt-24">
      <Spinner className="h-8 w-8 text-blue-600" />
    </div>
  );

  if (error) return (
    <div className="rounded-3xl border border-red-200 bg-red-50 px-6 py-5 text-sm text-red-600">{error}</div>
  );

  if (!data) return null;

  const statusChartData = data.tasksByStatus.map((entry) => ({ name: entry.status, Tasks: entry.count }));
  const projectChartData = data.tasksByProject.map((project) => ({ name: project.projectTitle, Tasks: project.count }));
  const pieData = data.tasksByStatus.map((entry) => ({ name: entry.status, value: entry.count }));

  return (
    <div className="space-y-8">
      <div className="rounded-[32px] border border-slate-200 bg-white/85 p-8 shadow-lg backdrop-blur-[20px]">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] font-bold text-blue-600">Analytics</p>
            <h1 className="mt-2 text-3xl font-semibold text-slate-950">Workspace performance</h1>
            <p className="mt-3 max-w-2xl text-sm text-slate-500">Track project velocity, team output, and task progress with elegant charts.</p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-3xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-700 shadow-sm">
            <Sparkles className="h-5 w-5 text-blue-600" />
            Real-time insights
          </div>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <Card className="space-y-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_40px_rgba(37,99,235,0.15)]">
          <p className="text-xs uppercase tracking-[0.28em] text-slate-500">Total projects</p>
          <p className="text-4xl font-semibold text-slate-950">{data.totalProjects}</p>
          <p className="text-sm text-slate-500">Active project count in your workspace.</p>
        </Card>
        <Card className="space-y-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_40px_rgba(37,99,235,0.15)]">
          <p className="text-xs uppercase tracking-[0.28em] text-slate-500">Completion rate</p>
          <p className="text-4xl font-semibold text-slate-950">{data.completionPercentage}%</p>
          <p className="text-sm text-slate-500">Tasks completed out of total tasks.</p>
        </Card>
        <Card className="space-y-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_40px_rgba(37,99,235,0.15)]">
          <p className="text-xs uppercase tracking-[0.28em] text-slate-500">Overdue tasks</p>
          <p className="text-4xl font-semibold text-slate-950">{data.overdueTasks}</p>
          <p className="text-sm text-slate-500">Tasks that need immediate attention.</p>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_40px_rgba(37,99,235,0.15)]">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Task status distribution</p>
              <h2 className="mt-2 text-xl font-semibold text-slate-950">Status breakdown</h2>
            </div>
          </div>
          {pieData.length === 0 ? (
            <div className="rounded-3xl border border-white/10 bg-slate-950/60 p-10 text-center text-sm text-slate-500">
              No data available.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={110}
                  paddingAngle={4}
                  dataKey="value"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                >
                  {pieData.map((entry) => (
                    <Cell key={entry.name} fill={STATUS_COLORS[entry.name] ?? "#94a3b8"} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`${value} tasks`, "Tasks"]} contentStyle={{ backgroundColor: "#0f172a", border: "1px solid rgba(255,255,255,0.08)" }} />
                <Legend verticalAlign="bottom" iconType="circle" iconSize={8} wrapperStyle={{ color: "#94a3b8" }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </Card>

        <Card className="p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_40px_rgba(37,99,235,0.15)]">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Task status breakdown</p>
              <h2 className="mt-2 text-xl font-semibold text-slate-950">Progress overview</h2>
            </div>
          </div>
          {statusChartData.length === 0 ? (
            <div className="rounded-3xl border border-white/10 bg-slate-950/60 p-10 text-center text-sm text-slate-500">
              No status data yet.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={statusChartData} barCategoryGap="30%">
                <XAxis dataKey="name" tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false} interval={0} />
                <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip cursor={{ fill: "rgba(255,255,255,0.06)" }} contentStyle={{ backgroundColor: "#0f172a", border: "1px solid rgba(255,255,255,0.08)" }} />
                <Bar dataKey="Tasks" radius={[8, 8, 0, 0]}>
                  {statusChartData.map((entry) => (
                    <Cell key={entry.name} fill={STATUS_COLORS[entry.name] ?? "#94a3b8"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>

        <Card className="p-6 xl:col-span-2 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_40px_rgba(37,99,235,0.15)]">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Task volume</p>
              <h2 className="mt-2 text-xl font-semibold text-slate-950">Project task counts</h2>
            </div>
          </div>
          {projectChartData.length === 0 ? (
            <div className="rounded-3xl border border-white/10 bg-slate-950/60 p-10 text-center text-sm text-slate-500">
              No project data yet.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={projectChartData} barCategoryGap="30%">
                <XAxis dataKey="name" tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false} interval={0} angle={-20} textAnchor="end" height={50} />
                <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip cursor={{ fill: "rgba(255,255,255,0.06)" }} contentStyle={{ backgroundColor: "#0f172a", border: "1px solid rgba(255,255,255,0.08)" }} />
                <Bar dataKey="Tasks" radius={[8, 8, 0, 0]}>
                  {projectChartData.map((_, index) => (
                    <Cell key={index} fill={PROJECT_COLORS[index % PROJECT_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>
      </div>
    </div>
  );
};

