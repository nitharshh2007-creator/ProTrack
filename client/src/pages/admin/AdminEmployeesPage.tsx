import { useEffect, useMemo, useState } from "react";
import { Mail, Search as SearchIcon, UserCircle2, Trash2, Clock } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Spinner } from "@/components/ui/Spinner";
import { userService, inviteService } from "@/services";
import type { User, InviteRecord } from "@/types";
import { formatDate } from "@/lib/formatDate";

export const AdminEmployeesPage = () => {
  // ── Members ────────────────────────────────────────────────────────────────
  const [members, setMembers] = useState<User[]>([]);
  const [membersLoading, setMembersLoading] = useState(true);
  const [search, setSearch] = useState("");

  // ── Invites ────────────────────────────────────────────────────────────────
  const [invites, setInvites] = useState<InviteRecord[]>([]);
  const [invitesLoading, setInvitesLoading] = useState(true);

  // ── Invite modal ───────────────────────────────────────────────────────────
  const [modalOpen, setModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [inviteError, setInviteError] = useState("");
  const [inviteSuccess, setInviteSuccess] = useState("");
  const [createdInviteToken, setCreatedInviteToken] = useState<string | null>(null);

  // ── Copy-link feedback ─────────────────────────────────────────────────────
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  // Fetch workspace members
  useEffect(() => {
    userService
      .getAll()
      .then(setMembers)
      .finally(() => setMembersLoading(false));
  }, []);

  // Fetch pending invites
  useEffect(() => {
    inviteService
      .list()
      .then(setInvites)
      .finally(() => setInvitesLoading(false));
  }, []);

  const filteredMembers = useMemo(
    () =>
      members.filter((m) =>
        [m.name, m.email, m.role].some((v) =>
          v.toLowerCase().includes(search.toLowerCase())
        )
      ),
    [members, search]
  );

  // ── Send invite ────────────────────────────────────────────────────────────
  const handleSendInvite = async () => {
    if (!inviteEmail.trim()) { setInviteError("Email is required."); return; }
    setSending(true);
    setInviteError("");
    setInviteSuccess("");
    setCreatedInviteToken(null);
    try {
      const { invite } = await inviteService.create(inviteEmail.trim());
      setInvites((prev) => [invite, ...prev]);
      setCreatedInviteToken(invite.token);
      setInviteSuccess(`Invite ready! Copy the link below and share it with ${inviteEmail.trim()}.`);
      setInviteEmail("");
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setInviteError(msg ?? "Failed to send invite.");
    } finally {
      setSending(false);
    }
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setInviteEmail("");
    setInviteError("");
    setInviteSuccess("");
    setCreatedInviteToken(null);
  };

  // ── Revoke invite ──────────────────────────────────────────────────────────
  const handleRevoke = async (id: string) => {
    if (!confirm("Revoke this invite?")) return;
    try {
      await inviteService.revoke(id);
      setInvites((prev) => prev.filter((i) => i._id !== id));
    } catch {
      alert("Failed to revoke invite.");
    }
  };

  // ── Copy invite link ───────────────────────────────────────────────────────
  const copyInviteLink = (token: string) => {
    const url = `${window.location.origin}/invite/${token}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopiedToken(token);
      setTimeout(() => setCopiedToken(null), 2000);
    });
  };

  const pendingInvites = invites.filter((i) => !i.accepted);

  return (
    <div className="space-y-8">
      {/* ── Header ── */}
      <div className="flex flex-col gap-4 rounded-2xl bg-white p-6 shadow-sm md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Team</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage workspace members and pending invitations.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative">
            <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search members..."
              className="rounded-lg border border-gray-300 py-2 pl-9 pr-4 text-sm outline-none focus:ring-2 focus:ring-blue-500 w-56"
            />
          </div>
          <Button onClick={() => setModalOpen(true)}>
            <Mail className="h-4 w-4" /> Invite Employee
          </Button>
        </div>
      </div>

      {/* ── Members table ── */}
      <div className="rounded-2xl bg-white shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-800">
            Members
            {!membersLoading && (
              <span className="ml-2 text-sm font-normal text-gray-400">
                {members.length} total
              </span>
            )}
          </h2>
        </div>

        {membersLoading ? (
          <div className="flex justify-center py-12">
            <Spinner className="h-6 w-6" />
          </div>
        ) : filteredMembers.length === 0 ? (
          <div className="py-10 text-center text-sm text-gray-400">
            {members.length === 0
              ? "No members yet. Invite employees to get started."
              : "No members match your search."}
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {filteredMembers.map((member) => (
              <div
                key={member._id}
                className="flex items-center gap-4 px-6 py-4"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                  <UserCircle2 className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{member.name}</p>
                  <p className="text-xs text-gray-400 truncate">{member.email}</p>
                </div>
                <Badge variant={member.role === "admin" ? "info" : "default"}>
                  {member.role}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Pending invites ── */}
      <div className="rounded-2xl bg-white shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-800">
            Pending Invites
            {!invitesLoading && pendingInvites.length > 0 && (
              <span className="ml-2 text-sm font-normal text-gray-400">
                {pendingInvites.length} pending
              </span>
            )}
          </h2>
        </div>

        {invitesLoading ? (
          <div className="flex justify-center py-12">
            <Spinner className="h-6 w-6" />
          </div>
        ) : pendingInvites.length === 0 ? (
          <div className="py-10 text-center text-sm text-gray-400">
            No pending invites.
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {pendingInvites.map((invite) => (
              <div
                key={invite._id}
                className="flex flex-wrap items-center gap-4 px-6 py-4"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-yellow-50 text-yellow-600">
                  <Clock className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{invite.email}</p>
                  <p className="text-xs text-gray-400">
                    Expires {formatDate(invite.expiresAt)}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => copyInviteLink(invite.token)}
                    className="rounded-md border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 transition"
                  >
                    {copiedToken === invite.token ? "Copied!" : "Copy link"}
                  </button>
                  <button
                    onClick={() => handleRevoke(invite._id)}
                    className="rounded-md border border-red-100 px-3 py-1.5 text-xs font-medium text-red-500 hover:bg-red-50 transition"
                    title="Revoke invite"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Invite modal ── */}
      {modalOpen && (
        <Modal title="Invite Employee" onClose={handleCloseModal}>
          <div className="space-y-4">
            <p className="text-sm text-gray-500">
              Enter the employee's email address. They'll receive a link to create their account
              and join your workspace.
            </p>

            <Input
              label="Email address"
              id="inviteEmail"
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="employee@company.com"
            />

            {inviteError && (
              <p className="text-sm text-red-500">{inviteError}</p>
            )}

            {inviteSuccess && (
              <div className="rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700">
                {inviteSuccess}
                <div className="mt-2 flex items-center gap-2">
                  <code className="flex-1 break-all rounded bg-green-100 p-2 font-mono text-xs text-green-800">
                    {`${window.location.origin}/invite/${createdInviteToken ?? ""}`}
                  </code>
                  <button
                    onClick={() => {
                      if (createdInviteToken) copyInviteLink(createdInviteToken);
                    }}
                    className="shrink-0 rounded border border-green-300 bg-white px-2 py-1 text-xs font-medium text-green-700 hover:bg-green-50"
                  >
                    {copiedToken === createdInviteToken ? "Copied!" : "Copy"}
                  </button>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-1">
              <Button variant="secondary" onClick={handleCloseModal}>
                Close
              </Button>
              {!inviteSuccess && (
                <Button onClick={handleSendInvite} loading={sending}>
                  Send Invite
                </Button>
              )}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
