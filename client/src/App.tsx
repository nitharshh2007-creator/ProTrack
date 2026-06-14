import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/store/auth.store";
import { ProtectedRoute, GuestRoute, AdminRoute } from "@/routes/guards";
import { AppLayout } from "@/components/layout/AppLayout";
import { LoginPage } from "@/pages/auth/LoginPage";
import { RegisterPage } from "@/pages/auth/RegisterPage";
import { AcceptInvitePage } from "@/pages/auth/AcceptInvitePage";
import { DashboardPage } from "@/pages/dashboard/DashboardPage";
import { ProjectsPage } from "@/pages/projects/ProjectsPage";
import { ProjectDetailPage } from "@/pages/projects/ProjectDetailPage";
import { CreateProjectPage } from "@/pages/projects/CreateProjectPage";
import { TasksPage } from "@/pages/tasks/TasksPage";
import { TaskDetailPage } from "@/pages/tasks/TaskDetailPage";
import { KanbanPage } from "@/pages/kanban/KanbanPage";
import { GanttPage } from "@/pages/gantt/GanttPage";
import { ReportPage } from "@/pages/reports/ReportPage";
import { AnalyticsPage } from "@/pages/analytics/AnalyticsPage";
import { ProjectTimelinePage } from "@/pages/projects/ProjectTimelinePage";
import { AdminEmployeesPage } from "@/pages/admin/AdminEmployeesPage";

const App = () => (
  <BrowserRouter>
    <AuthProvider>
      <Routes>
        {/* ── Public: invite acceptance (no auth required) ── */}
        <Route path="/invite/:token" element={<AcceptInvitePage />} />

        {/* ── Guest only ── */}
        <Route element={<GuestRoute />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
        </Route>

        {/* ── Protected (any authenticated user) ── */}
        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route path="/dashboard" element={<DashboardPage />} />

            {/* Projects */}
            <Route path="/projects" element={<ProjectsPage />} />
            <Route path="/projects/new" element={<CreateProjectPage />} />
            <Route path="/projects/:id" element={<ProjectDetailPage />} />
            <Route path="/projects/:id/kanban" element={<KanbanPage />} />
            <Route path="/projects/:id/timeline" element={<ProjectTimelinePage />} />
            <Route path="/projects/:id/report" element={<ReportPage />} />

            {/* Tasks */}
            <Route path="/tasks" element={<TasksPage />} />
            <Route path="/tasks/:id" element={<TaskDetailPage />} />

            {/* Kanban (global) */}
            <Route path="/kanban" element={<KanbanPage />} />

            {/* Analytics — admin only */}
            <Route path="/analytics" element={<AnalyticsPage />} />

            {/* Team / Employees — admin only */}
            <Route element={<AdminRoute />}>
              <Route path="/team" element={<AdminEmployeesPage />} />
            </Route>
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </AuthProvider>
  </BrowserRouter>
);

export default App;
