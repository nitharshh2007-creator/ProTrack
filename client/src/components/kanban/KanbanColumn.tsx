import { Droppable } from "@hello-pangea/dnd";
import type { Task, TaskStatus } from "@/types";
import { KanbanCard } from "./KanbanCard";

interface KanbanColumnProps {
  status: TaskStatus;
  tasks: Task[];
  color: string;
  headerColor: string;
  readonly?: boolean;
}

export const KanbanColumn = ({ status, tasks, color, headerColor, readonly = false }: KanbanColumnProps) => (
  <div className={`flex w-[300px] shrink-0 flex-col rounded-2xl ${color} p-3`}>
    {/* Header */}
    <div className="mb-3 flex items-center justify-between px-1">
      <div className="flex items-center gap-2">
        <span className={`h-2 w-2 rounded-full ${headerColor}`} />
        <span className="text-sm font-semibold text-gray-700">{status}</span>
      </div>
      <span className="rounded-full bg-white px-2 py-0.5 text-xs font-medium text-gray-500 shadow-sm">
        {tasks.length}
      </span>
    </div>

    {/* Droppable area */}
    <Droppable droppableId={status}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.droppableProps}
          className={`flex flex-1 flex-col gap-2 rounded-xl p-2 transition-colors min-h-[120px] ${
            snapshot.isDraggingOver ? "bg-white/60" : ""
          }`}
        >
          {tasks.length === 0 && !snapshot.isDraggingOver && (
            <div className="flex flex-1 items-center justify-center py-8 text-xs text-gray-400">
              No tasks
            </div>
          )}
          {tasks.map((task, index) => (
            <KanbanCard key={task._id} task={task} index={index} readonly={readonly} />
          ))}
          {provided.placeholder}
        </div>
      )}
    </Droppable>
  </div>
);
