import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Camera, Sparkles, UploadCloud, Pencil, X as XIcon } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { projectService } from "@/services";
import type { Project, ProjectStatus, ProjectPriority, UpdateProjectPayload } from "@/types";

interface EditProjectModalProps {
  project: Project;
  open: boolean;
  onClose: () => void;
  onUpdated: (project: Project) => void;
}

const toDateInput = (val?: string | null) => {
  if (!val) return "";
  try {
    const d = new Date(val);
    if (Number.isNaN(d.getTime())) return "";
    return d.toISOString().slice(0, 10);
  } catch {
    return "";
  }
};

export const EditProjectModal = ({ project, open, onClose, onUpdated }: EditProjectModalProps) => {
  const [title, setTitle] = useState(project.title);
  const [description, setDescription] = useState(project.description ?? "");
  const [status, setStatus] = useState<ProjectStatus>(project.status);
  const [priority, setPriority] = useState<ProjectPriority>(project.priority);
  const [deadline, setDeadline] = useState<string>(toDateInput(project.deadline));
  const [coverImage, setCoverImage] = useState<string | null>(project.coverImage ?? null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [coverError, setCoverError] = useState("");

  useEffect(() => {
    if (!open) return;
    setTitle(project.title);
    setDescription(project.description ?? "");
    setStatus(project.status);
    setPriority(project.priority);
    setDeadline(toDateInput(project.deadline));
    setCoverImage(project.coverImage ?? null);
    setError("");
    setCoverError("");
  }, [open, project]);

  const handleImage = (file: File) => {
    if (!file.type.startsWith("image/")) {
      setCoverError("Please choose a valid image file.");
      return;
    }
    if (file.size > 4 * 1024 * 1024) {
      setCoverError("Image must be smaller than 4MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setCoverImage(reader.result as string);
      setCoverError("");
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (event.dataTransfer.files.length) handleImage(event.dataTransfer.files[0]);
  };

  const handleRemoveCover = () => {
    setCoverImage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError("Project name is required.");
      return;
    }
    if (!description.trim()) {
      setError("Description is required.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const payload: UpdateProjectPayload = {
        title: title.trim(),
        description: description.trim(),
        status,
        priority,
        deadline: deadline ? deadline : null,
        coverImage: coverImage ?? null,
      };
      const res = await projectService.update(project._id, payload);
      onUpdated(res.project);
      onClose();
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(message || "Failed to save changes. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Edit project"
      description="Update the details, cover, and status of your project."
      icon={<Pencil className="h-5 w-5" />}
      size="xl"
    >
      <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-4">
          <Input
            id="edit-title"
            label="Project name"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Project name"
            required
          />
          <Textarea
            id="edit-description"
            label="Description"
            rows={5}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe the project vision, goals, and expected outcome."
            className="min-h-[140px]"
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Select id="edit-status" label="Status" value={status} onChange={(e) => setStatus(e.target.value as ProjectStatus)}>
              <option value="Planning">Planning</option>
              <option value="Active">Active</option>
              <option value="Completed">Completed</option>
            </Select>
            <Select id="edit-priority" label="Priority" value={priority} onChange={(e) => setPriority(e.target.value as ProjectPriority)}>
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
            </Select>
          </div>
          <Input
            id="edit-deadline"
            label="Deadline"
            type="date"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            hint="Leave empty to remove the deadline."
          />
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm text-rose-700"
            >
              {error}
            </motion.div>
          )}
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="secondary" onClick={onClose} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" loading={saving}>
              <Sparkles className="h-4 w-4" /> Save changes
            </Button>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-slate-900">Cover image</p>
              <p className="text-xs text-slate-500">Drop in a new image or remove the existing one.</p>
            </div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
              <UploadCloud className="h-3 w-3" /> Optional
            </div>
          </div>
          <div
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            className="group relative overflow-hidden rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-10 text-center transition hover:border-blue-400 hover:bg-blue-50/40"
          >
            {coverImage ? (
              <>
                <img src={coverImage} alt="Cover preview" className="mx-auto h-48 w-full rounded-xl object-cover" />
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={handleRemoveCover}
                  className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-slate-700 shadow-md hover:text-rose-600"
                  aria-label="Remove cover image"
                >
                  <XIcon className="h-4 w-4" />
                </motion.button>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center gap-2 text-slate-500">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-blue-600 shadow-sm">
                  <Camera className="h-6 w-6" />
                </div>
                <p className="text-sm font-semibold text-slate-900">Drop a new cover image</p>
                <p className="text-xs">PNG, JPG, WEBP up to 4MB</p>
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
          {coverError && <p className="text-xs font-medium text-rose-500">{coverError}</p>}
        </div>
      </form>
    </Modal>
  );
};
