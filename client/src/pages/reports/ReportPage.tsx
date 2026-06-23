import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { CheckCircle2, Clock, AlertCircle, Zap, FileText, TrendingUp, Users, Calendar } from "lucide-react";
import { dashboardService } from "@/services";
import type { ProjectReport } from "@/types";
import { Spinner } from "@/components/ui/Spinner";
import { Badge } from "@/components/ui/Badge";

export const ReportPage = () => {
  const { id } = useParams<{ id: string }>();
  const [report, setReport] = useState<ProjectReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);

  useEffect(() => {
    if (id) dashboardService.getProjectReport(id).then(setReport).finally(() => setLoading(false));
  }, [id]);

  const generateProjectHealth = () => {
    if (!report) return { status: "neutral", label: "Analyzing", color: "from-slate-500 to-slate-600" };
    
    const completionRate = report.totalTasks > 0 ? (report.completedTasks / report.totalTasks) * 100 : 0;
    const blockedPercentage = report.totalTasks > 0 ? (report.blockedTasks / report.totalTasks) * 100 : 0;
    const overdueCount = report.overdueTasks ?? 0;

    if (blockedPercentage > 30 || overdueCount > 5) return { status: "critical", label: "Critical", color: "from-red-500 to-rose-600" };
    if (blockedPercentage > 15 || overdueCount > 2) return { status: "at-risk", label: "At Risk", color: "from-amber-500 to-orange-600" };
    return { status: "healthy", label: "Healthy", color: "from-green-500 to-emerald-600" };
  };

  const generateExecutiveSummary = () => {
    if (!report) return "";
    
    const completionRate = report.totalTasks > 0 ? Math.round((report.completedTasks / report.totalTasks) * 100) : 0;
    const status = report.status || "Planning";
    
    let summary = `The project is currently in the ${status} phase with ${completionRate}% completion. `;
    
    if (report.completedTasks > 0) {
      summary += `${report.completedTasks} task${report.completedTasks !== 1 ? 's have' : ' has'} been completed. `;
    } else {
      summary += `No completed tasks have been recorded yet. `;
    }

    if (report.inProgressTasks > 0) {
      summary += `Currently, ${report.inProgressTasks} task${report.inProgressTasks !== 1 ? 's are' : ' is'} in progress. `;
    }

    if (report.blockedTasks > 0) {
      summary += `${report.blockedTasks} task${report.blockedTasks !== 1 ? 's are' : ' is'} blocked and require attention. `;
    }

    return summary || "Project planning is underway.";
  };

  const generateRecommendations = () => {
    if (!report) return [];
    
    const recommendations = [];
    const completionRate = report.totalTasks > 0 ? (report.completedTasks / report.totalTasks) * 100 : 0;

    if (report.totalTasks === 0) {
      recommendations.push("Define project scope and create initial task breakdown.");
      recommendations.push("Establish clear project milestones and deliverables.");
    }

    if (report.blockedTasks > 0) {
      recommendations.push("Address blocked tasks immediately to maintain project momentum.");
      recommendations.push("Identify and resolve blockers preventing task completion.");
    }

    if ((report.overdueTasks ?? 0) > 0) {
      recommendations.push("Review overdue tasks and adjust timeline expectations.");
      recommendations.push("Allocate additional resources to critical path items.");
    }

    if (completionRate < 25 && report.totalTasks > 0) {
      recommendations.push("Accelerate execution phase and increase team capacity if needed.");
    }

    if ((report.teamMembers ?? 0) === 0) {
      recommendations.push("Assign team members to project tasks.");
    }

    if (recommendations.length === 0) {
      recommendations.push("Continue current execution pace and monitor progress.");
      recommendations.push("Schedule regular status reviews with stakeholders.");
    }

    return recommendations;
  };

  const generateRisksAndObservations = () => {
    if (!report) return [];
    
    const observations = [];

    if (report.blockedTasks === 0) {
      observations.push("No blocked tasks detected.");
    }

    if ((report.overdueTasks ?? 0) === 0) {
      observations.push("No overdue tasks.");
    } else {
      observations.push(`${report.overdueTasks} task${report.overdueTasks !== 1 ? 's are' : ' is'} overdue.`);
    }

    if (report.totalTasks === 0) {
      observations.push("Project has not yet started execution.");
    }

    if ((report.teamMembers ?? 0) === 0) {
      observations.push("Team size is currently 0 - no members assigned.");
    }

    if (report.completedTasks === 0 && report.totalTasks > 0) {
      observations.push("Project is in early stages with no completed tasks.");
    }

    return observations;
  };

  const generatePDF = async () => {
    if (!report) return;
    setExporting(true);

    try {
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF();
      
      const health = generateProjectHealth();
      const completionRate = report.totalTasks > 0 ? Math.round((report.completedTasks / report.totalTasks) * 100) : 0;
      const today = new Date().toLocaleDateString();
      
      // Header
      doc.setFontSize(24);
      doc.text("PROTRACK PROJECT REPORT", 20, 20);
      
      doc.setFontSize(11);
      doc.setTextColor(100, 100, 100);
      doc.text(`Generated on ${today}`, 20, 30);
      
      // Project Info
      doc.setFontSize(14);
      doc.setTextColor(0, 0, 0);
      doc.text(`Project: ${report.projectName}`, 20, 45);
      
      doc.setFontSize(10);
      doc.setTextColor(80, 80, 80);
      doc.text(`Status: ${report.status || 'Active'} | Health: ${health.label} | Completion: ${completionRate}%`, 20, 52);
      
      // Executive Summary
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);
      doc.text("EXECUTIVE SUMMARY", 20, 65);
      
      doc.setFontSize(10);
      doc.setTextColor(80, 80, 80);
      const summary = generateExecutiveSummary();
      const summaryLines = doc.splitTextToSize(summary, 170);
      doc.text(summaryLines, 20, 73);
      
      let yPos = 73 + (summaryLines.length * 5) + 10;
      
      // Project Metrics
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);
      doc.text("PROJECT METRICS", 20, yPos);
      yPos += 10;
      
      const metrics = [
        ["Total Tasks", `${report.totalTasks}`],
        ["Completed Tasks", `${report.completedTasks}`],
        ["In Progress", `${report.inProgressTasks ?? 0}`],
        ["Pending Tasks", `${report.pendingTasks ?? 0}`],
        ["Blocked Tasks", `${report.blockedTasks ?? 0}`],
        ["Completion Rate", `${completionRate}%`],
      ];
      
      doc.setFontSize(10);
      metrics.forEach(([label, value]) => {
        doc.text(label, 25, yPos);
        doc.text(value, 150, yPos);
        yPos += 7;
      });
      
      yPos += 5;
      
      // Task Distribution
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);
      doc.text("TASK DISTRIBUTION", 20, yPos);
      yPos += 10;
      
      const distribution = [
        ["Completed", report.completedTasks],
        ["In Progress", report.inProgressTasks ?? 0],
        ["Pending", report.pendingTasks ?? 0],
        ["Blocked", report.blockedTasks ?? 0],
      ];
      
      doc.setFontSize(10);
      distribution.forEach(([label, count]) => {
        const pct = report.totalTasks > 0 ? Math.round((count / report.totalTasks) * 100) : 0;
        doc.text(`${label}`, 25, yPos);
        doc.text(`${count} (${pct}%)`, 150, yPos);
        yPos += 7;
      });
      
      yPos += 5;
      
      // Team Information
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);
      doc.text("TEAM INFORMATION", 20, yPos);
      yPos += 10;
      
      doc.setFontSize(10);
      doc.text(`Total Team Members: ${report.teamMembers ?? 0}`, 25, yPos);
      yPos += 7;
      doc.text(`Review Tasks: ${report.reviewTasks ?? 0}`, 25, yPos);
      yPos += 10;
      
      // Risks & Observations
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);
      doc.text("RISKS & OBSERVATIONS", 20, yPos);
      yPos += 10;
      
      doc.setFontSize(10);
      const observations = generateRisksAndObservations();
      observations.forEach((obs) => {
        doc.text(`• ${obs}`, 25, yPos);
        yPos += 6;
      });
      
      yPos += 5;
      
      // Recommendations
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);
      doc.text("RECOMMENDATIONS", 20, yPos);
      yPos += 10;
      
      doc.setFontSize(10);
      const recommendations = generateRecommendations();
      recommendations.forEach((rec) => {
        const recLines = doc.splitTextToSize(`• ${rec}`, 160);
        doc.text(recLines, 25, yPos);
        yPos += (recLines.length * 5) + 2;
      });
      
      doc.save(`${report.projectName}-Report-${today}.pdf`);
    } catch (error) {
      console.error("PDF generation failed:", error);
    } finally {
      setExporting(false);
      setShowExportMenu(false);
    }
  };

  const generateDOCX = async () => {
    if (!report) return;
    setExporting(true);

    try {
      const { Document, Packer, Paragraph, TextRun, Table, TableCell, TableRow } = await import("docx");
      
      const health = generateProjectHealth();
      const completionRate = report.totalTasks > 0 ? Math.round((report.completedTasks / report.totalTasks) * 100) : 0;
      const today = new Date().toLocaleDateString();
      
      const doc = new Document({
        sections: [{
          children: [
            new Paragraph({
              text: "PROTRACK PROJECT REPORT",
              style: "Heading1",
            }),
            new Paragraph({
              text: `Generated on ${today}`,
              style: "Normal",
            }),
            new Paragraph({ text: "" }),
            new Paragraph({
              text: `Project: ${report.projectName}`,
              style: "Heading2",
            }),
            new Paragraph({
              text: `Status: ${report.status || 'Active'} | Health: ${health.label} | Completion: ${completionRate}%`,
            }),
            new Paragraph({ text: "" }),
            new Paragraph({
              text: "EXECUTIVE SUMMARY",
              style: "Heading2",
            }),
            new Paragraph({
              text: generateExecutiveSummary(),
            }),
            new Paragraph({ text: "" }),
            new Paragraph({
              text: "PROJECT METRICS",
              style: "Heading2",
            }),
            new Table({
              rows: [
                new TableRow({
                  children: [
                    new TableCell({ children: [new Paragraph("Metric")] }),
                    new TableCell({ children: [new Paragraph("Value")] }),
                  ],
                }),
                new TableRow({
                  children: [
                    new TableCell({ children: [new Paragraph("Total Tasks")] }),
                    new TableCell({ children: [new Paragraph(`${report.totalTasks}`)] }),
                  ],
                }),
                new TableRow({
                  children: [
                    new TableCell({ children: [new Paragraph("Completed Tasks")] }),
                    new TableCell({ children: [new Paragraph(`${report.completedTasks}`)] }),
                  ],
                }),
                new TableRow({
                  children: [
                    new TableCell({ children: [new Paragraph("In Progress")] }),
                    new TableCell({ children: [new Paragraph(`${report.inProgressTasks ?? 0}`)] }),
                  ],
                }),
                new TableRow({
                  children: [
                    new TableCell({ children: [new Paragraph("Pending Tasks")] }),
                    new TableCell({ children: [new Paragraph(`${report.pendingTasks ?? 0}`)] }),
                  ],
                }),
                new TableRow({
                  children: [
                    new TableCell({ children: [new Paragraph("Blocked Tasks")] }),
                    new TableCell({ children: [new Paragraph(`${report.blockedTasks ?? 0}`)] }),
                  ],
                }),
                new TableRow({
                  children: [
                    new TableCell({ children: [new Paragraph("Completion Rate")] }),
                    new TableCell({ children: [new Paragraph(`${completionRate}%`)] }),
                  ],
                }),
              ],
            }),
            new Paragraph({ text: "" }),
            new Paragraph({
              text: "RECOMMENDATIONS",
              style: "Heading2",
            }),
            ...generateRecommendations().map(rec => new Paragraph(`• ${rec}`)),
          ],
        }],
      });
      
      const blob = await Packer.toBlob(doc);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${report.projectName}-Report-${today}.docx`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("DOCX generation failed:", error);
    } finally {
      setExporting(false);
      setShowExportMenu(false);
    }
  };

  if (loading) return <div className="flex justify-center pt-24"><Spinner className="h-8 w-8 text-blue-400" /></div>;
  if (!report) return <div className="rounded-2xl border border-slate-200/60 bg-white/85 p-8 text-center backdrop-blur-[20px]"><p className="text-slate-500">No report found.</p></div>;

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
        className="relative overflow-hidden rounded-[32px] border border-white/70 bg-gradient-to-br from-white/90 via-blue-50/40 to-white/80 shadow-lg backdrop-blur-[30px]"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-transparent" />
        
        <div className="relative p-8 md:p-10">
          <div className="mb-8 flex items-start justify-between">
            <div className="flex-1">
              <Link to={`/projects/${id}`} className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-[0.3em] text-blue-600 hover:text-blue-700 mb-4">
                ← Project Analytics
              </Link>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-4xl md:text-5xl font-bold text-slate-950">{report.projectName}</h1>
                <div className={`inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${health.color} text-white shadow-lg`}>
                  <span className="text-xs font-bold">{health.label === "Healthy" ? "✓" : health.label === "At Risk" ? "!" : "!"}</span>
                </div>
              </div>
              <p className="text-slate-500 text-sm flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Project Analytics & Reports
              </p>
            </div>
            <div className="relative">
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-700">Overall Progress</span>
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">{completionRate}%</span>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-slate-200/50 backdrop-blur-sm">
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
              <p className="text-slate-500 font-medium mb-1">Total Tasks</p>
              <p className="text-2xl font-bold text-slate-900">{report.totalTasks}</p>
            </div>
            <div>
              <p className="text-slate-500 font-medium mb-1">Team Members</p>
              <p className="text-2xl font-bold text-slate-900">{report.teamMembers ?? 0}</p>
            </div>
            <div>
              <p className="text-slate-500 font-medium mb-1">Created</p>
              <p className="text-sm font-semibold text-slate-700">{report.createdDate ? new Date(report.createdDate).toLocaleDateString() : 'N/A'}</p>
            </div>
            <div>
              <p className="text-slate-500 font-medium mb-1">Status</p>
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
            className="group relative overflow-hidden rounded-[24px] border border-white/70 bg-gradient-to-br from-white/90 to-white/70 p-6 shadow-lg backdrop-blur-[20px] transition-all hover:shadow-xl"
          >
            <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${color}`} />
            
            <div className="flex items-start justify-between relative z-10">
              <div>
                <p className="text-xs uppercase tracking-[0.15em] text-slate-500 font-bold mb-1">{label}</p>
                <p className="text-4xl font-bold text-slate-900">{value}</p>
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
            className="rounded-[24px] border border-white/70 bg-gradient-to-br from-white/90 to-white/70 p-6 shadow-lg backdrop-blur-[20px]"
          >
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs uppercase tracking-[0.15em] text-slate-500 font-bold">{label}</p>
              <div className={`inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${color}/20`}>
                <Icon className={`h-5 w-5 bg-gradient-to-br ${color} bg-clip-text text-transparent`} />
              </div>
            </div>
            <p className="text-3xl font-bold text-slate-900">{value}</p>
          </motion.div>
        ))}
      </motion.div>

      {/* Distribution Section */}
      <motion.div
        variants={itemVariants}
        initial="hidden"
        animate="show"
        className="rounded-[32px] border border-white/70 bg-gradient-to-br from-white/90 to-white/70 p-8 shadow-lg backdrop-blur-[20px]"
      >
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Task Distribution</h2>
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
                    <span className="text-sm font-semibold text-slate-700">{label}</span>
                  </div>
                  <span className="text-sm font-bold text-slate-900">{value} ({Math.round(percentage)}%)</span>
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-slate-200/50">
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
