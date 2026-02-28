import { create } from "zustand";
import { persist } from "zustand/middleware";

interface AuthState {
  userId: string | null;
  userName: string | null;
  userEmail: string | null;
  personalGroupId: string | null;
  login: (user: {
    id: string;
    name: string;
    email: string;
    personalGroupId?: string;
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

      login: ({ id, name, email, personalGroupId }) => {
        set({
          userId: id,
          userName: name,
          userEmail: email,
          personalGroupId: personalGroupId ?? null,
        });
      },

      logout: () => {
        set({
          userId: null,
          userName: null,
          userEmail: null,
          personalGroupId: null,
        });
      },
    }),
    {
      name: "splitquest-auth",
    },
  ),
);
