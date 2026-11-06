/**
 * Authentication service – the ONLY place the UI talks to for sign-in.
 * Every function returns { user, error } where error is a short code the UI translates.
 *
 * Email + password only, Supabase first:
 *  1. Supabase auth – used when configured AND it answers within the timeout
 *     (src/lib/supabase.js: 3 s, with a 60 s cool-down after a failure).
 *  2. Local (on-device) accounts – only when Supabase is not configured or unreachable, so the
 *     app still works offline. Accounts and the session live in localStorage; passwords are
 *     stored only as a salted SHA-256 hash. This is a PROTOTYPE convenience, not real security.
 *
 * user shape used by the app: { id, email?, phone?, local? }
 */
import { isSupabaseConfigured, safeCall, supabase } from '../lib/supabase';

/** Sign-in always works now: Supabase when reachable, local accounts otherwise. */
export const isAuthConfigured = true;

const ACCOUNTS_KEY = 'ks-local-accounts-v1';
const SESSION_KEY = 'ks-local-session-v1';
const LOCAL_EVENT = 'ks-local-auth';
/** Sign-up also sends the confirmation email, which can take longer than the 3 s default. */
const SIGNUP_TIMEOUT_MS = 8000;

/** 'supabase' | 'local' – which backend handled the last call (UI shows a small note for local). */
let lastMode = isSupabaseConfigured ? 'supabase' : 'local';
export const authMode = () => lastMode;

const toUser = (u) => (u ? { id: u.id, email: u.email || undefined, phone: u.phone ? `+${String(u.phone).replace(/^\+/, '')}` : undefined } : null);

/** Map Supabase error messages to stable codes for translated UI messages. */
function code(error) {
  if (!error) return null;
  const m = (error.message || '').toLowerCase();
  if (m.includes('invalid login credentials')) return 'invalid_credentials';
  if (m.includes('email not confirmed')) return 'email_not_confirmed';
  if (m.includes('already registered') || m.includes('already been registered') || m.includes('user already exists')) return 'already_registered';
  if (m.includes('password') && (m.includes('at least') || m.includes('characters') || m.includes('weak'))) return 'weak_password';
  if (m.includes('rate limit') || error.status === 429) return 'rate_limited';
  if (m.includes('invalid') && m.includes('email')) return 'invalid_email';
  if (m.includes('fetch') || m.includes('network') || m.includes('timed out') || error.status === 0) return 'network';
  return 'unknown';
}

/* ───────────── localStorage helpers (never throw: private mode / blocked storage) ───────────── */
function read(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}
function write(key, value) {
  try {
    if (value == null) localStorage.removeItem(key);
    else localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage unavailable – session lasts until reload */
  }
}

const norm = (email) => String(email || '').trim().toLowerCase();
const newId = () => (crypto.randomUUID ? crypto.randomUUID() : `local-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`);
const newSalt = () => Array.from(crypto.getRandomValues(new Uint8Array(16)), (b) => b.toString(16).padStart(2, '0')).join('');

/** Salted SHA-256 (Web Crypto). crypto.subtle only exists on https/localhost – fall back to FNV-1a on plain-http LAN URLs. */
async function hashPassword(password, salt) {
  const input = `${salt}:${password}`;
  if (globalThis.crypto?.subtle) {
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(input));
    return 'sha256:' + Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, '0')).join('');
  }
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) h = Math.imul(h ^ input.charCodeAt(i), 0x01000193);
  return 'fnv:' + (h >>> 0).toString(16);
}

function setLocalSession(user) {
  write(SESSION_KEY, user ? { ...user, local: true, signedInAt: new Date().toISOString() } : null);
  window.dispatchEvent(new CustomEvent(LOCAL_EVENT, { detail: user }));
}
const localSessionUser = () => {
  const s = read(SESSION_KEY, null);
  // Mobile-number sign-in was removed: an old phone-only session no longer counts as signed in.
  return s?.email ? { id: s.id, email: s.email, local: true } : null;
};

/* ───────────── Local backend ───────────── */
async function localSignUp(email, password) {
  const em = norm(email);
  const accounts = read(ACCOUNTS_KEY, {});
  if (accounts[em]) return { user: null, error: 'already_registered' };
  const salt = newSalt();
  accounts[em] = { id: newId(), email: em, salt, hash: await hashPassword(password, salt), createdAt: new Date().toISOString() };
  write(ACCOUNTS_KEY, accounts);
  const user = { id: accounts[em].id, email: em, local: true };
  setLocalSession(user);
  lastMode = 'local';
  return { user, needsConfirmation: false, error: null };
}

/**
 * Local sign-in. A known email must use its password. An email never seen on this
 * device is registered on the spot, so the demo never dead-ends on "no account".
 */
async function localSignIn(email, password) {
  const em = norm(email);
  const acc = read(ACCOUNTS_KEY, {})[em];
  if (!acc) return localSignUp(em, password);
  if ((await hashPassword(password, acc.salt)) !== acc.hash) return { user: null, error: 'invalid_credentials' };
  const user = { id: acc.id, email: em, local: true };
  setLocalSession(user);
  lastMode = 'local';
  return { user, error: null };
}

/* ───────────── Phone number display helpers ───────────── */
/** Indian mobile: 10 digits starting 6–9; accepts +91 / 0 prefixes, spaces and dashes. */
export function normalizeIndianPhone(input) {
  let d = String(input || '').replace(/\D/g, '');
  if (d.length === 12 && d.startsWith('91')) d = d.slice(2);
  else if (d.length === 11 && d.startsWith('0')) d = d.slice(1);
  return /^[6-9]\d{9}$/.test(d) ? `+91${d}` : null;
}
/** +919876543210 → "+91 98765 43210" */
export const formatPhone = (p) => (p && /^\+91\d{10}$/.test(p) ? `+91 ${p.slice(3, 8)} ${p.slice(8)}` : p || '');

/* ───────────── Supabase with network fallback ───────────── */
/**
 * Run a Supabase auth call through lib/supabase's safeCall (try/catch + timeout).
 * Network failures and timeouts come back as { networkFailed: true }.
 */
async function trySupabase(fn, timeoutMs) {
  if (!supabase) return { networkFailed: true };
  const res = await safeCall(fn, timeoutMs ? { timeoutMs } : undefined);
  if (res.offline) return { networkFailed: true };
  if (res.error && code(res.error) === 'network') return { networkFailed: true };
  return res;
}

/** Create an account. If Supabase email confirmation is on, session is null until the user confirms. */
export async function signUp(email, password) {
  const res = await trySupabase(
    () => supabase.auth.signUp({ email, password, options: { emailRedirectTo: window.location.origin } }),
    SIGNUP_TIMEOUT_MS
  );
  if (res.networkFailed) return localSignUp(email, password);
  lastMode = 'supabase';
  const { data, error } = res;
  if (error) return { user: null, error: code(error) };
  // Supabase returns a user with no identities when the email is already registered.
  if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
    return { user: null, error: 'already_registered' };
  }
  return { user: data.session ? toUser(data.user) : null, needsConfirmation: !data.session, error: null };
}

export async function signIn(email, password) {
  const res = await trySupabase(() => supabase.auth.signInWithPassword({ email, password }));
  if (res.networkFailed) return localSignIn(email, password);
  lastMode = 'supabase';
  return { user: toUser(res.data?.user), error: code(res.error) };
}

export async function resetPassword(email) {
  const res = await trySupabase(() => supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin }));
  if (res.networkFailed) {
    lastMode = 'local';
    // On-device accounts can't receive email – say so instead of pretending a link was sent.
    return { error: 'local_reset' };
  }
  lastMode = 'supabase';
  return { error: code(res.error) };
}

export async function signOut() {
  const hadLocal = !!localSessionUser();
  if (hadLocal) setLocalSession(null);
  if (supabase) await trySupabase(() => supabase.auth.signOut()); // clears its stored session even offline
  return { error: null };
}

/** Restore the session on page load: Supabase session first, then the local one. */
export async function getUser() {
  if (supabase) {
    const res = await trySupabase(() => supabase.auth.getSession());
    const u = toUser(res?.data?.session?.user);
    if (u) return u;
  }
  return localSessionUser();
}

/** Subscribe to sign-in / sign-out from either backend. Returns unsubscribe. */
export function onAuthChange(cb) {
  const onLocal = (e) => cb(e.detail ? { ...e.detail, local: true } : null);
  // Another tab signing in/out locally.
  const onStorage = (e) => e.key === SESSION_KEY && cb(localSessionUser());
  window.addEventListener(LOCAL_EVENT, onLocal);
  window.addEventListener('storage', onStorage);

  let unsubSupabase = () => {};
  if (supabase) {
    // Supabase fires INITIAL_SESSION / SIGNED_OUT with no user even when a local session is active –
    // fall back to the local session so it isn't wiped.
    const { data } = supabase.auth.onAuthStateChange((_event, session) => cb(toUser(session?.user) || localSessionUser()));
    unsubSupabase = () => data.subscription.unsubscribe();
  }
  return () => {
    window.removeEventListener(LOCAL_EVENT, onLocal);
    window.removeEventListener('storage', onStorage);
    unsubSupabase();
  };
}
