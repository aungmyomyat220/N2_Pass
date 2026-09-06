import { authConfigured, getAuth } from '@/lib/auth';
import { getDatabase } from '@/lib/db';
import { validState, emptyState, type StudyState } from '@/lib/study-state';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
const json = (body: unknown, status = 200) => Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } });
export async function GET(request: Request) {
  if (!authConfigured()) return json({ user: null, configured: false });
  try {
    const session = await getAuth().api.getSession({ headers: request.headers });
    if (!session) return json({ user: null, configured: true });
    const sql = getDatabase();
    const rows = await sql`SELECT state, revision FROM user_study_state WHERE user_id = ${session.user.id}` as { state: StudyState; revision: number }[];
    return json({ user: { id: session.user.id, name: session.user.name }, configured: true, state: rows[0]?.state ?? emptyState(), revision: rows[0]?.revision ?? 0 });
  } catch { return json({ message: 'Unable to load your account. Please retry.' }, 503); }
}
export async function PUT(request: Request) {
  if (!authConfigured()) return json({ message: 'Login is not configured.' }, 503);
  if (request.headers.get('origin') !== new URL(process.env.BETTER_AUTH_URL!).origin) return json({ message: 'Invalid origin.' }, 403);
  try {
    const session = await getAuth().api.getSession({ headers: request.headers });
    if (!session) return json({ message: 'Please sign in again to sync.' }, 401);
    const body = await request.text();
    if (body.length > 1000000) return json({ message: 'State is too large.' }, 413);
    let value;
    try { value = JSON.parse(body); } catch { return json({ message: 'Invalid JSON.' }, 400); }
    if (!value || !validState(value.state) || !Number.isSafeInteger(value.revision) || value.revision < 0) return json({ message: 'Invalid study state.' }, 400);
    if (value.userId !== session.user.id) return json({ message: 'Your signed-in account changed. Reload before continuing.' }, 401);
    const sql = getDatabase();
    const rows = await sql`
      INSERT INTO user_study_state (user_id, state, revision)
      SELECT ${session.user.id}, ${JSON.stringify(value.state)}::jsonb, 1 WHERE ${value.revision} = 0
      ON CONFLICT (user_id) DO NOTHING RETURNING revision` as { revision: number }[];
    if (rows.length) return json({ revision: rows[0].revision });
    const updated = await sql`UPDATE user_study_state SET state = ${JSON.stringify(value.state)}::jsonb, revision = revision + 1, updated_at = now()
      WHERE user_id = ${session.user.id} AND revision = ${value.revision} RETURNING revision` as { revision: number }[];
    if (!updated.length) return json({ message: 'Progress changed on another device. Reload cloud progress before continuing.' }, 409);
    return json({ revision: updated[0].revision });
  } catch { return json({ message: 'Sync failed. Your changes are kept on this device.' }, 503); }
}
