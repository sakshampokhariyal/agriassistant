/**
 * Supabase client + every database read/write the app makes.
 *
 * Failover rules (the UI must never break, online or not):
 *  - Every call is wrapped in try/catch and raced against a 3-second timeout.
 *  - A failed or slow call returns { data: null, offline: true } – callers then keep using
 *    localStorage, which is always the app's working copy.
 *  - After a network failure Supabase is skipped for 60 s, so screens don't wait 3 s per call.
 *  - Nothing here throws.
 *
 * Keys: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY (the publishable/anon key is meant to be
 * public; Row Level Security in supabase/schema.sql protects the data).
 */
import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(url && anonKey);

let client = null;
try {
  client = isSupabaseConfigured ? createClient(url, anonKey, { auth: { persistSession: true, autoRefreshToken: true } }) : null;
} catch {
  client = null; // malformed URL – run fully on-device
}
export const supabase = client;

export const TIMEOUT_MS = 3000;
const COOL_DOWN_MS = 60 * 1000;
let offlineUntil = 0;

/** True while Supabase is configured and not in a recent-failure cool-down. */
export const supabaseAvailable = () => !!client && Date.now() >= offlineUntil && (typeof navigator === 'undefined' || navigator.onLine !== false);

const isNetworkError = (e) => {
  const m = String(e?.message || e || '').toLowerCase();
  return e instanceof TypeError || e?.status === 0 || /fetch|network|timed out|timeout|load failed|enotfound|err_name/.test(m);
};

/**
 * Run a Supabase call with a 3 s timeout.
 * Returns { data, error } from Supabase, or { data: null, error: null, offline: true } on network failure / timeout.
 */
export async function safeCall(fn, { timeoutMs = TIMEOUT_MS } = {}) {
  if (!supabaseAvailable()) return { data: null, error: null, offline: true };
  let timer;
  try {
    const timeout = new Promise((resolve) => {
      timer = setTimeout(() => resolve({ data: null, error: { message: 'timed out', status: 0 } }), timeoutMs);
    });
    const res = await Promise.race([Promise.resolve().then(fn), timeout]);
    if (res?.error && isNetworkError(res.error)) {
      offlineUntil = Date.now() + COOL_DOWN_MS;
      return { data: null, error: null, offline: true };
    }
    return { data: res?.data ?? null, error: res?.error ?? null, offline: false };
  } catch (e) {
    if (isNetworkError(e)) {
      offlineUntil = Date.now() + COOL_DOWN_MS;
      return { data: null, error: null, offline: true };
    }
    return { data: null, error: e, offline: false };
  } finally {
    clearTimeout(timer);
  }
}

/* ───────────── profiles ───────────── */

/** App profile → profiles row. Farm details that have no column of their own go in `farm`. */
const toProfileRow = (userId, p, phone, coords) => ({
  id: userId,
  phone: phone || p.phone || null,
  full_name: p.name || null,
  state: p.state || null,
  district: p.district || null,
  village: p.village || null,
  location_lat: coords?.lat ?? null,
  location_lng: coords?.lon ?? null,
  farm: { landSize: p.landSize, landType: p.landType, soil: p.soil, irrigation: p.irrigation, language: p.language, locationSource: p.locationSource },
  updated_at: new Date().toISOString(),
});
const fromProfileRow = (r) =>
  r && {
    name: r.full_name || '',
    phone: r.phone || '',
    state: r.state || '',
    district: r.district || '',
    village: r.village || '',
    ...(r.farm || {}),
  };

export async function loadProfile(userId) {
  const res = await safeCall(() => client.from('profiles').select('*').eq('id', userId).maybeSingle());
  return { ...res, data: fromProfileRow(res.data) };
}

export async function saveProfile(userId, profile, { phone, coords } = {}) {
  return safeCall(() => client.from('profiles').upsert(toProfileRow(userId, profile, phone, coords)));
}

/* ───────────── user_crops (one row per field) ───────────── */

const toCropRow = (userId, f) => ({
  id: f.id,
  user_id: userId,
  crop_name: f.cropId,
  sowing_date: f.sowDate,
  acreage: Number(f.acres) || 0,
  current_stage: f.stageKey ?? null,
  details: { no: f.no, name: f.name || '', variant: f.variant || null, soil: f.soil || '', irrigation: f.irrigation || '', health: f.health || 'healthy' },
});
const fromCropRow = (r) => ({
  id: r.id,
  cropId: r.crop_name,
  sowDate: r.sowing_date,
  acres: Number(r.acreage),
  ...(r.details || {}),
});

export async function loadCrops(userId) {
  const res = await safeCall(() => client.from('user_crops').select('*').eq('user_id', userId).order('created_at'));
  return { ...res, data: res.data ? res.data.map(fromCropRow) : null };
}

export async function upsertCrops(userId, fields) {
  if (!fields.length) return { data: [], error: null, offline: false };
  return safeCall(() => client.from('user_crops').upsert(fields.map((f) => toCropRow(userId, f))));
}

export async function deleteCrops(userId, ids) {
  if (!ids.length) return { data: [], error: null, offline: false };
  return safeCall(() => client.from('user_crops').delete().eq('user_id', userId).in('id', ids));
}

/* ───────────── completed_tasks (crop-calendar ticks) ───────────── */

/** Returns the app's shape: { [fieldId]: { [taskId]: true } }. */
export async function loadCompleted(userId) {
  const res = await safeCall(() => client.from('completed_tasks').select('crop_id, task_id').eq('user_id', userId));
  if (!res.data) return res;
  const map = {};
  res.data.forEach((r) => ((map[r.crop_id] ||= {})[r.task_id] = true));
  return { ...res, data: map };
}

/** rows: [{ cropId, taskId, title }] */
export async function addCompleted(userId, rows) {
  if (!rows.length) return { data: [], error: null, offline: false };
  return safeCall(() =>
    client.from('completed_tasks').upsert(
      rows.map((r) => ({ user_id: userId, crop_id: r.cropId, task_id: r.taskId, task_title: r.title || r.taskId, completed_at: new Date().toISOString() })),
      { onConflict: 'user_id,crop_id,task_id', ignoreDuplicates: true }
    )
  );
}

/** rows: [{ cropId, taskId }] */
export async function removeCompleted(userId, rows) {
  const results = await Promise.all(
    rows.map((r) => safeCall(() => client.from('completed_tasks').delete().eq('user_id', userId).eq('crop_id', r.cropId).eq('task_id', r.taskId)))
  );
  return results.find((x) => x.offline || x.error) || { data: [], error: null, offline: false };
}
