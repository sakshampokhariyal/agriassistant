import { useEffect, useRef, useState } from 'react';
import { addCompleted, deleteCrops, loadCompleted, loadCrops, loadProfile, removeCompleted, saveProfile, upsertCrops } from '../lib/supabase';
import { cropStatus } from '../data/farmer';
import { buildSchedule } from '../utils/cropSchedule';
import { addDaysTo, daysBetween, todayISO } from '../utils/date';
import { readSavedPlace } from '../services/location';

const PUSH_DELAY_MS = 1200;
const RETRY_MS = 60 * 1000;

/** Field with the stage key the database stores in user_crops.current_stage. */
const withStage = (f) => ({ ...f, stageKey: cropStatus(f, todayISO(), daysBetween, addDaysTo).stageKey });
const json = (x) => JSON.stringify(x ?? null);
const pairs = (done) => Object.entries(done || {}).flatMap(([cropId, m]) => Object.keys(m || {}).map((taskId) => `${cropId}|${taskId}`));

/**
 * Mirrors fields, crop-calendar ticks and the profile to Supabase for a signed-in Supabase user.
 *
 * localStorage stays the app's working copy, so the UI never waits on the network:
 *  - On sign-in: pull the cloud copy and merge it with what is on this device (cloud wins for the
 *    same field id; fields only on this device are uploaded).
 *  - After that: every change is pushed a moment later.
 *  - Offline / slow (3 s timeout in lib/supabase): nothing breaks; it retries every minute and
 *    when the browser comes back online.
 * Local (on-device) accounts and guests are not synced.
 *
 * status: 'off' | 'syncing' | 'synced' | 'offline' | 'error'
 */
export default function useCloudSync({ auth, crops, setCrops, scheduleDone, setScheduleDone, profile, setProfile }) {
  const userId = auth.loggedIn && !auth.local ? auth.userId : null;
  const [status, setStatus] = useState('off');
  const [retry, setRetry] = useState(0);
  const readyFor = useRef(null); // user id whose first pull has finished
  const last = useRef({ crops: [], done: {}, profile: null }); // what the cloud is known to hold

  // Retry after a minute while offline, and as soon as the connection returns.
  useEffect(() => {
    if (status !== 'offline' && status !== 'error') return undefined;
    const bump = () => setRetry((n) => n + 1);
    const id = setInterval(bump, RETRY_MS);
    window.addEventListener('online', bump);
    return () => {
      clearInterval(id);
      window.removeEventListener('online', bump);
    };
  }, [status]);

  // 1) First pull + merge for this user.
  useEffect(() => {
    if (!userId) {
      readyFor.current = null;
      setStatus('off');
      return undefined;
    }
    if (readyFor.current === userId) return undefined;
    let alive = true;
    (async () => {
      setStatus('syncing');
      const [c, d, p] = await Promise.all([loadCrops(userId), loadCompleted(userId), loadProfile(userId)]);
      if (!alive) return;
      if (c.offline || d.offline || p.offline) return setStatus('offline');
      if (c.error || d.error || p.error) return setStatus('error');

      const cloudCrops = c.data || [];
      const cloudDone = d.data || {};
      last.current = { crops: cloudCrops, done: cloudDone, profile: p.data };

      if (cloudCrops.length) {
        setCrops((local) => {
          const ids = new Set(cloudCrops.map((x) => x.id));
          return [...cloudCrops, ...local.filter((x) => !ids.has(x.id))];
        });
        setScheduleDone((local) => {
          const merged = { ...local };
          Object.entries(cloudDone).forEach(([fid, m]) => (merged[fid] = { ...(merged[fid] || {}), ...m }));
          return merged;
        });
      }
      if (p.data) {
        // Cloud values fill in what this device does not know yet; nothing typed here is overwritten.
        setProfile((local) => {
          const next = { ...local };
          Object.entries(p.data).forEach(([k, v]) => {
            if (v !== '' && v != null && (local[k] === '' || local[k] == null)) next[k] = v;
          });
          return next;
        });
      }
      readyFor.current = userId;
      setStatus('synced');
    })();
    return () => {
      alive = false;
    };
  }, [userId, retry, setCrops, setScheduleDone, setProfile]);

  // 2) Push local changes (debounced) once the first pull is done.
  useEffect(() => {
    if (!userId || readyFor.current !== userId) return undefined;
    const timer = setTimeout(async () => {
      const prev = last.current;
      const prevById = Object.fromEntries(prev.crops.map((x) => [x.id, json(slim(x))]));
      const changed = crops.filter((f) => prevById[f.id] !== json(slim(f)));
      const removed = prev.crops.filter((x) => !crops.some((f) => f.id === x.id)).map((x) => x.id);

      const before = new Set(pairs(prev.done));
      const now = new Set(pairs(scheduleDone).filter((k) => crops.some((f) => k.startsWith(`${f.id}|`))));
      const titleOf = (cropId, taskId) => {
        const f = crops.find((x) => x.id === cropId);
        const tk = f && buildSchedule(f)?.tasks.find((x) => x.id === taskId);
        return tk?.title?.en || taskId;
      };
      const added = [...now].filter((k) => !before.has(k)).map((k) => {
        const [cropId, taskId] = k.split('|');
        return { cropId, taskId, title: titleOf(cropId, taskId) };
      });
      const unticked = [...before].filter((k) => !now.has(k) && crops.some((f) => k.startsWith(`${f.id}|`))).map((k) => {
        const [cropId, taskId] = k.split('|');
        return { cropId, taskId };
      });
      const profileChanged = json(profile) !== json(prev.profileLocal);

      if (!changed.length && !removed.length && !added.length && !unticked.length && !profileChanged) return;
      setStatus('syncing');
      // Fields first: ticks reference them.
      const results = [
        await upsertCrops(userId, changed.map(withStage)),
        await deleteCrops(userId, removed),
        await addCompleted(userId, added),
        await removeCompleted(userId, unticked),
      ];
      if (profileChanged) results.push(await saveProfile(userId, profile, { phone: auth.phone, coords: readSavedPlace() }));

      if (results.some((r) => r.offline)) return setStatus('offline');
      if (results.some((r) => r.error)) return setStatus('error');
      last.current = { crops: crops.map((x) => ({ ...x })), done: scheduleDone, profile: prev.profile, profileLocal: profile };
      setStatus('synced');
    }, PUSH_DELAY_MS);
    return () => clearTimeout(timer);
  }, [userId, crops, scheduleDone, profile, retry, auth.phone, status]);

  return status;
}

/** The parts of a field that are stored in the cloud (stage is derived, not compared). */
function slim(f) {
  return { id: f.id, cropId: f.cropId, sowDate: f.sowDate, acres: Number(f.acres) || 0, no: f.no, name: f.name || '', variant: f.variant || null, soil: f.soil || '', irrigation: f.irrigation || '', health: f.health || 'healthy' };
}
