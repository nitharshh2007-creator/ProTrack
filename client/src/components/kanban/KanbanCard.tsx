import { Draggable } from "@hello-pangea/dnd";
import type { Task, TaskPriority } from "@/types";
import { formatDate } from "@/lib/formatDate";

interface KanbanCardProps {
  task: Task;
  index: number;
  readonly?: boolean;
}

const priorityStyles: Record<TaskPriority, string> = {
  Low: "bg-emerald-500/10 text-emerald-300 border border-emerald-500/20",
  Medium: "bg-amber-500/10 text-amber-300 border border-amber-500/20",
  High: "bg-red-500/10 text-red-300 border border-red-500/20",
};

export const KanbanCard = ({ task, index, readonly = false }: KanbanCardProps) => (
  <Draggable draggableId={task._id} index={index} isDragDisabled={readonly}>
    {(provided, snapshot) => (
      <div
        ref={provided.innerRef}
        {...provided.draggableProps}
        {...(!readonly ? provided.dragHandleProps : {})}
        className={`rounded-3xl border border-white/10 bg-slate-950/80 p-4 shadow-lg transition-all ${snapshot.isDragging ? "ring-2 ring-blue-400/40 shadow-2xl" : "hover:-translate-y-0.5"} ${readonly ? "cursor-default" : "cursor-grab"}`}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-white leading-snug">{task.title}</p>
            <p className="mt-2 text-xs text-slate-400 line-clamp-2">{task.description || "No description available."}</p>
          </div>
          <span className={`rounded-full px-3 py-1 text-[11px] font-semibold ${priorityStyles[task.priority]}`}>{task.priority}</span>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-slate-400">
          <span className="rounded-2xl bg-white/5 px-2.5 py-1">{task.assignedTo?.name ?? "Unassigned"}</span>
          <span className="rounded-2xl bg-white/5 px-2.5 py-1">Due {formatDate(task.dueDate)}</span>
        </div>
      </div>
    )}
  </Draggable>
);
