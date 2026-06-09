import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { projectService } from "@/services";
import type { TimelineItem } from "@/types";
import { Spinner } from "@/components/ui/Spinner";

const msPerDay = 86_400_000;

const isValidDate = (value: string) => !isNaN(new Date(value).getTime());

const toPercent = (start: Date, end: Date, rangeStart: Date, totalMs: number) => {
  const left = ((start.getTime() - rangeStart.getTime()) / totalMs) * 100;
  const width = ((end.getTime() - start.getTime()) / totalMs) * 100;
  return { left: Math.max(0, left), width: Math.max(0.5, width) };
};

export const GanttPage = () => {
  const { id } = useParams<{ id: string }>();
  const [items, setItems] = useState<TimelineItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) projectService.getTimeline(id).then(setItems).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="flex justify-center pt-20"><Spinner className="h-8 w-8" /></div>;
  // Filter out items with missing or invalid dates before rendering
  const validItems = items.filter((i) => isValidDate(i.start) && isValidDate(i.end));

  if (!validItems.length) return <p className="text-gray-500">No tasks with valid dates found.</p>;

  const starts = validItems.map((i) => new Date(i.start).getTime());
  const ends = validItems.map((i) => new Date(i.end).getTime());
  const rangeStart = new Date(Math.min(...starts) - msPerDay);
  const rangeEnd = new Date(Math.max(...ends) + msPerDay);
  const totalMs = rangeEnd.getTime() - rangeStart.getTime();

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-gray-800">Gantt Timeline</h1>
      <div className="rounded-xl bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-3">
          {validItems.map((item) => {
            const { left, width } = toPercent(new Date(item.start), new Date(item.end), rangeStart, totalMs);
            return (
              <div key={item.id} className="flex items-center gap-4">
                <span className="w-40 shrink-0 truncate text-sm text-gray-700">{item.name}</span>
                <div className="relative flex-1 h-6 rounded bg-gray-100">
                  <div
                    className="absolute top-0 h-full rounded bg-blue-500"
                    style={{ left: `${left}%`, width: `${width}%` }}
                  >
                    <span className="absolute inset-0 flex items-center justify-center text-xs text-white font-medium">
                      {item.progress}%
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
