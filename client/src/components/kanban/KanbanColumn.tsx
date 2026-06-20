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
  <div className={`flex w-[320px] shrink-0 flex-col rounded-[32px] border border-white/10 bg-white/5 p-4 shadow-card backdrop-blur-xl ${color}`}>
    <div className="mb-4 flex items-center justify-between gap-3 rounded-3xl bg-slate-950/70 px-4 py-3">
      <div className="flex items-center gap-2">
        <span className={`h-2.5 w-2.5 rounded-full ${headerColor}`} />
        <span className="text-sm font-semibold text-white">{status}</span>
      </div>
      <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-slate-300">{tasks.length}</span>
    </div>

    <Droppable droppableId={status}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.droppableProps}
          className={`flex min-h-[160px] flex-1 flex-col gap-3 rounded-[28px] border border-white/10 px-3 py-3 transition ${snapshot.isDraggingOver ? "bg-white/10" : "bg-white/5"}`}
        >
          {tasks.length === 0 && !snapshot.isDraggingOver && (
            <div className="flex flex-1 items-center justify-center rounded-3xl border border-dashed border-white/10 bg-slate-950/60 p-6 text-center text-xs text-slate-400">
              No tasks in this column yet.
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
