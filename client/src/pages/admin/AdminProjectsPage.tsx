import { useMemo, useState } from "react";
import { Plus, Pencil, Trash2, Users, Layers, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";

interface ProjectItem {
  id: string;
  title: string;
  description: string;
  progress: number;
  status: string;
  team: string[];
}

const initialProjects: ProjectItem[] = [
  {
    id: "p-001",
    title: "Nova Launch Suite",
    description: "Modern enterprise product launch with cross-team workflows.",
    progress: 76,
    status: "Active",
    team: ["Emma", "Noah", "Ava"],
  },
  {
    id: "p-002",
    title: "Orion Redesign",
    description: "Refine platform UX with premium glass visuals and motion.",
    progress: 52,
    status: "Planning",
    team: ["Liam", "Mia", "Sophia"],
  },
  {
    id: "p-003",
    title: "Pulse Analytics",
    description: "Analytics product built for stakeholder transparency.",
    progress: 89,
    status: "Active",
    team: ["Ethan", "Isabella", "Lucas"],
  },
];

const statusBadge = (status: string) => {
  if (status === "Active") return "success";
  if (status === "Planning") return "info";
  return "default";
};

export const AdminProjectsPage = () => {
  const [projects, setProjects] = useState<ProjectItem[]>(initialProjects);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ProjectItem | null>(null);
  const [form, setForm] = useState({ title: "", description: "", status: "Active", progress: "0" });

  const activeCount = useMemo(() => projects.filter((project) => project.status === "Active").length, [projects]);

  const handleOpen = (project?: ProjectItem) => {
    if (project) {
      setEditing(project);
      setForm({ title: project.title, description: project.description, status: project.status, progress: String(project.progress) });
    } else {
      setEditing(null);
      setForm({ title: "", description: "", status: "Active", progress: "0" });
    }
    setOpen(true);
  };

  const handleSave = () => {
    const trimmedTitle = form.title.trim();
    if (!trimmedTitle) return;
    if (editing) {
      setProjects((prev) => prev.map((project) => project.id === editing.id ? { ...project, ...form, progress: Number(form.progress) } : project));
    } else {
      setProjects((prev) => [
        {
          id: `p-${prev.length + 4}`,
          title: trimmedTitle,
          description: form.description,
          status: form.status,
          progress: Number(form.progress),
          team: ["Zoe", "Noah", "Luna"],
        },
        ...prev,
      ]);
    }
    setOpen(false);
  };

  const handleDelete = (id: string) => {
    setProjects((prev) => prev.filter((project) => project.id !== id));
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 rounded-[32px] border border-white/10 bg-glass p-7 shadow-card backdrop-blur-xl md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.24em] text-slate-400">Project management</p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-50">All active initiatives</h1>
        </div>
        <div className="flex items-center gap-3">
          <span className="rounded-3xl bg-slate-900/80 px-4 py-3 text-sm text-slate-300">{activeCount} active projects</span>
          <Button onClick={() => handleOpen()}>
            <Plus className="h-4 w-4" /> Create project
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {projects.map((project) => (
          <Card key={project.id} className="group relative overflow-hidden">
            <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-r from-violet-500/20 via-transparent to-pink-500/20 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
            <div className="relative space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-semibold text-slate-100">{project.title}</h2>
                  <p className="mt-2 text-sm text-slate-400">{project.description}</p>
                </div>
                <Badge variant={statusBadge(project.status)}>{project.status}</Badge>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm text-slate-300">
                  <span>Progress</span>
                  <span>{project.progress}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-900">
                  <div className="h-full rounded-full bg-gradient-to-r from-fuchsia-500 to-violet-500 transition-all" style={{ width: `${project.progress}%` }} />
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-400">
                <Users className="h-4 w-4" />
                <span>{project.team.join(", ")}</span>
              </div>
              <div className="flex flex-wrap gap-3 pt-3">
                <Button variant="secondary" onClick={() => handleOpen(project)}>
                  <Pencil className="h-4 w-4" /> Edit
                </Button>
                <Button variant="danger" onClick={() => handleDelete(project.id)}>
                  <Trash2 className="h-4 w-4" /> Delete
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="rounded-[32px] border border-white/10 bg-glass p-6 shadow-card backdrop-blur-xl">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-slate-400">Status snapshot</p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-50">Current roadmap pulse</h2>
          </div>
          <div className="inline-flex items-center gap-2 rounded-3xl bg-slate-900/80 px-4 py-3 text-sm text-slate-300">
            <Layers className="h-4 w-4" /> Live sync
          </div>
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-[28px] bg-slate-950/80 p-5">
            <p className="text-sm text-slate-400">Upcoming feature deliveries</p>
            <p className="mt-4 text-3xl font-semibold text-slate-100">7 launches</p>
          </div>
          <div className="rounded-[28px] bg-slate-950/80 p-5">
            <p className="text-sm text-slate-400">Resource efficiency score</p>
            <p className="mt-4 text-3xl font-semibold text-slate-100">94%</p>
          </div>
        </div>
      </div>

      {open && (
        <Modal title={editing ? "Edit project" : "Create new project"} onClose={() => setOpen(false)}>
          <div className="space-y-5">
            <Input label="Project name" value={form.title} onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))} />
            <Input label="Description" value={form.description} onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))} />
            <div className="grid gap-4 md:grid-cols-2">
              <Select
                label="Status"
                value={form.status}
                onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value }))}
              >
                <option>Active</option>
                <option>Planning</option>
                <option>Completed</option>
              </Select>
              <Input
                label="Progress"
                type="number"
                value={form.progress}
                onChange={(e) => setForm((prev) => ({ ...prev, progress: e.target.value }))}
                min={0}
                max={100}
              />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
              <Button onClick={handleSave}>{editing ? "Save changes" : "Create project"}</Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
