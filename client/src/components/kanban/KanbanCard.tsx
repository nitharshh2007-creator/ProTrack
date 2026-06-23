import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import React from "react";
import { motion } from "framer-motion";
import type { Task, TaskPriority } from "@/types";
import { formatDate } from "@/lib/formatDate";
import { User, Calendar, MessageSquare, Paperclip, Users } from "lucide-react";

interface KanbanCardProps {
  task: Task;
  index: number;
  readonly?: boolean;
  commentCounts: Record<string, number>;
  isDragOverlay?: boolean;
}

const priorityStyles: Record<TaskPriority, { bg: string; text: string }> = {
  Low: { bg: "#F3F4F6", text: "#6B7280" },
  Medium: { bg: "#FEF3C7", text: "#D97706" },
  High: { bg: "#FEE2E2", text: "#DC2626" },
};

const statusStyles: Record<string, { bg: string; text: string }> = {
  Todo: { bg: "#F1F5F9", text: "#64748B" },
  "In Progress": { bg: "#DBEAFE", text: "#2563EB" },
  Review: { bg: "#FEF3C7", text: "#F59E0B" },
  Blocked: { bg: "#FEE2E2", text: "#EF4444" },
  Completed: { bg: "#DCFCE7", text: "#16A34A" },
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
  const attachmentCount = 0; // task.attachments?.length || 0; // TODO: Add attachments to Task type
  
  // Special styling for drag overlay
  if (isDragOverlay) {
    return (
      <motion.div
        className="bg-white dark:bg-slate-900/80 rounded-[20px] border border-slate-200 dark:border-slate-800 p-6 shadow-[0_30px_60px_rgba(37,99,235,0.25)] cursor-grabbing"
        style={{
          transform: 'rotate(2deg) scale(1.04)',
          width: '350px',
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
      className={`bg-white dark:bg-slate-900/80 rounded-[20px] border border-slate-200 dark:border-slate-800 p-6 transition-all duration-200 ease-out ${
        isDragging 
          ? 'opacity-50 cursor-grabbing z-[9999]'
          : readonly 
            ? 'cursor-default hover:-translate-y-1 hover:shadow-[0_12px_30px_rgba(15,23,42,0.12)]' 
            : 'cursor-grab hover:-translate-y-1 hover:shadow-[0_12px_30px_rgba(15,23,42,0.12)]'
      }`}
      style={{ 
        ...style,
        boxShadow: isDragging 
          ? '0 30px 60px rgba(37,99,235,0.25)' 
          : '0 4px 20px rgba(15,23,42,0.08)',
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
        <div className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-2">{task.project?.title || "FRONTEND"}</div>
        <h3 className="font-bold text-slate-900 dark:text-slate-100 leading-tight text-base mb-3">{task.title}</h3>
        <div className="text-sm font-semibold text-slate-800 dark:text-slate-200">{task.project?.title || "ATRIVA"}</div>
      </div>

      {/* Assignee & Due Date */}
      <div className="mb-4 space-y-2">
        <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
          <User className="h-4 w-4" />
          <span>{task.assignedTo?.name || "Unassigned"}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
          <Calendar className="h-4 w-4" />
          <span>{formatDate(task.dueDate)}</span>
        </div>
      </div>

      {/* Status & Priority Pills */}
      <div className="mb-4 flex gap-2">
        <span 
          className="inline-flex items-center rounded-full px-3 py-1.5 text-xs font-semibold"
          style={{ 
            backgroundColor: statusStyles[task.status]?.bg || statusStyles.Todo.bg,
            color: statusStyles[task.status]?.text || statusStyles.Todo.text
          }}
        >
          {task.status}
        </span>
        <span 
          className="inline-flex items-center rounded-full px-3 py-1.5 text-xs font-semibold"
          style={{ 
            backgroundColor: priorityStyles[task.priority].bg,
            color: priorityStyles[task.priority].text
          }}
        >
          {task.priority}
        </span>
      </div>

      {/* Enhanced Progress Bar */}
      <div className="mb-4">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs text-slate-500 dark:text-slate-400">Progress</span>
          <span className="text-xs font-bold text-slate-900 dark:text-slate-100">{progress}%</span>
        </div>
        <div className="h-[10px] rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 1, delay: index * 0.1 }}
            className="h-full rounded-full"
            style={{ background: 'linear-gradient(90deg,#2563eb,#60a5fa)' }}
          />
        </div>
      </div>

      {/* Metadata Pills */}
      <div className="mb-4 flex gap-2">
        <div className="flex items-center gap-1 rounded-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 px-3 py-1.5 text-xs font-medium">
          <MessageSquare className="h-3 w-3" />
          <span>{commentCount}</span>
        </div>
        <div className="flex items-center gap-1 rounded-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 px-3 py-1.5 text-xs font-medium">
          <Paperclip className="h-3 w-3" />
          <span>{attachmentCount}</span>
        </div>
        <div className="flex items-center gap-1 rounded-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 px-3 py-1.5 text-xs font-medium">
          <Users className="h-3 w-3" />
          <span>1</span>
        </div>
      </div>

      {/* Attachment Preview */}
      {attachmentCount > 0 && (
        <div className="mb-4">
          <div className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-2">
            📎 {attachmentCount} Attachment{attachmentCount > 1 ? 's' : ''}
          </div>
          <div className="text-xs text-slate-600 dark:text-slate-400">
            {attachmentCount > 3 ? `${attachmentCount} files attached` : 'Files attached'}
          </div>
        </div>
      )}

      {/* Last Updated */}
      <div className="text-xs text-slate-500 dark:text-slate-400">
        Last updated 2h ago
      </div>
    </>
  );
});
