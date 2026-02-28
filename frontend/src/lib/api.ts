const BASE = "/api";

async function request<T>(
  path: string,
  options?: RequestInit,
): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...options?.headers },
    ...options,
  });

  const data = await res.json();

  if (!res.ok) {
    throw new ApiError(
      data.error ?? "Request failed",
      res.status,
      data.details,
    );
  }

  return data as T;
}

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public details?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

// ── User ──────────────────────────────────────────────────

export interface RegisterRequest {
  name: string;
  email: string;
}

export interface RegisterResponse {
  success: true;
  data: { id: string; email: string; name: string; personalGroupId: string };
}

export const userApi = {
  register: (body: RegisterRequest) =>
    request<RegisterResponse>("/users/register", {
      method: "POST",
      body: JSON.stringify(body),
    }),
};

// ── Groups ────────────────────────────────────────────────

export interface Group {
  id: string;
  name: string;
  type: "Personal" | "Team";
  ownerId: string;
  memberIds: string[];
}

export interface CreateGroupRequest {
  name: string;
  ownerId: string;
  memberIds: string[];
}

export const groupApi = {
  create: (body: CreateGroupRequest) =>
    request<{ success: true; data: { id: string } }>("/groups", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  addMember: (groupId: string, userId: string) =>
    request<{ success: true }>(`/groups/${groupId}/members`, {
      method: "POST",
      body: JSON.stringify({ userId }),
    }),

  getBalance: (groupId: string) =>
    request<{
      success: true;
      data: {
        netBalances: Record<string, number>;
        settlements: Array<{ from: string; to: string; amount: number }>;
        descriptions: string[];
      };
    }>(`/groups/${groupId}/balance`),
};

// ── Expenses ──────────────────────────────────────────────

export type SplitType = "EQUAL" | "PERCENTAGE" | "EXACT";

export type CreateExpenseRequest =
  | {
      description: string;
      totalAmount: number;
      payerId: string;
      groupId: string;
      splitType: "EQUAL";
      memberIds: string[];
    }
  | {
      description: string;
      totalAmount: number;
      payerId: string;
      groupId: string;
      splitType: "PERCENTAGE";
      percentageMap: Record<string, number>;
    }
  | {
      description: string;
      totalAmount: number;
      payerId: string;
      groupId: string;
      splitType: "EXACT";
      exactMap: Record<string, number>;
    };

export const expenseApi = {
  create: (body: CreateExpenseRequest) =>
    request<{ success: true }>("/expenses", {
      method: "POST",
      body: JSON.stringify(body),
    }),
};
