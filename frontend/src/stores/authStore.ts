import { create } from "zustand";
import { persist } from "zustand/middleware";

interface AuthState {
  userId: string | null;
  userName: string | null;
  userEmail: string | null;
  avatarUrl: string | null;
  personalGroupId: string | null;
  token: string | null;
  customCategories: { expense: string[]; income: string[] };
  login: (user: {
    id: string;
    name: string;
    email: string;
    avatarUrl?: string | null;
    personalGroupId?: string;
    token: string;
    customCategories?: { expense: string[]; income: string[] };
  }) => void;
  updateUserInfo: (fields: {
    name?: string;
    avatarUrl?: string | null;
    customCategories?: { expense: string[]; income: string[] };
  }) => void;
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
      customCategories: { expense: [], income: [] },

      login: ({ id, name, email, avatarUrl, personalGroupId, token, customCategories }) => {
        set({
          userId: id,
          userName: name,
          userEmail: email,
          avatarUrl: avatarUrl ?? null,
          personalGroupId: personalGroupId ?? null,
          token,
          customCategories: customCategories ?? { expense: [], income: [] },
        });
      },

      updateUserInfo: (fields) => {
        set((s) => ({
          userName: fields.name ?? s.userName,
          avatarUrl: fields.avatarUrl !== undefined ? fields.avatarUrl : s.avatarUrl,
          customCategories: fields.customCategories !== undefined ? fields.customCategories : s.customCategories,
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
          customCategories: { expense: [], income: [] },
        });
      },
    }),
    {
      name: "splitquest-auth",
    },
  ),
);
