import { create } from "zustand";
import { persist } from "zustand/middleware";

interface AuthState {
  userId: string | null;
  userName: string | null;
  userEmail: string | null;
  personalGroupId: string | null;
  token: string | null;
  login: (user: {
    id: string;
    name: string;
    email: string;
    personalGroupId?: string;
    token: string;
  }) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      userId: null,
      userName: null,
      userEmail: null,
      personalGroupId: null,
      token: null,

      login: ({ id, name, email, personalGroupId, token }) => {
        set({
          userId: id,
          userName: name,
          userEmail: email,
          personalGroupId: personalGroupId ?? null,
          token,
        });
      },

      logout: () => {
        set({
          userId: null,
          userName: null,
          userEmail: null,
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
