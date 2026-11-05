import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import useLocalStorage from '../hooks/useLocalStorage';
import { translate, loc } from '../translations';
import { demoProfile, initialCrops } from '../data/farmer';
import { initialTasks, initialNotifications } from '../data/tasks';
import { initialDiscussions } from '../data/community';

const AppContext = createContext(null);
const VERSION = 'v1';

export function AppProvider({ children }) {
  const [profile, setProfile] = useLocalStorage(`ks-profile-${VERSION}`, demoProfile);
  const [crops, setCrops] = useLocalStorage(`ks-crops-${VERSION}`, initialCrops);
  const [tasks, setTasks] = useLocalStorage(`ks-tasks-${VERSION}`, initialTasks);
  const [notifications, setNotifications] = useLocalStorage(`ks-notifs-${VERSION}`, initialNotifications);
  const [discussions, setDiscussions] = useLocalStorage(`ks-disc-${VERSION}`, initialDiscussions);
  const [auth, setAuth] = useLocalStorage(`ks-auth-${VERSION}`, { loggedIn: false, phone: '' });
  const [lang, setLangState] = useLocalStorage(`ks-lang-${VERSION}`, demoProfile.language);
  const [toasts, setToasts] = useState([]);
  const [loginOpen, setLoginOpen] = useState(false);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

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

  const addCrop = useCallback((crop) => setCrops((x) => [...x, { id: `c${Date.now()}`, health: 'healthy', ...crop }]), [setCrops]);
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

  const login = useCallback(
    (phone) => {
      setAuth({ loggedIn: true, phone });
      setProfile((p) => ({ ...p, phone }));
    },
    [setAuth, setProfile]
  );
  const logout = useCallback(() => setAuth({ loggedIn: false, phone: '' }), [setAuth]);

  const resetDemo = useCallback(() => {
    setProfile(demoProfile);
    setCrops(initialCrops());
    setTasks(initialTasks());
    setNotifications(initialNotifications());
    setDiscussions(initialDiscussions);
    setAuth({ loggedIn: false, phone: '' });
    setLangState(demoProfile.language);
    try {
      Object.keys(localStorage)
        .filter((k) => k.startsWith('ks-chat'))
        .forEach((k) => localStorage.removeItem(k));
    } catch {
      /* ignore */
    }
  }, [setProfile, setCrops, setTasks, setNotifications, setDiscussions, setAuth]);

  const value = useMemo(
    () => ({
      lang, setLang, t, L,
      profile, setProfile,
      crops, addCrop, removeCrop, setCropHealth,
      tasks, addTask, toggleTask, deleteTask,
      notifications, markAllRead, pushNotification,
      discussions, setDiscussions,
      auth, login, logout,
      toasts, toast, dismissToast,
      loginOpen, setLoginOpen,
      resetDemo,
    }),
    [lang, setLang, t, L, profile, setProfile, crops, addCrop, removeCrop, setCropHealth, tasks, addTask, toggleTask, deleteTask, notifications, markAllRead, pushNotification, discussions, setDiscussions, auth, login, logout, toasts, toast, dismissToast, loginOpen, resetDemo]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
};
