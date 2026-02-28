export interface IJwtService {
  sign(payload: Record<string, unknown>): string;
  verify(token: string): Record<string, unknown> | null;
}
