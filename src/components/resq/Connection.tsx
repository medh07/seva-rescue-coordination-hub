import { useCallback, useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { resqClient } from '@/lib/resq/client';
import { canUseCommandCentre, label, REQUEST_FIELDS, type RequestRow } from '@/lib/resq/requests';

type Phase = 'loading' | 'signed-out' | 'denied' | 'ready' | 'error';
const button = 'rounded-lg border border-border bg-secondary px-4 py-2 text-sm font-semibold disabled:opacity-50';
const input = 'w-full rounded-lg border border-border bg-background p-3';

export function ResQConnection({ children }: { children: ReactNode }) {
  const [phase, setPhase] = useState<Phase>('loading');
  const [session, setSession] = useState<Session | null>(null);
  const [rows, setRows] = useState<RequestRow[]>([]);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [demo, setDemo] = useState(false);
  const [page, setPage] = useState(0);
  const [more, setMore] = useState(false);
  const [lastLoaded, setLastLoaded] = useState('');
  const generation = useRef(0);
  const sessionRef = useRef<Session | null>(null);
  const pageSize = 50;

  const load = useCallback(async (current: Session | null) => {
    const ticket = ++generation.current;
    setRows([]); setMessage(''); setMore(false); setPhase(current ? 'loading' : 'signed-out');
    if (!current) return;
    try {
      const db = resqClient();
      const roles = await db.from('user_roles').select('role,active').eq('user_id', current.user.id).eq('active', true);
      if (roles.error) throw roles.error;
      if (ticket !== generation.current) return;
      if (!canUseCommandCentre(roles.data ?? [])) { setPhase('denied'); setDemo(false); return; }
      // RLS limits this query to the officer's assigned scope; no admin key used.
      const result = await db.from('requests').select(REQUEST_FIELDS)
        .order('created_at', { ascending: false }).order('id', { ascending: false })
        .range(page * pageSize, page * pageSize + pageSize);
      if (result.error) throw result.error;
      if (ticket !== generation.current) return;
      setMore(result.data.length > pageSize);
      setRows(result.data.slice(0, pageSize) as RequestRow[]);
      setLastLoaded(new Date().toLocaleTimeString()); setPhase('ready');
    } catch (error) {
      if (ticket !== generation.current) return;
      setRows([]); setDemo(false); setPhase('error');
      setMessage(error instanceof Error ? error.message : (error as {message?: string})?.message ?? 'Could not load requests. Try again.');
    }
  }, [page]);

  useEffect(() => {
    let alive = true;
    const db = resqClient();
    // No asynchronous Supabase work inside the auth callback (avoids auth locks).
    const { data: { subscription } } = db.auth.onAuthStateChange((_event, next) => {
      if (!alive) return;
      ++generation.current;
      if (sessionRef.current?.user.id !== next?.user.id) setPage(0);
      sessionRef.current = next;
      setSession(next); setRows([]); setDemo(false);
      setPhase(next ? 'loading' : 'signed-out');
    });
    return () => { alive = false; ++generation.current; subscription.unsubscribe(); };
  }, []);

  useEffect(() => { void load(session); }, [session, load]);

  async function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setMessage('');
    const form = new FormData(event.currentTarget);
    try {
      const { error } = await resqClient().auth.signInWithPassword({
        email: String(form.get('email')).trim(), password: String(form.get('password')),
      });
      if (error) setMessage(error.message);
    } catch { setMessage('Unable to reach Supabase. Check your connection and try again.'); }
    finally { setBusy(false); }
  }
  async function logout() {
    ++generation.current; setRows([]); setDemo(false); setBusy(true); setMessage('');
    try {
      const { error } = await resqClient().auth.signOut({ scope: 'local' });
      if (error) throw error;
      sessionRef.current = null; setSession(null); setPage(0); setPhase('signed-out');
    } catch { setPhase('error'); setMessage('Sign-out failed. Please retry.'); }
    finally { setBusy(false); }
  }

  return <div className="min-h-screen bg-background text-foreground">
    <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-card px-6 py-4">
      <div><h1 className="font-display text-xl font-bold text-primary">ResQ-Flow</h1><p className="text-xs text-muted-foreground">Command Centre · Supabase connection test</p></div>
      {session && <div className="flex items-center gap-3"><span className="max-w-52 truncate text-sm">{session.user.email}</span><button className={button} disabled={busy} onClick={logout}>Sign out</button></div>}
    </header>
    {demo && phase === 'ready' ? <>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-secondary p-4 text-sm">
        <p><strong>Demo preview.</strong> These pages use simulated local data. Their actions do not change Supabase.</p>
        <button className={button} onClick={() => setDemo(false)}>Back to real requests</button>
      </div>{children}
    </> : <main className="mx-auto max-w-6xl space-y-5 p-6">
      {message && <p role="alert" className="rounded-lg border border-critical/40 bg-critical/10 p-4">{message}</p>}
      {phase === 'signed-out' && <form onSubmit={login} className="mx-auto mt-12 max-w-md space-y-4 rounded-xl border border-border bg-card p-6">
        <h2 className="text-2xl font-bold">Officer sign in</h2>
        <p className="text-sm text-muted-foreground">Use the email account you created in ResQ-Flow Supabase. Officer access must be granted separately.</p>
        <label className="block space-y-2"><span>Email</span><input className={input} type="email" name="email" autoComplete="username" required /></label>
        <label className="block space-y-2"><span>Password</span><input className={input} type="password" name="password" autoComplete="current-password" required /></label>
        <button className={`${button} w-full bg-primary text-primary-foreground`} disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button>
      </form>}
      {phase === 'loading' && <p role="status">Checking access and loading requests…</p>}
      {phase === 'denied' && <section className="rounded-xl border border-border bg-card p-6"><h2 className="text-xl font-bold">Login successful — officer access pending</h2><p className="mt-2">Your account has no active admin or officer role. A project administrator must grant access. Signing in does not grant it automatically.</p><button className={`${button} mt-4`} onClick={() => void load(sessionRef.current)}>Recheck access</button></section>}
      {phase === 'error' && <button className={button} onClick={() => void load(sessionRef.current)}>Retry connection</button>}
      {phase === 'ready' && <>
        <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-2xl font-bold">SOS requests</h2><p className="text-sm text-muted-foreground">Real database records · permitted area only · refreshed {lastLoaded}</p></div><div className="flex gap-2"><button className={button} onClick={() => void load(sessionRef.current)}>Refresh</button><button className={button} onClick={() => setDemo(true)}>Open original demo</button></div></div>
        <p className="text-sm text-muted-foreground">This first connection test is read-only. Assignment, status updates and automatic live refresh will be connected next.</p>
        {rows.length === 0 ? <div className="rounded-xl border border-border bg-card p-8"><h3 className="font-bold">No requests visible</h3><p className="mt-2 text-sm text-muted-foreground">There may be no reports yet, or your officer account may need an area scope. No sample incidents have been inserted.</p></div> : <div className="space-y-3">{rows.map(row => <article key={row.id} className="space-y-3 rounded-xl border border-border bg-card p-5">
          <div className="flex flex-wrap justify-between gap-2"><h3 className="break-all font-mono text-sm text-primary">{row.tracking_code}</h3><span className="capitalize">{label(row.status)}</span></div>
          <p className="whitespace-pre-wrap break-words">{row.details}</p>
          <div className="flex flex-wrap gap-4 text-sm"><span>People: {row.people_affected}</span><span>Reported severity: {label(row.reported_severity)}</span><span>Officer priority: {row.operational_priority ? label(row.operational_priority) : 'Not reviewed'}</span><span>Verification: {label(row.verification)}</span>{row.life_threatening && <strong className="text-critical">Life-threatening reported</strong>}</div>
          <p className="text-sm text-muted-foreground">{row.landmark || 'No landmark supplied'} · {row.latitude !== null && row.longitude !== null ? `${row.latitude}, ${row.longitude}` : 'Location not supplied'} · {new Date(row.created_at).toLocaleString()}</p>
        </article>)}</div>}
        <div className="flex items-center gap-3"><button className={button} disabled={page === 0} onClick={() => setPage(p => p - 1)}>Previous</button><span>Page {page + 1}</span><button className={button} disabled={!more} onClick={() => setPage(p => p + 1)}>Next</button></div>
      </>}
    </main>}
  </div>;
}
