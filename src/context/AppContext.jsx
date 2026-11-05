import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import useLocalStorage from '../hooks/useLocalStorage';
import { translate, loc } from '../translations';
import { demoProfile, initialCrops } from '../data/farmer';
import { initialTasks, initialNotifications } from '../data/tasks';
import { initialDiscussions } from '../data/community';
import * as authService from '../services/auth';

const AppContext = createContext(null);
const SIGNED_OUT = { loggedIn: false, email: '', userId: null };
const VERSION = 'v1';

export function AppProvider({ children }) {
  const [profile, setProfile] = useLocalStorage(`ks-profile-${VERSION}`, demoProfile);
  const [crops, setCrops] = useLocalStorage(`ks-crops-${VERSION}`, initialCrops);
  const [tasks, setTasks] = useLocalStorage(`ks-tasks-${VERSION}`, initialTasks);
  const [notifications, setNotifications] = useLocalStorage(`ks-notifs-${VERSION}`, initialNotifications);
  // v2: community posts use generic author labels (no personal names).
  const [discussions, setDiscussions] = useLocalStorage('ks-disc-v2', initialDiscussions);
  // Auth state mirrors the Supabase session (see services/auth.js).
  const [auth, setAuth] = useState(SIGNED_OUT);
  const [lang, setLangState] = useLocalStorage(`ks-lang-${VERSION}`, demoProfile.language);
  const [activeFieldId, setActiveFieldId] = useLocalStorage('ks-active-field-v1', null);
  const [dataSaver, setDataSaver] = useLocalStorage('ks-data-saver-v1', false);
  const [toasts, setToasts] = useState([]);
  const [loginOpen, setLoginOpen] = useState(false);

  // Fields migration: older crop entries get a field number, soil and irrigation source.
  useEffect(() => {
    if (crops.some((c) => !c.no || !c.soil || !c.irrigation)) {
      setCrops((x) => x.map((c, i) => ({ no: i + 1, name: '', soil: profile.soil, irrigation: profile.irrigation, ...c, ...(c.no ? {} : { no: i + 1 }) })));
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
    if (profile.schema !== 2) setProfile((p) => ({ ...p, name: '', schema: 2 }));
  }, [profile.schema, setProfile]);

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
    (task) => setTasks((x) => [...x, { id: `t${Date.now()}`, done: false, cropId: null, ...task }]),
    [setTasks]
  );
  const toggleTask = useCallback(
    (id) => setTasks((x) => x.map((tk) => (tk.id === id ? { ...tk, done: !tk.done } : tk))),
    [setTasks]
  );
  const deleteTask = useCallback((id) => setTasks((x) => x.filter((tk) => tk.id !== id)), [setTasks]);

  // Each crop entry is a *field*: { id, no, name, cropId, acres, sowDate, soil, irrigation, health }.
  const addCrop = useCallback(
    (crop) => {
      const id = `c${Date.now()}`;
      setCrops((x) => {
        const no = Math.max(0, ...x.map((c) => c.no || 0)) + 1;
        return [...x, { id, no, name: '', soil: profile.soil, irrigation: profile.irrigation, health: 'healthy', ...crop }];
      });
      setActiveFieldId(id);
    },
    [setCrops, setActiveFieldId, profile.soil, profile.irrigation]
  );
  const updateCrop = useCallback((id, patch) => setCrops((x) => x.map((c) => (c.id === id ? { ...c, ...patch } : c))), [setCrops]);
  const removeCrop = useCallback((id) => setCrops((x) => x.filter((c) => c.id !== id)), [setCrops]);
  const setCropHealth = useCallback(
    (id, health) => setCrops((x) => x.map((c) => (c.id === id ? { ...c, health } : c))),
    [setCrops]
  );

  const markAllRead = useCallback(() => setNotifications((x) => x.map((n) => ({ ...n, read: true }))), [setNotifications]);
  const pushNotification = useCallback(
    (n) => setNotifications((x) => [{ id: `n${Date.now()}`, read: false, ...n }, ...x]),
    [setNotifications]
  );

  /** Called after a successful sign-in ({ id, email }). Supabase keeps the session itself. */
  const login = useCallback((user) => setAuth(user ? { loggedIn: true, email: user.email, userId: user.id, local: !!user.local } : SIGNED_OUT), []);
  const logout = useCallback(async () => {
    await authService.signOut();
    setAuth(SIGNED_OUT);
  }, []);

  // Restore the Supabase session on load and follow sign-in / sign-out events
  // (including returning from an email confirmation or password-reset link).
  useEffect(() => {
    let alive = true;
    authService.getUser().then((u) => alive && setAuth(u ? { loggedIn: true, email: u.email, userId: u.id, local: !!u.local } : SIGNED_OUT));
    const unsubscribe = authService.onAuthChange((u) => setAuth(u ? { loggedIn: true, email: u.email, userId: u.id, local: !!u.local } : SIGNED_OUT));
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

  /** Name to show in the UI: the farmer's own name, or a generic placeholder. */
  const displayName = profile.name?.trim() || translate(lang, 'common.farmer');

  const resetDemo = useCallback(() => {
    setProfile(demoProfile);
    setCrops(initialCrops());
    setTasks(initialTasks());
    setNotifications(initialNotifications());
    setDiscussions(initialDiscussions);
    setLangState(demoProfile.language);
    try {
      Object.keys(localStorage)
        .filter((k) => k.startsWith('ks-chat') || k.startsWith('ks-claim'))
        .forEach((k) => localStorage.removeItem(k));
    } catch {
      /* ignore */
    }
  }, [setProfile, setCrops, setTasks, setNotifications, setDiscussions, setAuth]);

  const value = useMemo(
    () => ({
      lang, setLang, t, L,
      profile, setProfile, displayName,
      crops, addCrop, updateCrop, removeCrop, setCropHealth,
      activeField, setActiveFieldId,
      dataSaver, setDataSaver,
      tasks, addTask, toggleTask, deleteTask,
      notifications, markAllRead, pushNotification,
      discussions, setDiscussions,
      auth, login, logout,
      toasts, toast, dismissToast,
      loginOpen, setLoginOpen,
      resetDemo,
    }),
    [lang, setLang, t, L, profile, setProfile, displayName, crops, addCrop, updateCrop, removeCrop, setCropHealth, activeField, setActiveFieldId, dataSaver, setDataSaver, tasks, addTask, toggleTask, deleteTask, notifications, markAllRead, pushNotification, discussions, setDiscussions, auth, login, logout, toasts, toast, dismissToast, loginOpen, resetDemo]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
};
