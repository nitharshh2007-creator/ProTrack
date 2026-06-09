import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { projectService } from "@/services";
import type { Project } from "@/types";
import { Spinner } from "@/components/ui/Spinner";
import { Badge } from "@/components/ui/Badge";

export const ProjectDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) projectService.getById(id).then(setProject).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="flex justify-center pt-20"><Spinner className="h-8 w-8" /></div>;
  if (!project) return <p className="text-gray-500">Project not found.</p>;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">{project.title}</h1>
          <p className="mt-1 text-sm text-gray-500">{project.description}</p>
        </div>
        <Badge variant={project.status === "Active" ? "success" : project.status === "Completed" ? "default" : "info"}>
          {project.status}
        </Badge>
      </div>
      <div className="flex gap-3">
        <Link to={`/projects/${id}/kanban`} className="rounded-md bg-blue-50 px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-100">Kanban</Link>
        <Link to={`/projects/${id}/timeline`} className="rounded-md bg-blue-50 px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-100">Timeline</Link>
        <Link to={`/projects/${id}/report`} className="rounded-md bg-blue-50 px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-100">Report</Link>
      </div>
    </div>
  );
};
