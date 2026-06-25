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
  };

  return (configs as any)[status] || configs.Todo;
};
// Drop Zone Placeholder Component
const DropZonePlaceholder = () => (
  <motion.div 
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    exit={{ opacity: 0, scale: 0.95 }}
    className="rounded-[18px] border-2 border-dashed border-blue-500/30 bg-blue-950/20 p-8 flex items-center justify-center text-center transition-all duration-200"
    style={{ minHeight: '120px' }}
  >
    <div className="text-center">
      <div className="text-2xl mb-2">📋</div>
      <div className="text-sm font-medium text-blue-400">
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
      className={`flex flex-col bg-[#131B2E] rounded-[20px] border transition-all duration-200 ${
        isOver
          ? 'border-blue-500 border-2 border-dashed bg-blue-950/20 shadow-[0_0_25px_rgba(37,99,235,0.15)]'
          : 'border-white/5 shadow-[0_10px_30px_rgba(0,0,0,0.35)]'
      }`}
      style={{ minWidth: '380px', width: '380px', minHeight: '700px' }}
    >
      {/* Premium Column Header */}
      <div 
        className="flex items-center justify-between px-6 py-4 border-b border-white/5"
        style={{ 
          height: '64px',
          borderTopLeftRadius: '18px',
          borderTopRightRadius: '18px',
          backgroundColor: '#131B2E',
          color: 'white'
        }}
      >
        <div className="flex items-center gap-3">
          <div 
            className="h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: statusColor }}
          />
          <span className="text-sm font-bold text-white">{status}</span>
        </div>
        <span className="rounded-full bg-white/5 border border-white/5 px-2.5 py-0.5 text-xs font-bold text-slate-300">
          {tasks.length}
        </span>
      </div>

      {/* Drop Zone */}
      <div
        ref={setNodeRef}
        className={`flex-1 p-4 transition-all duration-200 ease-out`}
        style={{ 
          minHeight: '600px',
          borderBottomLeftRadius: '20px',
          borderBottomRightRadius: '20px',
          background: isOver 
            ? 'rgba(37,99,235,0.04)'
            : '#0B0F19'
        }}
      >
        {/* Empty State */}
        {tasks.length === 0 && !isOver && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center text-center p-8 h-full min-h-[350px]"
          >
            <div 
              className="flex items-center justify-center w-12 h-12 rounded-xl mb-4 bg-white/5 border border-white/5"
            >
              <span className="text-xl">{emptyState.icon}</span>
            </div>
            <h3 className="text-sm font-semibold text-white mb-1">{emptyState.title}</h3>
            <p className="text-xs text-slate-400">{emptyState.subtitle}</p>
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
