/**
 * Local stub for getServerSession to satisfy type checks until real auth is implemented.
 * Replace with next-auth implementation when providers are configured.
 */
export interface SessionUser { id: string; email: string; companyId?: string }
export interface Session { user?: SessionUser }

export async function getServerSession(): Promise<Session | null> {
  // TODO: Integrate next-auth real session retrieval
  return { user: { id: 'dev-user', email: 'dev@example.com' } };
}
