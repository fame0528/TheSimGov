// @ts-ignore - next-auth type export issue
import type { NextAuthOptions } from 'next-auth';

// Minimal placeholder auth options to satisfy imports; extend with real providers later.
export const authOptions: NextAuthOptions = {
  providers: [],
  session: { strategy: 'jwt' },
};
