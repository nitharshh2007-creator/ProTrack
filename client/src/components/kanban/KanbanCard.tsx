import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import React from "react";
import { motion } from "framer-motion";
import type { Task, TaskPriority } from "@/types";
import { formatDate } from "@/lib/formatDate";
import { Calendar, MessageSquare, Paperclip, AlertCircle, PlayCircle, AlertOctagon } from "lucide-react";

interface KanbanCardProps {
  task: Task;
  index: number;
  readonly?: boolean;
  commentCounts: Record<string, number>;
  isDragOverlay?: boolean;
}

const priorityStyles: Record<TaskPriority, { bg: string; text: string; border: string; icon: any }> = {
  Low: { bg: "bg-slate-500/10", text: "text-slate-400", border: "border-slate-500/20", icon: AlertCircle },
  Medium: { bg: "bg-amber-500/10", text: "text-amber-400", border: "border-amber-500/20", icon: PlayCircle },
  High: { bg: "bg-rose-500/10", text: "text-rose-400", border: "border-rose-500/20", icon: AlertOctagon },
};

const statusStyles: Record<string, { bg: string; text: string; border: string; dot: string }> = {
  Todo: { bg: "bg-slate-500/10", text: "text-slate-400", border: "border-slate-500/20", dot: "bg-slate-400" },
  "In Progress": { bg: "bg-blue-500/10", text: "text-blue-400", border: "border-blue-500/20", dot: "bg-blue-400" },
  Review: { bg: "bg-amber-500/10", text: "text-amber-400", border: "border-amber-500/20", dot: "bg-amber-400" },
  Blocked: { bg: "bg-rose-500/10", text: "text-rose-400", border: "border-rose-500/20", dot: "bg-rose-400" },
  Completed: { bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/20", dot: "bg-emerald-400" },
};

const getProgressPercentage = (status: string) => {
  const progressMap: Record<string, number> = {
    Todo: 0, 
    "In Progress": 40, 
    Review: 70, 
    Blocked: 30, 
    Completed: 100
  };
  return progressMap[status] || 0;
};

const getInitials = (name?: string) => {
  if (!name) return "?";
  return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
};

const getAvatarColor = (name?: string) => {
  if (!name) return "bg-slate-800 text-slate-400 border border-slate-700";
  const colors = [
    "bg-blue-500/15 text-blue-400 border border-blue-500/25",
    "bg-indigo-500/15 text-indigo-400 border border-indigo-500/25",
    "bg-purple-500/15 text-purple-400 border border-purple-500/25",
    "bg-pink-500/15 text-pink-400 border border-pink-500/25",
    "bg-emerald-500/15 text-emerald-400 border border-emerald-500/25",
  ];
  let sum = 0;
  for (let i = 0; i < name.length; i++) {
    sum += name.charCodeAt(i);
  }
  return colors[sum % colors.length];
};

export const KanbanCard = React.memo(({ 
  task, 
  index, 
  readonly = false, 
  commentCounts, 
  isDragOverlay = false 
}: KanbanCardProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging,
  } = useDraggable({
    id: task._id,
    disabled: readonly,
  });

  const style = {
    transform: CSS.Translate.toString(transform),
  };
  
  const progress = getProgressPercentage(task.status);
  const commentCount = commentCounts[task._id] || 0;
  const attachmentCount = 0; // task.attachments?.length || 0;
  
  // Special styling for drag overlay
  if (isDragOverlay) {
    return (
      <div
        className="premium-card bg-[#131B2E] border border-blue-500/30 p-5 shadow-2xl cursor-grabbing rounded-2xl w-[380px]"
        style={{
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 25px rgba(59, 130, 246, 0.2)",
        }}
      >
        <CardContent 
          task={task}
          progress={progress}
          commentCount={commentCount}
          attachmentCount={attachmentCount}
        />
      </div>
    );
  }
  
  return (
    <motion.div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className={`group premium-card w-full border border-white/5 hover:border-blue-500/30 rounded-2xl p-5 bg-[#131B2E] transition-all duration-300 ease-out select-none ${
        isDragging 
          ? 'opacity-40 cursor-grabbing z-[9999]'
          : readonly 
            ? 'cursor-default' 
            : 'cursor-grab'
      }`}
      style={{ 
        ...style,
        boxShadow: isDragging 
          ? '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 25px rgba(59, 130, 246, 0.2)' 
          : '0 10px 30px rgba(0, 0, 0, 0.25)',
      }}
    >
      <CardContent 
        task={task}
        progress={progress}
        commentCount={commentCount}
        attachmentCount={attachmentCount}
        index={index}
      />
    </motion.div>
  );
});

// Memoized card content component
const CardContent = React.memo(({ 
  task, 
  progress, 
  commentCount, 
  attachmentCount, 
  index = 0 
}: {
  task: Task;
  progress: number;
  commentCount: number;
  attachmentCount: number;
  index?: number;
}) => {
  const pStyle = priorityStyles[task.priority] || priorityStyles.Low;
  const sStyle = statusStyles[task.status] || statusStyles.Todo;
  const PriorityIcon = pStyle.icon;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-start gap-3">
        <div className="space-y-1 flex-1">
          <div className="text-[10px] font-bold uppercase tracking-wider text-blue-400/90">{task.project?.title || "WORKSPACE"}</div>
          <h3 className="font-semibold text-white leading-snug text-[15px] group-hover:text-blue-300 transition-colors duration-200">{task.title}</h3>
        </div>
        <div className={`h-2 w-2 rounded-full mt-1 ${sStyle.dot}`} />
      </div>

      {/* Assignee & Info */}
      <div className="flex items-center justify-between border-t border-white/5 pt-3">
        <div className="flex items-center gap-2">
          <div className={`h-7 w-7 rounded-full flex items-center justify-center text-[10px] font-bold ${getAvatarColor(task.assignedTo?.name)}`}>
            {getInitials(task.assignedTo?.name)}
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-medium text-slate-200">{task.assignedTo?.name || "Unassigned"}</span>
            <span className="text-[10px] text-slate-500 capitalize">{task.assignedTo?.role || "Member"}</span>
          </div>
        </div>
        
        <div className="flex items-center gap-1.5 text-xs text-slate-400 bg-white/5 border border-white/5 rounded-lg px-2.5 py-1">
          <Calendar className="h-3.5 w-3.5 text-slate-500" />
          <span>{formatDate(task.dueDate)}</span>
        </div>
      </div>

      {/* Badges & Progress Bar */}
      <div className="space-y-3 pt-1">
        <div className="flex gap-2">
          <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold border uppercase tracking-wider ${sStyle.bg} ${sStyle.text} ${sStyle.border}`}>
            {task.status}
          </span>
          <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold border uppercase tracking-wider ${pStyle.bg} ${pStyle.text} ${pStyle.border}`}>
            <PriorityIcon className="h-3 w-3" />
            {task.priority}
          </span>
        </div>

        {/* Enhanced Progress Bar */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-400 font-medium">Progress</span>
            <span className="font-bold text-white">{progress}%</span>
          </div>
          <div className="h-1.5 rounded-full bg-slate-950 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.8, delay: index * 0.05 }}
              className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-500"
            />
          </div>
        </div>
      </div>

      {/* Metadata Indicators */}
      <div className="flex items-center gap-4 pt-2 border-t border-white/5 text-slate-400 text-xs font-semibold">
        <div className={`flex items-center gap-1.5 transition-colors ${commentCount > 0 ? "text-blue-400" : "text-slate-500"}`}>
          <MessageSquare className="h-3.5 w-3.5" />
          <span>{commentCount}</span>
        </div>
        <div className={`flex items-center gap-1.5 transition-colors ${attachmentCount > 0 ? "text-blue-400" : "text-slate-500"}`}>
          <Paperclip className="h-3.5 w-3.5" />
          <span>{attachmentCount}</span>
        </div>
      </div>
    </div>
  );
});
