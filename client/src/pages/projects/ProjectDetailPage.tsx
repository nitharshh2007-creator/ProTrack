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
import { CalendarDays, Users, Sparkles, Upload } from "lucide-react";

const tabs = [
  { id: "overview", label: "Overview", route: "/projects" },
  { id: "kanban", label: "Kanban", route: "kanban" },
  { id: "timeline", label: "Timeline", route: "timeline" },
  { id: "reports", label: "Reports", route: "report" },
];

export const ProjectDetailPage = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
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
          // Clean up stale project IDs from localStorage
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

          // Show toast and redirect
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

  const imageUrl = useMemo(
    () => project?.coverImage ?? "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1200&q=80",
    [project]
  );

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

  return (
    <div className="space-y-8">
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="overflow-hidden rounded-[32px] border border-white/10 bg-white/5 shadow-card"
      >
        <div className="relative h-72 overflow-hidden sm:h-80">
          <img src={imageUrl} alt={project.title} className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-slate-950/40 to-transparent" />
          <input
            type="file"
            id="cover-upload"
            className="hidden"
            accept="image/*"
            onChange={handleImageUpload}
          />
          <label
            htmlFor="cover-upload"
            className="absolute right-4 top-4 inline-flex cursor-pointer items-center gap-2 rounded-2xl bg-blue-500/80 px-3 py-2 text-xs font-semibold text-white backdrop-blur hover:bg-blue-600"
          >
            <Upload className="h-3 w-3" />
            <span>Upload</span>
          </label>
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
                {memberCount} members
              </span>
              <Badge variant={project.status === "Active" ? "success" : project.status === "Completed" ? "default" : "info"}>
                {project.status}
              </Badge>
            </div>
          </div>
        </div>
        <div className="grid gap-4 p-6 sm:grid-cols-3 sm:p-8">
          <div className="rounded-3xl border border-white/10 bg-slate-950/80 p-5 text-white">
            <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Progress</p>
            <p className="mt-3 text-3xl font-semibold">{progress}%</p>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
              <div className="h-full rounded-full gradient-primary" style={{ width: `${progress}%` }} />
            </div>
          </div>
          <div className="rounded-3xl border border-white/10 bg-slate-950/80 p-5 text-white">
            <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Tasks</p>
            <p className="mt-3 text-3xl font-semibold">{completedTasks}/{totalTasks}</p>
            <p className="mt-2 text-sm text-slate-400">Completed / total</p>
          </div>
          <div className="rounded-3xl border border-white/10 bg-slate-950/80 p-5 text-white">
            <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Priority</p>
            <p className="mt-3 text-3xl font-semibold">{project.priority}</p>
            <p className="mt-2 text-sm text-slate-400">Project priority level</p>
          </div>
        </div>
      </motion.section>

      <section className="rounded-[32px] border border-white/10 bg-white/5 p-6 shadow-card backdrop-blur-xl">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Workspace tabs</p>
            <h2 className="mt-2 text-2xl font-semibold text-white">Project navigation</h2>
          </div>
          <button
            type="button"
            onClick={() => navigate(`/projects/${id}/kanban`)}
            className="inline-flex items-center gap-2 rounded-2xl gradient-primary px-4 py-2 text-sm font-semibold text-white shadow-lg hover:opacity-95"
          >
            <Sparkles className="h-4 w-4" /> Open Kanban
          </button>
        </div>

        <div className="grid gap-3 sm:grid-cols-4">
          {tabs.map((tab) => (
            <Link
              key={tab.id}
              to={tab.id === "overview" ? `/projects/${id}` : `/projects/${id}/${tab.route}`}
              className="rounded-3xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm font-semibold text-slate-200 transition hover:border-blue-400/40 hover:bg-slate-900"
            >
              {tab.label}
            </Link>
          ))}
        </div>
      </section>
      {toast && (
        <Toast
          message={toast.message}
          variant={toast.variant}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
};
