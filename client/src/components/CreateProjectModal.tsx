import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Calendar, AlertCircle, CheckCircle, Upload } from "lucide-react";
import { projectService } from "@/services";
import type { CreateProjectPayload } from "@/types";
import { getStoredJson, setStoredJson } from "@/lib/storage";

const FORM_STORAGE_KEY = "protrack:create-project-modal";

const emptyForm = (): CreateProjectPayload => getStoredJson<CreateProjectPayload>(FORM_STORAGE_KEY, {
  title: "",
  description: "",
  status: "Planning",
  priority: "Medium",
  deadline: "",
  coverImage: undefined,
});

const statusColors = {
  Planning: "from-blue-500 to-blue-600",
  Active: "from-green-500 to-green-600",
  Completed: "from-gray-500 to-gray-600",
};

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const CreateProjectModal = ({ isOpen, onClose, onSuccess }: CreateProjectModalProps) => {
  const [form, setForm] = useState<CreateProjectPayload>(emptyForm());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(form.coverImage || null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const setField =
    (field: keyof CreateProjectPayload) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      setForm((prev) => {
        const next = { ...prev, [field]: e.target.value };
        setStoredJson(FORM_STORAGE_KEY, next);
        return next;
      });
    };

  const handleImage = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      setImagePreview(base64);
      setForm((prev) => {
        const next = { ...prev, coverImage: base64 };
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

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleImage(file);
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
      setForm(emptyForm());
      setImagePreview(null);
      onSuccess();
      onClose();
    } catch {
      setError("Failed to create project. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    if (!saving) {
      setError("");
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", duration: 0.35 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="w-full max-w-4xl rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 shadow-2xl backdrop-blur-[20px] overflow-hidden max-h-[90vh]">
              {/* Header */}
              <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-800 px-10 py-6">
                <div>
                  <h2 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Create New Project</h2>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">Set up your project with all the details</p>
                </div>
                <button
                  onClick={handleClose}
                  disabled={saving}
                  className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              {/* Content */}
              <form onSubmit={handleSubmit} className="p-10 overflow-y-auto max-h-[calc(90vh-200px)]">
                <div className="grid gap-10 lg:grid-cols-[1.3fr_1fr]">
                  {/* Form Section */}
                  <div className="space-y-6">
                    {/* Project Name */}
                    <div>
                      <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 block mb-2">
                        Project Name *
                      </label>
                      <input
                        type="text"
                        placeholder="e.g., Project Aurora"
                        value={form.title}
                        onChange={setField("title")}
                        disabled={saving}
                        className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-5 py-3 text-base text-slate-900 dark:text-slate-100 placeholder-slate-400 outline-none transition-all duration-300 hover:border-blue-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50"
                        required
                      />
                    </div>

                    {/* Description */}
                    <div>
                      <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 block mb-2">
                        Description *
                      </label>
                      <textarea
                        rows={4}
                        placeholder="Describe your project vision, goals, and expected outcome..."
                        value={form.description}
                        onChange={setField("description")}
                        disabled={saving}
                        className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-5 py-3 text-base text-slate-900 dark:text-slate-100 placeholder-slate-400 outline-none transition-all duration-300 hover:border-blue-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 resize-none disabled:opacity-50"
                        required
                      />
                    </div>

                    {/* Status & Priority */}
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 block mb-2">
                          Status
                        </label>
                        <select
                          value={form.status}
                          onChange={setField("status")}
                          disabled={saving}
                          className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-5 py-3 text-base text-slate-900 dark:text-slate-100 outline-none transition-all duration-300 hover:border-blue-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50 appearance-none"
                        >
                          <option value="Planning">Planning</option>
                          <option value="Active">Active</option>
                          <option value="Completed">Completed</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 block mb-2">
                          Priority
                        </label>
                        <select
                          value={form.priority}
                          onChange={setField("priority")}
                          disabled={saving}
                          className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-5 py-3 text-base text-slate-900 dark:text-slate-100 outline-none transition-all duration-300 hover:border-blue-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50 appearance-none"
                        >
                          <option value="Low">Low</option>
                          <option value="Medium">Medium</option>
                          <option value="High">High</option>
                        </select>
                      </div>
                    </div>

                    {/* Deadline */}
                    <div>
                      <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 block mb-2">
                        Deadline (Optional)
                      </label>
                      <input
                        type="date"
                        value={form.deadline ?? ""}
                        onChange={setField("deadline")}
                        disabled={saving}
                        className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-5 py-3 text-base text-slate-900 dark:text-slate-100 outline-none transition-all duration-300 hover:border-blue-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50"
                      />
                    </div>

                    {/* Cover Image */}
                    <div>
                      <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 block mb-2">
                        Cover Image (Optional)
                      </label>
                      {imagePreview ? (
                        <motion.div
                          initial={{ scale: 0.95, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          className="relative rounded-2xl overflow-hidden border-2 border-blue-400/50"
                        >
                          <img src={imagePreview} alt="Cover" className="w-full h-28 object-cover" />
                          <button
                            type="button"
                            onClick={() => {
                              setImagePreview(null);
                              setForm((prev) => ({ ...prev, coverImage: undefined }));
                              setStoredJson(FORM_STORAGE_KEY, { ...form, coverImage: undefined });
                            }}
                            disabled={saving}
                            className="absolute right-3 top-3 rounded-lg bg-red-500 px-3 py-2 text-xs font-semibold text-white hover:bg-red-600 disabled:opacity-50 transition-colors"
                          >
                            Remove
                          </button>
                        </motion.div>
                      ) : (
                        <div
                          onDrop={handleDrop}
                          onDragOver={(e) => e.preventDefault()}
                          onClick={handleUploadClick}
                          className="rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50/50 px-6 py-8 text-center transition hover:border-blue-400 hover:bg-blue-50/50 cursor-pointer"
                        >
                          <div className="flex flex-col items-center gap-2">
                            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100">
                              <Upload className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                              <p className="font-medium text-slate-900 text-sm">Click or drag image</p>
                              <p className="text-xs text-slate-500 mt-0.5">PNG, JPG (max 10MB)</p>
                            </div>
                          </div>
                        </div>
                      )}
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        disabled={saving}
                        className="hidden"
                      />
                    </div>

                    {/* Error */}
                    {error && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="rounded-2xl border border-red-200/60 bg-red-50/80 px-5 py-3 text-sm text-red-700 flex items-center gap-3"
                      >
                        <AlertCircle className="h-5 w-5 shrink-0" />
                        {error}
                      </motion.div>
                    )}
                  </div>

                  {/* Preview Section */}
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="hidden lg:flex flex-col"
                  >
                    <h3 className="text-sm font-bold text-slate-600 uppercase tracking-[0.15em] mb-4">Preview</h3>

                    <div className="space-y-4 rounded-2xl border border-slate-100 bg-slate-50/50 p-5">
                      {/* Cover */}
                      {imagePreview ? (
                        <motion.img
                          key={imagePreview}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          src={imagePreview}
                          alt="Cover"
                          className="w-full h-24 rounded-lg object-cover"
                        />
                      ) : (
                        <div
                          className={`w-full h-24 rounded-lg bg-gradient-to-br ${statusColors[form.status]} flex items-center justify-center text-white text-3xl font-bold`}
                        >
                          {form.title?.charAt(0).toUpperCase() || "?"}
                        </div>
                      )}

                      <div className="space-y-3 border-t border-slate-200 pt-4">
                        {/* Title */}
                        <div>
                          <p className="text-xs font-bold text-slate-500 uppercase tracking-[0.1em]">Title</p>
                          <p className="mt-1 text-base font-bold text-slate-900">{form.title || "Untitled Project"}</p>
                        </div>

                        {/* Description */}
                        <div>
                          <p className="text-xs font-bold text-slate-500 uppercase tracking-[0.1em]">Description</p>
                          <p className="mt-1 text-xs text-slate-600 line-clamp-2">
                            {form.description || "No description yet"}
                          </p>
                        </div>

                        {/* Status & Priority */}
                        <div className="grid grid-cols-2 gap-2 pt-2">
                          <div>
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-[0.1em]">Status</p>
                            <div className="mt-1 inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-bold text-blue-700">
                              <div className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                              {form.status}
                            </div>
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-[0.1em]">Priority</p>
                            <p className="mt-1 text-xs font-bold text-slate-900">{form.priority}</p>
                          </div>
                        </div>

                        {/* Deadline */}
                        {form.deadline && (
                          <div className="rounded-lg bg-slate-100 p-2 flex items-center gap-2 text-xs">
                            <Calendar className="h-3.5 w-3.5 text-slate-600 shrink-0" />
                            <div>
                              <p className="text-slate-600">Deadline</p>
                              <p className="font-bold text-slate-900">{new Date(form.deadline).toLocaleDateString()}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                </div>
              </form>

              {/* Footer */}
              <div className="border-t border-slate-100 dark:border-slate-800 px-10 py-6 flex gap-3 bg-white dark:bg-slate-900/50">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={saving}
                  className="rounded-2xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-6 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  onClick={handleSubmit}
                  disabled={saving || !form.title?.trim() || !form.description?.trim()}
                  className="ml-auto rounded-2xl bg-gradient-to-r from-blue-600 to-blue-500 px-6 py-2.5 text-sm font-semibold text-white hover:from-blue-500 hover:to-blue-400 transition-all disabled:opacity-50 flex items-center gap-2 shadow-lg hover:shadow-xl"
                >
                  {saving ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      <span>Creating...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4" />
                      <span>Create Project</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
