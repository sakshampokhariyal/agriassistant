/**
 * Authentication service – the ONLY place the UI talks to for sign-in.
 * Supabase email + password auth (supabase.auth). Every function returns
 * { user, error } where error is a short code the UI translates.
 *
 * user shape used by the app: { id, email }
 */
import { isSupabaseConfigured, supabase } from '../supabaseClient';

export const isAuthConfigured = isSupabaseConfigured;

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
  if (m.includes('fetch') || m.includes('network')) return 'network';
  return 'unknown';
}

const notConfigured = { user: null, error: 'not_configured' };

/** Create an account. If email confirmation is on, session is null until the user confirms. */
export async function signUp(email, password) {
  if (!supabase) return notConfigured;
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { emailRedirectTo: window.location.origin },
  });
  if (error) return { user: null, error: code(error) };
  // Supabase returns a user with no identities when the email is already registered.
  if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
    return { user: null, error: 'already_registered' };
  }
  return { user: data.session ? toUser(data.user) : null, needsConfirmation: !data.session, error: null };
}

export async function signIn(email, password) {
  if (!supabase) return notConfigured;
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  return { user: toUser(data?.user), error: code(error) };
}

export async function resetPassword(email) {
  if (!supabase) return notConfigured;
  const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin });
  return { error: code(error) };
}

export async function signOut() {
  if (!supabase) return { error: null };
  const { error } = await supabase.auth.signOut();
  return { error: code(error) };
}

export async function getUser() {
  if (!supabase) return null;
  const { data } = await supabase.auth.getSession();
  return toUser(data?.session?.user);
}

/** Subscribe to sign-in / sign-out (also fires after email confirmation links). Returns unsubscribe. */
export function onAuthChange(cb) {
  if (!supabase) return () => {};
  const { data } = supabase.auth.onAuthStateChange((_event, session) => cb(toUser(session?.user)));
  return () => data.subscription.unsubscribe();
}
