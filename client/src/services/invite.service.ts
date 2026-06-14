import api from "@/lib/axios";
import type { AcceptInvitePayload, AuthResponse, InviteInfo, InviteRecord } from "@/types";

export const inviteService = {
  /** Admin: send an invite to an email address */
  create: (email: string) =>
    api
      .post<{ message: string; invite: InviteRecord }>("/invites", { email })
      .then((r) => r.data),

  /** Admin: list all invites for this workspace */
  list: () =>
    api.get<{ invites: InviteRecord[] }>("/invites").then((r) => r.data.invites),

  /** Public: validate a token and return invite metadata */
  getByToken: (token: string) =>
    api.get<{ invite: InviteInfo }>(`/invites/${token}`).then((r) => r.data.invite),

  /** Public: employee accepts invite and creates their account */
  accept: (token: string, payload: AcceptInvitePayload) =>
    api
      .post<AuthResponse>(`/invites/${token}/accept`, payload)
      .then((r) => r.data),

  /** Admin: revoke an invite */
  revoke: (id: string) =>
    api.delete<{ message: string }>(`/invites/${id}`).then((r) => r.data),
};
