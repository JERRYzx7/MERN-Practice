import { useQuery } from "@tanstack/react-query";
import { groupApi, type Member } from "@/lib/api";

export function useGroupMembers(groupId: string | undefined) {
  return useQuery<Member[]>({
    queryKey: ["members", groupId],
    queryFn: async () => {
      const res = await groupApi.getMembers(groupId!);
      return res.data;
    },
    enabled: !!groupId,
  });
}
