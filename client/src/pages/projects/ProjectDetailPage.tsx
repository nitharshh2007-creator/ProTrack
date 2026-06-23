import { useEffect, useMemo, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { projectService } from "@/services";
import { useAuth } from "@/store/auth.store";
import type { Project } from "@/types";
import { Spinner } from "@/components/ui/Spinner";
import { Badge } from "@/components/ui/Badge";
import { Toast } from "@/components/ui/Toast";
import api from "@/lib/axios";
import { CalendarDays, Users, Upload, LayoutGrid, KanbanSquare, FileBarChart, CheckCircle2, Clock, Zap } from "lucide-react";

export const ProjectDetailPage = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState<{ message: string; variant: "success" | "error" } | null>(null);

  useEffect(() => {
    if (!id) return;
    projectService
      .getById(id)
      .then((data) => {
        console.log("[ProjectDetailPage] Loaded project", {
          currentUser: user?.id,
          currentUserRole: user?.role,
          projectId: data._id,
          projectOwner: data.createdBy?._id || data.createdBy,
          projectWorkspace: data.workspaceId,
        });
        setProject(data);
      })
      .catch((err) => {
        const status = err?.response?.status;
        console.error("[ProjectDetailPage] Access error", { status, projectId: id, userId: user?.id });

        if (status === 403) {
          setError("You don't have access to this project.");
          try {
            const stored = localStorage.getItem("selectedProjects");
            if (stored) {
              const projects = JSON.parse(stored);
              const filtered = projects.filter((pId: string) => pId !== id);
              if (filtered.length > 0) {
                localStorage.setItem("selectedProjects", JSON.stringify(filtered));
              } else {
                localStorage.removeItem("selectedProjects");
              }
            }
          } catch {
            // Ignore parse errors
          }

          setToast({ message: "Project not found or access denied", variant: "error" });
          setTimeout(() => navigate("/projects"), 2000);
        } else if (status === 404) {
          setError("Project not found.");
        } else {
          setError("Failed to load project.");
        }
      })
      .finally(() => setLoading(false));
  }, [id, user, navigate]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !id) return;
    
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const base64 = event.target?.result as string;
        await api.post(`/projects/${id}/upload-cover`, { image: base64 });
        setProject((prev) => prev ? { ...prev, coverImage: base64 } : null);
      } catch (err) {
        console.error("Upload failed", err);
      }
    };
    reader.readAsDataURL(file);
  };

  if (loading) return <div className="flex justify-center pt-20"><Spinner className="h-8 w-8 text-blue-400" /></div>;
  if (error) return <p className="text-slate-400">{error}</p>;
  if (!project) return null;

  const completedTasks = project.completedTasks ?? 0;
  const totalTasks = project.totalTasks ?? 0;
  const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const memberCount = project.members?.length ?? 0;
  const inProgressTasks = project.inProgressTasks ?? 0;
  const pendingTasks = Math.max(0, totalTasks - completedTasks - inProgressTasks);

  const statCards = [
    {
      icon: Zap,
      label: "Progress",
      value: `${progress}%`,
      accent: "linear-gradient(90deg,#3B82F6,#60A5FA)",
    },
    {
      icon: CheckCircle2,
      label: "Tasks",
      value: `${completedTasks} / ${totalTasks}`,
      accent: "linear-gradient(90deg,#22C55E,#4ADE80)",
    },
    {
      icon: Users,
      label: "Team Members",
      value: project.teamMembers?.length ?? 0,
      accent: "linear-gradient(90deg,#06B6D4,#22D3EE)",
    },
    {
      icon: CalendarDays,
      label: "Due Date",
      value: project.deadline ? new Date(project.deadline).toLocaleDateString('en-US', { day: 'numeric', month: 'short' }) : "N/A",
      accent: "linear-gradient(90deg,#F59E0B,#FBBF24)",
    },
  ];

  const workspaceTabs = [
    {
      icon: LayoutGrid,
      label: "Overview",
      description: "Project status & metrics",
      route: `/projects/${id}`,
    },
    {
      icon: KanbanSquare,
      label: "Kanban",
      description: "Manage tasks visually",
      route: `/projects/${id}/kanban`,
    },
    {
      icon: CalendarDays,
      label: "Timeline",
      description: "Track milestones",
      route: `/projects/${id}/timeline`,
    },
    {
      icon: FileBarChart,
      label: "Reports",
      description: "Analytics & insights",
      route: `/projects/${id}/analytics`,
    },
  ];

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="overflow-hidden rounded-[32px] border border-slate-200/60 bg-white/85 shadow-lg backdrop-blur-[20px]"
      >
        <div className="relative h-72 overflow-hidden sm:h-80">
          {project.coverImage ? (
            <>
              <img src={project.coverImage} alt={project.title} className="h-full w-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-slate-950/40 to-transparent" />
            </>
          ) : (
            <>
              <div className="h-full w-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white">
                <div className="text-7xl font-bold opacity-20">
                  {project.title.charAt(0).toUpperCase()}
                </div>
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-slate-950/40 to-transparent" />
            </>
          )}
          <input
            type="file"
            id="cover-upload"
            className="hidden"
            accept="image/*"
            onChange={handleImageUpload}
          />
          {isAdmin && (
            <label
              htmlFor="cover-upload"
              className="absolute right-4 top-4 inline-flex cursor-pointer items-center gap-2 rounded-2xl bg-blue-500/80 px-3 py-2 text-xs font-semibold text-white backdrop-blur hover:bg-blue-600"
            >
              <Upload className="h-3 w-3" />
              <span>Upload</span>
            </label>
          )}
          <div className="absolute inset-x-0 bottom-0 px-6 pb-6 text-white sm:px-10">
            <p className="text-sm uppercase tracking-[0.3em] text-slate-300">Project overview</p>
            <h1 className="mt-3 text-4xl font-semibold leading-tight">{project.title}</h1>
            <p className="mt-4 max-w-2xl text-sm text-slate-300">{project.description}</p>
            <div className="mt-6 flex flex-wrap items-center gap-3 text-sm text-slate-200">
              <span className="inline-flex items-center gap-2 rounded-3xl bg-white/10 px-3 py-2 backdrop-blur-sm">
                <CalendarDays className="h-4 w-4 text-slate-200" />
                Created {new Date(project.createdAt).toLocaleDateString()}
              </span>
              <span className="inline-flex items-center gap-2 rounded-3xl bg-white/10 px-3 py-2 backdrop-blur-sm">
                <Users className="h-4 w-4 text-slate-200" />
                {project.teamMembers && project.teamMembers.length > 0 ? `${project.teamMembers.length} member${project.teamMembers.length !== 1 ? 's' : ''}` : "No members"}
              </span>
              <Badge variant={project.status === "Active" ? "success" : project.status === "Completed" ? "default" : "info"}>
                {project.status}
              </Badge>
            </div>
          </div>
        </div>

        {/* Project Metrics Cards */}
        <div className="grid gap-4 p-8 sm:grid-cols-2 lg:grid-cols-4 max-w-5xl">
          {statCards.map((card) => {
            const Icon = card.icon;
            return (
              <motion.div
                key={card.label}
                whileHover={{ y: -4 }}
                className="rounded-2xl border border-slate-200/60 bg-white/85 overflow-hidden shadow-lg backdrop-blur-[20px] transition-all hover:shadow-xl p-5"
              >
                {/* Accent Bar */}
                <div
                  className="h-1.5 w-full rounded-full mb-4"
                  style={{ background: card.accent }}
                />
                
                {/* Content */}
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] font-semibold text-slate-600">
                      {card.label}
                    </p>
                    <p className="mt-3 text-3xl font-bold text-slate-900">{card.value}</p>
                  </div>
                  <Icon className="h-5 w-5 text-slate-400" />
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.section>

      {/* Team Members Section */}
      {project.teamMembers && project.teamMembers.length > 0 && (
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.05 }}
          className="space-y-6"
        >
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Assigned Team Members</h2>
            <p className="mt-2 text-sm text-slate-600">{project.teamMembers.length} member{project.teamMembers.length !== 1 ? 's' : ''} assigned to this project</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {project.teamMembers.map((member) => (
              <motion.div
                key={member._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl border border-slate-200/60 bg-white/85 p-5 shadow-lg backdrop-blur-[20px]"
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-white font-semibold">
                    {member.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-900 truncate">{member.name}</p>
                    <p className="text-xs text-slate-500 capitalize">{member.role}</p>
                    <p className="text-xs text-slate-600 truncate mt-1">{member.email}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.section>
      )}

      {/* Workspace Hub Section */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="space-y-6"
      >
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Workspace Hub</h2>
          <p className="mt-2 text-sm text-slate-600">Navigate between project tools and collaboration spaces</p>
        </div>

        {/* Navigation Cards Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {workspaceTabs.map((tab, idx) => {
            const Icon = tab.icon;
            const isActive = window.location.pathname === tab.route;

            return (
              <motion.div
                key={tab.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: idx * 0.05 }}
              >
                <Link to={tab.route}>
                  <motion.div
                    whileHover={{ y: -6, scale: 1.02 }}
                    className={`h-full rounded-2xl p-5 transition-all cursor-pointer ${
                      isActive
                        ? "bg-gradient-to-br from-blue-600 to-blue-500 text-white shadow-lg shadow-blue-500/20"
                        : "bg-white/90 border border-blue-500/8 text-slate-900 shadow-lg hover:shadow-xl hover:border-blue-500/15"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`rounded-xl p-2 ${
                          isActive
                            ? "bg-white/20"
                            : "bg-blue-100"
                        }`}
                      >
                        <Icon
                          className={`h-5 w-5 ${
                            isActive ? "text-white" : "text-blue-600"
                          }`}
                        />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold">{tab.label}</h3>
                        <p
                          className={`mt-1 text-xs ${
                            isActive ? "text-blue-100" : "text-slate-600"
                          }`}
                        >
                          {tab.description}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </motion.section>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.variant}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
};
