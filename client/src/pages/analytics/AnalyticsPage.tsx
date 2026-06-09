import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";
import { analyticsService, type AnalyticsOverview } from "@/services";
import { Spinner } from "@/components/ui/Spinner";
import { useAuth } from "@/store/auth.store";

// ── Stat card ─────────────────────────────────────────────────
interface StatCardProps {
  label: string;
  value: number | string;
  sub?: string;
  accent: string;
}

const StatCard = ({ label, value, sub, accent }: StatCardProps) => (
  <div className="flex flex-col gap-1 rounded-2xl bg-white p-5 shadow-sm">
    <span className="text-xs font-medium uppercase tracking-wide text-gray-400">{label}</span>
    <span className={`text-3xl font-bold ${accent}`}>{value}</span>
    {sub && <span className="text-xs text-gray-400">{sub}</span>}
  </div>
);

// ── Chart colours ─────────────────────────────────────────────
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

// ── Page ──────────────────────────────────────────────────────
export const AnalyticsPage = () => {
  const { hasRole } = useAuth();

  // Redirect non-admins
  if (!hasRole("admin")) return <Navigate to="/dashboard" replace />;

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

  if (loading) return (
    <div className="flex justify-center pt-24">
      <Spinner className="h-8 w-8" />
    </div>
  );

  if (error) return (
    <div className="rounded-xl bg-red-50 px-5 py-4 text-sm text-red-600">{error}</div>
  );

  if (!data) return null;

  const statusChartData = data.tasksByStatus.map((s) => ({
    name: s.status,
    Tasks: s.count,
  }));

  const projectChartData = data.tasksByProject.map((p) => ({
    name: p.projectTitle,
    Tasks: p.count,
  }));

  const pieData = data.tasksByStatus.map((s) => ({
    name: s.status,
    value: s.count,
  }));

  return (
    <div className="space-y-8">
      {/* ── Header ── */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Analytics</h1>
        <p className="mt-1 text-sm text-gray-400">Project and task performance overview</p>
      </div>

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        <StatCard label="Total Projects"    value={data.totalProjects}        accent="text-blue-600"   />
        <StatCard label="Total Tasks"       value={data.totalTasks}           accent="text-gray-800"   />
        <StatCard label="Completed Tasks"   value={data.completedTasks}       accent="text-green-600"  />
        <StatCard label="Pending Tasks"     value={data.pendingTasks}         accent="text-yellow-600" />
        <StatCard label="Overdue Tasks"     value={data.overdueTasks}         accent="text-red-500"    />
        <StatCard
          label="Completion"
          value={`${data.completionPercentage}%`}
          sub={`${data.completedTasks} of ${data.totalTasks} tasks done`}
          accent="text-blue-600"
        />
      </div>

      {/* ── Completion progress bar ── */}
      <div className="rounded-2xl bg-white p-5 shadow-sm">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">Overall Completion</span>
          <span className="text-sm font-bold text-blue-600">{data.completionPercentage}%</span>
        </div>
        <div className="h-3 w-full overflow-hidden rounded-full bg-gray-100">
          <div
            className="h-3 rounded-full bg-blue-500 transition-all duration-500"
            style={{ width: `${data.completionPercentage}%` }}
          />
        </div>
      </div>

      {/* ── Charts row ── */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">

        {/* Tasks by Status — Pie */}
        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold text-gray-700">Tasks by Status</h2>
          {pieData.length === 0 ? (
            <p className="py-10 text-center text-sm text-gray-400">No data</p>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={3}
                  dataKey="value"
                  label={({ name, percent }) =>
                    `${name} ${(percent * 100).toFixed(0)}%`
                  }
                  labelLine={false}
                >
                  {pieData.map((entry) => (
                    <Cell
                      key={entry.name}
                      fill={STATUS_COLORS[entry.name] ?? "#94a3b8"}
                    />
                  ))}
                </Pie>
                <Tooltip formatter={(v: number) => [`${v} tasks`, "Count"]} />
                <Legend iconType="circle" iconSize={8} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Tasks by Status — Bar */}
        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold text-gray-700">Task Status Breakdown</h2>
          {statusChartData.length === 0 ? (
            <p className="py-10 text-center text-sm text-gray-400">No data</p>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={statusChartData} barCategoryGap="35%">
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11, fill: "#6b7280" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 11, fill: "#6b7280" }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip cursor={{ fill: "#f1f5f9" }} />
                <Bar dataKey="Tasks" radius={[6, 6, 0, 0]}>
                  {statusChartData.map((entry) => (
                    <Cell
                      key={entry.name}
                      fill={STATUS_COLORS[entry.name] ?? "#94a3b8"}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Tasks per Project — full width bar */}
        <div className="rounded-2xl bg-white p-5 shadow-sm xl:col-span-2">
          <h2 className="mb-4 text-sm font-semibold text-gray-700">Tasks per Project</h2>
          {projectChartData.length === 0 ? (
            <p className="py-10 text-center text-sm text-gray-400">No data</p>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={projectChartData} barCategoryGap="35%">
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11, fill: "#6b7280" }}
                  axisLine={false}
                  tickLine={false}
                  interval={0}
                  angle={-20}
                  textAnchor="end"
                  height={50}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 11, fill: "#6b7280" }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip cursor={{ fill: "#f1f5f9" }} />
                <Bar dataKey="Tasks" radius={[6, 6, 0, 0]}>
                  {projectChartData.map((_, i) => (
                    <Cell key={i} fill={PROJECT_COLORS[i % PROJECT_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
};
