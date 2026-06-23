import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { taskService, projectService, userService } from "@/services";
import type { Task, CreateTaskPayload, TaskStatus, TaskPriority, Project, User } from "@/types";
import { X, SquareKanban, Upload, FileText, Paperclip, Trash2, Image, Video, File, RefreshCw } from "lucide-react";

const STATUSES: TaskStatus[] = ["Todo", "In Progress", "Review", "Blocked", "Completed"];
const PRIORITIES: TaskPriority[] = ["Low", "Medium", "High"];

interface TaskModalProps {
  task?: Task;
  onClose: () => void;
  onSaved: (task: Task) => void;
}

interface FormState {
  title: string;
  description: string;
  startDate: string;
  dueDate: string;
  project: string;
  assignedTo: string;
  status: TaskStatus;
  priority: TaskPriority;
}

interface FileChip { id: string; file: File; url: string; }

const toDateInput = (iso: string) => iso.slice(0, 10);
const defaultForm = (): FormState => ({
  title: "", description: "", startDate: "", dueDate: "",
  project: "", assignedTo: "", status: "Todo", priority: "Medium",
});

const fileIcon = (name: string) => {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  if (["jpg","jpeg","png","gif","webp","svg"].includes(ext)) return <Image className="h-4 w-4 text-blue-500" />;
  if (ext === "pdf") return <FileText className="h-4 w-4 text-red-500" />;
  if (["mp4","mov","webm","avi"].includes(ext)) return <Video className="h-4 w-4 text-purple-500" />;
  if (["docx","doc"].includes(ext)) return <FileText className="h-4 w-4 text-blue-600" />;
  if (["xlsx","xls"].includes(ext)) return <FileText className="h-4 w-4 text-green-600" />;
  if (["ppt","pptx"].includes(ext)) return <FileText className="h-4 w-4 text-orange-500" />;
  if (ext === "zip") return <File className="h-4 w-4 text-purple-600" />;
  return <File className="h-4 w-4 text-gray-500" />;
};

export const TaskModal = ({ task, onClose, onSaved }: TaskModalProps) => {
  const [form, setForm] = useState<FormState>(
    task
      ? { title: task.title, description: task.description, startDate: toDateInput(task.startDate),
          dueDate: toDateInput(task.dueDate), project: task.project._id, assignedTo: task.assignedTo._id,
          status: task.status, priority: task.priority }
      : defaultForm()
  );
  const [projects, setProjects] = useState<Project[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [dropdownLoading, setDropdownLoading] = useState(true);
  const [dropdownError, setDropdownError] = useState("");
  const [errors, setErrors] = useState<Partial<FormState>>({});
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState("");
  const [files, setFiles] = useState<FileChip[]>([]);
  const [dragging, setDragging] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const loadDropdowns = (silent = false) => {
    if (!silent) setDropdownLoading(true);
    Promise.all([projectService.getAll(), userService.getAll()])
      .then(([p, u]) => { setProjects(p); setUsers(u); })
      .catch(() => setDropdownError("Failed to load projects or users."))
      .finally(() => { if (!silent) setDropdownLoading(false); });
  };

  useEffect(() => { loadDropdowns(); }, []);

  const handleRefreshUsers = () => {
    setRefreshing(true);
    userService.getAll()
      .then((u) => setUsers(u))
      .catch(() => {})
      .finally(() => setRefreshing(false));
  };

  const set = (field: keyof FormState) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const addFiles = (fl: FileList | null) => {
    if (!fl) return;
    setFiles((p) => [...p, ...Array.from(fl).map((f) => ({ 
      id: crypto.randomUUID(), 
      file: f,
      url: URL.createObjectURL(f)
    }))]);
  };

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setDragging(false); addFiles(e.dataTransfer.files);
  }, []);

  const validate = (): boolean => {
    const e: Partial<FormState> = {};
    if (!form.title.trim()) e.title = "Required";
    if (!form.description.trim()) e.description = "Required";
    if (!form.startDate) e.startDate = "Required";
    if (!form.dueDate) e.dueDate = "Required";
    if (form.startDate && form.dueDate && form.startDate > form.dueDate) e.dueDate = "Must be on or after start date";
    if (!form.project) e.project = "Required";
    if (!form.assignedTo) e.assignedTo = "Required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setApiError(""); setSubmitting(true);
    try {
      const payload: CreateTaskPayload = {
        title: form.title.trim(), 
        description: files.length > 0 
          ? `${form.description.trim()}\n\nAttached files: ${files.map(f => f.file.name).join(', ')}`
          : form.description.trim(),
        startDate: form.startDate, dueDate: form.dueDate,
        project: form.project, assignedTo: form.assignedTo,
        status: form.status, priority: form.priority,
      };
      const result = task ? await taskService.update(task._id, payload) : await taskService.create(payload);
      onSaved(result.task);
    } catch {
      setApiError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.93, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.93, y: 20 }}
          transition={{ type: "spring", stiffness: 380, damping: 28 }}
          className="relative z-10 w-full max-w-xl rounded-2xl bg-white dark:bg-slate-900 shadow-2xl overflow-hidden max-h-[92vh] flex flex-col"
        >
          {/* Header — gradient glassmorphism */}
          <div
            className="flex items-center justify-between px-6 py-4 shrink-0"
            style={{ background: "linear-gradient(135deg,#0F172D,#1E3A8A,#2563EB)" }}
          >
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/15">
                <SquareKanban className="h-4 w-4 text-white" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-white">{task ? "Edit Task" : "Create Task"}</h2>
                <p className="text-xs text-white/60">Fill in the details below</p>
              </div>
            </div>
            <button onClick={onClose} className="rounded-lg p-1.5 text-white/60 hover:bg-white/15 hover:text-white transition shrink-0">
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Body - scrollable */}
          <div className="flex-1 overflow-y-auto">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4 px-6 py-5">

            <Input label="Title" id="title" value={form.title} onChange={set("title")}
              error={errors.title} placeholder="e.g. Design the onboarding flow"
              className="" />

            {/* Description */}
            <div className="flex flex-col gap-1">
              <label htmlFor="description" className="text-sm font-medium text-slate-700 dark:text-slate-300">Description</label>
              <textarea
                id="description" rows={3} value={form.description} onChange={set("description")}
                placeholder="Describe what needs to be done…"
                className={`w-full resize-none rounded-xl border px-3 py-2.5 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100 placeholder:text-slate-400 ${
                  errors.description ? "border-red-400" : "border-slate-200 dark:border-slate-700"
                }`}
              />
              {errors.description && <span className="text-xs text-red-500">{errors.description}</span>}
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-3">
              <Input label="Start Date" id="startDate" type="date" value={form.startDate} onChange={set("startDate")} error={errors.startDate}
                className="" />
              <Input label="Due Date" id="dueDate" type="date" value={form.dueDate} onChange={set("dueDate")} error={errors.dueDate}
                className="" />
            </div>

            {dropdownError && <p className="text-xs text-red-500">{dropdownError}</p>}

            {/* Project + Assignee */}
            <div className="grid grid-cols-2 gap-3">
              <Select label="Project" id="project" value={form.project} onChange={(e) => setForm((p) => ({ ...p, project: e.target.value, assignedTo: "" }))}
                error={errors.project} disabled={dropdownLoading} className="">
                <option value="">{dropdownLoading ? "Loading…" : "Select project"}</option>
                {projects.map((p) => <option key={p._id} value={p._id}>{p.title}</option>)}
              </Select>
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <label htmlFor="assignedTo" className="text-sm font-medium text-slate-700 dark:text-slate-300">Assignee</label>
                  <button
                    type="button"
                    onClick={handleRefreshUsers}
                    disabled={refreshing || dropdownLoading}
                    title="Refresh members"
                    className="rounded-lg p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition disabled:opacity-40"
                  >
                    <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
                  </button>
                </div>
                <select
                  id="assignedTo"
                  value={form.assignedTo}
                  onChange={set("assignedTo")}
                  disabled={dropdownLoading}
                  className={`w-full rounded-xl border px-3 py-2.5 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100 ${
                    errors.assignedTo ? "border-red-400" : "border-slate-200 dark:border-slate-700"
                  } disabled:opacity-60`}
                >
                  <option value="">{dropdownLoading ? "Loading…" : "Select member"}</option>
                  {users.map((u) => <option key={u._id} value={u._id}>{u.name}</option>)}
                </select>
                {errors.assignedTo && <span className="text-xs text-red-500">{errors.assignedTo}</span>}
              </div>
            </div>

            {/* Status + Priority */}
            <div className="grid grid-cols-2 gap-3">
              <Select label="Status" id="status" value={form.status} onChange={set("status")} className="">
                {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </Select>
              <Select label="Priority" id="priority" value={form.priority} onChange={set("priority")} className="">
                {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
              </Select>
            </div>

            {/* File upload area */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Attachments</label>
              <input ref={fileRef} type="file" multiple className="hidden" onChange={(e) => addFiles(e.target.files)} />
              <div
                onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={onDrop}
                onClick={() => fileRef.current?.click()}
                className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed py-6 transition ${
                  dragging ? "border-blue-400 bg-blue-50 dark:bg-blue-900/20" : "border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 hover:border-blue-300 hover:bg-blue-50/50 dark:hover:bg-blue-900/20"
                }`}
              >
                <Upload className={`h-6 w-6 transition ${dragging ? "text-blue-500" : "text-slate-300"}`} />
                <p className="text-xs text-slate-400">
                  Drag files here or <span className="font-semibold text-blue-600">Browse Files</span>
                </p>
                <p className="text-[10px] text-slate-300">Images, PDFs, DOCX, XLSX, PPT, ZIP, Video</p>
              </div>

              {/* File chips */}
              {files.length > 0 && (
                <div className="mt-2 flex flex-col gap-1.5">
                  {files.map((chip) => (
                    <div key={chip.id} className="flex items-center justify-between rounded-xl border border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 px-3 py-2">
                      <div className="flex items-center gap-2 min-w-0">
                        {fileIcon(chip.file.name)}
                        <a 
                          href={chip.url}
                          download={chip.file.name}
                          className="truncate text-xs text-gray-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:underline cursor-pointer"
                          title="Click to download"
                        >
                          {chip.file.name}
                        </a>
                        <span className="shrink-0 text-xs text-gray-400 dark:text-slate-500">({(chip.file.size / 1024).toFixed(0)} KB)</span>
                      </div>
                      <button type="button" onClick={() => {
                        URL.revokeObjectURL(chip.url);
                        setFiles((p) => p.filter((c) => c.id !== chip.id));
                      }}
                        className="ml-2 rounded-lg p-1 text-gray-400 dark:text-slate-500 hover:text-red-500 hover:bg-red-50 dark:hover:text-red-400 dark:hover:bg-red-900/20 transition">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </form>
          </div>

          {/* Footer - always visible */}
          {apiError && <div className="px-6 py-2 border-t border-slate-200 dark:border-slate-800"><p className="text-sm text-red-500">{apiError}</p></div>}
          <div className="flex justify-end gap-2 px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 shrink-0">
            <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
            <Button type="submit" onClick={handleSubmit} loading={submitting}>{task ? "Save Changes" : "Create Task"}</Button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
