import { useEffect, useState } from "react";
import { dashboardService } from "@/services";
import type { DashboardStats } from "@/types";
import { Spinner } from "@/components/ui/Spinner";

const StatCard = ({ label, value }: { label: string; value: number }) => (
  <div className="rounded-xl bg-white p-6 shadow-sm">
    <p className="text-sm text-gray-500">{label}</p>
    <p className="mt-1 text-3xl font-bold text-gray-800">{value}</p>
  </div>
);

export const DashboardPage = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardService.getStats().then(setStats).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center pt-20"><Spinner className="h-8 w-8" /></div>;

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-gray-800">Dashboard</h1>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        <StatCard label="Total Projects" value={stats?.totalProjects ?? 0} />
        <StatCard label="Active Projects" value={stats?.activeProjects ?? 0} />
        <StatCard label="Completed Projects" value={stats?.completedProjects ?? 0} />
        <StatCard label="Total Tasks" value={stats?.totalTasks ?? 0} />
        <StatCard label="Completed Tasks" value={stats?.completedTasks ?? 0} />
        <StatCard label="Pending Tasks" value={stats?.pendingTasks ?? 0} />
      </div>
    </div>
  );
};
