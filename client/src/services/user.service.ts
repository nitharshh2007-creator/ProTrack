import api from "@/lib/axios";
import type { User } from "@/types";

export const userService = {
  getAll: () =>
    api.get<{ users: User[] }>("/users").then((r) => r.data.users),
};
