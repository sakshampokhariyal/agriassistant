import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import useLocalStorage from '../hooks/useLocalStorage';
import { translate, loc } from '../translations';
import { defaultProfile, initialCrops } from '../data/farmer';
import { initialTasks, LEGACY_DEMO_TASK_IDS } from '../data/tasks';
import { pastTaskIds } from '../utils/cropSchedule';
import * as authService from '../services/auth';
import useNow from '../hooks/useNow';
import useCloudSync from '../hooks/useCloudSync';
import { toISO } from '../utils/date';

const AppContext = createContext(null);
const SIGNED_OUT = { loggedIn: false, email: '', phone: '', userId: null };
const VERSION = 'v1';

export function AppProvider({ children }) {
  const [profile, setProfile] = useLocalStorage(`ks-profile-${VERSION}`, defaultProfile);
  const [crops, setCrops] = useLocalStorage(`ks-crops-${VERSION}`, initialCrops);
  const [tasks, setTasks] = useLocalStorage(`ks-tasks-${VERSION}`, initialTasks);
  // Auth state mirrors the Supabase session (see services/auth.js).
  const [auth, setAuth] = useState(SIGNED_OUT);
  const [lang, setLangState] = useLocalStorage(`ks-lang-${VERSION}`, defaultProfile.language);
  const [activeFieldId, setActiveFieldId] = useLocalStorage('ks-active-field-v1', null);
  const [dataSaver, setDataSaver] = useLocalStorage('ks-data-saver-v1', false);
  const [toasts, setToasts] = useState([]);
  const [loginOpen, setLoginOpen] = useState(false);

  // Fields migration: older crop entries get a field number, soil and irrigation source.
  useEffect(() => {
    if (crops.some((c) => !c.no || c.soil === undefined || c.irrigation === undefined)) {
      setCrops((x) => x.map((c, i) => ({ no: i + 1, name: '', soil: profile.soil || '', irrigation: profile.irrigation || '', ...c, ...(c.no ? {} : { no: i + 1 }) })));
    }
  }, [crops, setCrops, profile.soil, profile.irrigation]);

  // Keep the active field valid.
  const activeField = crops.find((c) => c.id === activeFieldId) || crops[0] || null;

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  // One-time migration: profiles saved before schema 2 carried a hardcoded demo name – clear it
  // so only a name the farmer enters (or one from auth) is ever shown.
  useEffect(() => {
    if (!profile.schema || profile.schema < 2) setProfile((p) => ({ ...p, name: '', schema: 2 }));
  }, [profile.schema, setProfile]);

  // Schema 3: drop the old built-in demo farm. Values the farmer never changed (the sample village,
  // the sample 3-acre farm and the three sample fields) are cleared; anything they edited stays.
  useEffect(() => {
    if (profile.schema !== 2) return;
    setProfile((p) => {
      const next = { ...p, schema: 3 };
      if (p.village === 'Kikkeri' && p.district === 'Mandya' && p.locationSource !== 'manual' && p.locationSource !== 'gps') {
        Object.assign(next, { village: '', district: '', state: '' });
      }
      if (Number(p.landSize) === 3 && p.landType === 'mixed' && p.soil === 'red' && p.irrigation === 'borewell') {
        Object.assign(next, { landSize: '', landType: '', soil: '', irrigation: '' });
      }
      return next;
    });
    const SAMPLE = { c1: ['ragi', 2], c2: ['tomato', 0.5], c3: ['maize', 0.5] };
    setCrops((x) => x.filter((c) => !(SAMPLE[c.id] && !c.name && SAMPLE[c.id][0] === c.cropId && Number(c.acres) === SAMPLE[c.id][1])));
    try {
      localStorage.removeItem('ks-disc-v2'); // seeded sample discussions (feature removed)
    } catch {
      /* ignore */
    }
  }, [profile.schema, setProfile, setCrops]);

  const t = useCallback((key, vars) => translate(lang, key, vars), [lang]);
  const L = useCallback((obj) => loc(obj, lang), [lang]);

  const toast = useCallback((message, type = 'success') => {
    const id = Date.now() + Math.random();
    setToasts((x) => [...x, { id, message, type }]);
    setTimeout(() => setToasts((x) => x.filter((m) => m.id !== id)), 3200);
  }, []);

  const dismissToast = useCallback((id) => setToasts((x) => x.filter((m) => m.id !== id)), []);

  const setLang = useCallback(
    (code) => {
      setLangState(code);
      setProfile((p) => ({ ...p, language: code }));
      toast(translate(code, 'lang.changed'), 'info');
    },
    [setProfile, toast]
  );

  const addTask = useCallback(
    // Random suffix: several tasks added in the same millisecond (e.g. Crop Doctor follow-ups) need distinct ids.
    (task) => setTasks((x) => [...x, { id: `t${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, done: false, cropId: null, ...task }]),
    [setTasks]
  );
  const toggleTask = useCallback(
    (id) => setTasks((x) => x.map((tk) => (tk.id === id ? { ...tk, done: !tk.done } : tk))),
    [setTasks]
  );
  const deleteTask = useCallback((id) => setTasks((x) => x.filter((tk) => tk.id !== id)), [setTasks]);

  // Each crop entry is a *field*: { id, no, name, cropId, acres, sowDate, soil, irrigation, health }.
  // Crop-calendar completion (see below); declared first because editing a field resets it.
  const [scheduleDone, setScheduleDone] = useLocalStorage('ks-schedule-done-v1', () =>
    Object.fromEntries(crops.map((f) => [f.id, Object.fromEntries(pastTaskIds(f).map((id) => [id, true]))]))
  );

  const addCrop = useCallback(
    (crop) => {
      // Unique across devices too: field ids are also the cloud row ids.
      const id = `c${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
      setCrops((x) => {
        const no = Math.max(0, ...x.map((c) => c.no || 0)) + 1;
        return [...x, { id, no, name: '', soil: profile.soil, irrigation: profile.irrigation, health: 'healthy', ...crop }];
      });
      setActiveFieldId(id);
    },
    [setCrops, setActiveFieldId, profile.soil, profile.irrigation]
  );
  const updateCrop = useCallback(
    (id, patch) => {
      const prev = crops.find((c) => c.id === id);
      setCrops((x) => x.map((c) => (c.id === id ? { ...c, ...patch } : c)));
      // A different crop, sowing date or variety means a different schedule: old ticks no longer apply.
      if (prev && ['cropId', 'sowDate', 'variant'].some((k) => k in patch && patch[k] !== prev[k])) {
        setScheduleDone((m) => ({ ...m, [id]: {} }));
      }
    },
    [crops, setCrops, setScheduleDone]
  );
  const removeCrop = useCallback(
    (id) => {
      setCrops((x) => x.filter((c) => c.id !== id));
      setScheduleDone((m) => {
        const { [id]: _gone, ...rest } = m; // eslint-disable-line no-unused-vars
        return rest;
      });
    },
    [setCrops, setScheduleDone]
  );
  const setCropHealth = useCallback(
    (id, health) => setCrops((x) => x.map((c) => (c.id === id ? { ...c, health } : c))),
    [setCrops]
  );

  /* ── Crop calendar completion: { [fieldId]: { [taskId]: true } } ──
   * Shared by the Crop Calendar and the Home "Today's action" card so both update together.
   * First run: tasks that ended >3 days ago are pre-completed, so an existing farm isn't flooded
   * with "missed" items. Fields added later start clean (and have a "mark past done" button). */
  // Drop completion ticks of fields that no longer exist (e.g. removed sample fields).
  useEffect(() => {
    const ids = new Set(crops.map((c) => c.id));
    if (Object.keys(scheduleDone).some((k) => !ids.has(k))) {
      setScheduleDone((m) => Object.fromEntries(Object.entries(m).filter(([k]) => ids.has(k))));
    }
  }, [crops, scheduleDone, setScheduleDone]);

  const setScheduleTaskDone = useCallback(
    (fieldId, taskId, done = true) =>
      setScheduleDone((m) => {
        const f = { ...(m[fieldId] || {}) };
        if (done) f[taskId] = true;
        else delete f[taskId];
        return { ...m, [fieldId]: f };
      }),
    [setScheduleDone]
  );
  const markScheduleTasksDone = useCallback(
    (fieldId, ids) => setScheduleDone((m) => ({ ...m, [fieldId]: { ...(m[fieldId] || {}), ...Object.fromEntries(ids.map((id) => [id, true])) } })),
    [setScheduleDone]
  );

  // One-time cleanup: the old demo seed had placeholder crop tasks ("top-dress urea in ragi" …)
  // that conflict with the real crop calendar. Remove those seed entries; user-made tasks stay.
  useEffect(() => {
    try {
      if (localStorage.getItem('ks-demo-tasks-cleaned-v2')) return;
      localStorage.setItem('ks-demo-tasks-cleaned-v2', '1');
    } catch {
      return;
    }
    setTasks((x) => x.filter((tk) => !LEGACY_DEMO_TASK_IDS.includes(tk.id)));
  }, [setTasks]);

  // Repair tasks saved with duplicate ids (older addTask used only Date.now()).
  useEffect(() => {
    const seen = new Set();
    if (tasks.every((tk) => !seen.has(tk.id) && seen.add(tk.id))) return;
    // The Set lives inside the updater: React may call updaters twice in development.
    setTasks((x) => {
      const used = new Set();
      return x.map((tk, i) => (used.has(tk.id) ? { ...tk, id: `${tk.id}-${i}` } : (used.add(tk.id), tk)));
    });
  }, [tasks, setTasks]);


  /** Called after a successful sign-in ({ id, email }). Supabase keeps the session itself. */
  const login = useCallback((user) => setAuth(user ? { loggedIn: true, email: user.email || '', phone: user.phone || '', userId: user.id, local: !!user.local } : SIGNED_OUT), []);
  const logout = useCallback(async () => {
    await authService.signOut();
    setAuth(SIGNED_OUT);
  }, []);

  // Restore the Supabase session on load and follow sign-in / sign-out events
  // (including returning from an email confirmation or password-reset link).
  useEffect(() => {
    let alive = true;
    authService.getUser().then((u) => alive && setAuth(u ? { loggedIn: true, email: u.email || '', phone: u.phone || '', userId: u.id, local: !!u.local } : SIGNED_OUT));
    const unsubscribe = authService.onAuthChange((u) => setAuth(u ? { loggedIn: true, email: u.email || '', phone: u.phone || '', userId: u.id, local: !!u.local } : SIGNED_OUT));
    try {
      localStorage.removeItem('ks-auth-v1'); // old mock phone login
    } catch {
      /* ignore */
    }
    return () => {
      alive = false;
      unsubscribe();
    };
  }, []);

  // Calendar date that rolls over at midnight (checked every 30 s and whenever the tab is shown),
  // so every date-based view – crop stages, today's tasks, weather days – moves to the new day.
  const now = useNow(30000);
  const today = toISO(new Date(now));

  // Mirror fields, calendar ticks and profile to Supabase for a signed-in Supabase user.
  const cloudStatus = useCloudSync({ auth, crops, setCrops, scheduleDone, setScheduleDone, profile, setProfile });

  /** Name to show in the UI: the farmer's own name, or a generic placeholder. */
  const displayName = profile.name?.trim() || translate(lang, 'common.farmer');

  /** Clear every field, task and setting on this device (start over as a new farmer). */
  const resetDemo = useCallback(() => {
    setProfile(defaultProfile);
    setCrops(initialCrops());
    setScheduleDone({});
    setTasks(initialTasks());
    setLangState(defaultProfile.language);
    try {
      Object.keys(localStorage)
        .filter((k) => k.startsWith('ks-chat') || k.startsWith('ks-claim'))
        .forEach((k) => localStorage.removeItem(k));
    } catch {
      /* ignore */
    }
  }, [setProfile, setCrops, setScheduleDone, setTasks, setAuth]);

  const value = useMemo(
    () => ({
      lang, setLang, t, L,
      profile, setProfile, displayName,
      crops, addCrop, updateCrop, removeCrop, setCropHealth,
      activeField, setActiveFieldId,
      dataSaver, setDataSaver,
      tasks, addTask, toggleTask, deleteTask,
      scheduleDone, setScheduleTaskDone, markScheduleTasksDone,
      auth, login, logout,
      toasts, toast, dismissToast,
      loginOpen, setLoginOpen,
      resetDemo,
      today,
      cloudStatus,
    }),
    [lang, setLang, t, L, profile, setProfile, displayName, crops, addCrop, updateCrop, removeCrop, setCropHealth, activeField, setActiveFieldId, dataSaver, setDataSaver, tasks, addTask, toggleTask, deleteTask, scheduleDone, setScheduleTaskDone, markScheduleTasksDone,  auth, login, logout, toasts, toast, dismissToast, loginOpen, resetDemo, today, cloudStatus]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
};
