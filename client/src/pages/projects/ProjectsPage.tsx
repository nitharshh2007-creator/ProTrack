import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Plus } from "lucide-react";
import { projectService } from "@/services";
import { useAuth } from "@/store/auth.store";
import type { Project } from "@/types";
import { Spinner } from "@/components/ui/Spinner";
import { ProjectCard } from "@/pages/projects/ProjectCard";

const listVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};

export const ProjectsPage = () => {
  const { hasRole } = useAuth();
  const navigate = useNavigate();
  const isAdmin = hasRole("admin");

  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    projectService.getAll().then(setProjects).finally(() => setLoading(false));
  }, []);

  if (loading)
    return (
      <div className="flex justify-center pt-24">
        <Spinner className="h-7 w-7 text-blue-400" />
      </div>
    );

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div className="rounded-[32px] border border-slate-200 bg-white/85 p-8 shadow-lg backdrop-blur-[20px]">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] font-bold text-blue-600">Projects</p>
            <h1 className="mt-2 text-3xl font-semibold text-slate-950">All projects</h1>
            <p className="mt-2 text-sm text-slate-500">A polished collection of your current workspaces and active initiatives.</p>
          </div>
          {isAdmin && (
            <motion.button
              whileHover={{ y: -1, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate("/projects/new")}
              className="inline-flex items-center gap-2 rounded-2xl gradient-primary px-4 py-3 text-sm font-semibold text-white shadow-lg glow-blue"
            >
              <Plus className="h-4 w-4" /> New project
            </motion.button>
          )}
        </div>
      </div>

      {projects.length === 0 ? (
        <div className="glass-card rounded-[32px] p-12 text-center">
          <p className="text-sm text-slate-400">No projects have been created yet.</p>
        </div>
      ) : (
        <motion.div variants={listVariants} initial="hidden" animate="show" className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {projects.map((project) => (
            <ProjectCard key={project._id} project={project} />
          ))}
        </motion.div>
      )}
    </div>
  );
};
