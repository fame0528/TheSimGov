export interface SessionUser { id: string; companyId?: string }
export interface Session { user?: SessionUser }
export async function getServerSession(): Promise<Session | null> { return { user: { id: 'dev-user' } }; }
