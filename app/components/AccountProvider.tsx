'use client';
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { createAuthClient } from 'better-auth/react';
import { accountState, activateAccount, guestState, readPending, STUDY_CHANGE, updateAccount, writePending } from '@/lib/study-storage';
import { importGuest, type StudyState } from '@/lib/study-state';
const client = createAuthClient();
type Account = { user: { id: string; name: string } | null; configured: boolean; state: StudyState; revision: number };
const Context = createContext<ReactNode>(null);
export function AccountControls() { return useContext(Context); }
export default function AccountProvider({ children }: { children: ReactNode }) {
  const [account, setAccount] = useState<Account | null>(null);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);
  const [version, setVersion] = useState(0);
  const [canImport, setCanImport] = useState(false);
  const current = useRef<Account | null>(null);
  const saving = useRef(false);
  const dirty = useRef(false);
  const conflict = useRef(false);
  const generation = useRef(0);

  async function save() {
    const a = current.current;
    if (!a?.user || saving.current || !dirty.current || conflict.current) return;
    saving.current = true;
    setStatus('Saving…');
    const snapshot = accountState()!;
    const token = generation.current;
    try {
      const response = await fetch('/api/study-state', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ state: snapshot, revision: a.revision, userId: a.user.id }) });
      const result = await response.json();
      if (token !== generation.current) return;
      if (!response.ok) {
        conflict.current = response.status === 409 || response.status === 401;
        throw new Error(result.message || 'Unable to sync. Please retry.');
      }
      a.revision = result.revision;
      dirty.current = accountState() !== snapshot;
      writePending(a.user.id, dirty.current ? { state: accountState()!, revision: a.revision } : null);
      setError(''); setStatus(dirty.current ? 'Saving…' : 'Saved to your account');
    } catch (e) {
      if (token === generation.current) { setError(e instanceof Error ? e.message : 'Unable to sync. Please retry.'); setStatus('Changes saved on this device'); }
    } finally { saving.current = false; }
  }

  async function load() {
    setError('');
    try {
      const response = await fetch('/api/study-state', { cache: 'no-store' });
      const a: Account & { message?: string } = await response.json();
      if (!response.ok) throw new Error(a.message);
      generation.current++;
      current.current = a;
      conflict.current = false; dirty.current = false;
      let value = a.state;
      if (a.user) {
        const pending = readPending(a.user.id);
        if (pending) {
          value = pending.state; dirty.current = true;
          if (pending.revision !== a.revision) {
            conflict.current = true;
            setError('Progress changed on another device. Download your unsynced changes, then load cloud progress to continue.');
          }
          // Keep the draft's original revision until the conflict is resolved.
          a.revision = pending.revision;
        }
        const guest = guestState();
        setCanImport(!localStorage.getItem(`n2-imported:${a.user.id}`) && Boolean(Object.keys(guest.progress).length || guest.starred.length));
      }
      activateAccount(a.user?.id ?? null, value);
      setAccount(a); setVersion(v => v + 1);
      setStatus(a.user ? dirty.current ? 'Changes saved on this device' : 'Saved to your account' : 'Guest · saved in this browser');
    } catch (e) { setError(e instanceof Error ? e.message : 'Unable to load your account.'); }
  }

  useEffect(() => {
    void load();
    const change = () => {
      const a = current.current;
      if (!a?.user) return;
      dirty.current = true;
      try { writePending(a.user.id, { state: accountState()!, revision: a.revision }); }
      catch { setError('Browser storage is full. Keep this page open until sync succeeds.'); }
      void save();
    };
    const unload = (event: BeforeUnloadEvent) => { if (dirty.current) { event.preventDefault(); event.returnValue = ''; } };
    const timer = window.setInterval(() => { if (navigator.onLine) void save(); }, 5000);
    window.addEventListener(STUDY_CHANGE, change);
    window.addEventListener('beforeunload', unload);
    return () => { clearInterval(timer); window.removeEventListener(STUDY_CHANGE, change); window.removeEventListener('beforeunload', unload); };
  }, []);

  async function login() {
    setBusy(true); setError('');
    try {
      const result = await client.signIn.social({ provider: 'google', callbackURL: window.location.pathname });
      if (result.error) throw new Error(result.error.message);
    } catch { setError('Could not start Google login. Please try again.'); }
    finally { setBusy(false); }
  }
  async function logout() {
    setBusy(true); setError('');
    try {
      await save();
      if (dirty.current || saving.current) throw new Error('Please finish syncing or resolve the conflict before signing out.');
      const result = await client.signOut();
      if (result.error) throw new Error('Could not sign out. Please retry.');
      activateAccount(null); setAccount(null); current.current = null;
      await load();
    } catch (e) { setError(e instanceof Error ? e.message : 'Could not sign out.'); }
    finally { setBusy(false); }
  }
  function download() {
    const url = URL.createObjectURL(new Blob([JSON.stringify(accountState(), null, 2)], { type: 'application/json' }));
    const link = document.createElement('a'); link.href = url; link.download = 'n2-unsynced-progress.json'; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  const controls = <section className="account-controls" aria-label="Account">
    <strong>{account?.user?.name || 'Your progress'}</strong>
    <small role="status">{status}</small>
    {account?.user ? <>
      <button disabled={busy} onClick={() => void logout()}>Sign out</button>
      {canImport && <div><p>Bring this browser’s guest progress and stars into your account? Existing account progress takes priority.</p>
        <button disabled={busy || conflict.current} onClick={() => {
          updateAccount(importGuest(accountState()!, guestState()));
          localStorage.setItem(`n2-imported:${account.user!.id}`, 'yes'); setCanImport(false); setVersion(v => v + 1);
        }}>Import guest progress</button>
        <button onClick={() => { localStorage.setItem(`n2-imported:${account.user!.id}`, 'skip'); setCanImport(false); }}>Skip</button>
      </div>}
    </> : <button
      className="google-sign-in"
      disabled={busy || !account?.configured}
      title={account?.configured ? undefined : 'Google login is not configured yet'}
      onClick={() => void login()}
    >
      <svg className="google-sign-in-icon" viewBox="0 0 24 24" aria-hidden="true">
        <path fill="#4285F4" d="M21.6 12.23c0-.71-.06-1.39-.18-2.05H12v3.88h5.38a4.6 4.6 0 0 1-1.99 3.02v2.51h3.23c1.89-1.74 2.98-4.3 2.98-7.36Z" />
        <path fill="#34A853" d="M12 22c2.7 0 4.96-.9 6.62-2.41l-3.23-2.51c-.9.6-2.05.96-3.39.96-2.6 0-4.81-1.76-5.6-4.12H3.06v2.59A10 10 0 0 0 12 22Z" />
        <path fill="#FBBC05" d="M6.4 13.92a6 6 0 0 1 0-3.84V7.49H3.06a10 10 0 0 0 0 9.02l3.34-2.59Z" />
        <path fill="#EA4335" d="M12 5.96c1.47 0 2.79.5 3.82 1.49l2.87-2.87A9.6 9.6 0 0 0 12 2a10 10 0 0 0-8.94 5.49l3.34 2.59A6 6 0 0 1 12 5.96Z" />
      </svg>
      <span>{busy ? 'Connecting…' : 'Continue with Google'}</span>
    </button>}
    {error && <div role="alert"><p>{error}</p>
      {conflict.current ? <><button onClick={download}>Download unsynced changes</button><button disabled={saving.current} onClick={() => {
        if (!window.confirm('Replace this tab’s unsynced changes with your saved cloud progress? Download a backup first if you need it.')) return;
        writePending(account!.user!.id, null); setAccount(null); void load();
      }}>Load cloud progress</button></> : <button onClick={() => { if (account?.user) void save(); else void load(); }}>Retry</button>}
    </div>}
  </section>;
  return <Context.Provider value={controls}>{account ? <div key={`${account.user?.id ?? 'guest'}:${version}`}>{children}</div> : <div className="account-loading">{error ? <>{error} <button onClick={() => void load()}>Retry</button></> : 'Loading your study progress…'}</div>}</Context.Provider>;
}
