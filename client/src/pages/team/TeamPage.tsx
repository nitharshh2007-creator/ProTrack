import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { UserPlus, Copy, MoreVertical, Trash2, Lock, Eye } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
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
  const { token, user } = useAuth();
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
        className="relative overflow-hidden rounded-[24px] border border-white/10 bg-gradient-to-br from-slate-950/90 via-slate-900/80 to-[#101728] px-8 py-12 shadow-xl"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(37,99,235,0.25),_transparent_28%),radial-gradient(circle_at_bottom_right,_rgba(124,58,237,0.18),_transparent_35%)]" />
        <div className="relative space-y-2">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Administration</p>
          <h1 className="text-3xl font-bold text-white">Team Management</h1>
          <p className="text-sm text-slate-400">Manage workspace members, invitations and project assignments</p>
        </div>
      </motion.div>

      {/* Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid gap-4 grid-cols-2 md:grid-cols-4"
      >
        <div className="rounded-[20px] bg-gradient-to-br from-white via-slate-50/80 to-slate-100/60 p-6 shadow-md border border-slate-200/40">
          <p className="text-xs uppercase tracking-[0.2em] font-semibold text-slate-600">Total Members</p>
          <p className="text-2xl font-bold text-slate-900 mt-2">{stats?.totalMembers ?? 0}</p>
        </div>
        <div className="rounded-[20px] bg-gradient-to-br from-white via-slate-50/80 to-slate-100/60 p-6 shadow-md border border-slate-200/40">
          <p className="text-xs uppercase tracking-[0.2em] font-semibold text-slate-600">Active Members</p>
          <p className="text-2xl font-bold text-slate-900 mt-2">{stats?.activeMembers ?? 0}</p>
        </div>
        <div className="rounded-[20px] bg-gradient-to-br from-white via-slate-50/80 to-slate-100/60 p-6 shadow-md border border-slate-200/40">
          <p className="text-xs uppercase tracking-[0.2em] font-semibold text-slate-600">Pending Invites</p>
          <p className="text-2xl font-bold text-slate-900 mt-2">{stats?.pendingInvites ?? 0}</p>
        </div>
        <div className="rounded-[20px] bg-gradient-to-br from-white via-slate-50/80 to-slate-100/60 p-6 shadow-md border border-slate-200/40">
          <p className="text-xs uppercase tracking-[0.2em] font-semibold text-slate-600">Projects</p>
          <p className="text-2xl font-bold text-slate-900 mt-2">{stats?.projects ?? 0}</p>
        </div>
      </motion.div>

      {/* Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="flex gap-3"
      >
        <button
          onClick={() => setInviteModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm transition shadow-md hover:shadow-lg"
        >
          <UserPlus className="h-4 w-4" />
          Invite Member
        </button>
        <button
          onClick={() => setLinkInputModalOpen(true)}
          disabled={generatingLink}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-900 font-medium text-sm transition shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {generatingLink ? (
            <Spinner className="h-4 w-4" />
          ) : (
            <Copy className="h-4 w-4" />
          )}
          Generate Link
        </button>
      </motion.div>

      {/* Project Filter */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
      >
        <label className="text-sm font-semibold text-slate-700 block mb-2">Filter by Project</label>
        <select
          value={selectedProjectId}
          onChange={(e) => setSelectedProjectId(e.target.value)}
          className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition-all duration-300 hover:border-blue-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 shadow-sm"
        >
          <option value="all">All Projects</option>
          {projects.map((project) => (
            <option key={project._id} value={project._id}>
              {project.title}
            </option>
          ))}
        </select>
      </motion.div>

      {/* Error */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-[20px] bg-red-50 border border-red-200/60 p-4 shadow-md"
        >
          <p className="text-sm font-medium text-red-700">{error}</p>
        </motion.div>
      )}

      {/* Success */}
      {success && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-[20px] bg-green-50 border border-green-200/60 p-4 shadow-md"
        >
          <p className="text-sm font-medium text-green-700">{success}</p>
        </motion.div>
      )}

      {/* Members Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="rounded-[20px] bg-gradient-to-br from-white via-slate-50/80 to-slate-100/60 shadow-md border border-slate-200/40 overflow-hidden"
      >
        <div className="p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-600 mb-6">
            {selectedProjectId === "all" ? "Workspace Members" : "Project Members"}
          </p>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <Spinner className="h-8 w-8 mx-auto mb-3" />
                <p className="text-sm text-slate-600">Loading team members...</p>
              </div>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-sm text-red-600 font-medium">{error}</p>
              <button
                onClick={() => fetchData()}
                className="mt-4 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm transition"
              >
                Retry
              </button>
            </div>
          ) : projectMembers.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-slate-600 font-medium">No team members</p>
              <p className="text-sm text-slate-500 mt-1">
                {selectedProjectId === "all"
                  ? "Invite members to get started"
                  : "No members assigned to this project"}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200/60">
                    <th className="text-left py-3 px-4 font-semibold text-xs uppercase tracking-wider text-slate-700">
                      Name
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-xs uppercase tracking-wider text-slate-700">
                      Email
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-xs uppercase tracking-wider text-slate-700">
                      Role
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-xs uppercase tracking-wider text-slate-700">
                      Joined
                    </th>
                    <th className="text-right py-3 px-4 font-semibold text-xs uppercase tracking-wider text-slate-700">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {projectMembers.map((member) => (
                    <tr
                      key={member._id}
                      className="border-b border-slate-200/40 hover:bg-slate-100/50 transition"
                    >
                      <td className="py-3 px-4 text-slate-900 font-medium">{member.name}</td>
                      <td className="py-3 px-4 text-slate-600 text-sm">{member.email}</td>
                      <td className="py-3 px-4">
                        <span className="inline-block px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold border border-blue-200/50">
                          {member.role}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-slate-600">
                        {new Date(member.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 text-right relative">
                        <button
                          onClick={() =>
                            setOpenMenu(openMenu === member._id ? null : member._id)
                          }
                          className="p-1 hover:bg-slate-200/50 rounded transition"
                        >
                          <MoreVertical className="h-4 w-4 text-slate-600" />
                        </button>
                        {openMenu === member._id && (
                          <motion.div
                            initial={{ opacity: 0, y: -8 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="absolute right-0 top-8 bg-white border border-slate-200/60 rounded-lg shadow-lg z-10 min-w-32 overflow-hidden"
                          >
                            <button className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2 border-b border-slate-200/40 font-medium">
                              <Eye className="h-3 w-3" /> View
                            </button>
                            <button
                              onClick={() => handleBlockMember(member._id)}
                              className="w-full px-4 py-2 text-left text-sm text-orange-600 hover:bg-orange-50 flex items-center gap-2 border-b border-slate-200/40 font-medium"
                            >
                              <Lock className="h-3 w-3" /> Block
                            </button>
                            <button
                              onClick={() => handleRemoveMember(member._id)}
                              className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 font-medium"
                            >
                              <Trash2 className="h-3 w-3" /> Remove
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
            <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
              Email Address
            </label>
            <input
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="member@example.com"
              className="rounded-lg border border-slate-200/60 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Role</label>
            <select
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value)}
              className="rounded-lg border border-slate-200/60 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            >
              <option value="employee">Employee</option>
              <option value="manager">Manager</option>
            </select>
          </div>
          <div className="flex gap-3 pt-4">
            <button
              onClick={handleInviteMember}
              disabled={inviting}
              className="flex-1 px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm transition shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {inviting ? "Sending..." : "Send Invite"}
            </button>
            <button
              onClick={() => setInviteModalOpen(false)}
              disabled={inviting}
              className="flex-1 px-4 py-2.5 rounded-lg border border-slate-200/60 bg-white hover:bg-slate-50 text-slate-700 font-medium text-sm transition shadow-md disabled:opacity-50"
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
            <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
              Email (Optional)
            </label>
            <input
              type="email"
              value={linkEmail}
              onChange={(e) => setLinkEmail(e.target.value)}
              placeholder="member@example.com"
              className="rounded-lg border border-slate-200/60 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            />
            <p className="text-xs text-slate-500">If provided, the link will be sent via email</p>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Role</label>
            <select
              value={linkRole}
              onChange={(e) => setLinkRole(e.target.value)}
              className="rounded-lg border border-slate-200/60 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            >
              <option value="employee">Employee</option>
              <option value="manager">Manager</option>
            </select>
          </div>
          <div className="flex gap-3 pt-4">
            <button
              onClick={handleGenerateLink}
              disabled={generatingLink}
              className="flex-1 px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm transition shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {generatingLink ? "Generating..." : "Generate"}
            </button>
            <button
              onClick={() => setLinkInputModalOpen(false)}
              disabled={generatingLink}
              className="flex-1 px-4 py-2.5 rounded-lg border border-slate-200/60 bg-white hover:bg-slate-50 text-slate-700 font-medium text-sm transition shadow-md disabled:opacity-50"
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
            <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block mb-2">
              Invite Link
            </label>
            <div className="bg-slate-50 border border-slate-200/60 rounded-lg p-4 break-all text-sm text-slate-900 font-mono">
              {inviteLink || "Generating..."}
            </div>
          </div>
          <div className="flex gap-3 pt-4">
            <button
              onClick={handleCopyLink}
              className="flex-1 px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm transition shadow-md flex items-center justify-center gap-2"
            >
              <Copy className="h-4 w-4" />
              Copy Link
            </button>
            <button
              onClick={() => setLinkModalOpen(false)}
              className="flex-1 px-4 py-2.5 rounded-lg border border-slate-200/60 bg-white hover:bg-slate-50 text-slate-700 font-medium text-sm transition shadow-md"
            >
              Close
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
