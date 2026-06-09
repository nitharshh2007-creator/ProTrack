import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { projectService } from "@/services";
import type { Project } from "@/types";
import { Spinner } from "@/components/ui/Spinner";
import { Badge } from "@/components/ui/Badge";

const statusVariant = {
  Planning: "info",
  Active: "success",
  Completed: "default",
} as const;

export const ProjectsPage = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    projectService.getAll().then(setProjects).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center pt-20"><Spinner className="h-8 w-8" /></div>;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Projects</h1>
        <Link to="/projects/new" className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
          New Project
        </Link>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {projects.map((project) => (
          <Link key={project._id} to={`/projects/${project._id}`} className="rounded-xl bg-white p-5 shadow-sm hover:shadow-md transition">
            <div className="mb-2 flex items-center justify-between">
              <span className="font-semibold text-gray-800">{project.title}</span>
              <Badge variant={statusVariant[project.status]}>{project.status}</Badge>
            </div>
            <p className="text-sm text-gray-500 line-clamp-2">{project.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
};
