/**
 * Authentication service – the ONLY place the UI talks to for sign-in.
 * Every function returns { user, error } where error is a short code the UI translates.
 *
 * Two backends:
 *  1. Supabase email + password auth – used when configured AND reachable.
 *  2. Local (on-device) accounts – used when Supabase is not configured, or when a call
 *     fails with a network error (offline, DNS failure, paused project, timeout).
 *     Accounts and the session live in localStorage; passwords are stored only as a
 *     salted SHA-256 hash. This is a PROTOTYPE convenience: it is not real security
 *     (anyone with access to this browser can read localStorage).
 *
 *  3. Phone + OTP – always local (simulated SMS, demo code 1234).
 *
 * user shape used by the app: { id, email?, phone?, local? }
 */
import { isSupabaseConfigured, supabase } from '../supabaseClient';

/** Sign-in always works now: Supabase when reachable, local accounts otherwise. */
export const isAuthConfigured = true;

const ACCOUNTS_KEY = 'ks-local-accounts-v1';
const SESSION_KEY = 'ks-local-session-v1';
const LOCAL_EVENT = 'ks-local-auth';
const NETWORK_TIMEOUT_MS = 8000;

/** 'supabase' | 'local' – which backend handled the last call (UI shows a small note for local). */
let lastMode = isSupabaseConfigured ? 'supabase' : 'local';
export const authMode = () => lastMode;

const toUser = (u) => (u ? { id: u.id, email: u.email } : null);

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
  if (s?.phone) return { id: s.id, phone: s.phone, local: true };
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

/* ───────────── Phone + OTP (local demo – no SMS is sent) ───────────── */
const PHONES_KEY = 'ks-local-phones-v1';
/** Fixed demo code. A real build would send an SMS through Supabase/Twilio/MSG91. */
export const DEMO_OTP = '1234';
const OTP_TTL_MS = 5 * 60 * 1000;
let pendingOtp = null; // { phone, expires }

/** Indian mobile: 10 digits starting 6–9; accepts +91 / 0 prefixes, spaces and dashes. */
export function normalizeIndianPhone(input) {
  let d = String(input || '').replace(/\D/g, '');
  if (d.length === 12 && d.startsWith('91')) d = d.slice(2);
  else if (d.length === 11 && d.startsWith('0')) d = d.slice(1);
  return /^[6-9]\d{9}$/.test(d) ? `+91${d}` : null;
}
/** +919876543210 → "+91 98765 43210" */
export const formatPhone = (p) => (p && /^\+91\d{10}$/.test(p) ? `+91 ${p.slice(3, 8)} ${p.slice(8)}` : p || '');

/** "Send" an OTP. Simulated: nothing leaves the device; the demo code is DEMO_OTP. */
export async function sendPhoneOtp(phoneInput) {
  const phone = normalizeIndianPhone(phoneInput);
  if (!phone) return { error: 'invalid_phone' };
  await new Promise((r) => setTimeout(r, 600)); // feels like a network round-trip
  pendingOtp = { phone, expires: Date.now() + OTP_TTL_MS };
  lastMode = 'local';
  return { phone, error: null };
}

/** Verify the OTP and start a local phone session (account is created on first login). */
export async function verifyPhoneOtp(phoneInput, otp) {
  const phone = normalizeIndianPhone(phoneInput);
  if (!phone) return { user: null, error: 'invalid_phone' };
  if (!pendingOtp || pendingOtp.phone !== phone || Date.now() > pendingOtp.expires) return { user: null, error: 'otp_expired' };
  if (String(otp).trim() !== DEMO_OTP) return { user: null, error: 'invalid_otp' };
  pendingOtp = null;
  const phones = read(PHONES_KEY, {});
  if (!phones[phone]) phones[phone] = { id: newId(), phone, createdAt: new Date().toISOString() };
  write(PHONES_KEY, phones);
  const user = { id: phones[phone].id, phone, local: true };
  setLocalSession(user);
  lastMode = 'local';
  return { user, error: null };
}

/* ───────────── Supabase with network fallback ───────────── */
/** Run a Supabase call with a timeout; network failures are returned as { networkFailed: true }. */
async function trySupabase(fn) {
  if (!supabase) return { networkFailed: true };
  let timer;
  try {
    const timeout = new Promise((resolve) => {
      timer = setTimeout(() => resolve({ data: null, error: { message: 'timed out', status: 0 } }), NETWORK_TIMEOUT_MS);
    });
    const res = await Promise.race([fn(), timeout]);
    if (res?.error && code(res.error) === 'network') return { networkFailed: true };
    return res;
  } catch (e) {
    // supabase-js can throw (e.g. TypeError: Failed to fetch) instead of returning an error.
    return code(e) === 'network' || e instanceof TypeError ? { networkFailed: true } : { data: null, error: e };
  } finally {
    clearTimeout(timer);
  }
}

/** Create an account. If Supabase email confirmation is on, session is null until the user confirms. */
export async function signUp(email, password) {
  const res = await trySupabase(() =>
    supabase.auth.signUp({ email, password, options: { emailRedirectTo: window.location.origin } })
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
