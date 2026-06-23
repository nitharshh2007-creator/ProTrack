import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { CheckSquare, Users, CalendarDays, ArrowRight, Clock, TrendingUp, MoreVertical, Edit, Archive, Trash2 } from "lucide-react";
import type { Project } from "@/types";
import { Badge } from "@/components/ui/Badge";
import { useState } from "react";
import { useAuth } from "@/store/auth.store";
import { projectService } from "@/services";
import { useEffect, useRef } from "react";

const statusVariant = {
  Planning: "info",
  Active: "success", 
  Completed: "default",
} as const;

const statusColors = {
  Planning: "from-blue-500 to-blue-600",
  Active: "from-green-500 to-green-600", 
  Completed: "from-gray-500 to-gray-600",
};

interface ProjectCardProps {
  project: Project;
  onUpdate?: () => void;
}

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" }
  }
};

const patternSvg = "data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='22' cy='22' r='6'/%3E%3Ccircle cx='6' cy='6' r='6'/%3E%3Ccircle cx='38' cy='6' r='6'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E";

export const ProjectCard = ({ project, onUpdate }: ProjectCardProps) => {
  const { hasRole } = useAuth();
  const canManage = hasRole("admin", "manager");
  
  const [showDropdown, setShowDropdown] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDropdown]);
  
  const completedTasks = project.completedTasks ?? 0;
  const totalTasks = project.totalTasks ?? 0;
  const memberCount = project.memberCount ?? project.members?.length ?? 0;
  const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  
  const handleArchive = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowDropdown(false);
    
    try {
      const newStatus = project.status === 'Completed' ? 'Active' : 'Completed';
      await projectService.update(project._id, { status: newStatus });
      onUpdate?.();
    } catch (error: any) {
      console.error('Failed to archive project:', error);
      if (error?.response?.status === 429) {
        alert('Too many requests. Please wait a moment and try again.');
      } else {
        alert('Failed to archive project. Please try again.');
      }
    }
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowDeleteConfirm(false);
    setIsDeleting(true);
    
    try {
      await projectService.delete(project._id);
      onUpdate?.();
    } catch (error: any) {
      console.error('Failed to delete project:', error);
      if (error?.response?.status === 429) {
        alert('Too many requests. Please wait a moment and try again.');
      } else {
        alert('Failed to delete project. Please try again.');
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDropdownClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowDropdown(!showDropdown);
  };

  const closeDropdown = () => {
    setShowDropdown(false);
  };

  const isArchived = project.status === 'Completed';
  
  const teamMembers = project.members?.slice(0, 4) || [];
  const extraMembers = Math.max(0, memberCount - 4);
  
  const dueDate = project.deadline ? new Date(project.deadline) : null;
  const today = new Date();
  const isOverdue = dueDate && dueDate < today && project.status !== "Completed";
  const isDueSoon = dueDate && !isOverdue && dueDate.getTime() - today.getTime() < 7 * 24 * 60 * 60 * 1000;

  return (
    <motion.article
      variants={cardVariants}
      whileHover={{ y: -8, scale: 1.02 }}
      className={`group relative overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm transition-all hover:shadow-md ${
        isDeleting ? 'opacity-50 pointer-events-none' : ''
      }`}
      onClick={closeDropdown}
    >
      <div className="relative h-48 overflow-hidden">
        <Link to={`/projects/${project._id}`} className="block h-full">
          {project.coverImage ? (
            <>
              <img 
                src={project.coverImage} 
                alt={project.title} 
                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" 
              />
              <div className="absolute inset-0 bg-gradient-to-br from-black/20 via-transparent to-black/40" />
            </>
          ) : (
            <div className={`h-full w-full bg-gradient-to-br ${statusColors[project.status]} flex items-center justify-center text-white relative overflow-hidden`}>
              <div className="absolute inset-0 opacity-20" style={{ backgroundImage: `url('${patternSvg}')` }} />
              <div className="text-5xl font-bold tracking-wider">
                {project.title.charAt(0).toUpperCase()}
              </div>
            </div>
          )}
        </Link>
        
        <div className="absolute left-4 top-4">
          <div className={`inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r ${statusColors[project.status]} px-3 py-1.5 text-xs font-semibold text-white shadow-sm`}>
            <div className="h-2 w-2 rounded-full bg-white/80" />
            {project.status}
          </div>
        </div>
        
          <div className="absolute right-4 top-4 flex items-center gap-2">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-slate-900 dark:bg-slate-800 dark:text-white shadow-sm">
            <TrendingUp className="h-3 w-3" />
            {progress}%
          </div>
          
          {canManage && (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={handleDropdownClick}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-md transition-all hover:bg-white/30 z-10"
                title="Project Actions"
              >
                <MoreVertical className="h-4 w-4" />
              </button>
              
              {/* Remove test button */}
              
              {showDropdown && (
                <div className="absolute right-0 top-10 z-20 w-48 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm">
                  <div className="p-1">
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setShowDropdown(false);
                        window.location.href = `/projects/${project._id}/edit`;
                      }}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-700 dark:text-slate-300 transition-colors hover:bg-gray-100 dark:hover:bg-slate-700"
                    >
                      <Edit className="h-4 w-4" />
                      Edit Project
                    </button>
                    
                    <button
                      onClick={handleArchive}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-700 dark:text-slate-300 transition-colors hover:bg-gray-100 dark:hover:bg-slate-700"
                    >
                      <Archive className="h-4 w-4" />
                      {isArchived ? 'Unarchive' : 'Archive'} Project
                    </button>
                    
                    <div className="my-1 h-px bg-gray-200 dark:bg-slate-700" />
                    
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setShowDeleteConfirm(true);
                        setShowDropdown(false);
                      }}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-600 dark:text-red-400 transition-colors hover:bg-red-50 dark:hover:bg-red-900/20"
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete Project
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
        
        {(isOverdue || isDueSoon) && (
          <div className="absolute bottom-4 right-4">
            <div className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${
              isOverdue ? "bg-red-500/90 text-white" : "bg-amber-500/90 text-white"
            }`}>
              <Clock className="h-3 w-3" />
              {isOverdue ? "Overdue" : "Due Soon"}
            </div>
          </div>
        )}
      </div>
      
      <Link to={`/projects/${project._id}`} className="block">
        <div className="space-y-5 p-6">
          <div className="space-y-3">
            <div className="flex items-start justify-between gap-3">
              <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 transition-colors group-hover:text-blue-600 leading-tight">
                {project.title}
              </h3>
              <Badge variant={statusVariant[project.status]} className="shrink-0">
                {project.status}
              </Badge>
            </div>
            <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400 line-clamp-2">
              {project.description}
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-slate-700 dark:text-slate-300">Progress</span>
              <span className="font-semibold text-slate-900 dark:text-slate-100">{progress}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700">
              <div 
                className={`h-full rounded-full bg-gradient-to-r ${statusColors[project.status]} transition-all duration-500 ease-out`}
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

            <div className="grid grid-cols-2 gap-4">
            <div className="rounded-2xl border border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-4">
              <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
                <CheckSquare className="h-3 w-3" />
                Tasks
              </div>
              <div className="mt-2 space-y-1">
                <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">{completedTasks}</div>
                <div className="text-xs text-slate-500 dark:text-slate-400">of {totalTasks} completed</div>
              </div>
            </div>
            
            <div className="rounded-2xl border border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-4">
              <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
                <Users className="h-3 w-3" />
                Team
              </div>
              <div className="mt-2 space-y-2">
                <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">{memberCount}</div>
                {teamMembers.length > 0 && (
                  <div className="flex items-center gap-1">
                    {teamMembers.map((member, idx) => (
                      <div
                        key={member._id || idx}
                        className="h-6 w-6 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-xs font-semibold text-white ring-2 ring-white"
                        style={{ marginLeft: idx > 0 ? '-4px' : '0' }}
                      >
                        {member.name?.charAt(0).toUpperCase() || '?'}
                      </div>
                    ))}
                    {extraMembers > 0 && (
                      <div className="ml-1 h-6 w-6 rounded-full bg-slate-200 dark:bg-slate-600 flex items-center justify-center text-xs font-semibold text-slate-600 dark:text-slate-300">
                        +{extraMembers}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
              <CalendarDays className="h-4 w-4" />
              {dueDate ? (
                <span className={isOverdue ? "text-red-600 font-medium" : isDueSoon ? "text-amber-600 font-medium" : ""}>
                  Due {dueDate.toLocaleDateString()}
                </span>
              ) : (
                <span>Created {new Date(project.createdAt).toLocaleDateString()}</span>
              )}
            </div>
            
            <div className="flex items-center gap-2 text-sm font-medium text-blue-600 opacity-0 transition-all group-hover:opacity-100">
              <span>View project</span>
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </div>
          </div>
        </div>
      </Link>
      
      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mx-4 w-full max-w-md rounded-2xl bg-white dark:bg-slate-800 p-6 shadow-2xl"
          >
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
                <Trash2 className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-slate-100">Delete Project</h3>
              <p className="mb-6 text-sm text-gray-600 dark:text-slate-400">
                Are you sure you want to delete "{project.title}"? This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setShowDeleteConfirm(false);
                  }}
                  className="flex-1 rounded-xl border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-4 py-2 text-sm font-medium text-gray-700 dark:text-slate-300 transition-colors hover:bg-gray-50 dark:hover:bg-slate-600"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="flex-1 rounded-xl bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-50"
                >
                  {isDeleting ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </motion.article>
  );
};
