import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { CheckSquare, Users, CalendarDays, ArrowRight } from "lucide-react";
import type { Project } from "@/types";
import { Badge } from "@/components/ui/Badge";

const statusVariant = {
  Planning:  "info",
  Active:    "success",
  Completed: "default",
} as const;

interface ProjectCardProps {
  project: Project;
}

export const ProjectCard = ({ project }: ProjectCardProps) => {
  const completedTasks = project.completedTasks ?? 0;
  const totalTasks = project.totalTasks ?? 0;
  const memberCount = project.memberCount ?? project.members?.length ?? 0;
  const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return (
    <motion.article
      whileHover={{ y: -6, scale: 1.02 }}
      className="group project-card shadow-md"
    >
      <Link to={`/projects/${project._id}`} className="block h-full">
        <div className="relative h-44 overflow-hidden bg-slate-100">
          {project.coverImage ? (
            <img src={project.coverImage} alt={project.title} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
          ) : (
            <div className="h-full w-full gradient-placeholder flex items-center justify-center text-white text-3xl font-bold select-none">
              {project.title.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/40 to-transparent" />
          <div className="absolute left-4 bottom-4 rounded-full bg-black/20 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.28em] text-white backdrop-blur-sm">
            {project.status}
          </div>
        </div>
        <div className="space-y-4 p-5 sm:p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold text-slate-900 transition-colors group-hover:text-blue-600">{project.title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-500 line-clamp-2">{project.description}</p>
            </div>
            <Badge variant={statusVariant[project.status]}>{project.status}</Badge>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-3xl border border-slate-100 bg-slate-50/50 p-4">
              <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500">Progress</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">{progress}%</p>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200">
                <div className="h-full rounded-full bg-blue-600" style={{ width: `${progress}%` }} />
              </div>
            </div>
            <div className="rounded-3xl border border-slate-100 bg-slate-50/50 p-4">
              <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500">Team</p>
              <div className="mt-3 flex items-center gap-2 text-sm text-slate-600">
                <Users className="h-4 w-4 text-slate-400" />
                {memberCount} member{memberCount !== 1 ? "s" : ""}
              </div>
              <div className="mt-3 flex items-center gap-2 text-sm text-slate-600">
                <CheckSquare className="h-4 w-4 text-slate-400" />
                {completedTasks}/{totalTasks} done
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 text-sm text-slate-500">
            <span className="inline-flex items-center gap-2 rounded-full border border-slate-100 bg-slate-50/50 px-3 py-1">
              <CalendarDays className="h-4 w-4" />
              {new Date(project.createdAt).toLocaleDateString()}
            </span>
            <span className="inline-flex items-center gap-2 text-blue-600 font-medium group-hover:text-blue-700">
              View details <ArrowRight className="h-4 w-4" />
            </span>
          </div>
        </div>
      </Link>
    </motion.article>
  );
};
