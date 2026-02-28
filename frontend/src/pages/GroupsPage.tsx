import { useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/stores/authStore";
import { groupApi, ApiError } from "@/lib/api";
import { PixelCard } from "@/components/ui/PixelCard";
import { PixelButton } from "@/components/ui/PixelButton";
import { PixelInput } from "@/components/ui/PixelInput";
import { PixelEmpty } from "@/components/ui/PixelLoader";
import { PixelBadge } from "@/components/ui/PixelBadge";
import { useLocalGroups } from "@/hooks/useLocalGroups";

export default function GroupsPage() {
  const { userId } = useAuthStore();
  const [showForm, setShowForm] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [error, setError] = useState("");
  const qc = useQueryClient();

  const { groups, addGroup } = useLocalGroups();

  const mutation = useMutation({
    mutationFn: () =>
      groupApi.create({
        name: groupName.trim(),
        ownerId: userId!,
        memberIds: [userId!],
      }),
    onSuccess: (res) => {
      addGroup({ id: res.data.id, name: groupName.trim(), memberCount: 1 });
      setGroupName("");
      setShowForm(false);
      void qc.invalidateQueries({ queryKey: ["groups"] });
    },
    onError: (err) => {
      if (err instanceof ApiError) setError(err.message);
    },
  });

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!groupName.trim()) {
      setError("群組名稱不能為空");
      return;
    }
    mutation.mutate();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-pixel text-pixel-sm text-pixel-gold">⊕ 我的群組</h1>
        <PixelButton
          variant="primary"
          size="sm"
          onClick={() => setShowForm((v) => !v)}
          aria-expanded={showForm}
          aria-controls="create-group-form"
        >
          {showForm ? "✕ 取消" : "+ 新群組"}
        </PixelButton>
      </div>

      {/* Create group form */}
      {showForm && (
        <PixelCard id="create-group-form" title="建立新群組" titleIcon="⊕" variant="gold">
          <form onSubmit={handleCreate} aria-label="建立群組表單">
            <div className="flex flex-col gap-4">
              <PixelInput
                label="群組名稱"
                type="text"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                error={error}
                placeholder="旅遊、聚餐..."
                autoFocus
                required
              />
              <PixelButton
                type="submit"
                variant="primary"
                fullWidth
                loading={mutation.isPending}
              >
                ▶ 建立
              </PixelButton>
            </div>
          </form>
        </PixelCard>
      )}

      {/* Groups list */}
      {groups.length === 0 ? (
        <PixelEmpty
          icon="🏰"
          title="還沒有群組"
          description="建立一個群組開始分帳吧！"
        />
      ) : (
        <ul className="space-y-3" role="list">
          {groups.map((group) => (
            <li key={group.id}>
              <Link
                to={`/groups/${group.id}`}
                className="block border-2 border-pixel-border shadow-pixel bg-pixel-panel p-4 hover:border-pixel-gold hover:shadow-pixel-gold transition-all duration-75 hover:translate-x-[2px] hover:translate-y-[2px]"
                aria-label={`群組：${group.name}，${group.memberCount} 名成員`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="font-pixel text-pixel-xs text-pixel-text mb-2">
                      {group.name}
                    </h2>
                    <PixelBadge variant="muted">
                      {group.memberCount} 人
                    </PixelBadge>
                  </div>
                  <span className="text-2xl text-pixel-muted" aria-hidden="true">▶</span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
