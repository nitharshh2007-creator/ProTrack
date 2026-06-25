import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { UserPlus, Copy, MoreVertical, Trash2, Lock, Eye } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Spinner } from "@/components/ui/Spinner";
import { useAuth } from "@/store/auth.store";

interface TeamMember {
  _id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
}

interface TeamStats {
  totalMembers: number;
  activeMembers: number;
  pendingInvites: number;
  projects: number;
}

interface Project {
  _id: string;
  title: string;
}

export const TeamPage = () => {
  const { token, user: _user } = useAuth();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [stats, setStats] = useState<TeamStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [linkModalOpen, setLinkModalOpen] = useState(false);
  const [linkInputModalOpen, setLinkInputModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("employee");
  const [linkEmail, setLinkEmail] = useState("");
  const [linkRole, setLinkRole] = useState("employee");
  const [inviteLink, setInviteLink] = useState("");
  const [inviting, setInviting] = useState(false);
  const [generatingLink, setGeneratingLink] = useState(false);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("all");
  const [projectMembers, setProjectMembers] = useState<TeamMember[]>([]);

  const baseURL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }
    fetchData();
  }, [token]);

  useEffect(() => {
    if (selectedProjectId === "all") {
      setProjectMembers(members);
    } else {
      loadProjectMembers(selectedProjectId);
    }
  }, [selectedProjectId, members]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const headers = { Authorization: `Bearer ${token}` };

      const [membersRes, statsRes, projectsRes] = await Promise.all([
        fetch(`${baseURL}/team/members`, { headers }),
        fetch(`${baseURL}/team/stats`, { headers }),
        fetch(`${baseURL}/projects`, { headers }),
      ]);

      if (membersRes.ok) {
        const data = await membersRes.json();
        setMembers(data.members || []);
        setProjectMembers(data.members || []);
      } else {
        const errorData = await membersRes.json();
        setError(errorData.message || "Failed to load team members");
      }

      if (statsRes.ok) {
        const data = await statsRes.json();
        setStats(data.stats);
      }

      if (projectsRes.ok) {
        const data = await projectsRes.json();
        setProjects(data.projects || []);
      }
    } catch (err) {
      setError("Failed to load team data. Please refresh the page.");
    } finally {
      setLoading(false);
    }
  };

  const loadProjectMembers = async (projectId: string) => {
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const res = await fetch(`${baseURL}/projects/${projectId}/members`, { headers });
      if (res.ok) {
        const data = await res.json();
        setProjectMembers(data.members || []);
      }
    } catch (err) {
      console.error("Failed to load project members", err);
    }
  };

  const handleInviteMember = async () => {
    if (!inviteEmail) {
      setError("Email is required");
      setTimeout(() => setError(null), 3000);
      return;
    }

    try {
      setInviting(true);
      setError(null);
      const res = await fetch(`${baseURL}/team/invite`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess("Invitation sent successfully!");
        setTimeout(() => setSuccess(null), 3000);
        setInviteEmail("");
        setInviteRole("employee");
        setInviteModalOpen(false);
        setTimeout(() => fetchData(), 500);
      } else {
        setError(data.message || "Failed to send invitation");
        setTimeout(() => setError(null), 3000);
      }
    } catch (err) {
      setError("Failed to send invitation");
      setTimeout(() => setError(null), 3000);
    } finally {
      setInviting(false);
    }
  };

  const handleGenerateLink = async () => {
    try {
      setGeneratingLink(true);
      setError(null);
      const res = await fetch(`${baseURL}/team/generate-link`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ role: linkRole, email: linkEmail || undefined }),
      });

      if (res.ok) {
        const data = await res.json();
        setInviteLink(data.link || "");
        setLinkEmail("");
        setLinkRole("employee");
        setLinkInputModalOpen(false);
        setLinkModalOpen(true);
      } else {
        setError("Failed to generate invite link");
      }
    } catch (err) {
      setError("Failed to generate invite link");
    } finally {
      setGeneratingLink(false);
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink);
      setSuccess("Link copied to clipboard!");
    } catch (err) {
      setError("Failed to copy link");
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!window.confirm("Are you sure you want to remove this member?")) return;

    try {
      const res = await fetch(`${baseURL}/team/remove/${memberId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        setSuccess("Member removed successfully");
        setTimeout(() => setSuccess(null), 3000);
        setMembers(members.filter((m) => m._id !== memberId));
        setOpenMenu(null);
      } else {
        setError("Failed to remove member");
        setTimeout(() => setError(null), 3000);
      }
    } catch (err) {
      setError("Failed to remove member");
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleBlockMember = async (memberId: string) => {
    if (!window.confirm("Are you sure you want to block this member?")) return;

    try {
      const res = await fetch(`${baseURL}/team/block/${memberId}`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        setSuccess("Member blocked successfully");
        setTimeout(() => setSuccess(null), 3000);
        setMembers(members.filter((m) => m._id !== memberId));
        setOpenMenu(null);
      } else {
        setError("Failed to block member");
        setTimeout(() => setError(null), 3000);
      }
    } catch (err) {
      setError("Failed to block member");
      setTimeout(() => setError(null), 3000);
    }
  };

  return (
    <div className="space-y-8">
      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="premium-hero"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(37,99,235,0.15),_transparent_35%),radial-gradient(circle_at_bottom_right,_rgba(37,99,235,0.05),_transparent_45%)] pointer-events-none" />
        <div className="relative space-y-3">
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-blue-400/80">Administration</p>
          <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight leading-none">Team Management</h1>
          <p className="text-sm md:text-base text-[#CBD5E1] max-w-2xl leading-relaxed">Manage workspace members, invitations and project assignments</p>
        </div>
      </motion.div>

      {/* Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid gap-6 grid-cols-2 md:grid-cols-4"
      >
        <div className="premium-card">
          <p className="text-xs uppercase tracking-[0.2em] font-semibold text-slate-400">Total Members</p>
          <p className="text-2xl font-bold text-slate-100 mt-2">{stats?.totalMembers ?? 0}</p>
        </div>
        <div className="premium-card">
          <p className="text-xs uppercase tracking-[0.2em] font-semibold text-slate-400">Active Members</p>
          <p className="text-2xl font-bold text-slate-100 mt-2">{stats?.activeMembers ?? 0}</p>
        </div>
        <div className="premium-card">
          <p className="text-xs uppercase tracking-[0.2em] font-semibold text-slate-400">Pending Invites</p>
          <p className="text-2xl font-bold text-slate-100 mt-2">{stats?.pendingInvites ?? 0}</p>
        </div>
        <div className="premium-card">
          <p className="text-xs uppercase tracking-[0.2em] font-semibold text-slate-400">Projects</p>
          <p className="text-2xl font-bold text-slate-100 mt-2">{stats?.projects ?? 0}</p>
        </div>
      </motion.div>

      {/* Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="flex gap-4 items-end flex-wrap"
      >
        <div>
          <button
            onClick={() => setInviteModalOpen(true)}
            className="premium-button-primary"
          >
            <UserPlus className="h-4 w-4" />
            Invite Member
          </button>
        </div>
        <div>
          <button
            onClick={() => setLinkInputModalOpen(true)}
            disabled={generatingLink}
            className="premium-button-secondary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {generatingLink ? (
              <Spinner className="h-4 w-4" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
            Generate Link
          </button>
        </div>
        
        {/* Project Filter */}
        <div className="flex-grow md:flex-grow-0 min-w-[200px]">
          <label className="text-xs font-semibold text-slate-400 block mb-2 uppercase tracking-wider">Filter by Project</label>
          <select
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            className="premium-input"
          >
            <option value="all">All Projects</option>
            {projects.map((project) => (
              <option key={project._id} value={project._id}>
                {project.title}
              </option>
            ))}
          </select>
        </div>
      </motion.div>

      {/* Error */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-lg bg-red-950/20 border border-red-900/30 p-4"
        >
          <p className="text-sm font-medium text-red-400">{error}</p>
        </motion.div>
      )}

      {/* Success */}
      {success && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-lg bg-green-950/20 border border-green-900/30 p-4"
        >
          <p className="text-sm font-medium text-green-400">{success}</p>
        </motion.div>
      )}

      {/* Members Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="premium-table-container"
      >
        <div className="p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400 mb-6">
            {selectedProjectId === "all" ? "Workspace Members" : "Project Members"}
          </p>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <Spinner className="h-8 w-8 mx-auto mb-3" />
                <p className="text-sm text-slate-400">Loading team members...</p>
              </div>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-sm text-red-400 font-medium">{error}</p>
              <button
                onClick={() => fetchData()}
                className="mt-4 premium-button-primary"
              >
                Retry
              </button>
            </div>
          ) : projectMembers.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-slate-350 font-medium">No team members</p>
              <p className="text-sm text-slate-500 mt-1">
                {selectedProjectId === "all"
                  ? "Invite members to get started"
                  : "No members assigned to this project"}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="premium-table">
                <thead>
                  <tr>
                    <th className="premium-table-th">Name</th>
                    <th className="premium-table-th">Email</th>
                    <th className="premium-table-th">Role</th>
                    <th className="premium-table-th">Joined</th>
                    <th className="premium-table-th text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {projectMembers.map((member) => (
                    <tr
                      key={member._id}
                      className="premium-table-row"
                    >
                      <td className="premium-table-td font-medium text-slate-200">{member.name}</td>
                      <td className="premium-table-td text-slate-400 text-sm">{member.email}</td>
                      <td className="premium-table-td">
                        <span className="inline-block px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 text-xs font-semibold border border-blue-500/20">
                          {member.role}
                        </span>
                      </td>
                      <td className="premium-table-td text-sm text-slate-450">
                        {new Date(member.createdAt).toLocaleDateString()}
                      </td>
                      <td className="premium-table-td text-right relative">
                        <button
                          onClick={() =>
                            setOpenMenu(openMenu === member._id ? null : member._id)
                          }
                          className="p-1.5 hover:bg-slate-800/80 rounded-lg transition"
                        >
                          <MoreVertical className="h-4 w-4 text-slate-400" />
                        </button>
                        {openMenu === member._id && (
                          <motion.div
                            initial={{ opacity: 0, y: -8 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="absolute right-0 top-10 w-36 premium-dropdown"
                          >
                            <button className="premium-dropdown-item">
                              <Eye className="h-3.5 w-3.5" /> View
                            </button>
                            <button
                              onClick={() => handleBlockMember(member._id)}
                              className="premium-dropdown-item text-orange-400 hover:text-orange-300 hover:bg-orange-500/10"
                            >
                              <Lock className="h-3.5 w-3.5" /> Block
                            </button>
                            <button
                              onClick={() => handleRemoveMember(member._id)}
                              className="premium-dropdown-item premium-dropdown-item-danger"
                            >
                              <Trash2 className="h-3.5 w-3.5" /> Remove
                            </button>
                          </motion.div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </motion.div>

      {/* Invite Modal */}
      <Modal open={inviteModalOpen} onClose={() => setInviteModalOpen(false)} title="Invite Team Member">
        <div className="space-y-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Email Address
            </label>
            <input
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="member@example.com"
              className="premium-input"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Role</label>
            <select
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value)}
              className="premium-input"
            >
              <option value="employee">Employee</option>
              <option value="manager">Manager</option>
            </select>
          </div>
          <div className="flex gap-3 pt-4">
            <button
              onClick={handleInviteMember}
              disabled={inviting}
              className="premium-button-primary flex-1 disabled:opacity-50"
            >
              {inviting ? "Sending..." : "Send Invite"}
            </button>
            <button
              onClick={() => setInviteModalOpen(false)}
              disabled={inviting}
              className="premium-button-secondary flex-1 disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </div>
      </Modal>

      {/* Generate Link Input Modal */}
      <Modal
        open={linkInputModalOpen}
        onClose={() => setLinkInputModalOpen(false)}
        title="Generate Invite Link"
      >
        <div className="space-y-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Email (Optional)
            </label>
            <input
              type="email"
              value={linkEmail}
              onChange={(e) => setLinkEmail(e.target.value)}
              placeholder="member@example.com"
              className="premium-input"
            />
            <p className="text-xs text-slate-500">If provided, the link will be sent via email</p>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Role</label>
            <select
              value={linkRole}
              onChange={(e) => setLinkRole(e.target.value)}
              className="premium-input"
            >
              <option value="employee">Employee</option>
              <option value="manager">Manager</option>
            </select>
          </div>
          <div className="flex gap-3 pt-4">
            <button
              onClick={handleGenerateLink}
              disabled={generatingLink}
              className="premium-button-primary flex-1 disabled:opacity-50"
            >
              {generatingLink ? "Generating..." : "Generate"}
            </button>
            <button
              onClick={() => setLinkInputModalOpen(false)}
              disabled={generatingLink}
              className="premium-button-secondary flex-1 disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </div>
      </Modal>

      {/* Link Display Modal */}
      <Modal open={linkModalOpen} onClose={() => setLinkModalOpen(false)} title="Generate Invite Link">
        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">
              Invite Link
            </label>
            <div className="bg-slate-950 border border-slate-800 rounded-lg p-4 break-all text-sm text-slate-350 font-mono">
              {inviteLink || "Generating..."}
            </div>
          </div>
          <div className="flex gap-3 pt-4">
            <button
              onClick={handleCopyLink}
              className="premium-button-primary flex-1"
            >
              <Copy className="h-4 w-4" />
              Copy Link
            </button>
            <button
              onClick={() => setLinkModalOpen(false)}
              className="premium-button-secondary flex-1"
            >
              Close
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
