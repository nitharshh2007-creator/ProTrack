import { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Plus, Search, ArrowUpDown, Filter, Layers3 } from "lucide-react";
import { projectService } from "@/services";
import { useAuth } from "@/store/auth.store";
import type { Project, ProjectStatus } from "@/types";
import { Spinner } from "@/components/ui/Spinner";
import { ProjectCard } from "@/pages/projects/ProjectCard";
import { CreateProjectModal } from "@/components/CreateProjectModal";

const listVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

type SortOption = "name" | "created" | "progress" | "status";

const statCards = [
  { label: "Total Projects", color: "border-t-blue-500", key: "all" },
  { label: "Active", color: "border-t-green-500", key: "active" },
  { label: "Planning", color: "border-t-amber-500", key: "planning" },
  { label: "Completed", color: "border-t-purple-500", key: "completed" },
];

export const ProjectsPage = () => {
  const { hasRole } = useAuth();
  const isAdmin = hasRole("admin");

  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | "All">("All");
  const [sortBy, setSortBy] = useState<SortOption>("created");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const loadProjects = () => {
    setLoading(true);
    projectService.getAll().then(setProjects).finally(() => setLoading(false));
  };

  useEffect(() => {
    loadProjects();
  }, []);

  const filteredAndSortedProjects = useMemo(() => {
    let filtered = projects.filter((project) => {
      const matchesSearch = project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        project.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === "All" || project.status === statusFilter;
      return matchesSearch && matchesStatus;
    });

    return filtered.sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.title.localeCompare(b.title);
        case "created":
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case "progress":
          const aProgress = a.totalTasks ? (a.completedTasks || 0) / a.totalTasks : 0;
          const bProgress = b.totalTasks ? (b.completedTasks || 0) / b.totalTasks : 0;
          return bProgress - aProgress;
        case "status":
          return a.status.localeCompare(b.status);
        default:
          return 0;
      }
    });
  }, [projects, searchQuery, statusFilter, sortBy]);

  const statusCounts = useMemo(() => {
    const counts = { all: projects.length, active: 0, planning: 0, completed: 0 };
    projects.forEach((p) => {
      if (p.status === "Active") counts.active++;
      if (p.status === "Planning") counts.planning++;
      if (p.status === "Completed") counts.completed++;
    });
    return counts;
  }, [projects]);

  if (loading)
    return (
      <div className="flex justify-center pt-24">
        <Spinner className="h-7 w-7 text-blue-400" />
      </div>
    );

  return (
    <>
      <div className="space-y-8">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-[24px] border border-gray-200 dark:border-white/10 bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-slate-950/90 dark:via-slate-900/80 dark:to-[#101728] px-8 py-12 shadow-xl"
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(37,99,235,0.15),_transparent_28%),radial-gradient(circle_at_bottom_right,_rgba(124,58,237,0.10),_transparent_35%)] dark:bg-[radial-gradient(circle_at_top_left,_rgba(37,99,235,0.25),_transparent_28%),radial-gradient(circle_at_bottom_right,_rgba(124,58,237,0.18),_transparent_35%)]" />
          <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-2 flex-1 min-w-0">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-600 dark:text-slate-400">Project Management</p>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Projects</h1>
              <p className="text-sm text-slate-700 dark:text-slate-400">Manage your project portfolio with advanced insights</p>
            </div>
            {isAdmin && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => window.location.href = '/projects/new'}
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 hover:bg-blue-700 px-5 py-2.5 text-sm font-semibold text-white transition shadow-lg hover:shadow-xl whitespace-nowrap"
              >
                <Plus className="h-4 w-4 flex-shrink-0" />
                New Project
              </motion.button>
            )}
          </div>
        </motion.div>

        {/* Statistics Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4"
        >
          {statCards.map((card, idx) => {
            const value = card.key === 'all' ? statusCounts.all : 
                         card.key === 'active' ? statusCounts.active :
                         card.key === 'planning' ? statusCounts.planning :
                         statusCounts.completed;
            
              return (
              <motion.div
                key={card.key}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + idx * 0.05 }}
                className={`rounded-2xl border-t-4 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-6 shadow-sm hover:shadow-md transition ${card.color}`}
              >
                <p className="text-xs uppercase tracking-wider font-semibold text-slate-500 dark:text-slate-400 mb-3">{card.label}</p>
                <p className="text-4xl font-bold text-slate-900 dark:text-slate-100 mb-1">{value}</p>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Search & Filter Toolbar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4 shadow-sm hover:shadow-md"
        >
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search Bar */}
              <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-slate-400" />
              <input
                type="text"
                placeholder="Search projects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-lg border-0 bg-white dark:bg-slate-800/50 pl-10 pr-4 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-500 dark:placeholder:text-slate-400 outline-none transition focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-blue-500/30"
              />
            </div>

            {/* Filter Controls */}
            <div className="flex flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-gray-400 dark:text-slate-400" />
                <div className="flex rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 p-1">
                  {([" All", "Planning", "Active", "Completed"] as const).map((status) => (
                    <button
                      key={status}
                      onClick={() => setStatusFilter(status)}
                      className={`rounded px-3 py-1.5 text-xs font-medium transition ${ 
                        statusFilter === status
                          ? "bg-blue-600 text-white shadow-sm"
                          : "text-gray-600 dark:text-slate-400 hover:text-gray-800 dark:hover:text-slate-300"
                      }`}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 outline-none transition focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-blue-500/30"
              >
                <option value="created">Created Date</option>
                <option value="name">Name</option>
                <option value="progress">Progress</option>
                <option value="status">Status</option>
              </select>

              <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-400">
                {filteredAndSortedProjects.length} projects
              </div>
            </div>
          </div>
        </motion.div>

        {/* Projects Grid */}
        {filteredAndSortedProjects.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-12 text-center shadow-sm hover:shadow-md">
            {searchQuery || statusFilter !== " All" ? (
              <div className="space-y-3">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-white dark:bg-slate-800">
                  <Search className="h-6 w-6 text-gray-400 dark:text-slate-400" />
                </div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">No projects found</h3>
                <p className="text-xs text-slate-600 dark:text-slate-400">Try adjusting your filters</p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-blue-500/20">
                  <Layers3 className="h-6 w-6 text-blue-400" />
                </div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">No projects yet</h3>
                <p className="text-xs text-slate-600 dark:text-slate-400">Create your first project to get started</p>
                {isAdmin && (
                  <button
                    onClick={() => window.location.href = '/projects/new'}
                    className="mt-4 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700"
                  >
                    <Plus className="h-3 w-3" />
                    Create project
                  </button>
                )}
              </div>
            )}
          </div>
        ) : (
          <motion.div
            variants={listVariants}
            initial="hidden"
            animate="show"
            className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
          >
            {filteredAndSortedProjects.map((project) => (
              <ProjectCard
                key={project._id}
                project={project}
                onUpdate={loadProjects}
              />
            ))}
          </motion.div>
        )}
      </div>

      {/* Create Project Modal */}
      <CreateProjectModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={loadProjects}
      />
    </>
  );
};
