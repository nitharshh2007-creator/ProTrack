import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { dashboardService } from "@/services";
import type { ProjectReport } from "@/types";
import { Spinner } from "@/components/ui/Spinner";

export const ReportPage = () => {
  const { id } = useParams<{ id: string }>();
  const [report, setReport] = useState<ProjectReport | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) dashboardService.getProjectReport(id).then(setReport).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="flex justify-center pt-20"><Spinner className="h-8 w-8" /></div>;
  if (!report) return <p className="text-gray-500">No report found.</p>;

  const stats = [
    { label: "Total Tasks", value: report.totalTasks },
    { label: "Completed", value: report.completedTasks },
    { label: "In Progress", value: report.inProgressTasks },
    { label: "Pending", value: report.pendingTasks },
    { label: "Review", value: report.reviewTasks },
    { label: "Blocked", value: report.blockedTasks },
    { label: "Overdue", value: report.overdueTasks },
  ];

  return (
    <div>
      <h1 className="mb-2 text-2xl font-bold text-gray-800">{report.projectName}</h1>
      <p className="mb-6 text-sm text-gray-500">Project Report</p>
      <div className="mb-6 flex items-center gap-3">
        <div className="flex-1 rounded-full bg-gray-200 h-3">
          <div
            className="h-3 rounded-full bg-blue-500 transition-all"
            style={{ width: `${report.progress}%` }}
          />
        </div>
        <span className="text-sm font-semibold text-gray-700">{report.progress}%</span>
      </div>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map(({ label, value }) => (
          <div key={label} className="rounded-xl bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">{label}</p>
            <p className="mt-1 text-2xl font-bold text-gray-800">{value}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
