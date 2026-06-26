import { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Plus, Search, Layers3, FolderKanban, Activity, Compass, CheckCircle2, Grid, List, Sparkles } from "lucide-react";
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

const statCardsConfig = [
  { label: "Total Projects", key: "all", icon: FolderKanban, color: "text-blue-400", bgGlow: "rgba(59, 130, 246, 0.15)", trend: "+12% growth", trendUp: true },
  { label: "Active", key: "active", icon: Activity, color: "text-emerald-400", bgGlow: "rgba(16, 185, 129, 0.15)", trend: "High velocity", trendUp: true },
  { label: "Planning", key: "planning", icon: Compass, color: "text-amber-400", bgGlow: "rgba(245, 158, 11, 0.15)", trend: "Setup phase", trendUp: null },
  { label: "Completed", key: "completed", icon: CheckCircle2, color: "text-violet-400", bgGlow: "rgba(139, 92, 246, 0.15)", trend: "100% target", trendUp: true },
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
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

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
      <div className="space-y-6">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-[24px] border border-white/5 bg-gradient-to-br from-slate-950 via-[#0B0F19] to-slate-950 p-8 md:p-10 shadow-[0_24px_50px_rgba(0,0,0,0.6)]"
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(59,130,246,0.12),_transparent_45%),radial-gradient(circle_at_bottom_left,_rgba(147,51,234,0.08),_transparent_45%)]" />
          <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-2 flex-1 min-w-0">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-blue-400 border border-blue-500/20">
                <Sparkles className="h-3 w-3 text-blue-400" />
                Portfolio Manager
              </div>
              <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight leading-none">Projects</h1>
              <p className="text-sm text-slate-400 max-w-xl leading-relaxed">
                Manage your project portfolio with advanced insights, team allocations, and real-time health metrics.
              </p>
            </div>
            {isAdmin && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setIsCreateModalOpen(true)}
                className="premium-button-primary z-10 shrink-0 self-start sm:self-center"
              >
                <Plus className="h-4 w-4" />
                New Project
              </motion.button>
            )}
          </div>
        </motion.div>

        {/* Statistics Cards */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4"
        >
          {statCardsConfig.map((card, idx) => {
            const value = card.key === 'all' ? statusCounts.all : 
                         card.key === 'active' ? statusCounts.active :
                         card.key === 'planning' ? statusCounts.planning :
                         statusCounts.completed;
            const IconComponent = card.icon;
            
            return (
              <motion.div
                key={card.key}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + idx * 0.05 }}
                className="premium-card relative overflow-hidden group p-5 border border-white/5 bg-gradient-to-b from-[#131B2E] to-[#0E1424] rounded-2xl shadow-xl"
              >
                {/* Glow effect on hover */}
                <div 
                  className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-500 pointer-events-none"
                  style={{ backgroundColor: card.bgGlow }}
                />
                
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400">{card.label}</p>
                    <p className="text-3xl font-extrabold text-white tracking-tight">{value}</p>
                  </div>
                  <div className={`p-2 rounded-lg bg-white/5 border border-white/10 group-hover:scale-105 transition-transform duration-300 ${card.color}`}>
                    <IconComponent className="h-4.5 w-4.5" />
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-[10px]">
                  <span className="text-slate-400 font-medium">{card.trend}</span>
                  {card.trendUp !== null && (
                    <span className={`font-bold ${card.trendUp ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {card.trendUp ? '↑ active' : '↓ queue'}
                    </span>
                  )}
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Search & Filter Toolbar */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="premium-card p-4 bg-[#131B2E]/80 backdrop-blur-md border border-white/5 rounded-2xl"
        >
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
            {/* Search Bar */}
            <div className="relative w-full lg:flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <input
                type="text"
                placeholder="Search portfolio projects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="premium-input pl-10 pr-4 py-2 bg-[#0B0F19] border border-white/5 focus:border-blue-500 rounded-xl transition-all text-sm"
              />
            </div>

            {/* Filter Controls */}
            <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto justify-between lg:justify-end">
              <div className="flex items-center gap-2 overflow-x-auto py-1 scrollbar-none">
                <div className="flex rounded-xl border border-white/5 bg-[#0B0F19] p-1">
                  {(["All", "Planning", "Active", "Completed"] as const).map((status) => (
                    <button
                      key={status}
                      onClick={() => setStatusFilter(status)}
                      className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all duration-200 ${ 
                        statusFilter === status
                          ? "bg-blue-600 text-white shadow-md shadow-blue-900/35"
                          : "text-slate-400 hover:text-white hover:bg-white/5"
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
                className="premium-input px-3 py-2 w-auto bg-[#0B0F19] border border-white/5 rounded-xl text-xs font-semibold cursor-pointer text-slate-300"
              >
                <option value="created">Sort: Created Date</option>
                <option value="name">Sort: Name</option>
                <option value="progress">Sort: Progress</option>
                <option value="status">Sort: Status</option>
              </select>

              {/* Grid / List View Toggle */}
              <div className="flex items-center rounded-xl border border-white/5 bg-[#0B0F19] p-1">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-1.5 rounded-lg transition-all ${
                    viewMode === "grid" ? "bg-white/10 text-white" : "text-slate-500 hover:text-white"
                  }`}
                  title="Grid View"
                >
                  <Grid className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`p-1.5 rounded-lg transition-all ${
                    viewMode === "list" ? "bg-white/10 text-white" : "text-slate-500 hover:text-white"
                  }`}
                  title="List View"
                >
                  <List className="h-3.5 w-3.5" />
                </button>
              </div>

              <div className="rounded-xl border border-white/5 bg-[#0B0F19] px-3.5 py-2 text-xs font-bold text-slate-400">
                {filteredAndSortedProjects.length} projects
              </div>
            </div>
          </div>
        </motion.div>

        {/* Projects Container */}
        {filteredAndSortedProjects.length === 0 ? (
          <div className="premium-empty-state p-12">
            {searchQuery || statusFilter !== "All" ? (
              <div className="space-y-3">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-white/5 border border-white/5">
                  <Search className="h-6 w-6 text-slate-400" />
                </div>
                <h3 className="text-sm font-semibold text-white">No projects found</h3>
                <p className="text-xs text-slate-400">Try adjusting your filters</p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10 border border-blue-500/20">
                  <Layers3 className="h-6 w-6 text-blue-400" />
                </div>
                <h3 className="text-sm font-semibold text-white">No projects yet</h3>
                <p className="text-xs text-slate-400">Create your first project to get started</p>
                {isAdmin && (
                  <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="mt-4 premium-button-primary"
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
            className={
              viewMode === "grid"
                ? "grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
                : "flex flex-col gap-4"
            }
          >
            {filteredAndSortedProjects.map((project) => (
              <ProjectCard
                key={project._id}
                project={project}
                onUpdate={loadProjects}
                viewMode={viewMode}
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
