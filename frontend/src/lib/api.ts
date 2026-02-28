const BASE = "/api";

function getToken(): string | null {
  try {
    const raw = localStorage.getItem("splitquest-auth");
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { state?: { token?: string } };
    return parsed.state?.token ?? null;
  } catch {
    return null;
  }
}

async function request<T>(
  path: string,
  options?: RequestInit,
): Promise<T> {
  const token = getToken();
  const authHeader: Record<string, string> = token
    ? { Authorization: `Bearer ${token}` }
    : {};

  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...authHeader, ...options?.headers },
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
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  success: true;
  data: { id: string; email: string; name: string; personalGroupId: string; token: string };
}

export const userApi = {
  register: (body: RegisterRequest) =>
    request<AuthResponse>("/users/register", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  login: (body: LoginRequest) =>
    request<AuthResponse>("/users/login", {
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

export interface ExpenseRecord {
  id: string;
  groupId: string;
  payerId: string;
  amount: number;
  currency: string;
  description: string;
  splits: { userId: string; amount: number }[];
}

export const groupApi = {
  getGroups: () =>
    request<{ success: true; data: Group[] }>("/groups"),

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
      currency?: string;
      payerId: string;
      groupId: string;
      splitType: "EQUAL";
      memberIds: string[];
    }
  | {
      description: string;
      totalAmount: number;
      currency?: string;
      payerId: string;
      groupId: string;
      splitType: "PERCENTAGE";
      percentageMap: Record<string, number>;
    }
  | {
      description: string;
      totalAmount: number;
      currency?: string;
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

  getByGroup: (groupId: string) =>
    request<{ success: true; data: ExpenseRecord[] }>(`/groups/${groupId}/expenses`),
};
