import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, CheckCircle, Rocket, Calendar, AlertCircle, Edit } from "lucide-react";
import { projectService } from "@/services";
import type { CreateProjectPayload } from "@/types";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { getStoredJson, setStoredJson } from "@/lib/storage";
import { useAuth } from "@/store/auth.store";

const FORM_STORAGE_KEY = "protrack:create-project-form";

const emptyForm = (): CreateProjectPayload => getStoredJson<CreateProjectPayload>(FORM_STORAGE_KEY, {
  title: "",
  description: "",
  status: "Planning",
  priority: "Medium",
  deadline: "",
  coverImage: undefined,
  teamMembers: [],
});

const statusColors = {
  Planning: "from-blue-500 to-blue-600",
  Active: "from-green-500 to-green-600",
  Completed: "from-gray-500 to-gray-600",
};

export const CreateProjectPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { token: authToken, user } = useAuth();
  const isEditing = Boolean(id);
  
  const [form, setForm] = useState<CreateProjectPayload>(emptyForm());
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [step, setStep] = useState(1);
  const [imagePreview, setImagePreview] = useState<string | null>(form.coverImage || null);
  const [teamMembers, setTeamMembers] = useState<Array<{ _id: string; name: string; email: string }>>([]);
  const [selectedTeamMembers, setSelectedTeamMembers] = useState<string[]>(form.teamMembers || []);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const coverFileRef = useRef<HTMLInputElement>(null);
  const baseURL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

  useEffect(() => {
    const fetchTeamMembers = async () => {
      if (!authToken) return;
      try {
        setLoadingMembers(true);
        const res = await fetch(`${baseURL}/team/members`, {
          headers: { Authorization: `Bearer ${authToken}` },
        });
        if (res.ok) {
          const data = await res.json();
          setTeamMembers(data.members || []);
        }
      } catch (err) {
        console.error("Failed to load team members", err);
      } finally {
        setLoadingMembers(false);
      }
    };
    void fetchTeamMembers();
  }, [authToken, baseURL]);

  useEffect(() => {
    if (isEditing && id) {
      setLoading(true);
      projectService.getById(id)
        .then((project) => {
          const mIds = project.teamMembers?.map((m) => m._id) || [];
          const formData = {
            title: project.title,
            description: project.description,
            status: project.status,
            priority: project.priority || 'Medium',
            deadline: project.deadline ? project.deadline.split('T')[0] : '',
            coverImage: project.coverImage,
            teamMembers: mIds,
          };
          setForm(formData);
          setSelectedTeamMembers(mIds);
          setImagePreview(project.coverImage || null);
        })
        .catch(() => {
          setError('Failed to load project data.');
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [isEditing, id]);

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
      if (isEditing && id) {
        await projectService.update(id, {
          ...form,
          deadline: form.deadline || undefined,
        });
      } else {
        await projectService.create({
          ...form,
          deadline: form.deadline || undefined,
        });
      }
      
      if (!isEditing) {
        localStorage.removeItem(FORM_STORAGE_KEY);
      }
      navigate("/projects");
    } catch {
      setError(`Failed to ${isEditing ? 'update' : 'create'} project. Please try again.`);
    } finally {
      setSaving(false);
    }
  };

  const stepIndicators = [
    { num: 1, label: "Details" },
    { num: 2, label: "Settings" },
    { num: 3, label: "Cover" },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/40 to-slate-50 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-blue-500 shadow-lg mx-auto mb-4">
            <Edit className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-xl font-semibold text-slate-900 mb-2">Loading Project</h2>
          <p className="text-slate-600">Fetching project details...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/40 to-slate-50 pb-12">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative space-y-6 mb-12 pt-8 px-6"
      >
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-blue-500/15 via-blue-400/5 to-transparent rounded-full blur-3xl -z-10" />

        <div className="flex items-start gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-blue-500 shadow-lg">
            {isEditing ? <Edit className="h-7 w-7 text-white" /> : <Rocket className="h-7 w-7 text-white" />}
          </div>
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-blue-600">
              {isEditing ? 'Edit' : 'Launch'}
            </p>
            <h1 className="text-4xl font-bold text-slate-900">
              {isEditing ? 'Edit Project' : 'Create New Project'}
            </h1>
            <p className="mt-2 text-slate-600 max-w-2xl">
              {isEditing 
                ? 'Update your project details, settings and cover image.'
                : 'Build, organize and manage your team\'s work from a single collaborative workspace.'
              }
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 max-w-md">
          {stepIndicators.map((indicator, idx) => (
            <motion.div key={indicator.num} className="flex items-center gap-3 flex-1">
              <motion.div
                whileHover={step >= indicator.num ? { scale: 1.1 } : {}}
                onClick={() => step > indicator.num && setStep(indicator.num)}
                className={`flex h-10 w-10 items-center justify-center rounded-full font-semibold transition-all cursor-pointer ${
                  step >= indicator.num
                    ? "bg-gradient-to-br from-blue-600 to-blue-500 text-white shadow-lg shadow-blue-500/30"
                    : "bg-slate-200 text-slate-500"
                }`}
              >
                {step > indicator.num ? <CheckCircle className="h-5 w-5" /> : indicator.num}
              </motion.div>
              <div className={`text-xs font-medium ${step >= indicator.num ? "text-slate-900" : "text-slate-500"}`}>
                {indicator.label}
              </div>
              {idx < stepIndicators.length - 1 && (
                <motion.div
                  className={`flex-1 h-1 rounded-full transition-colors ${
                    step > indicator.num ? "bg-blue-600" : "bg-slate-200"
                  }`}
                />
              )}
            </motion.div>
          ))}
        </div>
      </motion.div>

      <form onSubmit={handleSubmit} className="mx-auto max-w-6xl px-6">
        <div className="grid gap-8 lg:grid-cols-[1.2fr_1fr]">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={step === 1 ? { opacity: 1, height: "auto" } : { opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="rounded-2xl border border-slate-200/60 bg-white/80 p-8 shadow-lg backdrop-blur-[20px] space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">Project Details</h2>
                  <p className="mt-1 text-sm text-slate-600">Give your project a name and description</p>
                </div>

                <div>
                  <label className="text-sm font-semibold text-slate-700 block mb-2">Project Name</label>
                  <input
                    type="text"
                    placeholder="e.g., Project Aurora"
                    value={form.title}
                    onChange={setField("title")}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder-slate-400 outline-none transition-all duration-300 hover:border-blue-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                    required
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold text-slate-700 block mb-2">Description</label>
                  <textarea
                    rows={6}
                    placeholder="Describe your project vision, goals, and expected outcome..."
                    value={form.description}
                    onChange={setField("description")}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder-slate-400 outline-none transition-all duration-300 hover:border-blue-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 resize-none"
                    required
                  />
                </div>

                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-xl border border-red-200/60 bg-red-50/80 px-4 py-3 text-sm text-red-700 flex items-center gap-2"
                  >
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    {error}
                  </motion.div>
                )}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={step === 2 ? { opacity: 1, height: "auto" } : { opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="rounded-2xl border border-slate-200/60 bg-white/80 p-8 shadow-lg backdrop-blur-[20px] space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">Project Settings</h2>
                  <p className="mt-1 text-sm text-slate-600">Configure status, priority, deadline and team</p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="text-sm font-semibold text-slate-700 block mb-2">Status</label>
                    <select
                      value={form.status}
                      onChange={setField("status")}
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition-all duration-300 hover:border-blue-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                    >
                      <option value="Planning">Planning</option>
                      <option value="Active">Active</option>
                      <option value="Completed">Completed</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-slate-700 block mb-2">Priority</label>
                    <select
                      value={form.priority}
                      onChange={setField("priority")}
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition-all duration-300 hover:border-blue-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                    >
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-semibold text-slate-700 block mb-2">Deadline (Optional)</label>
                  <input
                    type="date"
                    value={form.deadline ?? ""}
                    onChange={setField("deadline")}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition-all duration-300 hover:border-blue-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>

                {user?.role === "admin" && (
                  <div className="border-t pt-6">
                    <label className="text-sm font-semibold text-slate-700 block mb-2">Team Members</label>
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setDropdownOpen(!dropdownOpen)}
                        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 text-left outline-none transition-all duration-300 hover:border-blue-300 focus:border-blue-500 flex justify-between items-center shadow-sm"
                      >
                        <span>
                          {selectedTeamMembers.length === 0
                            ? "Select members..."
                            : `Selected Members: ${selectedTeamMembers.length}`}
                        </span>
                        <span className={`text-slate-400 text-xs transition-transform ${dropdownOpen ? 'rotate-180' : ''}`}>▼</span>
                      </button>

                      {dropdownOpen && (
                        <div className="absolute z-20 w-full mt-2 bg-white border border-slate-200 rounded-xl shadow-xl max-h-60 overflow-y-auto p-2 space-y-1 top-full left-0">
                          {loadingMembers ? (
                            <div className="flex items-center justify-center py-4">
                              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                            </div>
                          ) : teamMembers.length === 0 ? (
                            <p className="text-sm text-slate-500 p-2">No team members available</p>
                          ) : (
                            teamMembers.map((member) => {
                              const isSelected = selectedTeamMembers.includes(member._id);
                              return (
                                <label
                                  key={member._id}
                                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors"
                                >
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={(e) => {
                                      const newSelected = e.target.checked
                                        ? [...selectedTeamMembers, member._id]
                                        : selectedTeamMembers.filter(id => id !== member._id);
                                      setSelectedTeamMembers(newSelected);
                                      setForm(prev => {
                                        const next = { ...prev, teamMembers: newSelected };
                                        setStoredJson(FORM_STORAGE_KEY, next);
                                        return next;
                                      });
                                    }}
                                    className="w-4 h-4 rounded border-slate-300 text-blue-600 cursor-pointer"
                                  />
                                  <div className="flex-1">
                                    <p className="text-sm font-medium text-slate-900">{member.name}</p>
                                    <p className="text-xs text-slate-500">{member.email}</p>
                                  </div>
                                </label>
                              );
                            })
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="rounded-xl border border-blue-200/60 bg-blue-50/80 p-4 space-y-2">
                  <p className="text-sm font-semibold text-blue-900">💡 Pro Tip</p>
                  <p className="text-xs text-blue-800">Set a clear deadline to keep your team focused and accountable on the project timeline.</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={step === 3 ? { opacity: 1, height: "auto" } : { opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="rounded-2xl border border-slate-200/60 bg-white/80 p-8 shadow-lg backdrop-blur-[20px] space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">Project Cover</h2>
                  <p className="mt-1 text-sm text-slate-600">Add a professional cover image (optional)</p>
                </div>

                {imagePreview ? (
                  <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="relative rounded-xl overflow-hidden border-2 border-blue-400/50"
                  >
                    <img src={imagePreview} alt="Cover" className="w-full h-48 object-cover" />
                    <button
                      type="button"
                      onClick={() => { setImagePreview(null); setForm(prev => ({ ...prev, coverImage: undefined })); setStoredJson(FORM_STORAGE_KEY, { ...form, coverImage: undefined }); }}
                      className="absolute right-3 top-3 rounded-lg bg-red-500 px-2.5 py-1 text-xs font-semibold text-white hover:bg-red-600"
                    >
                      Remove
                    </button>
                  </motion.div>
                ) : (
                  <div
                    onDrop={handleDrop}
                    onDragOver={(e) => e.preventDefault()}
                    onClick={() => coverFileRef.current?.click()}
                    className="relative rounded-xl border-2 border-dashed border-slate-300 bg-slate-50/50 px-6 py-12 text-center transition hover:border-blue-400 hover:bg-blue-50/50 cursor-pointer"
                  >
                    <div className="flex flex-col items-center gap-3">
                      <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-gradient-to-br from-blue-100 to-blue-50 border border-blue-200">
                        <svg className="h-8 w-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900">Drag & drop image here</p>
                        <p className="text-xs text-slate-500">or click to browse (PNG, JPG, max 10MB)</p>
                      </div>
                    </div>
                    <input
                      ref={coverFileRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleImage(file);
                      }}
                    />
                  </div>
                )}

                <div className="rounded-xl border border-amber-200/60 bg-amber-50/80 p-4 space-y-2">
                  <p className="text-sm font-semibold text-amber-900">✨ Cover Image Tips</p>
                  <ul className="text-xs text-amber-800 space-y-1 list-disc list-inside">
                    <li>Use high-quality images (1600x900px recommended)</li>
                    <li>Choose images that represent your project</li>
                    <li>Images display on project cards and overview</li>
                  </ul>
                </div>
              </div>
            </motion.div>

            <div className="flex gap-3">
              <Button
                type="button"
                variant="secondary"
                onClick={() => step > 1 ? setStep(step - 1) : navigate("/projects")}
                disabled={saving}
              >
                {step > 1 ? "← Back" : "Cancel"}
              </Button>
              {step < 3 ? (
                <Button
                  type="button"
                  onClick={() => setStep(step + 1)}
                  disabled={step === 1 && (!form.title?.trim() || !form.description?.trim())}
                  className="flex items-center gap-2 ml-auto"
                >
                  Next <ArrowRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button type="submit" loading={saving} className="flex items-center gap-2 ml-auto">
                  <CheckCircle className="h-4 w-4" />
                  {isEditing ? "Update project" : "Create project"}
                </Button>
              )}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="hidden lg:block"
          >
            <div className="sticky top-8 rounded-2xl border border-slate-200/60 bg-white/80 p-8 shadow-lg backdrop-blur-[20px]">
              <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-600 mb-6">Project Preview</h3>

              <div className="space-y-6">
                {imagePreview ? (
                  <motion.img
                    key={imagePreview}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    src={imagePreview}
                    alt="Cover"
                    className="w-full h-32 rounded-xl object-cover"
                  />
                ) : (
                  <div className={`w-full h-32 rounded-xl bg-gradient-to-br ${statusColors[form.status]} flex items-center justify-center text-white text-4xl font-bold`}>
                    {form.title?.charAt(0).toUpperCase() || "?"}
                  </div>
                )}

                <div className="space-y-4 pt-4 border-t border-slate-200">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-500 font-semibold">Title</p>
                    <p className="mt-1 text-lg font-bold text-slate-900">{form.title || "Untitled Project"}</p>
                  </div>

                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-500 font-semibold">Description</p>
                    <p className="mt-1 text-sm text-slate-600 line-clamp-3">{form.description || "No description yet"}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-4 border-t border-slate-200">
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-500 font-semibold">Status</p>
                      <div className="mt-1 inline-flex items-center gap-1.5 rounded-full bg-blue-100 px-2.5 py-1 text-xs font-semibold text-blue-700">
                        <div className="h-2 w-2 rounded-full bg-blue-500" />
                        {form.status}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-500 font-semibold">Priority</p>
                      <p className="mt-1 text-sm font-semibold text-slate-900">{form.priority}</p>
                    </div>
                  </div>

                  {form.deadline && (
                    <div className="rounded-lg bg-slate-50 p-3 flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-slate-500 shrink-0" />
                      <div>
                        <p className="text-xs text-slate-600">Deadline</p>
                        <p className="font-semibold text-slate-900">{new Date(form.deadline).toLocaleDateString()}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </form>
    </div>
  );
};
