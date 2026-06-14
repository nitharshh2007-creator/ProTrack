import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { projectService } from "@/services";
import type { CreateProjectPayload } from "@/types";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";

const emptyForm = (): CreateProjectPayload => ({
  title: "",
  description: "",
  status: "Planning",
  priority: "Medium",
  deadline: "",
});

export const CreateProjectPage = () => {
  const navigate = useNavigate();

  const [form, setForm] = useState<CreateProjectPayload>(emptyForm());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const set =
    (field: keyof CreateProjectPayload) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.title.trim()) {
      setError("Title is required.");
      return;
    }
    if (!form.description.trim()) {
      setError("Description is required.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      await projectService.create({
        ...form,
        deadline: form.deadline || undefined,
      });
      navigate("/projects");
    } catch {
      setError("Failed to create project. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Create Project</h1>
        <p className="mt-1 text-sm text-gray-500">Fill in the details to start a new project.</p>
      </div>

      <form onSubmit={handleSubmit} noValidate className="rounded-xl bg-white p-6 shadow-sm space-y-5">
        <Input
          id="title"
          label="Title"
          placeholder="Enter project title"
          value={form.title}
          onChange={set("title")}
          required
        />

        <div className="flex flex-col gap-1">
          <label htmlFor="description" className="text-sm font-medium text-gray-700">
            Description
          </label>
          <textarea
            id="description"
            rows={4}
            placeholder="Describe the project..."
            value={form.description}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, description: e.target.value }))
            }
            className="rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Select id="status" label="Status" value={form.status} onChange={set("status")}>
            <option value="Planning">Planning</option>
            <option value="Active">Active</option>
            <option value="Completed">Completed</option>
          </Select>

          <Select id="priority" label="Priority" value={form.priority} onChange={set("priority")}>
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
          </Select>
        </div>

        <Input
          id="deadline"
          label="Deadline (optional)"
          type="date"
          value={form.deadline ?? ""}
          onChange={set("deadline")}
        />

        {error && (
          <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
        )}

        <div className="flex justify-end gap-3 pt-1">
          <Button
            type="button"
            variant="secondary"
            onClick={() => navigate("/projects")}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button type="submit" loading={saving}>
            Create Project
          </Button>
        </div>
      </form>
    </div>
  );
};
