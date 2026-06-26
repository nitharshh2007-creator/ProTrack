import { jsPDF } from "jspdf";
import * as XLSX from "xlsx";
import type { AnalyticsDataAdmin } from "@/services/analytics.service";

// Function to generate real, dynamic insights based on backend data
export function generateDynamicInsights(data: AnalyticsDataAdmin) {
  const insights: string[] = [];
  const observations: string[] = [];
  const recommendations: string[] = [];

  // Workload Insights
  if (data.workloadDistribution && data.workloadDistribution.length > 0) {
    const sortedWorkload = [...data.workloadDistribution].sort((a, b) => b.taskCount - a.taskCount);
    const topEmployee = sortedWorkload[0];
    const totalWorkloadTasks = data.workloadDistribution.reduce((acc, curr) => acc + curr.taskCount, 0);

    if (topEmployee && totalWorkloadTasks > 0) {
      const pct = Math.round((topEmployee.taskCount / totalWorkloadTasks) * 100);
      if (pct > 40 && data.workloadDistribution.length > 1) {
        insights.push(`Development team workload is heavily concentrated on ${topEmployee.employeeName}, holding ${pct}% of all assigned tasks (${topEmployee.taskCount} tasks).`);
        recommendations.push(`Balance the task allocation in the workspace to relieve ${topEmployee.employeeName} and mitigate project bottlenecks.`);
      } else {
        insights.push(`Task allocation is led by ${topEmployee.employeeName} with ${topEmployee.taskCount} active tasks.`);
      }
    }
  }

  // Deadlines & Overdue Tasks
  if (data.overdueTasks > 0) {
    insights.push(`There are currently ${data.overdueTasks} overdue tasks in the workspace.`);
    observations.push(`Overdue work represents ${Math.round((data.overdueTasks / (data.totalTasks || 1)) * 100)}% of total system workload.`);
    recommendations.push("Conduct a sync meeting to review overdue deliverables and adjust timelines or resources.");
  } else {
    insights.push("Great job! There are currently no overdue tasks in the workspace.");
  }

  // Upcoming deadlines in next 7 days
  if (data.upcomingDeadlines && data.upcomingDeadlines.length > 0) {
    const now = new Date();
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const nearDeadlines = data.upcomingDeadlines.filter(d => {
      const dueDate = new Date(d.dueDate);
      return dueDate >= now && dueDate <= sevenDaysFromNow;
    });

    if (nearDeadlines.length > 0) {
      insights.push(`${nearDeadlines.length} tasks are approaching their deadlines within the next 7 days.`);
      recommendations.push("Prioritize tasks with approaching deadlines in the upcoming daily check-ins.");
    }
  }

  // Blocked Tasks Ratio
  const blockedEntry = data.statusDistribution?.find(s => s.status === "Blocked");
  if (blockedEntry && blockedEntry.count > 0) {
    const total = data.totalTasks || 1;
    const blockedPct = Math.round((blockedEntry.count / total) * 100);
    insights.push(`Blocked tasks represent ${blockedPct}% of all active work (${blockedEntry.count} tasks).`);
    if (blockedPct > 10) {
      observations.push("Higher volume of blocked items indicates dependencies or requirements challenges.");
      recommendations.push("Identify blockers in the next standup and assign owners to resolve them.");
    }
  }

  // Project Progress Standout
  if (data.projectProgressComparison && data.projectProgressComparison.length > 0) {
    const sortedProjects = [...data.projectProgressComparison].sort((a, b) => b.completionPercent - a.completionPercent);
    const topProject = sortedProjects[0];
    if (topProject && topProject.completionPercent > 0) {
      insights.push(`Project "${topProject.projectName}" has the highest completion percentage at ${topProject.completionPercent}%.`);
    }

    const lowProject = sortedProjects[sortedProjects.length - 1];
    if (lowProject && lowProject.completionPercent < 30 && sortedProjects.length > 1) {
      observations.push(`Project "${lowProject.projectName}" is lagging at ${lowProject.completionPercent}% completion rate.`);
      recommendations.push(`Review constraints and resource requirements for "${lowProject.projectName}" to speed up deliveries.`);
    }
  }

  // Completion Velocity Trend
  if (data.completionTrend && data.completionTrend.length > 1) {
    const latest = data.completionTrend[data.completionTrend.length - 1]?.count ?? 0;
    const previous = data.completionTrend[data.completionTrend.length - 2]?.count ?? 0;
    if (latest > previous && previous > 0) {
      const increasePct = Math.round(((latest - previous) / previous) * 100);
      insights.push(`Overall task completion pace increased by ${increasePct}% compared to the previous logged period.`);
    } else if (latest < previous && previous > 0) {
      const decreasePct = Math.round(((previous - latest) / previous) * 100);
      observations.push(`Task closeout pace decreased by ${decreasePct}% compared to the previous period.`);
    }
  }

  // Fallback defaults if list is too small
  if (insights.length === 0) {
    insights.push("Overall workspace productivity is stable, and tasks are moving through the stages normally.");
  }
  if (observations.length === 0) {
    observations.push("Status, priority, and workload distributions are within normal operational thresholds.");
  }
  if (recommendations.length === 0) {
    recommendations.push("Continue monitoring active projects and update deliverables regularly to maintain team alignment.");
  }

  return { insights, observations, recommendations };
}

// 1. CSV EXPORT
export function exportToCSV(data: AnalyticsDataAdmin, projectTitle: string) {
  const { insights, observations, recommendations } = generateDynamicInsights(data);

  let csvContent = "";
  
  // Title / Metadata
  csvContent += `ProTrack Workspace Analytics Report - ${projectTitle}\n`;
  csvContent += `Generated Date & Time: ${new Date().toLocaleString()}\n\n`;

  // Workspace Summary Section
  csvContent += "WORKSPACE SUMMARY METRICS\n";
  csvContent += "Metric,Value\n";
  csvContent += `Total Projects,${data.totalProjects}\n`;
  csvContent += `Active Projects,${data.activeProjects}\n`;
  csvContent += `Completed Projects,${data.completedProjects}\n`;
  csvContent += `Total Tasks,${data.totalTasks}\n`;
  csvContent += `Completed Tasks,${data.completedTasks}\n`;
  csvContent += `Overdue Tasks,${data.overdueTasks}\n`;
  csvContent += `Completion Rate,${data.completionRate}%\n\n`;

  // Status Distribution
  csvContent += "TASK STATUS DISTRIBUTION\n";
  csvContent += "Status,Task Count\n";
  data.statusDistribution.forEach(s => {
    csvContent += `"${s.status}",${s.count}\n`;
  });
  csvContent += "\n";

  // Team Workload
  csvContent += "TEAM WORKLOAD DISTRIBUTION\n";
  csvContent += "Team Member,Task Count\n";
  data.workloadDistribution.forEach(w => {
    csvContent += `"${w.employeeName}",${w.taskCount}\n`;
  });
  csvContent += "\n";

  // Project Progress
  csvContent += "PROJECT PROGRESS SUMMARY\n";
  csvContent += "Project Name,Completion %\n";
  data.projectProgressComparison.forEach(p => {
    csvContent += `"${p.projectName}",${p.completionPercent}%\n`;
  });
  csvContent += "\n";

  // Dynamic Insights
  csvContent += "DYNAMIC WORKSPACE INSIGHTS\n";
  insights.forEach(ins => {
    csvContent += `"- ${ins.replace(/"/g, '""')}"\n`;
  });
  csvContent += "\n";

  csvContent += "PERFORMANCE OBSERVATIONS\n";
  observations.forEach(obs => {
    csvContent += `"- ${obs.replace(/"/g, '""')}"\n`;
  });
  csvContent += "\n";

  csvContent += "RECOMMENDATIONS\n";
  recommendations.forEach(rec => {
    csvContent += `"- ${rec.replace(/"/g, '""')}"\n`;
  });

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `ProTrack_Analytics_${projectTitle.replace(/\s+/g, "_")}_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// 2. EXCEL EXPORT (.xlsx) using SheetJS
export function exportToExcel(data: AnalyticsDataAdmin, projectTitle: string) {
  const { insights, observations, recommendations } = generateDynamicInsights(data);
  const wb = XLSX.utils.book_new();

  // Sheet 1: Dashboard Summary
  const summaryData = [
    ["ProTrack Workspace Analytics Report"],
    ["Project/Context", projectTitle],
    ["Generated At", new Date().toLocaleString()],
    [],
    ["WORKSPACE METRICS SUMMARY"],
    ["Metric", "Value"],
    ["Total Projects", data.totalProjects],
    ["Active Projects", data.activeProjects],
    ["Completed Projects", data.completedProjects],
    ["Total Tasks", data.totalTasks],
    ["Completed Tasks", data.completedTasks],
    ["Overdue Tasks", data.overdueTasks],
    ["Completion Rate", `${data.completionRate}%`],
    [],
    ["DYNAMIC WORKSPACE INSIGHTS"],
    ...insights.map(i => [i]),
    [],
    ["PERFORMANCE OBSERVATIONS"],
    ...observations.map(o => [o]),
    [],
    ["RECOMMENDATIONS"],
    ...recommendations.map(r => [r])
  ];
  const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(wb, summarySheet, "Workspace Summary");

  // Sheet 2: Projects & Workload Details
  const detailData = [
    ["PROJECT PROGRESSION"],
    ["Project Name", "Completion %"],
    ...data.projectProgressComparison.map(p => [p.projectName, p.completionPercent]),
    [],
    ["TEAM WORKLOAD BALANCE"],
    ["Employee Name", "Tasks Count"],
    ...data.workloadDistribution.map(w => [w.employeeName, w.taskCount]),
    [],
    ["TASK STATUS DISTRIBUTION"],
    ["Status", "Task Count"],
    ...data.statusDistribution.map(s => [s.status, s.count]),
    [],
    ["TASK PRIORITY BALANCE"],
    ["Priority", "Task Count"],
    ...data.priorityDistribution.map(p => [p.priority, p.count])
  ];
  const detailSheet = XLSX.utils.aoa_to_sheet(detailData);
  XLSX.utils.book_append_sheet(wb, detailSheet, "Workspace Analytics Details");

  // Save Workbook
  XLSX.writeFile(wb, `ProTrack_Analytics_${projectTitle.replace(/\s+/g, "_")}_${new Date().toISOString().slice(0, 10)}.xlsx`);
}

// 3. PDF EXPORT using jsPDF
export function exportToPDF(data: AnalyticsDataAdmin, projectTitle: string) {
  const { insights, observations, recommendations } = generateDynamicInsights(data);
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // Theme styling colors
  const primaryColor = [37, 99, 235]; // #2563eb Blue
  const darkNavy = [11, 19, 38]; // #0b1326 Deep Navy
  const secondaryColor = [100, 116, 139]; // Slate

  // Header / Branding
  doc.setFillColor(darkNavy[0], darkNavy[1], darkNavy[2]);
  doc.rect(0, 0, pageWidth, 42, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(22);
  doc.text("ProTrack Analytics Hub", 14, 18);
  
  doc.setFont("Helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(180, 197, 255);
  doc.text(`Scope: ${projectTitle} | Generated: ${new Date().toLocaleString()}`, 14, 27);
  doc.text("CONFIDENTIAL - FOR ADMIN REVIEW ONLY", 14, 34);

  // Content Start Y
  let y = 52;

  // Function to draw section headers
  const drawSectionHeader = (title: string) => {
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text(title, 14, y);
    doc.setDrawColor(226, 232, 240); // light gray border line
    doc.line(14, y + 2, pageWidth - 14, y + 2);
    y += 10;
  };

  // Section 1: Summary Metrics Card
  drawSectionHeader("WORKSPACE SUMMARY METRICS");
  
  // Drawing clean enterprise cards
  const cardWidth = 58;
  const cardHeight = 22;
  const cards = [
    { label: "Total Projects", val: String(data.totalProjects) },
    { label: "Active Projects", val: String(data.activeProjects) },
    { label: "Completed Projects", val: String(data.completedProjects) },
    { label: "Total Tasks", val: String(data.totalTasks) },
    { label: "Completed Tasks", val: String(data.completedTasks) },
    { label: "Completion Rate", val: `${data.completionRate}%` }
  ];

  let cardX = 14;
  cards.forEach((card, idx) => {
    // Row break
    if (idx === 3) {
      cardX = 14;
      y += 28;
    }

    doc.setFillColor(248, 250, 252); // light slate background card
    doc.rect(cardX, y, cardWidth, cardHeight, "F");
    doc.setDrawColor(226, 232, 240);
    doc.rect(cardX, y, cardWidth, cardHeight, "S");

    doc.setFont("Helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
    doc.text(card.label.toUpperCase(), cardX + 4, y + 6);

    doc.setFont("Helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(darkNavy[0], darkNavy[1], darkNavy[2]);
    doc.text(card.val, cardX + 4, y + 16);

    cardX += cardWidth + 4;
  });

  y += cardHeight + 12;

  // Section 2: Dynamic Insights & Observations
  drawSectionHeader("INTELLIGENT INSIGHTS & PERFORMANCE OBSERVATIONS");
  doc.setFont("Helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(51, 65, 85); // dark charcoal

  const allObservations = [...insights, ...observations];
  allObservations.forEach(obs => {
    const textLines = doc.splitTextToSize(`• ${obs}`, pageWidth - 28);
    textLines.forEach((line: string) => {
      if (y > 275) { doc.addPage(); y = 20; }
      doc.text(line, 14, y);
      y += 6;
    });
  });

  y += 6;

  // Section 3: Priority & Status tables side-by-side or standard
  if (y > 220) { doc.addPage(); y = 20; }
  drawSectionHeader("WORKSPACE DATA DETAIL");

  // Project Progress Table
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(darkNavy[0], darkNavy[1], darkNavy[2]);
  doc.text("Project Progress Summary", 14, y);
  y += 6;

  // Header row
  doc.setFillColor(241, 245, 249);
  doc.rect(14, y, pageWidth - 28, 7, "F");
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(51, 65, 85);
  doc.text("Project Name", 18, y + 5);
  doc.text("Completion Rate (%)", pageWidth - 60, y + 5);
  y += 7;

  doc.setFont("Helvetica", "normal");
  doc.setFontSize(9);
  data.projectProgressComparison.forEach(p => {
    if (y > 275) { doc.addPage(); y = 20; }
    doc.text(p.projectName, 18, y + 5);
    doc.text(`${p.completionPercent}%`, pageWidth - 60, y + 5);
    doc.setDrawColor(241, 245, 249);
    doc.line(14, y + 7, pageWidth - 14, y + 7);
    y += 8;
  });

  y += 6;

  // Team Workload Summary Table
  if (y > 220) { doc.addPage(); y = 20; }
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(darkNavy[0], darkNavy[1], darkNavy[2]);
  doc.text("Team Workload Balance", 14, y);
  y += 6;

  // Header row
  doc.setFillColor(241, 245, 249);
  doc.rect(14, y, pageWidth - 28, 7, "F");
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(51, 65, 85);
  doc.text("Employee Name", 18, y + 5);
  doc.text("Assigned Tasks Count", pageWidth - 60, y + 5);
  y += 7;

  doc.setFont("Helvetica", "normal");
  doc.setFontSize(9);
  data.workloadDistribution.forEach(w => {
    if (y > 275) { doc.addPage(); y = 20; }
    doc.text(w.employeeName, 18, y + 5);
    doc.text(String(w.taskCount), pageWidth - 60, y + 5);
    doc.setDrawColor(241, 245, 249);
    doc.line(14, y + 7, pageWidth - 14, y + 7);
    y += 8;
  });

  y += 8;

  // Section 4: Recommendations
  if (y > 220) { doc.addPage(); y = 20; }
  drawSectionHeader("ACTIONABLE RECOMMENDATIONS");
  doc.setFont("Helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(51, 65, 85);

  recommendations.forEach(rec => {
    const textLines = doc.splitTextToSize(`• ${rec}`, pageWidth - 28);
    textLines.forEach((line: string) => {
      if (y > 275) { doc.addPage(); y = 20; }
      doc.text(line, 14, y);
      y += 6;
    });
  });

  // Save Document
  doc.save(`ProTrack_Analytics_Report_${projectTitle.replace(/\s+/g, "_")}_${new Date().toISOString().slice(0, 10)}.pdf`);
}
