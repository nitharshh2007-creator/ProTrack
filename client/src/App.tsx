import { BrowserRouter, Routes, Route, Navigate, useParams } from "react-router-dom";
import { AuthProvider } from "@/store/auth.store";
import { NotificationProvider } from "@/store/notification.store";
import { ThemeProvider } from "@/store/theme.store";
import { ProtectedRoute, GuestRoute, AdminRoute } from "@/routes/guards";
import { AppLayout } from "@/components/layout/AppLayout";
import { LoginPage } from "@/pages/auth/LoginPage";
import { RegisterPage } from "@/pages/auth/RegisterPage";
import { ForgotPasswordPage } from "@/pages/auth/ForgotPasswordPage";
import { ResetPasswordPage } from "@/pages/auth/ResetPasswordPage";
import { InviteAcceptancePage } from "@/pages/auth/InviteAcceptancePage";
import { DashboardPage } from "@/pages/dashboard/DashboardPage";
import { ProjectsPage } from "@/pages/projects/ProjectsPage";
import { ProjectDetailPage } from "@/pages/projects/ProjectDetailPage";
import { CreateProjectPage } from "@/pages/projects/CreateProjectPage";
import { TasksPage } from "@/pages/tasks/TasksPage";
import { TaskDetailPage } from "@/pages/tasks/TaskDetailPage";
import { KanbanPage } from "@/pages/kanban/KanbanPage";
import { AnalyticsPage } from "@/pages/analytics/AnalyticsPage";
import { ProjectTimelinePage } from "@/pages/projects/ProjectTimelinePage";
import { TeamPage } from "@/pages/team/TeamPage";
import { ProfilePage } from "@/pages/profile/ProfilePage";
import { SettingsPage } from "@/pages/settings/SettingsPage";
import { NotificationsPage } from "@/pages/NotificationsPage";
import { LandingPage } from "./pages/LandingPage";

const ProjectReportRedirect = () => {
  const { id } = useParams();
  return <Navigate to={`/projects/${id}/analytics`} replace />;
};

const App = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ThemeProvider>
          <NotificationProvider>
            <Routes>
              <Route path="/invite/:token" element={<InviteAcceptancePage />} />

              <Route element={<GuestRoute />}>
                <Route path="/" element={<LandingPage />} />
                <Route path="/signin" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
              </Route>

              <Route element={<ProtectedRoute />}>
                <Route element={<AppLayout />}>
                  <Route path="/dashboard" element={<DashboardPage />} />

                  <Route path="/projects" element={<ProjectsPage />} />
                  <Route path="/projects/new" element={<CreateProjectPage />} />
                  <Route path="/projects/:id" element={<ProjectDetailPage />} />
                  <Route path="/projects/:id/edit" element={<CreateProjectPage />} />
                  <Route path="/projects/:id/kanban" element={<KanbanPage />} />
                  <Route path="/projects/:id/timeline" element={<ProjectTimelinePage />} />
                  <Route path="/projects/:id/report" element={<ProjectReportRedirect />} />
                  <Route path="/projects/:id/analytics" element={<AnalyticsPage />} />

                  <Route path="/tasks" element={<TasksPage />} />
                  <Route path="/tasks/:id" element={<TaskDetailPage />} />

                  <Route path="/kanban" element={<KanbanPage />} />

                  <Route path="/analytics" element={<AnalyticsPage />} />

                  <Route path="/profile" element={<ProfilePage />} />
                  <Route path="/notifications" element={<NotificationsPage />} />
                  <Route path="/settings" element={<SettingsPage />} />

                  <Route element={<AdminRoute />}>
                    <Route path="/team" element={<TeamPage />} />
                  </Route>
                </Route>
              </Route>

              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </NotificationProvider>
        </ThemeProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
