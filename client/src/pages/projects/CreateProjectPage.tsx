import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, CheckCircle, Rocket, Calendar, AlertCircle, Edit } from "lucide-react";
import { projectService } from "@/services";
import type { CreateProjectPayload } from "@/types";
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
            coverImage: project.coverImage || undefined,
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
      <div className="min-h-screen bg-transparent flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-blue-500 shadow-lg mx-auto mb-4">
            <Edit className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">Loading Project</h2>
          <p className="text-slate-400">Fetching project details...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent pb-12">
      <motion.div
        initial={{ opacity: 0, y: -15 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-[24px] border border-white/5 bg-gradient-to-br from-slate-950 via-[#0B0F19] to-slate-950 p-8 md:p-10 shadow-[0_24px_50px_rgba(0,0,0,0.6)] mb-8"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(59,130,246,0.12),_transparent_45%),radial-gradient(circle_at_bottom_left,_rgba(147,51,234,0.08),_transparent_45%)]" />

        <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10 border border-blue-500/20 shadow-lg shrink-0">
              {isEditing ? <Edit className="h-5.5 w-5.5 text-blue-450" /> : <Rocket className="h-5.5 w-5.5 text-blue-455" />}
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-blue-400 border border-blue-500/20">
                {isEditing ? 'Project settings' : 'New Workspace'}
              </div>
              <h1 className="text-2xl font-extrabold text-white tracking-tight leading-none mt-2">
                {isEditing ? 'Edit Project' : 'Create New Project'}
              </h1>
              <p className="mt-2 text-slate-400 max-w-xl text-xs leading-relaxed">
                {isEditing 
                  ? 'Update your project details, settings and cover image.'
                  : 'Build, organize and manage your team\'s work from a single collaborative workspace.'
                }
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full lg:w-auto lg:max-w-md shrink-0">
            {stepIndicators.map((indicator, idx) => (
              <div key={indicator.num} className="flex items-center gap-3 flex-1">
                <motion.div
                  whileHover={step >= indicator.num ? { scale: 1.05 } : {}}
                  onClick={() => step > indicator.num && setStep(indicator.num)}
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-all cursor-pointer ${
                    step >= indicator.num
                      ? "bg-blue-600 text-white shadow-md shadow-blue-500/30"
                      : "bg-[#0B0F19] text-slate-500 border border-white/5"
                  }`}
                >
                  {step > indicator.num ? <CheckCircle className="h-4.5 w-4.5" /> : indicator.num}
                </motion.div>
                <div className={`text-[10px] font-bold uppercase tracking-wider ${step >= indicator.num ? "text-white" : "text-slate-500"}`}>
                  {indicator.label}
                </div>
                {idx < stepIndicators.length - 1 && (
                  <div
                    className={`flex-1 h-[1px] min-w-[20px] transition-colors ${
                      step > indicator.num ? "bg-blue-500" : "bg-white/5"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      <form onSubmit={handleSubmit} className="mx-auto max-w-6xl">
        <div className="grid gap-8 lg:grid-cols-[1.2fr_1fr]">
          <motion.div
            initial={{ opacity: 0, x: -15 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <div className={`${step === 1 ? 'block' : 'hidden'}`}>
              <div className="premium-card space-y-6">
                <div>
                  <h2 className="text-lg font-bold text-slate-100">Project Details</h2>
                  <p className="mt-1 text-xs text-slate-400">Give your project a name and description</p>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Project Name</label>
                  <input
                    type="text"
                    placeholder="e.g., Project Aurora"
                    value={form.title}
                    onChange={setField("title")}
                    className="premium-input bg-[#0B0F19] border border-white/5 px-4 py-2.5 rounded-xl text-sm"
                    required
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Description</label>
                  <textarea
                    rows={6}
                    placeholder="Describe your project vision, goals, and expected outcome..."
                    value={form.description}
                    onChange={setField("description")}
                    className="premium-input bg-[#0B0F19] border border-white/5 px-4 py-2.5 rounded-xl text-sm resize-none"
                    required
                  />
                </div>

                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-xl border border-red-900/30 bg-red-950/20 px-4 py-3 text-xs text-red-400 flex items-center gap-2"
                  >
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    {error}
                  </motion.div>
                )}
              </div>
            </div>

            <div className={`${step === 2 ? 'block' : 'hidden'}`}>
              <div className="premium-card space-y-6">
                <div>
                  <h2 className="text-lg font-bold text-slate-100">Project Settings</h2>
                  <p className="mt-1 text-xs text-slate-400">Configure status, priority, deadline and team</p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Status</label>
                    <select
                      value={form.status}
                      onChange={setField("status")}
                      className="premium-input bg-[#0B0F19] border border-white/5 px-4 py-2.5 rounded-xl text-sm text-slate-300"
                    >
                      <option value="Planning">Planning</option>
                      <option value="Active">Active</option>
                      <option value="Completed">Completed</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Priority</label>
                    <select
                      value={form.priority}
                      onChange={setField("priority")}
                      className="premium-input bg-[#0B0F19] border border-white/5 px-4 py-2.5 rounded-xl text-sm text-slate-300"
                    >
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Deadline (Optional)</label>
                  <input
                    type="date"
                    value={form.deadline ?? ""}
                    onChange={setField("deadline")}
                    className="premium-input bg-[#0B0F19] border border-white/5 px-4 py-2.5 rounded-xl text-sm text-slate-300"
                  />
                </div>

                {(user?.role === "admin" || user?.role === "manager") && (
                  <div className="border-t border-white/5 pt-6">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Team Members</label>
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setDropdownOpen(!dropdownOpen)}
                        className="premium-input bg-[#0B0F19] border border-white/5 px-4 py-2.5 rounded-xl text-sm text-left flex justify-between items-center text-slate-300"
                      >
                        <span>
                          {selectedTeamMembers.length === 0
                            ? "Select members..."
                            : `Selected Members: ${selectedTeamMembers.length}`}
                        </span>
                        <span className={`text-slate-400 text-xs transition-transform ${dropdownOpen ? 'rotate-180' : ''}`}>▼</span>
                      </button>

                      {dropdownOpen && (
                        <div className="absolute z-20 w-full mt-2 bg-[#0E1424] border border-white/5 rounded-xl shadow-2xl max-h-60 overflow-y-auto p-1.5 space-y-1 top-full left-0 backdrop-blur-md">
                          {loadingMembers ? (
                            <div className="flex items-center justify-center py-4">
                              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                            </div>
                          ) : teamMembers.length === 0 ? (
                            <p className="text-xs text-slate-500 p-2">No team members available</p>
                          ) : (
                            teamMembers.map((member) => {
                              const isSelected = selectedTeamMembers.includes(member._id);
                              return (
                                <label
                                  key={member._id}
                                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 cursor-pointer transition-colors"
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
                                    className="w-4 h-4 rounded border-white/5 bg-slate-900 text-blue-600 cursor-pointer focus:ring-offset-0 focus:ring-0"
                                  />
                                  <div className="flex-1">
                                    <p className="text-xs font-bold text-slate-200">{member.name}</p>
                                    <p className="text-[10px] text-slate-500">{member.email}</p>
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
              </div>
            </div>

            <div className={`${step === 3 ? 'block' : 'hidden'}`}>
              <div className="premium-card space-y-6">
                <div>
                  <h2 className="text-lg font-bold text-slate-100">Project Cover</h2>
                  <p className="mt-1 text-xs text-slate-400">Add a professional cover image (optional)</p>
                </div>

                {imagePreview ? (
                  <motion.div
                    initial={{ scale: 0.98, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="relative rounded-xl overflow-hidden border border-white/5"
                  >
                    <img src={imagePreview} alt="Cover" className="w-full h-40 object-cover" />
                    <button
                      type="button"
                      onClick={() => { setImagePreview(null); setForm(prev => ({ ...prev, coverImage: undefined })); setStoredJson(FORM_STORAGE_KEY, { ...form, coverImage: undefined }); }}
                      className="absolute right-3 top-3 rounded-lg bg-red-600/90 hover:bg-red-700 px-3 py-1 text-xs font-semibold text-white shadow-lg transition"
                    >
                      Remove
                    </button>
                  </motion.div>
                ) : (
                  <div
                    onDrop={handleDrop}
                    onDragOver={(e) => e.preventDefault()}
                    onClick={() => coverFileRef.current?.click()}
                    className="relative rounded-xl border border-dashed border-white/10 bg-[#0B0F19] px-6 py-10 text-center transition hover:border-blue-500/50 hover:bg-white/5 cursor-pointer"
                  >
                    <div className="flex flex-col items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-450">
                        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-200">Drag & drop image here</p>
                        <p className="text-[10px] text-slate-500 mt-1">or click to browse (PNG, JPG, max 10MB)</p>
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
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => step > 1 ? setStep(step - 1) : navigate("/projects")}
                disabled={saving}
                className="premium-button-secondary py-2 text-sm"
              >
                {step > 1 ? "← Back" : "Cancel"}
              </button>
              {step < 3 ? (
                <button
                  type="button"
                  onClick={() => setStep(step + 1)}
                  disabled={step === 1 && (!form.title?.trim() || !form.description?.trim())}
                  className="premium-button-primary flex items-center gap-2 ml-auto disabled:opacity-50 disabled:cursor-not-allowed py-2 text-sm"
                >
                  Next <ArrowRight className="h-4 w-4" />
                </button>
              ) : (
                <button type="submit" disabled={saving} className="premium-button-primary flex items-center gap-2 ml-auto disabled:opacity-50 py-2 text-sm">
                  <CheckCircle className="h-4 w-4" />
                  {isEditing ? "Update project" : "Create project"}
                </button>
              )}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 15 }}
            animate={{ opacity: 1, x: 0 }}
            className="hidden lg:block animate-fade-in"
          >
            <div className="premium-card sticky top-8 space-y-6">
              <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Project Preview</h3>

              <div className="space-y-6">
                {imagePreview ? (
                  <motion.img
                    key={imagePreview}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    src={imagePreview}
                    alt="Cover"
                    className="w-full h-32 rounded-xl object-cover border border-white/5"
                  />
                ) : (
                  <div className="w-full h-32 rounded-xl bg-gradient-to-br from-slate-900 to-[#0B0F19] border border-white/5" />
                )}

                <div className="space-y-4 pt-4 border-t border-white/5">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.2em] text-slate-550 font-bold">Title</p>
                    <p className="mt-1 text-base font-bold text-slate-200 truncate">{form.title || "Untitled Project"}</p>
                  </div>

                  <div>
                    <p className="text-[10px] uppercase tracking-[0.2em] text-slate-550 font-bold">Description</p>
                    <p className="mt-1 text-xs text-slate-400 line-clamp-3 leading-relaxed">{form.description || "No description yet"}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-4 border-t border-white/5">
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.2em] text-slate-550 font-bold">Status</p>
                      <div className="mt-1.5 inline-flex items-center gap-1.5 rounded-full bg-blue-500/10 px-2.5 py-0.5 text-xs font-semibold border border-blue-500/20 text-blue-450">
                        <div className="h-1 w-1 rounded-full bg-blue-400" />
                        {form.status}
                      </div>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.2em] text-slate-550 font-bold">Priority</p>
                      <p className="mt-1.5 text-xs font-bold text-slate-300">{form.priority}</p>
                    </div>
                  </div>

                  {form.deadline && (
                    <div className="rounded-xl bg-[#0B0F19] border border-white/5 p-3 flex items-center gap-2.5 text-xs mt-2">
                      <Calendar className="h-4 w-4 text-slate-500 shrink-0" />
                      <div>
                        <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Deadline</p>
                        <p className="font-bold text-slate-300 mt-0.5">{new Date(form.deadline).toLocaleDateString()}</p>
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
