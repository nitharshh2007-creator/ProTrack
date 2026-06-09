import { useEffect, useState, useCallback } from "react";
import { DragDropContext, type DropResult } from "@hello-pangea/dnd";
import { taskService } from "@/services";
import type { Task, TaskStatus } from "@/types";
import { Spinner } from "@/components/ui/Spinner";
import { KanbanColumn } from "@/components/kanban/KanbanColumn";
import { useAuth } from "@/store/auth.store";

const COLUMNS: TaskStatus[] = ["Todo", "In Progress", "Review", "Blocked", "Completed"];

const COLUMN_STYLES: Record<TaskStatus, { bg: string; dot: string }> = {
  Todo:         { bg: "bg-gray-100",   dot: "bg-gray-400"   },
  "In Progress":{ bg: "bg-blue-50",    dot: "bg-blue-500"   },
  Review:       { bg: "bg-yellow-50",  dot: "bg-yellow-500" },
  Blocked:      { bg: "bg-red-50",     dot: "bg-red-500"    },
  Completed:    { bg: "bg-green-50",   dot: "bg-green-500"  },
};

type Board = Record<TaskStatus, Task[]>;

const buildBoard = (tasks: Task[]): Board => {
  const board = Object.fromEntries(COLUMNS.map((c) => [c, []])) as Board;
  for (const task of tasks) {
    if (task.status in board) board[task.status].push(task);
  }
  return board;
};

export const KanbanPage = () => {
  const { hasRole } = useAuth();
  const canEdit = hasRole("admin", "manager");

  const [board, setBoard] = useState<Board | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dragError, setDragError] = useState("");

  const fetchTasks = useCallback(() => {
    setLoading(true);
    setError("");
    taskService
      .getAll()
      .then((tasks) => setBoard(buildBoard(tasks)))
      .catch(() => setError("Failed to load tasks."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  const onDragEnd = async (result: DropResult) => {
    if (!canEdit) return;          // block non-privileged users at handler level
    const { source, destination, draggableId } = result;
    setDragError("");

    // Dropped outside or same position
    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    const srcCol  = source.droppableId as TaskStatus;
    const destCol = destination.droppableId as TaskStatus;

    if (!board) return;

    // — Optimistic update —
    const prevBoard = structuredClone(board);

    const srcTasks  = [...board[srcCol]];
    const destTasks = srcCol === destCol ? srcTasks : [...board[destCol]];

    const [moved] = srcTasks.splice(source.index, 1);
    const updatedTask = { ...moved, status: destCol };

    if (srcCol === destCol) {
      srcTasks.splice(destination.index, 0, updatedTask);
      setBoard({ ...board, [srcCol]: srcTasks });
    } else {
      destTasks.splice(destination.index, 0, updatedTask);
      setBoard({ ...board, [srcCol]: srcTasks, [destCol]: destTasks });
    }

    // — API call —
    try {
      await taskService.update(draggableId, { status: destCol });
    } catch {
      setBoard(prevBoard);
      setDragError(`Failed to move "${moved.title}". Change reverted.`);
    }
  };

  // ── Loading ──
  if (loading) return (
    <div className="flex justify-center pt-24">
      <Spinner className="h-8 w-8" />
    </div>
  );

  // ── Fetch error ──
  if (error) return (
    <div className="rounded-xl bg-red-50 px-5 py-4 text-sm text-red-600">
      {error}{" "}
      <button onClick={fetchTasks} className="underline font-medium">Retry</button>
    </div>
  );

  if (!board) return null;

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-xl font-bold text-gray-800 sm:text-2xl">Kanban Board</h1>
        <span className="shrink-0 rounded-full bg-white px-3 py-1 text-sm text-gray-400 shadow-sm">
          {Object.values(board).flat().length} tasks
        </span>
      </div>

      {/* Readonly notice for non-privileged users */}
      {!canEdit && (
        <div className="mb-4 rounded-lg bg-blue-50 px-4 py-2 text-sm text-blue-600">
          View only — you do not have permission to move tasks.
        </div>
      )}

      {/* Drag error banner */}
      {dragError && (
        <div className="mb-4 flex items-center justify-between rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600">
          <span>{dragError}</span>
          <button onClick={() => setDragError("")} className="ml-4 text-red-400 hover:text-red-600">✕</button>
        </div>
      )}

      {/* Board — negative margin + padding trick lets columns scroll edge-to-edge on mobile */}
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="-mx-4 overflow-x-auto px-4 pb-4 md:mx-0 md:px-0">
          <div className="flex gap-3" style={{ minWidth: "max-content" }}>
            {COLUMNS.map((col) => (
              <KanbanColumn
                key={col}
                status={col}
                tasks={board[col]}
                color={COLUMN_STYLES[col].bg}
                headerColor={COLUMN_STYLES[col].dot}
                readonly={!canEdit}
              />
            ))}
          </div>
        </div>
      </DragDropContext>
    </div>
  );
};
