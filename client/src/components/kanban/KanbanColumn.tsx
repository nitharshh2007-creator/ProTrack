import { useDroppable } from "@dnd-kit/core";
import { motion, AnimatePresence } from "framer-motion";
import type { Task, TaskStatus } from "@/types";
import { KanbanCard } from "./KanbanCard";

interface KanbanColumnProps {
  status: TaskStatus;
  tasks: Task[];
  color: string;
  headerColor: string;
  statusColor: string;
  readonly?: boolean;
  commentCounts: Record<string, number>;
}

const getEmptyStateContent = (status: TaskStatus) => {
  const configs = {
    Todo: { icon: "📝", title: "No tasks in Todo", subtitle: "Add tasks to get started" },
    "In Progress": { icon: "⚡", title: "No tasks in progress", subtitle: "Drag tasks here when you start working" },
    Review: { icon: "📭", title: "No tasks in Review", subtitle: "Drag tasks here when ready for approval" },
    Blocked: { icon: "🚫", title: "No blocked tasks", subtitle: "Tasks with blockers will appear here" },
    Completed: { icon: "✅", title: "No completed tasks", subtitle: "Finished tasks will appear here" }
  };
  
  return configs[status] || configs.Todo;
};

// Drop Zone Placeholder Component
const DropZonePlaceholder = () => (
  <motion.div 
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    exit={{ opacity: 0, scale: 0.95 }}
    className="rounded-[20px] border-2 border-dashed border-blue-400 bg-blue-50/50 p-8 flex items-center justify-center text-center transition-all duration-200"
    style={{ minHeight: '120px' }}
  >
    <div className="text-center">
      <div className="text-2xl mb-2">📋</div>
      <div className="text-sm font-medium text-blue-600">
        Drop Task Here
      </div>
    </div>
  </motion.div>
);

export const KanbanColumn = ({ 
  status, 
  tasks, 
  statusColor, 
  readonly = false, 
  commentCounts 
}: KanbanColumnProps) => {
  const { setNodeRef, isOver } = useDroppable({
    id: status,
  });
  
  const emptyState = getEmptyStateContent(status);
  
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex flex-col bg-white dark:bg-slate-900/80 rounded-3xl border border-slate-200 dark:border-slate-800 transition-all duration-200 ${
        isOver
          ? 'border-blue-400 border-2 border-dashed bg-blue-50 shadow-[0_0_25px_rgba(37,99,235,0.15)]'
          : 'border-slate-200 dark:border-slate-800 shadow-lg'
      }`}
      style={{ minWidth: '380px', width: '380px', minHeight: '700px' }}
    >
      {/* Premium Column Header */}
      <div 
        className="flex items-center justify-between px-6 py-4 rounded-t-3xl"
        style={{ 
          height: '64px',
          borderTopLeftRadius: '18px',
          borderTopRightRadius: '18px',
          backgroundColor: statusColor,
          color: 'white'
        }}
      >
        <div className="flex items-center gap-3">
          <div 
            className="h-3 w-3 rounded-full"
            style={{ backgroundColor: 'rgba(255,255,255,0.8)' }}
          />
          <span className="text-sm font-bold">{status}</span>
        </div>
        <span 
          className="rounded-full px-3 py-1 text-xs font-bold"
          style={{ backgroundColor: 'rgba(255,255,255,0.2)', color: 'white' }}
        >
          {tasks.length}
        </span>
      </div>

      {/* Drop Zone */}
      <div
        ref={setNodeRef}
        className={`flex-1 p-4 transition-all duration-200 ease-out ${
          isOver 
            ? 'bg-blue-50/70 dark:bg-blue-900/20' 
            : 'bg-slate-50/30 dark:bg-slate-800/30'
        }`}
        style={{ 
          minHeight: '600px',
          borderBottomLeftRadius: '24px',
          borderBottomRightRadius: '24px',
          background: isOver 
            ? 'rgba(37,99,235,0.08)'
            : undefined
        }}
      >
        {/* Empty State */}
        {tasks.length === 0 && !isOver && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center text-center p-8 h-full"
          >
            <div 
              className="flex items-center justify-center w-16 h-16 rounded-2xl mb-4"
              style={{ backgroundColor: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(10px)' }}
            >
              <span className="text-2xl">{emptyState.icon}</span>
            </div>
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">{emptyState.title}</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">{emptyState.subtitle}</p>
          </motion.div>
        )}

        {/* Drop Zone Placeholder */}
        {isOver && tasks.length === 0 && <DropZonePlaceholder />}

        {/* Task Cards with AnimatePresence for smooth transitions */}
        <AnimatePresence mode="popLayout">
          <div className="space-y-4">
            {tasks.map((task, index) => (
              <motion.div
                key={task._id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ 
                  type: "spring",
                  stiffness: 300,
                  damping: 30,
                  layout: { duration: 0.25, ease: [0.4, 0, 0.2, 1] }
                }}
              >
                <KanbanCard 
                  task={task} 
                  index={index} 
                  readonly={readonly}
                  commentCounts={commentCounts}
                />
              </motion.div>
            ))}
          </div>
        </AnimatePresence>
      </div>
    </motion.div>
  );
};
