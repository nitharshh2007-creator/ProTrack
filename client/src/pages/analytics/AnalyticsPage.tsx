import { useEffect, useState, useCallback } from "react";
import { Navigate } from "react-router-dom";
import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, CartesianGrid
} from "recharts";
import { analyticsService, type AnalyticsData, type AnalyticsDataAdmin, type AnalyticsDataEmployee } from "@/services";
import { Spinner } from "@/components/ui/Spinner";
import { Card } from "@/components/ui/Card";
import { useAuth } from "@/store/auth.store";
import { getSocket } from "@/lib/socket";
import { 
  Clock, Calendar, AlertCircle, Activity, Folder, Bolt, CheckCircle2, 
  ListTodo, TrendingUp, TrendingDown, Layers, BarChart3, User, 
  ChevronRight, Inbox, Download, FileText, X
} from "lucide-react";
import { exportToPDF, exportToExcel, exportToCSV } from "@/lib/export-helpers";

const STATUS_COLORS: Record<string, string> = {
  Todo: "#64748b",
  "In Progress": "#3b82f6",
  Review: "#f59e0b",
  Blocked: "#ef4444",
  Completed: "#10b981",
};

const PROJECT_COLORS = [
  "#3b82f6", "#8b5cf6", "#ec4899", "#f59e0b",
  "#10b981", "#06b6d4", "#f97316", "#6366f1",
  "#14b8a6", "#e11d48",
];

const StatCard: React.FC<{ 
  label: string; 
  value: number | string; 
  color: string; 
  description?: string;
  icon: React.ReactNode;
  trend?: { value: string; isUp: boolean } | null;
}> = ({
  label,
  value,
  color,
  description,
  icon,
  trend
}) => (
  <div className="relative overflow-hidden bg-slate-900/50 hover:bg-slate-900/85 border border-slate-800/80 hover:border-slate-700/60 rounded-xl p-5 shadow-lg transition-all duration-300 group">
    {/* Subtle indicator bar on the left */}
    <div className="absolute left-0 top-0 bottom-0 w-[3px] transition-all duration-300 group-hover:w-[4px]" style={{ backgroundColor: color }} />
    
    <div className="flex justify-between items-start mb-4 pl-1">
      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 group-hover:text-slate-350 transition-colors duration-300">{label}</p>
      <div className="p-2 rounded-lg bg-slate-950/80 border border-slate-800/80 text-slate-450 group-hover:text-slate-200 group-hover:border-slate-700/50 transition-all duration-300">
        {icon}
      </div>
    </div>
    <div className="flex items-end gap-3 pl-1">
      <span className="text-3xl font-extrabold text-white tracking-tight leading-none">{value}</span>
      {trend && (
        <div className={`flex items-center text-[10px] font-bold uppercase px-2 py-0.5 rounded-md ${trend.isUp ? 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20' : 'text-rose-400 bg-rose-500/10 border border-rose-500/20'}`}>
          {trend.isUp ? <TrendingUp className="h-3 w-3 mr-0.5" /> : <TrendingDown className="h-3 w-3 mr-0.5" />}
          <span>{trend.value}</span>
        </div>
      )}
    </div>
    {description && <p className="text-xs text-slate-500 mt-3.5 font-medium pl-1">{description}</p>}
  </div>
);

const ChartCard: React.FC<{ 
  title: string; 
  subtitle: string; 
  children: React.ReactNode; 
  className?: string;
  icon?: React.ReactNode;
}> = ({ title, subtitle, children, className = "", icon }) => (
  <Card className={`bg-slate-900/40 border border-slate-800/85 hover:border-slate-850/80 rounded-xl p-6 shadow-xl transition-all duration-300 hover:shadow-2xl ${className}`}>
    <div className="flex justify-between items-center mb-6 border-b border-slate-800/60 pb-4">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">{subtitle}</p>
        <h3 className="text-lg font-bold text-slate-100 tracking-tight mt-1">{title}</h3>
      </div>
      {icon && (
        <div className="p-2 rounded-lg bg-slate-950 border border-slate-850 text-slate-400">
          {icon}
        </div>
      )}
    </div>
    <div className="w-full">
      {children}
    </div>
  </Card>
);

const EmptyState: React.FC<{ message: string; description?: string }> = ({ message, description }) => (
  <div className="flex flex-col items-center justify-center py-12 px-4 border border-dashed border-slate-800/80 bg-slate-950/20 rounded-xl text-center">
    <div className="w-12 h-12 rounded-full bg-slate-900/60 border border-slate-800 flex items-center justify-center text-slate-500 mb-4">
      <Inbox className="h-5 w-5" />
    </div>
    <h4 className="text-sm font-semibold text-slate-350">{message}</h4>
    {description && <p className="text-xs text-slate-500 mt-1 max-w-xs">{description}</p>}
  </div>
);

export const AnalyticsPage = () => {
  const { hasRole } = useAuth();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [projects, setProjects] = useState<{ _id: string; title: string; status: string }[]>([]);
  const [selectedProject, setSelectedProject] = useState("all");
  const [exporting, setExporting] = useState(false);
  const [exportDropdownOpen, setExportDropdownOpen] = useState(false);
  const [exportMessage, setExportMessage] = useState<{ text: string; isError: boolean } | null>(null);

  const handleExport = async (format: "pdf" | "excel" | "csv") => {
    setExportDropdownOpen(false);
    setExporting(true);
    setExportMessage(null);
    try {
      const freshData = await analyticsService.getData(selectedProject !== "all" ? selectedProject : undefined);
      if (freshData.role !== "admin") {
        throw new Error("Unauthorized to export admin metrics");
      }
      const projectTitle = selectedProject === "all" ? "All Projects" : projects.find(p => p._id === selectedProject)?.title || "Selected Project";
      
      if (format === "pdf") {
        exportToPDF(freshData, projectTitle);
      } else if (format === "excel") {
        exportToExcel(freshData, projectTitle);
      } else {
        exportToCSV(freshData, projectTitle);
      }
      setExportMessage({ text: `Successfully exported analytics report as ${format.toUpperCase()}.`, isError: false });
      setTimeout(() => setExportMessage(null), 5000);
    } catch (err: any) {
      console.error(err);
      setExportMessage({ text: "Failed to generate report. Please try again.", isError: true });
      setTimeout(() => setExportMessage(null), 5000);
    } finally {
      setExporting(false);
    }
  };

  const loadData = useCallback(() => {
    analyticsService
      .getData(selectedProject !== "all" ? selectedProject : undefined)
      .then(setData)
      .catch(() => setError("Failed to load analytics data."))
      .finally(() => setLoading(false));
  }, [selectedProject]);

  useEffect(() => {
    if (hasRole("admin", "manager")) {
      analyticsService.getProjects()
        .then(setProjects)
        .catch(console.error);
    }
  }, [hasRole]);

  useEffect(() => {
    setLoading(true);
    loadData();
  }, [selectedProject, loadData]);

  // Real-time updates
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    const socket = getSocket(token);
    socket.connect();

    const handleRefresh = () => {
      loadData();
    };

    socket.on("analytics:refresh", handleRefresh);

    return () => {
      socket.off("analytics:refresh", handleRefresh);
    };
  }, [loadData]);

  if (!hasRole("admin", "manager", "employee")) {
    return <Navigate to="/dashboard" replace />;
  }

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center pt-32 pb-32 space-y-4">
        <Spinner className="h-10 w-10 text-blue-500" />
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-widest animate-pulse">Loading Analytics...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-500/10 bg-red-500/5 px-6 py-5 text-sm text-red-400 flex items-center gap-3">
        <AlertCircle className="h-5 w-5 shrink-0 text-red-500" />
        <span className="font-semibold">{error}</span>
      </div>
    );
  }

  if (!data) return null;

  const isAdmin = data.role === "admin";
  const adminData = data as AnalyticsDataAdmin;
  const employeeData = data as AnalyticsDataEmployee;

  return (
    <div className="space-y-6">
      {/* HERO SECTION */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border border-slate-800/80 rounded-2xl p-6 md:p-8 shadow-xl">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(37,99,235,0.12),_transparent_40%),radial-gradient(circle_at_bottom_right,_rgba(99,102,241,0.04),_transparent_50%)] animate-pulse" />
        <div className="relative z-10 space-y-3">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-widest bg-blue-500/10 text-blue-400 border border-blue-500/20">
              {isAdmin ? "Workspace Hub" : "Personal space"}
            </span>
            <span className="text-slate-600 text-xs font-semibold">|</span>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Real-time telemetry</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight leading-none">
            {isAdmin ? "Analytics Engine" : "My Productivity Hub"}
          </h1>
          <p className="text-xs md:text-sm text-slate-400 max-w-xl leading-relaxed">
            {isAdmin
              ? "Track core indicators, team workloads, timelines, and status distributions across all active projects."
              : "Review your performance metrics, upcoming milestones, and personal completion ratios."}
          </p>
        </div>
      </div>

      {exportMessage && (
        <div className={`p-4 rounded-xl border text-xs font-semibold flex items-center justify-between shadow-md transition-all duration-300 ${
          exportMessage.isError 
            ? 'bg-rose-500/10 border-rose-500/20 text-rose-400' 
            : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
        }`}>
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-current" />
            <span>{exportMessage.text}</span>
          </div>
          <button onClick={() => setExportMessage(null)} className="text-slate-400 hover:text-slate-200 transition-colors">
            <X className="h-4.5 w-4.5" />
          </button>
        </div>
      )}

      {/* PROJECT FILTER (ADMIN ONLY) */}
      {isAdmin && (
        <div className="bg-slate-900/35 border border-slate-800/85 rounded-xl p-4 md:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-lg">
          <div className="space-y-1">
            <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block">
              Workspace Context
            </label>
            <p className="text-xs text-slate-500 font-medium">Select a project to narrow down system statistics</p>
          </div>
          
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
            {/* Project Selector */}
            <div className="relative w-full sm:w-64">
              <select
                value={selectedProject}
                onChange={(e) => setSelectedProject(e.target.value)}
                className="w-full rounded-lg border border-slate-850 bg-slate-950 px-4 py-2 text-xs font-semibold text-slate-200 outline-none transition duration-200 hover:border-slate-700 focus:border-blue-500/80 focus:ring-2 focus:ring-blue-500/10 cursor-pointer appearance-none"
              >
                <option value="all">All Projects</option>
                {projects.map((p) => (
                  <option key={p._id} value={p._id}>
                    {p.title}
                  </option>
                ))}
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                <ChevronRight className="h-4 w-4 rotate-90" />
              </div>
            </div>

            {/* Export Dropdown */}
            <div className="relative">
              <button
                disabled={exporting}
                onClick={() => setExportDropdownOpen(!exportDropdownOpen)}
                className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-lg border border-slate-800 bg-[#2563eb] hover:bg-[#2563eb]/95 text-white px-4 py-2 text-xs font-semibold outline-none transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg active:scale-[0.98]"
              >
                <Download className="h-4 w-4" />
                <span>{exporting ? "Generating..." : "Export Analytics"}</span>
              </button>

              {exportDropdownOpen && (
                <div className="absolute right-0 mt-2 w-40 rounded-lg border border-slate-800 bg-[#171f33] p-1 shadow-2xl z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  <button
                    onClick={() => handleExport("pdf")}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-left text-xs font-medium text-[#dae2fd] hover:bg-[#2d3449]/50 rounded-md transition-all"
                  >
                    <FileText className="h-4 w-4 text-red-400" />
                    <span>Export PDF</span>
                  </button>
                  <button
                    onClick={() => handleExport("excel")}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-left text-xs font-medium text-[#dae2fd] hover:bg-[#2d3449]/50 rounded-md transition-all"
                  >
                    <FileText className="h-4 w-4 text-emerald-400" />
                    <span>Export Excel</span>
                  </button>
                  <button
                    onClick={() => handleExport("csv")}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-left text-xs font-medium text-[#dae2fd] hover:bg-[#2d3449]/50 rounded-md transition-all"
                  >
                    <FileText className="h-4 w-4 text-blue-400" />
                    <span>Export CSV</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* STATISTICS CARDS */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {isAdmin ? (
          <>
            <StatCard
              label="Total Projects"
              value={adminData.totalProjects}
              color="#3b82f6"
              icon={<Folder className="h-4 w-4" />}
              description="Overall registered projects"
              trend={{ value: "Active system", isUp: true }}
            />
            <StatCard
              label="Active Projects"
              value={adminData.activeProjects}
              color="#3b82f6"
              icon={<Bolt className="h-4 w-4" />}
              description="Projects currently in progress"
              trend={adminData.totalProjects > 0 ? { value: `${Math.round((adminData.activeProjects / adminData.totalProjects) * 100)}% active`, isUp: true } : null}
            />
            <StatCard
              label="Completed Projects"
              value={adminData.completedProjects}
              color="#10b981"
              icon={<CheckCircle2 className="h-4 w-4" />}
              description="Archived and finished"
            />
            <StatCard
              label="Total Tasks"
              value={adminData.totalTasks}
              color="#f59e0b"
              icon={<ListTodo className="h-4 w-4" />}
              description="Tasks assigned to workspace"
            />
            <StatCard
              label="Completed Tasks"
              value={adminData.completedTasks}
              color="#10b981"
              icon={<CheckCircle2 className="h-4 w-4" />}
              description="Finished workflow iterations"
            />
            <StatCard
              label="Completion Rate"
              value={`${adminData.completionRate}%`}
              color="#8b5cf6"
              icon={<Activity className="h-4 w-4" />}
              description="Task closeout velocity"
              trend={adminData.completionRate >= 70 ? { value: "optimal", isUp: true } : { value: "action needed", isUp: false }}
            />
          </>
        ) : (
          <>
            <StatCard
              label="Assigned Projects"
              value={employeeData.assignedProjects}
              color="#3b82f6"
              icon={<Folder className="h-4 w-4" />}
              description="Your primary active project workspaces"
            />
            <StatCard
              label="Assigned Tasks"
              value={employeeData.assignedTasks}
              color="#f59e0b"
              icon={<ListTodo className="h-4 w-4" />}
              description="Total workload allocated to you"
            />
            <StatCard
              label="Completed Tasks"
              value={employeeData.completedTasks}
              color="#10b981"
              icon={<CheckCircle2 className="h-4 w-4" />}
              description="Work units successfully delivered"
            />
            <StatCard
              label="Completion Rate"
              value={`${employeeData.completionRate}%`}
              color="#8b5cf6"
              icon={<Activity className="h-4 w-4" />}
              description="Your closeout ratio"
              trend={employeeData.completionRate >= 80 ? { value: "exceeds targets", isUp: true } : null}
            />
          </>
        )}
      </div>

      {/* ADMIN CHARTS */}
      {isAdmin && (
        <div className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-12">
            {/* Task Status Distribution */}
            <div className="lg:col-span-8">
              <ChartCard 
                title="Task Status Distribution" 
                subtitle="Metrics" 
                icon={<Layers className="h-4 w-4" />}
              >
                {adminData.statusDistribution.length === 0 ? (
                  <EmptyState message="No task statuses available" description="Create tasks and set statuses to populate the donut chart." />
                ) : (
                  <div className="flex flex-col md:flex-row items-center justify-between gap-6 py-4">
                    <div className="w-full md:w-1/2" style={{ minHeight: "260px" }}>
                      <ResponsiveContainer width="100%" height={260}>
                        <PieChart>
                          <Pie
                            data={adminData.statusDistribution}
                            cx="50%"
                            cy="50%"
                            innerRadius={70}
                            outerRadius={105}
                            paddingAngle={3}
                            dataKey="count"
                          >
                            {adminData.statusDistribution.map((entry) => (
                              <Cell key={entry.status} fill={STATUS_COLORS[entry.status] ?? "#64748b"} />
                            ))}
                          </Pie>
                          <Tooltip
                            contentStyle={{ 
                              backgroundColor: "#090d16", 
                              border: "1px solid rgba(255,255,255,0.06)", 
                              borderRadius: "10px", 
                              color: "#f8fafc",
                              fontSize: "12px",
                              fontFamily: "monospace"
                            }}
                            formatter={(value) => [`${value} task(s)`, "Tasks"]}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="w-full md:w-1/2 space-y-2.5">
                      <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 mb-2">Detailed Status Breakdown</p>
                      {adminData.statusDistribution.map((entry) => {
                        const total = adminData.statusDistribution.reduce((acc, curr) => acc + curr.count, 0);
                        const pct = total > 0 ? Math.round((entry.count / total) * 100) : 0;
                        return (
                          <div key={entry.status} className="flex items-center justify-between p-2 rounded-lg bg-slate-950/40 border border-slate-900/60 hover:bg-slate-950/80 transition-all duration-200">
                            <div className="flex items-center gap-2.5">
                              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: STATUS_COLORS[entry.status] ?? "#64748b" }} />
                              <span className="text-xs font-semibold text-slate-350">{entry.status}</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-xs font-mono font-bold text-white">{entry.count}</span>
                              <span className="text-[10px] font-mono text-slate-500 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-850">{pct}%</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </ChartCard>
            </div>

            {/* Team Workload Distribution */}
            <div className="lg:col-span-4">
              <ChartCard 
                title="Workload Balance" 
                subtitle="Team" 
                icon={<User className="h-4 w-4" />}
                className="h-full flex flex-col"
              >
                {adminData.workloadDistribution.length === 0 ? (
                  <EmptyState message="No workload data" description="Assign tasks to employees to see team workload balance." />
                ) : (
                  <div className="space-y-3 overflow-y-auto max-h-[300px] pr-1">
                    {adminData.workloadDistribution.map((item, idx) => (
                      <div 
                        key={item.employeeId} 
                        className="flex items-center justify-between p-3 rounded-lg bg-slate-950/40 border border-slate-900/80 hover:bg-slate-950/70 hover:border-slate-800 transition-all duration-200"
                      >
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-extrabold text-white border"
                            style={{ 
                              background: `${PROJECT_COLORS[idx % PROJECT_COLORS.length]}15`, 
                              borderColor: `${PROJECT_COLORS[idx % PROJECT_COLORS.length]}40`,
                              color: PROJECT_COLORS[idx % PROJECT_COLORS.length]
                            }}
                          >
                            {item.employeeName.charAt(0).toUpperCase()}
                          </div>
                          <span className="text-xs font-bold text-slate-300">{item.employeeName}</span>
                        </div>
                        <span 
                          className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border font-mono"
                          style={{ 
                            background: PROJECT_COLORS[idx % PROJECT_COLORS.length] + "10", 
                            color: PROJECT_COLORS[idx % PROJECT_COLORS.length], 
                            borderColor: PROJECT_COLORS[idx % PROJECT_COLORS.length] + "25" 
                          }}
                        >
                          {item.taskCount} task{item.taskCount !== 1 ? 's' : ''}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </ChartCard>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Project Progress Comparison */}
            <ChartCard 
              title="Project Progression" 
              subtitle="Analytics" 
              icon={<BarChart3 className="h-4 w-4" />}
            >
              {adminData.projectProgressComparison.length === 0 ? (
                <EmptyState message="No projects in this context" description="Create a project to map comparative progress." />
              ) : (
                <div style={{ height: "260px" }} className="pt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={adminData.projectProgressComparison} margin={{ bottom: 15, left: -20 }}>
                      <defs>
                        <linearGradient id="barPrimaryGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.85}/>
                          <stop offset="100%" stopColor="#1e3a8a" stopOpacity={0.2}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                      <XAxis
                        dataKey="projectName"
                        tick={{ fontSize: 9, fill: "#64748b", fontWeight: "600" }}
                        axisLine={{ stroke: "rgba(255,255,255,0.05)" }}
                        tickLine={false}
                        dy={8}
                      />
                      <YAxis 
                        tick={{ fill: "#64748b", fontSize: 9 }} 
                        axisLine={{ stroke: "rgba(255,255,255,0.05)" }}
                        tickLine={false}
                        domain={[0, 100]}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: "#090d16", 
                          border: "1px solid rgba(255,255,255,0.06)", 
                          borderRadius: "10px", 
                          color: "#f8fafc",
                          fontSize: "12px"
                        }}
                        formatter={(value) => [`${value}% Complete`, "Progress"]}
                      />
                      <Bar dataKey="completionPercent" fill="url(#barPrimaryGrad)" radius={[4, 4, 0, 0]} maxBarSize={45} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </ChartCard>

            {/* Priority Distribution */}
            <ChartCard 
              title="Task Priority Balance" 
              subtitle="Analytics" 
              icon={<Layers className="h-4 w-4" />}
            >
              {adminData.priorityDistribution.length === 0 ? (
                <EmptyState message="No task priority records" description="Priority levels will populate here once task records exist." />
              ) : (
                <div style={{ height: "260px" }} className="pt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={adminData.priorityDistribution} margin={{ bottom: 15, left: -20 }}>
                      <defs>
                        <linearGradient id="barWarningGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.85}/>
                          <stop offset="100%" stopColor="#78350f" stopOpacity={0.2}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                      <XAxis dataKey="priority" tick={{ fill: "#64748b", fontSize: 9, fontWeight: "600" }} axisLine={{ stroke: "rgba(255,255,255,0.05)" }} tickLine={false} dy={8} />
                      <YAxis tick={{ fill: "#64748b", fontSize: 9 }} axisLine={{ stroke: "rgba(255,255,255,0.05)" }} tickLine={false} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: "#090d16", 
                          border: "1px solid rgba(255,255,255,0.06)", 
                          borderRadius: "10px", 
                          color: "#f8fafc",
                          fontSize: "12px"
                        }}
                        formatter={(value) => [`${value} task(s)`, "Count"]}
                      />
                      <Bar dataKey="count" fill="url(#barWarningGrad)" radius={[4, 4, 0, 0]} maxBarSize={45} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </ChartCard>
          </div>

          {/* Completion Trend */}
          <ChartCard 
            title="Weekly Task Closeout Pace" 
            subtitle="Historical velocity" 
            icon={<Activity className="h-4 w-4" />}
          >
            {adminData.completionTrend.length === 0 ? (
              <EmptyState message="No completed tasks recorded" description="Close out tasks to generate historical charts." />
            ) : (
              <div style={{ height: "260px" }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={adminData.completionTrend} margin={{ bottom: 10, left: -20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                    <XAxis dataKey="date" tick={{ fill: "#64748b", fontSize: 9 }} axisLine={{ stroke: "rgba(255,255,255,0.05)" }} tickLine={false} dy={8} />
                    <YAxis tick={{ fill: "#64748b", fontSize: 9 }} axisLine={{ stroke: "rgba(255,255,255,0.05)" }} tickLine={false} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: "#090d16", 
                        border: "1px solid rgba(255,255,255,0.06)", 
                        borderRadius: "10px", 
                        color: "#f8fafc",
                        fontSize: "12px"
                      }}
                      formatter={(value) => [`${value} tasks completed`, "Completed"]}
                    />
                    <Line
                      type="monotone"
                      dataKey="count"
                      stroke="#10b981"
                      strokeWidth={2.5}
                      dot={{ fill: "#10b981", r: 3.5, strokeWidth: 1.5, stroke: "#0f172a" }}
                      activeDot={{ r: 5, strokeWidth: 0 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </ChartCard>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Recent Activity */}
            <ChartCard 
              title="Recent Workspace Activities" 
              subtitle="Timelines" 
              icon={<Clock className="h-4 w-4" />}
            >
              {adminData.recentActivity.length === 0 ? (
                <EmptyState message="No recent updates" description="Real-time events will be listed as they occur." />
              ) : (
                <div className="relative pl-4 space-y-4 max-h-[350px] overflow-y-auto pr-1">
                  <div className="absolute left-[20px] top-1.5 bottom-1.5 w-[1px] bg-slate-800" />
                  {adminData.recentActivity.map((activity, idx) => (
                    <div key={idx} className="relative flex gap-4 items-start group">
                      <div className="absolute left-[-2.5px] mt-1.5 w-[7px] h-[7px] rounded-full bg-slate-900 border border-blue-500/80 ring-4 ring-blue-500/5 group-hover:bg-blue-500 transition-all duration-200" />
                      <div className="ml-4 flex-1 p-3 rounded-lg bg-slate-950/30 border border-slate-900/60 group-hover:bg-slate-950/70 group-hover:border-slate-850 transition-all duration-200">
                        <p className="text-xs font-semibold text-slate-200 leading-relaxed group-hover:text-slate-100">{activity.description}</p>
                        <div className="flex items-center gap-1.5 text-[9px] text-slate-500 font-mono mt-2 uppercase tracking-wide">
                          <Calendar className="h-3 w-3" />
                          <span>{new Date(activity.timestamp).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ChartCard>

            {/* Upcoming Deadlines */}
            <ChartCard 
              title="Approaching Deliverables" 
              subtitle="Milestones" 
              icon={<AlertCircle className="h-4 w-4" />}
            >
              {adminData.upcomingDeadlines.length === 0 ? (
                <EmptyState message="No imminent deadlines" description="Projects with due dates will list remaining time tags." />
              ) : (
                <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
                  {adminData.upcomingDeadlines.map((deadline, idx) => {
                    const diffTime = new Date(deadline.dueDate).getTime() - new Date().getTime();
                    const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                    return (
                      <div 
                        key={idx} 
                        className="group bg-slate-950/30 hover:bg-slate-950/70 border border-slate-900/60 hover:border-slate-850 transition-all duration-300 p-3.5 rounded-lg flex items-center justify-between gap-4"
                      >
                        <div className="flex items-center gap-3.5 min-w-0">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-500/5 text-amber-500 border border-amber-500/10 group-hover:border-amber-500/20 transition-all">
                            <Calendar className="h-4 w-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-slate-200 group-hover:text-white transition-colors text-xs truncate leading-snug">{deadline.title}</p>
                            <p className="text-[10px] text-slate-500 flex items-center gap-1.5 mt-1.5 font-mono">
                              <Clock className="h-3 w-3" />
                              {new Date(deadline.dueDate).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2.5 shrink-0">
                          {days < 0 ? (
                            <span className="text-[9px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20">Overdue</span>
                          ) : days === 0 ? (
                            <span className="text-[9px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-500/15 text-amber-400 border border-amber-500/25">Today</span>
                          ) : days === 1 ? (
                            <span className="text-[9px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/15">Tomorrow</span>
                          ) : (
                            <span className="text-[9px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800">{days}d left</span>
                          )}
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-500/5 text-blue-400 border border-blue-500/10">
                            {deadline.status}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </ChartCard>
          </div>
        </div>
      )}

      {/* EMPLOYEE CHARTS */}
      {!isAdmin && (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Personal Task Status Distribution */}
          <ChartCard 
            title="Personal Workload Distribution" 
            subtitle="Metrics" 
            icon={<Layers className="h-4 w-4" />}
          >
            {employeeData.personalStatusDistribution.length === 0 ? (
              <EmptyState message="No personal tasks found" description="When tasks are assigned to you, status metrics will populate." />
            ) : (
              <div style={{ height: "260px" }} className="pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={employeeData.personalStatusDistribution} margin={{ bottom: 15, left: -20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                    <XAxis dataKey="status" tick={{ fill: "#64748b", fontSize: 9, fontWeight: "600" }} axisLine={{ stroke: "rgba(255,255,255,0.05)" }} tickLine={false} dy={8} />
                    <YAxis tick={{ fill: "#64748b", fontSize: 9 }} axisLine={{ stroke: "rgba(255,255,255,0.05)" }} tickLine={false} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: "#090d16", 
                        border: "1px solid rgba(255,255,255,0.06)", 
                        borderRadius: "10px", 
                        color: "#f8fafc",
                        fontSize: "12px"
                      }}
                      formatter={(value) => [`${value} tasks`, "Count"]}
                    />
                    <Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={45}>
                      {employeeData.personalStatusDistribution.map((entry) => (
                        <Cell key={entry.status} fill={STATUS_COLORS[entry.status] ?? "#64748b"} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </ChartCard>

          {/* Personal Completion Trend */}
          <ChartCard 
            title="Your Completion Progression" 
            subtitle="Velocity" 
            icon={<Activity className="h-4 w-4" />}
          >
            {employeeData.completionTrend.length === 0 ? (
              <EmptyState message="No historical progression data" description="Complete tasks over time to map your output trend." />
            ) : (
              <div style={{ height: "260px" }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={employeeData.completionTrend} margin={{ bottom: 10, left: -20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                    <XAxis dataKey="date" tick={{ fill: "#64748b", fontSize: 9 }} axisLine={{ stroke: "rgba(255,255,255,0.05)" }} tickLine={false} dy={8} />
                    <YAxis tick={{ fill: "#64748b", fontSize: 9 }} axisLine={{ stroke: "rgba(255,255,255,0.05)" }} tickLine={false} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: "#090d16", 
                        border: "1px solid rgba(255,255,255,0.06)", 
                        borderRadius: "10px", 
                        color: "#f8fafc",
                        fontSize: "12px"
                      }}
                      formatter={(value) => [`${value} tasks completed`, "Completed"]}
                    />
                    <Line
                      type="monotone"
                      dataKey="count"
                      stroke="#10b981"
                      strokeWidth={2.5}
                      dot={{ fill: "#10b981", r: 3.5, strokeWidth: 1.5, stroke: "#0f172a" }}
                      activeDot={{ r: 5, strokeWidth: 0 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </ChartCard>

          {/* Personal Deadlines */}
          <div className="lg:col-span-2">
            <ChartCard 
              title="Your Imminent Deliverables" 
              subtitle="Milestones" 
              icon={<AlertCircle className="h-4 w-4" />}
            >
              {employeeData.deadlines.length === 0 ? (
                <EmptyState message="No personal deadlines found" description="When task due dates approach, they will appear here." />
              ) : (
                <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
                  {employeeData.deadlines.map((deadline, idx) => {
                    const diffTime = new Date(deadline.dueDate).getTime() - new Date().getTime();
                    const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                    return (
                      <div 
                        key={idx} 
                        className="group bg-slate-950/30 hover:bg-slate-950/70 border border-slate-900/60 hover:border-slate-850 transition-all duration-300 p-3.5 rounded-lg flex items-center justify-between gap-4"
                      >
                        <div className="flex items-center gap-3.5 min-w-0">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-500/5 text-amber-500 border border-amber-500/10 group-hover:border-amber-500/20 transition-all">
                            <Calendar className="h-4 w-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-slate-200 group-hover:text-white transition-colors text-xs truncate leading-snug">{deadline.title}</p>
                            <p className="text-[10px] text-slate-500 flex items-center gap-1.5 mt-1.5 font-mono">
                              <Clock className="h-3 w-3" />
                              {new Date(deadline.dueDate).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2.5 shrink-0">
                          {days < 0 ? (
                            <span className="text-[9px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20">Overdue</span>
                          ) : days === 0 ? (
                            <span className="text-[9px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-500/15 text-amber-400 border border-amber-500/25">Today</span>
                          ) : days === 1 ? (
                            <span className="text-[9px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/15">Tomorrow</span>
                          ) : (
                            <span className="text-[9px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800">{days}d left</span>
                          )}
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-500/5 text-blue-400 border border-blue-500/10">
                            {deadline.status}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </ChartCard>
          </div>
        </div>
      )}
    </div>
  );
};

