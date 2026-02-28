import { create } from "zustand";
import { persist } from "zustand/middleware";

interface LocalGroup {
  id: string;
  name: string;
  memberCount: number;
}

interface LocalGroupsState {
  groups: LocalGroup[];
  addGroup: (group: LocalGroup) => void;
  updateMemberCount: (id: string, count: number) => void;
}

export const useLocalGroups = create<LocalGroupsState>()(
  persist(
    (set) => ({
      groups: [],
      addGroup: (group) =>
        set((state) => ({ groups: [group, ...state.groups] })),
      updateMemberCount: (id, count) =>
        set((state) => ({
          groups: state.groups.map((g) =>
            g.id === id ? { ...g, memberCount: count } : g,
          ),
        })),
    }),
    { name: "splitquest-groups" },
  ),
);
