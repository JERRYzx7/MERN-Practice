import { useQuery } from "@tanstack/react-query";
import { groupApi, type Member } from "@/lib/api";

function isMember(value: unknown): value is Member {
  if (!value || typeof value !== "object") return false;
  const candidate = value as { id?: unknown; name?: unknown };
  return typeof candidate.id === "string" && typeof candidate.name === "string";
}

function normalizeMembersPayload(value: unknown): Member[] {
  if (Array.isArray(value)) return value.filter(isMember);
  if (!value || typeof value !== "object") return [];
  const maybeMembers = (value as { members?: unknown }).members;
  if (!Array.isArray(maybeMembers)) return [];
  return maybeMembers.filter(isMember);
}

export function useGroupMembers(groupId: string | undefined) {
  return useQuery<Member[]>({
    queryKey: ["members", groupId],
    queryFn: async () => {
      const res = await groupApi.getMembers(groupId!);
      return normalizeMembersPayload(res.data);
    },
    enabled: !!groupId,
  });
}
