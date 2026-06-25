import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import React from "react";
import { motion } from "framer-motion";
import type { Task, TaskPriority } from "@/types";
import { formatDate } from "@/lib/formatDate";
import { User, Calendar, MessageSquare, Paperclip } from "lucide-react";

interface KanbanCardProps {
  task: Task;
  index: number;
  readonly?: boolean;
  commentCounts: Record<string, number>;
  isDragOverlay?: boolean;
}

const priorityStyles: Record<TaskPriority, { bg: string; text: string; border: string }> = {
  Low: { bg: "rgba(148, 163, 184, 0.08)", text: "#94A3B8", border: "rgba(148, 163, 184, 0.15)" },
  Medium: { bg: "rgba(245, 158, 11, 0.08)", text: "#F59E0B", border: "rgba(245, 158, 11, 0.15)" },
  High: { bg: "rgba(239, 68, 68, 0.08)", text: "#EF4444", border: "rgba(239, 68, 68, 0.15)" },
};

const statusStyles: Record<string, { bg: string; text: string; border: string }> = {
  Todo: { bg: "rgba(148, 163, 184, 0.08)", text: "#94A3B8", border: "rgba(148, 163, 184, 0.15)" },
  "In Progress": { bg: "rgba(59, 130, 246, 0.08)", text: "#3B82F6", border: "rgba(59, 130, 246, 0.15)" },
  Review: { bg: "rgba(245, 158, 11, 0.08)", text: "#F59E0B", border: "rgba(245, 158, 11, 0.15)" },
  Blocked: { bg: "rgba(239, 68, 68, 0.08)", text: "#EF4444", border: "rgba(239, 68, 68, 0.15)" },
  Completed: { bg: "rgba(16, 185, 129, 0.08)", text: "#10B981", border: "rgba(16, 185, 129, 0.15)" },
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
      <motion.div
        className="premium-card bg-gradient-to-b from-[#131B2E] to-[#0E1424] p-6 shadow-2xl cursor-grabbing"
        style={{
          transform: 'rotate(2deg) scale(1.04)',
          width: '380px',
        }}
      >
        <CardContent 
          task={task}
          progress={progress}
          commentCount={commentCount}
          attachmentCount={attachmentCount}
        />
      </motion.div>
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
      className={`premium-card w-full transition-all duration-200 ease-out ${
        isDragging 
          ? 'opacity-50 cursor-grabbing z-[9999]'
          : readonly 
            ? 'cursor-default' 
            : 'cursor-grab'
      }`}
      style={{ 
        ...style,
        boxShadow: isDragging 
          ? '0 20px 45px rgba(37,99,235,0.2)' 
          : undefined,
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
  return (
    <>
      {/* Header */}
      <div className="mb-4">
        <div className="text-[10px] font-bold uppercase tracking-wider text-blue-400 mb-2">{task.project?.title || "WORKSPACE"}</div>
        <h3 className="font-bold text-white leading-tight text-base">{task.title}</h3>
      </div>

      {/* Assignee & Due Date */}
      <div className="mb-4 space-y-2">
        <div className="flex items-center gap-2 text-sm text-slate-400">
          <User className="h-4 w-4 text-slate-500" />
          <span>{task.assignedTo?.name || "Unassigned"}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-400">
          <Calendar className="h-4 w-4 text-slate-500" />
          <span>{formatDate(task.dueDate)}</span>
        </div>
      </div>

      {/* Status & Priority Pills */}
      <div className="mb-4 flex gap-2">
        <span 
          className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold border"
          style={{ 
            backgroundColor: statusStyles[task.status]?.bg || statusStyles.Todo.bg,
            color: statusStyles[task.status]?.text || statusStyles.Todo.text,
            borderColor: statusStyles[task.status]?.border || statusStyles.Todo.border
          }}
        >
          {task.status}
        </span>
        <span 
          className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold border"
          style={{ 
            backgroundColor: priorityStyles[task.priority].bg,
            color: priorityStyles[task.priority].text,
            borderColor: priorityStyles[task.priority].border
          }}
        >
          {task.priority}
        </span>
      </div>

      {/* Enhanced Progress Bar */}
      <div className="mb-4">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs text-slate-400">Progress</span>
          <span className="text-xs font-bold text-white">{progress}%</span>
        </div>
        <div className="h-2 rounded-full bg-[#0B0F19] overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 1, delay: index * 0.1 }}
            className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-500"
          />
        </div>
      </div>

      {/* Metadata Pills */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1 text-slate-400 text-xs font-medium">
          <MessageSquare className="h-4 w-4 text-slate-500" />
          <span>{commentCount}</span>
        </div>
        <div className="flex items-center gap-1 text-slate-400 text-xs font-medium">
          <Paperclip className="h-4 w-4 text-slate-500" />
          <span>{attachmentCount}</span>
        </div>
      </div>
    </>
  );
});
