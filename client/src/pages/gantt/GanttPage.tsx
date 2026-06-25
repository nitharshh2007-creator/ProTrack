import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Calendar, CheckCircle, Clock, AlertTriangle, BarChart3, Plus } from "lucide-react";
import { projectService } from "@/services";
import type { TimelineItem, TaskStatus } from "@/types";
import { Spinner } from "@/components/ui/Spinner";

const msPerDay = 86_400_000;

const isValidDate = (value: string) => !isNaN(new Date(value).getTime());

const toPercent = (start: Date, end: Date, rangeStart: Date, totalMs: number) => {
  const left = ((start.getTime() - rangeStart.getTime()) / totalMs) * 100;
  const width = ((end.getTime() - start.getTime()) / totalMs) * 100;
  return { left: Math.max(0, left), width: Math.max(0.5, width) };
};

const getStatusColor = (status: TaskStatus) => {
  switch (status) {
    case "Completed": return "bg-green-500";
    case "In Progress": return "bg-blue-500";
    case "Blocked": return "bg-red-500";
    case "Review": return "bg-yellow-500";
    default: return "bg-white dark:bg-slate-800";
  }
};

const getStatusIcon = (status: TaskStatus) => {
  switch (status) {
    case "Completed": return <CheckCircle className="w-4 h-4" />;
    case "In Progress": return <Clock className="w-4 h-4" />;
    case "Blocked": return <AlertTriangle className="w-4 h-4" />;
    case "Review": return <BarChart3 className="w-4 h-4" />;
    default: return <Calendar className="w-4 h-4" />;
  }
};

export const GanttPage = () => {
  const { id } = useParams<{ id: string }>();
  const [items, setItems] = useState<TimelineItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) projectService.getTimeline(id).then((data) => setItems(data.tasks)).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="flex justify-center pt-20"><Spinner className="h-8 w-8" /></div>;
  
  const validItems = items.filter((i) => isValidDate(i.start) && isValidDate(i.end));

  if (!validItems.length) {
    return (
      <div className="w-full">
        <h1 className="mb-8 text-3xl font-bold text-gray-900">Timeline</h1>
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Calendar className="w-16 h-16 text-gray-400 mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No timeline tasks available</h3>
          <p className="text-gray-500 mb-6">Get started by creating your first timeline task</p>
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            <Plus className="w-4 h-4" />
            Create Timeline Task
          </button>
        </div>
      </div>
    );
  }

  const statusCounts = validItems.reduce((acc, item) => {
    acc[item.status] = (acc[item.status] || 0) + 1;
    return acc;
  }, {} as Record<TaskStatus, number>);

  const starts = validItems.map((i) => new Date(i.start).getTime());
  const ends = validItems.map((i) => new Date(i.end).getTime());
  const rangeStart = new Date(Math.min(...starts) - msPerDay);
  const rangeEnd = new Date(Math.max(...ends) + msPerDay);
  const totalMs = rangeEnd.getTime() - rangeStart.getTime();

  return (
    <div className="w-full space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Timeline</h1>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <motion.div 
          whileHover={{ scale: 1.02 }}
          className="bg-white p-4 rounded-xl shadow-sm border border-gray-100"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Tasks</p>
              <p className="text-2xl font-bold text-gray-900">{validItems.length}</p>
            </div>
            <Calendar className="w-8 h-8 text-blue-500" />
          </div>
        </motion.div>
        
        <motion.div 
          whileHover={{ scale: 1.02 }}
          className="bg-white p-4 rounded-xl shadow-sm border border-gray-100"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Completed</p>
              <p className="text-2xl font-bold text-green-600">{statusCounts.Completed || 0}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
        </motion.div>
        
        <motion.div 
          whileHover={{ scale: 1.02 }}
          className="bg-white p-4 rounded-xl shadow-sm border border-gray-100"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">In Progress</p>
              <p className="text-2xl font-bold text-blue-600">{statusCounts["In Progress"] || 0}</p>
            </div>
            <Clock className="w-8 h-8 text-blue-500" />
          </div>
        </motion.div>
        
        <motion.div 
          whileHover={{ scale: 1.02 }}
          className="bg-white p-4 rounded-xl shadow-sm border border-gray-100"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Blocked</p>
              <p className="text-2xl font-bold text-red-600">{statusCounts.Blocked || 0}</p>
            </div>
            <AlertTriangle className="w-8 h-8 text-red-500" />
          </div>
        </motion.div>
      </div>

      {/* Gantt Chart */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-xl font-semibold text-gray-900">Project Timeline</h2>
        </div>
        
        <div className="p-6">
          <div className="space-y-4">
            {validItems.map((item, index) => {
              const { left, width } = toPercent(new Date(item.start), new Date(item.end), rangeStart, totalMs);
              return (
                <motion.div 
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ scale: 1.01 }}
                  className="group"
                >
                  <div className="flex items-center gap-6">
                    <div className="w-64 shrink-0">
                      <div className="flex items-center gap-3">
                        <div className={`flex items-center justify-center w-8 h-8 rounded-full ${getStatusColor(item.status)} text-white`}>
                          {getStatusIcon(item.status)}
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900 text-sm">{item.name}</h3>
                          <p className="text-xs text-gray-500 capitalize">{item.status}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="relative h-8 bg-gray-100 rounded-lg overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${width}%` }}
                          transition={{ duration: 0.8, delay: index * 0.1 }}
                          className={`absolute top-0 h-full rounded-lg ${getStatusColor(item.status)} group-hover:shadow-lg transition-shadow`}
                          style={{ left: `${left}%` }}
                        >
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-xs font-medium text-white">
                              {item.progress}%
                            </span>
                          </div>
                        </motion.div>
                      </div>
                      
                      <div className="flex justify-between mt-2 text-xs text-gray-500">
                        <span>{new Date(item.start).toLocaleDateString()}</span>
                        <span>{new Date(item.end).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
