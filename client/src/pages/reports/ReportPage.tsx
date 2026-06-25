import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { CheckCircle2, Clock, AlertCircle, Zap, FileText, TrendingUp, Users, Calendar } from "lucide-react";
import { dashboardService } from "@/services";
import { Spinner } from "@/components/ui/Spinner";
import { Badge } from "@/components/ui/Badge";

export const ReportPage = () => {
  const { id } = useParams<{ id: string }>();
  const [report, setReport] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) dashboardService.getProjectReport(id).then(setReport).finally(() => setLoading(false));
  }, [id]);

  const generateProjectHealth = () => {
    if (!report) return { status: "neutral", label: "Analyzing", color: "from-slate-500 to-slate-600" };
    
    const blockedPercentage = report.totalTasks > 0 ? (report.blockedTasks / report.totalTasks) * 100 : 0;
    const overdueCount = report.overdueTasks ?? 0;

    if (blockedPercentage > 30 || overdueCount > 5) return { status: "critical", label: "Critical", color: "from-red-500 to-rose-600" };
    if (blockedPercentage > 15 || overdueCount > 2) return { status: "at-risk", label: "At Risk", color: "from-amber-500 to-orange-600" };
    return { status: "healthy", label: "Healthy", color: "from-green-500 to-emerald-600" };
  };

  if (loading) return <div className="flex justify-center pt-24"><Spinner className="h-8 w-8 text-blue-400" /></div>;
  if (!report) return <div className="rounded-2xl border border-slate-800 bg-slate-900 p-8 text-center"><p className="text-slate-400">No report found.</p></div>;

  const completionRate = report.totalTasks > 0 ? Math.round((report.completedTasks / report.totalTasks) * 100) : 0;
  const inProgressCount = report.inProgressTasks ?? 0;
  const pendingCount = report.pendingTasks ?? 0;
  const blockedCount = report.blockedTasks ?? 0;
  const health = generateProjectHealth();

  const containerVariants = {
    hidden: {},
    show: { transition: { staggerChildren: 0.06 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
  };

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="premium-hero"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(37,99,235,0.15),_transparent_35%),radial-gradient(circle_at_bottom_right,_rgba(37,99,235,0.05),_transparent_45%)]" />
        
        <div className="relative">
          <div className="mb-8 flex items-start justify-between">
            <div className="flex-1">
              <Link to={`/projects/${id}`} className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.3em] text-blue-450 hover:text-blue-400 mb-4">
                ← Project Analytics
              </Link>
              <div className="flex items-center gap-3 mb-3">
                <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight leading-none">{report.projectName}</h1>
                <div className={`inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${health.color} text-white shadow-lg`}>
                  <span className="text-xs font-bold">{health.label === "Healthy" ? "✓" : health.label === "At Risk" ? "!" : "!"}</span>
                </div>
              </div>
              <p className="text-[#CBD5E1] text-sm flex items-center gap-2">
                <FileText className="h-4 w-4 text-blue-450" />
                Project Analytics & Reports
              </p>
            </div>
            <div className="relative">
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-350">Overall Progress</span>
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-blue-500 bg-clip-text text-transparent">{completionRate}%</span>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-slate-850/50 backdrop-blur-sm">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${completionRate}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
                className="h-full rounded-full bg-gradient-to-r from-blue-500 to-blue-600 shadow-lg shadow-blue-500/30"
              />
            </div>
          </div>

          {/* Meta Info */}
          <div className="mt-8 grid gap-4 grid-cols-2 md:grid-cols-4 text-sm">
            <div>
              <p className="text-slate-450 font-medium mb-1">Total Tasks</p>
              <p className="text-2xl font-bold text-slate-100">{report.totalTasks}</p>
            </div>
            <div>
              <p className="text-slate-450 font-medium mb-1">Team Members</p>
              <p className="text-2xl font-bold text-slate-100">{report.teamMembers ?? 0}</p>
            </div>
            <div>
              <p className="text-slate-450 font-medium mb-1">Created</p>
              <p className="text-sm font-semibold text-slate-300">{report.createdDate ? new Date(report.createdDate).toLocaleDateString() : 'N/A'}</p>
            </div>
            <div>
              <p className="text-slate-450 font-medium mb-1">Status</p>
              <Badge variant="success">{report.status ?? 'Active'}</Badge>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Metric Cards */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid gap-6 md:grid-cols-2 lg:grid-cols-4"
      >
        {[
          { icon: CheckCircle2, label: "Completed", value: report.completedTasks, color: "from-green-500 to-emerald-600" },
          { icon: Clock, label: "In Progress", value: inProgressCount, color: "from-blue-500 to-cyan-600" },
          { icon: AlertCircle, label: "Pending", value: pendingCount, color: "from-amber-500 to-orange-600" },
          { icon: Zap, label: "Blocked", value: blockedCount, color: "from-red-500 to-rose-600" },
        ].map(({ icon: Icon, label, value, color }) => (
          <motion.div
            key={label}
            variants={itemVariants}
            whileHover={{ y: -6, scale: 1.02 }}
            className="group relative overflow-hidden rounded-[24px] border border-slate-800 bg-slate-900/80 p-6 shadow-lg backdrop-blur-[20px] transition-all hover:shadow-xl hover:border-slate-700/60"
          >
            <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${color}`} />
            
            <div className="flex items-start justify-between relative z-10">
              <div>
                <p className="text-xs uppercase tracking-[0.15em] text-slate-500 font-bold mb-1">{label}</p>
                <p className="text-4xl font-bold text-slate-100">{value}</p>
              </div>
              <div className={`inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${color} text-white shadow-lg`}>
                <Icon className="h-6 w-6" />
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Key Metrics Grid */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid gap-6 md:grid-cols-2 lg:grid-cols-4"
      >
        {[
          { icon: TrendingUp, label: "Completion Rate", value: `${completionRate}%`, color: "from-green-500 to-emerald-600" },
          { icon: AlertCircle, label: "Review Tasks", value: report.reviewTasks ?? 0, color: "from-blue-500 to-cyan-600" },
          { icon: Calendar, label: "Overdue Tasks", value: report.overdueTasks ?? 0, color: "from-red-500 to-rose-600" },
          { icon: Users, label: "Team Size", value: report.teamMembers ?? 0, color: "from-purple-500 to-indigo-600" },
        ].map(({ icon: Icon, label, value, color }) => (
          <motion.div
            key={label}
            variants={itemVariants}
            whileHover={{ y: -4 }}
            className="rounded-[24px] border border-slate-800 bg-slate-900/80 p-6 shadow-lg backdrop-blur-[20px]"
          >
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs uppercase tracking-[0.15em] text-slate-500 font-bold">{label}</p>
              <div className={`inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${color}/20`}>
                <Icon className={`h-5 w-5 bg-gradient-to-br ${color} bg-clip-text text-transparent`} />
              </div>
            </div>
            <p className="text-3xl font-bold text-slate-100">{value}</p>
          </motion.div>
        ))}
      </motion.div>

      {/* Distribution Section */}
      <motion.div
        variants={itemVariants}
        initial="hidden"
        animate="show"
        className="rounded-[32px] border border-slate-800 bg-slate-900/80 p-8 shadow-lg backdrop-blur-[20px]"
      >
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-slate-100 mb-2">Task Distribution</h2>
          <p className="text-sm text-slate-500">Status breakdown across all tasks</p>
        </div>
        
        <div className="space-y-6">
          {[
            { label: "Completed", value: report.completedTasks, color: "from-green-400 to-emerald-600", icon: CheckCircle2 },
            { label: "In Progress", value: inProgressCount, color: "from-blue-400 to-cyan-600", icon: Clock },
            { label: "Pending", value: pendingCount, color: "from-amber-400 to-orange-600", icon: AlertCircle },
            { label: "Blocked", value: blockedCount, color: "from-red-400 to-rose-600", icon: Zap },
          ].map(({ label, value, color, icon: Icon }) => {
            const percentage = report.totalTasks > 0 ? (value / report.totalTasks) * 100 : 0;
            return (
              <div key={label}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4 text-slate-400" />
                    <span className="text-sm font-semibold text-slate-300">{label}</span>
                  </div>
                  <span className="text-sm font-bold text-slate-100">{value} ({Math.round(percentage)}%)</span>
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-slate-850/50">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    transition={{ duration: 0.8, ease: "easeOut", delay: 0.1 }}
                    className={`h-full rounded-full bg-gradient-to-r ${color} shadow-lg`}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
};
