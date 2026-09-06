import { authConfigured, getAuth } from '@/lib/auth';
export const runtime = 'nodejs';
async function handler(request: Request) {
  if (!authConfigured()) return Response.json({ message: 'Login is not configured yet.' }, { status: 503 });
  return getAuth().handler(request);
}
export { handler as GET, handler as POST };
