import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { CheckSquare, Users, CalendarDays, ArrowRight, Clock, TrendingUp, MoreVertical, Edit, Archive, Trash2 } from "lucide-react";
import type { Project } from "@/types";
import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/store/auth.store";
import { projectService } from "@/services";

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
      whileHover={{ y: -6 }}
      className={`premium-card relative overflow-hidden p-0 block ${
        isDeleting ? 'opacity-50 pointer-events-none' : ''
      }`}
      onClick={closeDropdown}
    >
      <div className="relative h-44 overflow-hidden">
        <Link to={`/projects/${project._id}`} className="block h-full">
          {project.coverImage ? (
            <>
              <img 
                src={project.coverImage} 
                alt={project.title} 
                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" 
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
          <div className={`inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r ${statusColors[project.status]} px-3 py-1 text-[10px] font-bold text-white shadow-sm`}>
            <div className="h-1.5 w-1.5 rounded-full bg-white/80" />
            {project.status}
          </div>
        </div>
        
        <div className="absolute right-4 top-4 flex items-center gap-2">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-[#131B2E] border border-white/10 px-3 py-1 text-[10px] font-bold text-white shadow-sm">
            <TrendingUp className="h-3 w-3 text-blue-400" />
            {progress}%
          </div>
          
          {canManage && (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={handleDropdownClick}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-black/40 border border-white/5 text-white transition-all hover:bg-black/60"
                title="Project Actions"
              >
                <MoreVertical className="h-4 w-4" />
              </button>
              
              {showDropdown && (
                <div className="absolute right-0 top-9 z-20 w-44 premium-dropdown">
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setShowDropdown(false);
                      window.location.href = `/projects/${project._id}/edit`;
                    }}
                    className="premium-dropdown-item"
                  >
                    <Edit className="h-3.5 w-3.5" />
                    Edit Project
                  </button>
                  
                  <button
                    onClick={handleArchive}
                    className="premium-dropdown-item"
                  >
                    <Archive className="h-3.5 w-3.5" />
                    {isArchived ? 'Unarchive' : 'Archive'} Project
                  </button>
                  
                  <div className="my-1 border-t border-slate-800/80" />
                  
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setShowDeleteConfirm(true);
                      setShowDropdown(false);
                    }}
                    className="premium-dropdown-item premium-dropdown-item-danger"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete Project
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
        
        {(isOverdue || isDueSoon) && (
          <div className="absolute bottom-4 right-4">
            <div className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold ${
              isOverdue ? "bg-red-500/90 text-white" : "bg-amber-500/90 text-white"
            }`}>
              <Clock className="h-3 w-3" />
              {isOverdue ? "Overdue" : "Due Soon"}
            </div>
          </div>
        )}
      </div>
      
      <Link to={`/projects/${project._id}`} className="block">
        <div className="space-y-4 p-5">
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-white transition-colors group-hover:text-blue-400 leading-tight">
              {project.title}
            </h3>
            <p className="text-xs leading-relaxed text-slate-400 line-clamp-2">
              {project.description}
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-400">Progress</span>
              <span className="font-bold text-white">{progress}%</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-[#0B0F19]">
              <div 
                className={`h-full rounded-full bg-gradient-to-r ${statusColors[project.status]} transition-all duration-500 ease-out`}
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-white/5 bg-[#0B0F19] p-3">
              <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-450">
                <CheckSquare className="h-3 w-3 text-slate-500" />
                Tasks
              </div>
              <div className="mt-1 space-y-0.5">
                <div className="text-lg font-bold text-white">{completedTasks}</div>
                <div className="text-[10px] text-slate-400">of {totalTasks} completed</div>
              </div>
            </div>
            
            <div className="rounded-xl border border-white/5 bg-[#0B0F19] p-3">
              <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-450">
                <Users className="h-3 w-3 text-slate-500" />
                Team
              </div>
              <div className="mt-1 space-y-1.5">
                <div className="text-lg font-bold text-white">{memberCount}</div>
                {teamMembers.length > 0 && (
                  <div className="flex items-center gap-1">
                    {teamMembers.map((member, idx) => (
                      <div
                        key={member._id || idx}
                        className="h-5 w-5 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-[10px] font-bold text-white ring-1 ring-[#0B0F19]"
                        style={{ marginLeft: idx > 0 ? '-4px' : '0' }}
                      >
                        {member.name?.charAt(0).toUpperCase() || '?'}
                      </div>
                    ))}
                    {extraMembers > 0 && (
                      <div className="ml-0.5 h-5 w-5 rounded-full bg-white/5 border border-white/5 flex items-center justify-center text-[9px] font-bold text-slate-300">
                        +{extraMembers}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-1 border-t border-white/5">
            <div className="flex items-center gap-1.5 text-xs text-slate-400 font-semibold">
              <CalendarDays className="h-3.5 w-3.5 text-slate-500" />
              {dueDate ? (
                <span className={isOverdue ? "text-red-400" : isDueSoon ? "text-amber-400" : ""}>
                  Due {dueDate.toLocaleDateString()}
                </span>
              ) : (
                <span>Created {new Date(project.createdAt).toLocaleDateString()}</span>
              )}
            </div>
            
            <div className="flex items-center gap-1 text-xs font-semibold text-blue-400 opacity-0 transition-all duration-200 group-hover:opacity-100">
              <span>View</span>
              <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
            </div>
          </div>
        </div>
      </Link>
      
      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mx-4 w-full max-w-sm rounded-2xl bg-[#131B2E] border border-white/10 p-6 shadow-2xl"
          >
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10 border border-red-500/20">
                <Trash2 className="h-6 w-6 text-red-500" />
              </div>
              <h3 className="mb-2 text-lg font-bold text-white">Delete Project</h3>
              <p className="mb-6 text-sm text-slate-400">
                Are you sure you want to delete "{project.title}"? This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setShowDeleteConfirm(false);
                  }}
                  className="flex-1 premium-button-secondary py-2 text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="flex-1 premium-button-danger py-2 text-sm"
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
