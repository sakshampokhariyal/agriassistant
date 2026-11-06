/**
 * Authentication service – the ONLY place the UI talks to for sign-in.
 * Email + password through Supabase Auth, nothing else: there are no on-device / mock accounts.
 *
 * Every function returns { user, error } where error is a short code the form translates
 * (auth.err.<code>): already_registered, invalid_credentials, email_not_confirmed,
 * weak_password, invalid_email, rate_limited, network, not_configured, unknown.
 *
 * user shape used by the app: { id, email }
 */
import { isSupabaseConfigured, safeCall, supabase } from '../lib/supabase';

export const isAuthConfigured = isSupabaseConfigured;

/** Auth calls send email and hash passwords server-side, so they get longer than the 3 s data timeout. */
const AUTH_TIMEOUT_MS = 10000;

/** Kept for the sign-in form's API; every account is a Supabase account now. */
export const authMode = () => 'supabase';

const toUser = (u) => (u ? { id: u.id, email: u.email || '' } : null);

/** Map Supabase error messages / codes to stable codes for translated UI messages. */
function code(error) {
  if (!error) return null;
  const c = String(error.code || '').toLowerCase();
  const m = String(error.message || '').toLowerCase();
  if (c === 'invalid_credentials' || m.includes('invalid login credentials')) return 'invalid_credentials';
  if (c === 'email_not_confirmed' || m.includes('email not confirmed')) return 'email_not_confirmed';
  if (c === 'user_already_exists' || c === 'email_exists' || m.includes('already registered') || m.includes('already been registered') || m.includes('user already exists')) return 'already_registered';
  if (c === 'weak_password' || (m.includes('password') && (m.includes('at least') || m.includes('characters') || m.includes('weak')))) return 'weak_password';
  if (c === 'over_request_rate_limit' || c === 'over_email_send_rate_limit' || m.includes('rate limit') || error.status === 429) return 'rate_limited';
  if (c === 'email_address_invalid' || c === 'validation_failed' || (m.includes('invalid') && m.includes('email'))) return 'invalid_email';
  if (m.includes('fetch') || m.includes('network') || m.includes('timed out') || error.status === 0) return 'network';
  return 'unknown';
}

/** Run a Supabase auth call with try/catch + timeout (lib/supabase); offline → { error: 'network' }. */
async function call(fn) {
  if (!supabase) return { data: null, error: { code: 'not_configured' }, failed: 'not_configured' };
  const res = await safeCall(fn, { timeoutMs: AUTH_TIMEOUT_MS });
  if (res.offline) return { data: null, error: null, failed: 'network' };
  return res;
}

const norm = (email) => String(email || '').trim().toLowerCase();

/**
 * Create an account. With "Confirm email" on in Supabase, there is no session until the
 * farmer clicks the link (needsConfirmation: true).
 */
export async function signUpWithEmail(email, password) {
  const res = await call(() => supabase.auth.signUp({ email: norm(email), password, options: { emailRedirectTo: window.location.origin } }));
  if (res.failed) return { user: null, error: res.failed };
  if (res.error) return { user: null, error: code(res.error) };
  const u = res.data?.user;
  // With email confirmation on, Supabase does not reveal existing emails with an error:
  // it returns a user with an empty identities list instead. Treat that as a duplicate.
  if (u && Array.isArray(u.identities) && u.identities.length === 0) return { user: null, error: 'already_registered' };
  return { user: res.data?.session ? toUser(u) : null, needsConfirmation: !res.data?.session, error: null };
}

export async function signInWithEmail(email, password) {
  const res = await call(() => supabase.auth.signInWithPassword({ email: norm(email), password }));
  if (res.failed) return { user: null, error: res.failed };
  if (res.error) return { user: null, error: code(res.error) };
  return { user: toUser(res.data?.user), error: null };
}

/** Older names used by the sign-in form. */
export const signUp = signUpWithEmail;
export const signIn = signInWithEmail;

export async function resetPassword(email) {
  const res = await call(() => supabase.auth.resetPasswordForEmail(norm(email), { redirectTo: window.location.origin }));
  if (res.failed) return { error: res.failed };
  return { error: code(res.error) };
}

/** Sign out of Supabase (also clears its stored session when offline: scope 'local'). */
export async function signOut() {
  if (!supabase) return { error: null };
  const res = await call(() => supabase.auth.signOut());
  if (res.failed || res.error) await safeCall(() => supabase.auth.signOut({ scope: 'local' }));
  return { error: null };
}

/** Restore the session on page load. */
export async function getUser() {
  if (!supabase) return null;
  const res = await safeCall(() => supabase.auth.getSession());
  return toUser(res?.data?.session?.user);
}

/** Subscribe to sign-in / sign-out (including other tabs and email-link returns). Returns unsubscribe. */
export function onAuthChange(cb) {
  if (!supabase) return () => {};
  const { data } = supabase.auth.onAuthStateChange((_event, session) => cb(toUser(session?.user)));
  return () => data.subscription.unsubscribe();
}

/* ───────────── Clean-up of the removed on-device accounts ───────────── */
const OLD_LOCAL_KEYS = ['ks-local-accounts-v1', 'ks-local-session-v1', 'ks-local-phones-v1', 'ks-auth-v1'];
/** Delete accounts / sessions left by the old offline sign-in (passwords hashes included). */
export function removeLegacyLocalAccounts() {
  try {
    OLD_LOCAL_KEYS.forEach((k) => localStorage.removeItem(k));
  } catch {
    /* storage unavailable */
  }
}

/* ───────────── Phone number display helpers (profile mobile number) ───────────── */
/** Indian mobile: 10 digits starting 6–9; accepts +91 / 0 prefixes, spaces and dashes. */
export function normalizeIndianPhone(input) {
  let d = String(input || '').replace(/\D/g, '');
  if (d.length === 12 && d.startsWith('91')) d = d.slice(2);
  else if (d.length === 11 && d.startsWith('0')) d = d.slice(1);
  return /^[6-9]\d{9}$/.test(d) ? `+91${d}` : null;
}
/** +919876543210 → "+91 98765 43210" */
export const formatPhone = (p) => (p && /^\+91\d{10}$/.test(p) ? `+91 ${p.slice(3, 8)} ${p.slice(8)}` : p || '');
