import { Draggable } from "@hello-pangea/dnd";
import type { Task, TaskPriority } from "@/types";
import { formatDate } from "@/lib/formatDate";

interface KanbanCardProps {
  task: Task;
  index: number;
  readonly?: boolean;
}

const priorityStyles: Record<TaskPriority, string> = {
  Low: "bg-gray-100 text-gray-600",
  Medium: "bg-yellow-100 text-yellow-700",
  High: "bg-red-100 text-red-600",
};

export const KanbanCard = ({ task, index, readonly = false }: KanbanCardProps) => (
  <Draggable draggableId={task._id} index={index} isDragDisabled={readonly}>
    {(provided, snapshot) => (
      <div
        ref={provided.innerRef}
        {...provided.draggableProps}
        {...(!readonly ? provided.dragHandleProps : {})}
        className={`rounded-xl bg-white p-3 shadow-sm select-none transition-shadow ${
          snapshot.isDragging ? "shadow-lg ring-2 ring-blue-300 rotate-1" : ""
        } ${
          readonly ? "cursor-default" : "cursor-grab"
        }`}
      >
        <p className="mb-2 text-sm font-semibold text-gray-800 leading-snug">{task.title}</p>
        <div className="flex items-center justify-between gap-2">
          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${priorityStyles[task.priority]}`}>
            {task.priority}
          </span>
          <span className="text-xs text-gray-400 truncate max-w-[90px]">
            {task.assignedTo?.name ?? "Unassigned"}
          </span>
        </div>
        <p className="mt-2 text-xs text-gray-400">Due {formatDate(task.dueDate)}</p>
      </div>
    )}
  </Draggable>
);
