import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Camera, Sparkles, UploadCloud } from "lucide-react";
import { projectService } from "@/services";
import type { CreateProjectPayload } from "@/types";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { getStoredJson, setStoredJson } from "@/lib/storage";

const FORM_STORAGE_KEY = "protrack:create-project-form";

const emptyForm = (): CreateProjectPayload => getStoredJson<CreateProjectPayload>(FORM_STORAGE_KEY, {
  title: "",
  description: "",
  status: "Planning",
  priority: "Medium",
  deadline: "",
  coverImage: undefined,
});

export const CreateProjectPage = () => {
  const navigate = useNavigate();

  const [form, setForm] = useState<CreateProjectPayload>(emptyForm());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const setField =
    (field: keyof CreateProjectPayload) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm((prev) => {
        const next = { ...prev, [field]: e.target.value };
        setStoredJson(FORM_STORAGE_KEY, next);
        return next;
      });

  const handleImage = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      setForm((prev) => {
        const next = { ...prev, coverImage: reader.result as string };
        setStoredJson(FORM_STORAGE_KEY, next);
        return next;
      });
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (event.dataTransfer.files.length) {
      handleImage(event.dataTransfer.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.title?.trim()) {
      setError("Project name is required.");
      return;
    }
    if (!form.description?.trim()) {
      setError("Project description is required.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      await projectService.create({
        ...form,
        deadline: form.deadline || undefined,
      });
      localStorage.removeItem(FORM_STORAGE_KEY);
      navigate("/projects");
    } catch {
      setError("Failed to create project. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div className="rounded-[32px] border border-white/10 bg-white/5 p-8 shadow-card backdrop-blur-xl">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Create project</p>
            <h1 className="mt-2 text-3xl font-semibold text-white">Launch your next project</h1>
            <p className="mt-3 max-w-2xl text-sm text-slate-400">Add a cover, define goals, and move it quickly into your workspace pipeline.</p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-3xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-300 shadow-lg">
            <Sparkles className="h-4 w-4 text-blue-400" />
            Draft saved locally
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-6 rounded-[32px] border border-white/10 bg-white/5 p-8 shadow-card backdrop-blur-xl">
          <div className="space-y-4">
            <label className="text-sm font-semibold uppercase tracking-[0.28em] text-slate-400">Project details</label>
            <Input
              id="title"
              label="Project name"
              placeholder="Project Aurora"
              value={form.title}
              onChange={setField("title")}
              required
            />
            <div className="flex flex-col gap-2">
              <label htmlFor="description" className="text-sm font-semibold uppercase tracking-[0.28em] text-slate-400">Description</label>
              <textarea
                id="description"
                rows={5}
                value={form.description}
                onChange={setField("description")}
                placeholder="Describe the project vision, goals, and expected outcome."
                className="min-h-[140px] rounded-3xl border border-white/10 bg-white/5 px-4 py-4 text-sm text-white outline-none transition focus:border-blue-500/60 focus:ring-2 focus:ring-blue-500/20 resize-none"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Select id="status" label="Status" value={form.status} onChange={setField("status")}> 
              <option value="Planning">Planning</option>
              <option value="Active">Active</option>
              <option value="Completed">Completed</option>
            </Select>
            <Select id="priority" label="Priority" value={form.priority} onChange={setField("priority")}> 
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
            </Select>
          </div>

          <Input
            id="deadline"
            label="Deadline"
            type="date"
            value={form.deadline ?? ""}
            onChange={setField("deadline")}
          />

          {error && <div className="rounded-3xl bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</div>}

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
            <Button type="button" variant="secondary" onClick={() => navigate("/projects")} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" loading={saving}>
              Create project
            </Button>
          </div>
        </div>

        <div className="space-y-6 rounded-[32px] border border-white/10 bg-white/5 p-8 shadow-card backdrop-blur-xl">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-white">Project cover</p>
              <p className="text-sm text-slate-400">Add an image to give your project a premium cover.</p>
            </div>
            <div className="inline-flex items-center gap-2 rounded-3xl bg-slate-950/70 px-3 py-1 text-xs text-slate-400">
              <UploadCloud className="h-4 w-4" /> Optional
            </div>
          </div>

          <div
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            className="group relative rounded-[28px] border border-dashed border-white/10 bg-white/5 px-5 py-12 text-center transition hover:border-blue-400/50 hover:bg-white/10"
          >
            {form.coverImage ? (
              <img src={form.coverImage} alt="Cover preview" className="mx-auto h-52 w-full max-w-full rounded-3xl object-cover" />
            ) : (
              <div className="flex flex-col items-center justify-center gap-3 text-slate-400">
                <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-slate-950/70 text-blue-300">
                  <Camera className="h-7 w-7" />
                </div>
                <p className="text-sm font-semibold text-white">Drag & drop an image here</p>
                <p className="text-sm">or click to upload</p>
              </div>
            )}
            <input
              type="file"
              accept="image/*"
              className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleImage(file);
              }}
            />
          </div>

          {form.coverImage && (
            <div className="rounded-3xl bg-slate-950/60 p-4 text-sm text-slate-300">
              <p className="font-semibold text-white">Preview ready</p>
              <p className="mt-2 text-slate-400">Your cover image will display on the project card and detail header.</p>
            </div>
          )}
        </div>
      </form>
    </div>
  );
};
