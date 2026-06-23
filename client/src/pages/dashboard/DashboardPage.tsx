import { useEffect, useState } from "react";
import { dashboardService } from "@/services";
import type { DashboardStats, EmployeeDashboardStats, AdminDashboardStats } from "@/types";
import { useAuth } from "@/store/auth.store";
import { getSocket } from "@/lib/socket";
import { DashboardAdminView } from "./DashboardAdminView";
import { DashboardEmployeeView } from "./DashboardEmployeeView";
import { DashboardSkeleton } from "./DashboardSkeleton";

function isEmployeeRole(role?: string) {
  return role === "employee" || role === "member";
}

export const DashboardPage = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { user, token } = useAuth();

  const fetchDashboard = async (silent = false) => {
    if (silent) setRefreshing(true);
    else setLoading(true);

    try {
      const data = await dashboardService.getStats();
      setStats(data);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    void fetchDashboard();
  }, []);

  useEffect(() => {
    if (!token) return;

    const socket = getSocket(token);
    socket.connect();

    const handleRefresh = () => {
      void fetchDashboard(true);
    };

    socket.on("dashboard:refresh", handleRefresh);
    return () => {
      socket.off("dashboard:refresh", handleRefresh);
    };
  }, [token]);

  if (loading || !stats) {
    return <DashboardSkeleton />;
  }

  const role = stats.user.role ?? user?.role;
  const displayName = user?.name ?? stats.user.name ?? "Team member";

  if (isEmployeeRole(role)) {
    return (
      <DashboardEmployeeView
        stats={stats as EmployeeDashboardStats}
        displayName={displayName}
        refreshing={refreshing}
      />
    );
  }

  return (
    <DashboardAdminView
      stats={stats as AdminDashboardStats}
      displayName={displayName}
      refreshing={refreshing}
    />
  );
};

export default DashboardPage;
