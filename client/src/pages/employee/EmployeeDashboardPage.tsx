import { useEffect } from "react";
import { Activity, CalendarDays, Clock, Trophy, Sparkles } from "lucide-react";
import { useNavigate } from "@tanstack/router";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Spinner } from "@/components/ui/Spinner";
import { useAuth } from "@/store/auth.store";

const assignedTasks = [
  { title: "Refine sprint dashboard", due: "Today", status: "In progress" },
  { title: "Review release notes", due: "Tomorrow", status: "Review" },
  { title: "Update onboarding flow", due: "This week", status: "Planned" },
];

const deadlines = [
  { label: "Orion redesign", date: "Apr 25" },
  { label: "Pulse analytics launch", date: "Apr 28" },
  { label: "Team review sync", date: "Apr 30" },
];

const activities = [
  "Completed QA review for Nova module",
  "Added feedback comments to design system",
  "Synced status with product and ops teams",
];

export const EmployeeDashboardPage = () => {
  const { isAuthenticated, isLoading, hasRole } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        navigate({ to: "/login" });
      } else if (hasRole("admin")) {
        navigate({ to: "/admin/dashboard" });
      }
    }
  }, [hasRole, isAuthenticated, isLoading, navigate]);

  if (isLoading || !isAuthenticated) {
    return (
      <div className="flex min-h-[calc(100vh-160px)] items-center justify-center">
        <Spinner className="h-10 w-10" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="rounded-[32px] border border-white/10 bg-glass p-8 shadow-card backdrop-blur-xl">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-slate-400">Employee hub</p>
            <h1 className="mt-2 text-4xl font-semibold text-slate-50">Hi there, ready to move the needle?</h1>
            <p className="mt-3 max-w-2xl text-sm text-slate-400">
              Your personal task board, deadline timeline, and performance snapshot in one premium workspace.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-[28px] bg-slate-950/80 p-5">
              <p className="text-sm text-slate-400">Today&apos;s focus</p>
              <p className="mt-3 text-3xl font-semibold text-slate-100">4 tasks</p>
            </div>
            <div className="rounded-[28px] bg-gradient-primary/20 p-5 text-slate-100 shadow-glow">
              <p className="text-sm uppercase tracking-[0.24em] text-slate-200">Productivity</p>
              <p className="mt-3 text-3xl font-semibold">+12%</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-6">
          <Card>
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.24em] text-slate-400">Assigned tasks</p>
                <h2 className="mt-2 text-2xl font-semibold text-slate-50">Your sprint work</h2>
              </div>
              <Badge variant="success">4 open</Badge>
            </div>
            <div className="space-y-4">
              {assignedTasks.map((task) => (
                <div key={task.title} className="rounded-3xl border border-white/10 bg-slate-950/70 px-5 py-4 transition hover:border-fuchsia-400/30 hover:bg-slate-900/80">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-semibold text-slate-100">{task.title}</p>
                    <Badge variant={task.status === "In progress" ? "info" : task.status === "Review" ? "warning" : "default"}>{task.status}</Badge>
                  </div>
                  <p className="mt-2 text-sm text-slate-400">Due {task.due}</p>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.24em] text-slate-400">Upcoming deadlines</p>
                <h2 className="mt-2 text-2xl font-semibold text-slate-50">Next milestones</h2>
              </div>
              <Clock className="h-5 w-5 text-slate-300" />
            </div>
            <div className="mt-5 space-y-3">
              {deadlines.map((item) => (
                <div key={item.label} className="flex items-center justify-between rounded-3xl bg-slate-900/80 px-5 py-4 text-sm text-slate-300">
                  <span>{item.label}</span>
                  <span className="font-semibold text-slate-100">{item.date}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="space-y-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.24em] text-slate-400">Performance</p>
                <h2 className="mt-2 text-2xl font-semibold text-slate-50">Weekly score</h2>
              </div>
              <Sparkles className="h-6 w-6 text-fuchsia-400" />
            </div>
            <div className="rounded-[28px] bg-slate-950/80 p-6 text-center">
              <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Focus index</p>
              <p className="mt-4 text-5xl font-semibold text-slate-100">87</p>
              <p className="mt-3 text-sm text-slate-400">Your productivity is 8% above the team average.</p>
            </div>
            <div className="grid gap-3">
              <div className="flex items-center justify-between rounded-3xl border border-white/10 bg-slate-900/80 px-4 py-3 text-sm text-slate-300">
                <span>Collaboration</span>
                <span>92%</span>
              </div>
              <div className="flex items-center justify-between rounded-3xl border border-white/10 bg-slate-900/80 px-4 py-3 text-sm text-slate-300">
                <span>Delivery</span>
                <span>81%</span>
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.24em] text-slate-400">Recent activity</p>
                <h2 className="mt-2 text-2xl font-semibold text-slate-50">Latest updates</h2>
              </div>
              <Badge variant="info">Live</Badge>
            </div>
            <div className="mt-5 space-y-4">
              {activities.map((item) => (
                <div key={item} className="rounded-3xl border border-white/10 bg-slate-950/70 px-5 py-4 text-sm text-slate-300 transition hover:border-violet-400/30 hover:bg-slate-900/80">
                  <div className="flex items-center gap-3">
                    <Activity className="h-4 w-4 text-fuchsia-400" />
                    <p>{item}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
