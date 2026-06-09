import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { taskService, projectService, userService } from "@/services";
import type { Task, CreateTaskPayload, TaskStatus, TaskPriority, Project, User } from "@/types";

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

const toDateInput = (iso: string) => iso.slice(0, 10);

const defaultForm = (): FormState => ({
  title: "",
  description: "",
  startDate: "",
  dueDate: "",
  project: "",
  assignedTo: "",
  status: "Todo",
  priority: "Medium",
});

export const TaskModal = ({ task, onClose, onSaved }: TaskModalProps) => {
  const [form, setForm] = useState<FormState>(
    task
      ? {
          title: task.title,
          description: task.description,
          startDate: toDateInput(task.startDate),
          dueDate: toDateInput(task.dueDate),
          project: task.project._id,
          assignedTo: task.assignedTo._id,
          status: task.status,
          priority: task.priority,
        }
      : defaultForm()
  );
  const [projects, setProjects] = useState<Project[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [dropdownLoading, setDropdownLoading] = useState(true);
  const [dropdownError, setDropdownError] = useState("");
  const [errors, setErrors] = useState<Partial<FormState>>({});
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState("");

  useEffect(() => {
    setDropdownLoading(true);
    setDropdownError("");
    Promise.all([projectService.getAll(), userService.getAll()])
      .then(([p, u]) => {
        console.log("[TaskModal] projects:", p);
        console.log("[TaskModal] users:", u);
        setProjects(p);
        setUsers(u);
      })
      .catch((err) => {
        console.error("[TaskModal] failed to load dropdown data:", err);
        setDropdownError("Failed to load projects or users.");
      })
      .finally(() => setDropdownLoading(false));
  }, []);

  const handleProjectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setForm((prev) => ({ ...prev, project: e.target.value, assignedTo: "" }));
  };

  const set = (field: keyof FormState) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const validate = (): boolean => {
    const e: Partial<FormState> = {};
    if (!form.title.trim()) e.title = "Required";
    if (!form.description.trim()) e.description = "Required";
    if (!form.startDate) e.startDate = "Required";
    if (!form.dueDate) e.dueDate = "Required";
    if (form.startDate && form.dueDate && form.startDate > form.dueDate)
      e.dueDate = "Must be on or after start date";
    if (!form.project) e.project = "Required";
    if (!form.assignedTo) e.assignedTo = "Required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setApiError("");
    setSubmitting(true);
    try {
      const payload: CreateTaskPayload = {
        title: form.title.trim(),
        description: form.description.trim(),
        startDate: form.startDate,
        dueDate: form.dueDate,
        project: form.project,
        assignedTo: form.assignedTo,
        status: form.status,
        priority: form.priority,
      };
      const result = task
        ? await taskService.update(task._id, payload)
        : await taskService.create(payload);
      onSaved(result.task);
    } catch {
      setApiError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal title={task ? "Edit Task" : "Create Task"} onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          label="Title"
          id="title"
          value={form.title}
          onChange={set("title")}
          error={errors.title}
          placeholder="Task title"
        />

        <div className="flex flex-col gap-1">
          <label htmlFor="description" className="text-sm font-medium text-gray-700">
            Description
          </label>
          <textarea
            id="description"
            rows={3}
            value={form.description}
            onChange={set("description")}
            placeholder="Task description"
            className={`rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 resize-none ${errors.description ? "border-red-500" : "border-gray-300"}`}
          />
          {errors.description && <span className="text-xs text-red-500">{errors.description}</span>}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Start Date"
            id="startDate"
            type="date"
            value={form.startDate}
            onChange={set("startDate")}
            error={errors.startDate}
          />
          <Input
            label="Due Date"
            id="dueDate"
            type="date"
            value={form.dueDate}
            onChange={set("dueDate")}
            error={errors.dueDate}
          />
        </div>

        {dropdownError && (
          <p className="text-xs text-red-500">{dropdownError}</p>
        )}

        <Select
          label="Project"
          id="project"
          value={form.project}
          onChange={handleProjectChange}
          error={errors.project}
          disabled={dropdownLoading}
        >
          <option value="">
            {dropdownLoading ? "Loading..." : "Select project"}
          </option>
          {!dropdownLoading && projects.length === 0 && (
            <option disabled value="">No projects found</option>
          )}
          {projects.map((p) => (
            <option key={p._id} value={p._id}>{p.title}</option>
          ))}
        </Select>

        <Select
          label="Assign To"
          id="assignedTo"
          value={form.assignedTo}
          onChange={set("assignedTo")}
          error={errors.assignedTo}
          disabled={dropdownLoading}
        >
          <option value="">
            {dropdownLoading ? "Loading..." : "Select user"}
          </option>
          {!dropdownLoading && users.length === 0 && (
            <option disabled value="">No members found</option>
          )}
          {users.map((u) => (
            <option key={u._id} value={u._id}>{u.name} ({u.role})</option>
          ))}
        </Select>

        <div className="grid grid-cols-2 gap-3">
          <Select label="Status" id="status" value={form.status} onChange={set("status")}>
            {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </Select>
          <Select label="Priority" id="priority" value={form.priority} onChange={set("priority")}>
            {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
          </Select>
        </div>

        {apiError && <p className="text-sm text-red-500">{apiError}</p>}

        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={submitting}>
            {task ? "Save Changes" : "Create Task"}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
