import { create } from "zustand";
import { persist } from "zustand/middleware";

interface AuthState {
  userId: string | null;
  userName: string | null;
  userEmail: string | null;
  avatarUrl: string | null;
  personalGroupId: string | null;
  token: string | null;
  login: (user: {
    id: string;
    name: string;
    email: string;
    avatarUrl?: string | null;
    personalGroupId?: string;
    token: string;
  }) => void;
  updateUserInfo: (fields: { name?: string; avatarUrl?: string | null }) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      userId: null,
      userName: null,
      userEmail: null,
      avatarUrl: null,
      personalGroupId: null,
      token: null,

      login: ({ id, name, email, avatarUrl, personalGroupId, token }) => {
        set({
          userId: id,
          userName: name,
          userEmail: email,
          avatarUrl: avatarUrl ?? null,
          personalGroupId: personalGroupId ?? null,
          token,
        });
      },

      updateUserInfo: (fields) => {
        set((s) => ({
          userName: fields.name ?? s.userName,
          avatarUrl: fields.avatarUrl !== undefined ? fields.avatarUrl : s.avatarUrl,
        }));
      },

      logout: () => {
        set({
          userId: null,
          userName: null,
          userEmail: null,
          avatarUrl: null,
          personalGroupId: null,
          token: null,
        });
      },
    }),
    {
      name: "splitquest-auth",
    },
  ),
);
