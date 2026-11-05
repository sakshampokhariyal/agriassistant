import { useEffect, useRef, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Home, MessageCircle, Sprout, CloudSun, Landmark, LineChart, CalendarDays, Users, UserRound,
  Grid2x2, LogIn, LogOut, X, FlaskConical, ChevronDown, ShieldCheck, Megaphone,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import LanguageSwitcher from '../components/LanguageSwitcher';
import NotificationBell from '../components/NotificationBell';
import LoginModal from '../components/LoginModal';
import Toaster from '../components/Toaster';

export const NAV = [
  { to: '/', key: 'nav.dashboard', icon: Home, end: true },
  { to: '/announcements', key: 'nav.announcements', icon: Megaphone },
  { to: '/assistant', key: 'nav.assistant', icon: MessageCircle },
  { to: '/crops', key: 'nav.crops', icon: Sprout },
  { to: '/weather', key: 'nav.weather', icon: CloudSun },
  { to: '/schemes', key: 'nav.schemes', icon: Landmark },
  { to: '/market', key: 'nav.market', icon: LineChart },
  { to: '/calendar', key: 'nav.calendar', icon: CalendarDays },
  { to: '/community', key: 'nav.community', icon: Users },
  { to: '/profile', key: 'nav.profile', icon: UserRound },
];

const MOBILE_MAIN = ['/', '/assistant', '/crops', '/weather'];

function Logo({ light = false }) {
  const { t } = useApp();
  return (
    <div className="flex items-center gap-2.5">
      <LogoMark className="h-8 w-8 shrink-0" />
      <div className="leading-tight whitespace-nowrap hidden min-[420px]:block">
        <div className={`font-semibold tracking-tight text-base sm:text-xl ${light ? 'text-white' : 'text-forest-900'}`}>{t('app.name')}</div>
        <div className={`text-xs hidden ${light ? 'lg:block text-white/60' : 'text-forest-600/70'}`}>{t('app.tagline')}</div>
      </div>
    </div>
  );
}

/** Seed-cluster mark, echoing the reference logo. */
function LogoMark({ className = '' }) {
  const dots = [[16, 5, 3], [9, 10, 3], [23, 10, 3], [16, 15, 3.4], [4, 16, 2.4], [28, 16, 2.4], [9, 21, 3], [23, 21, 3], [16, 26, 3]];
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden>
      {dots.map(([cx, cy, r], i) => (
        <ellipse key={i} cx={cx} cy={cy} rx={r * 1.25} ry={r} fill={i % 3 === 0 ? '#4d9a2f' : '#6cb33f'} />
      ))}
    </svg>
  );
}

function Avatar({ name, size = 44 }) {
  const initials = name
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('');
  return (
    <span
      style={{ width: size, height: size }}
      className="rounded-full bg-earth-400 text-white font-extrabold grid place-items-center shrink-0"
      aria-hidden
    >
      {initials}
    </span>
  );
}

function Sidebar() {
  const { t, profile, auth, setLoginOpen, logout, toast } = useApp();
  return (
    <aside className="hidden lg:flex fixed inset-y-0 left-0 w-72 flex-col bg-[#071f13] text-white/85 p-5 z-30">
      <Logo light />
      <nav className="mt-6 flex-1 space-y-1 overflow-y-auto scrollbar-none -mr-2 pr-2" aria-label="Main">
        {NAV.filter((n) => n.to !== '/profile').map(({ to, key, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-full px-4 min-h-[46px] font-medium transition ${
                isActive ? 'bg-emerald-600 text-white' : 'text-white/75 hover:bg-white/10 hover:text-white'
              }`
            }
          >
            <Icon size={22} aria-hidden /> {t(key)}
          </NavLink>
        ))}
      </nav>
      <div className="rounded-2xl bg-white/10 p-3 mt-4">
        <NavLink to="/profile" className="flex items-center gap-3 rounded-xl hover:bg-white/10 p-1.5">
          <Avatar name={profile.name} />
          <div className="min-w-0">
            <div className="font-bold truncate">{profile.name}</div>
            <div className="text-xs text-cream-200 truncate">
              {profile.village}, {profile.district}
            </div>
          </div>
        </NavLink>
        <button
          onClick={() => {
            if (auth.loggedIn) {
              logout();
              toast(t('auth.loggedOut'), 'info');
            } else setLoginOpen(true);
          }}
          className="mt-2 w-full flex items-center justify-center gap-2 rounded-xl min-h-[44px] bg-white/10 hover:bg-white/20 font-bold text-sm"
        >
          {auth.loggedIn ? <LogOut size={16} /> : <LogIn size={16} />}
          {auth.loggedIn ? t('common.logout') : t('common.login')}
        </button>
      </div>
      <p className="mt-3 text-[11px] text-cream-200/80 flex gap-1.5">
        <FlaskConical size={13} className="shrink-0 mt-0.5" /> {t('footer.demo')}
      </p>
    </aside>
  );
}

/** Top-right farmer button: profile link + phone/OTP login state. */
function ProfileMenu() {
  const { t, profile, auth, setLoginOpen, logout, toast } = useApp();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const nav = useNavigate();

  useEffect(() => {
    if (!open) return;
    const onDoc = (e) => ref.current && !ref.current.contains(e.target) && setOpen(false);
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-label={t('nav.profile')}
        className="flex items-center gap-2 rounded-full pl-1 pr-1 sm:pr-3 min-h-[44px] hover:bg-cream-100 transition"
      >
        <Avatar name={profile.name} size={40} />
        <span className="hidden xl:block text-left leading-tight">
          <span className="block text-sm font-semibold text-forest-900">{profile.name.split(' ')[0]}</span>
          <span className="block text-[11px] text-forest-600/70">{auth.loggedIn ? `+91 ${auth.phone}` : t('common.guest')}</span>
        </span>
        <ChevronDown size={16} className="hidden sm:block text-forest-600" />
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl border border-black/[0.06] shadow-lift p-2 z-50">
          <div className="px-3 py-2">
            <div className="font-semibold text-forest-900">{profile.name}</div>
            <div className="text-xs text-forest-600/80">{profile.village}, {profile.district}</div>
            {auth.loggedIn ? (
              <div className="mt-1 text-xs font-medium text-emerald-700 flex items-center gap-1"><ShieldCheck size={13} /> {t('profile.loggedIn')}</div>
            ) : (
              <div className="mt-1 text-xs text-earth-700">{t('common.guest')}</div>
            )}
          </div>
          <button onClick={() => { setOpen(false); nav('/profile'); }} className="w-full flex items-center gap-2.5 rounded-xl px-3 min-h-[44px] hover:bg-cream-100 text-forest-900">
            <UserRound size={18} /> {t('nav.profile')}
          </button>
          <button
            onClick={() => {
              setOpen(false);
              if (auth.loggedIn) {
                logout();
                toast(t('auth.loggedOut'), 'info');
              } else setLoginOpen(true);
            }}
            className={`w-full flex items-center gap-2.5 rounded-xl px-3 min-h-[44px] font-medium ${auth.loggedIn ? 'hover:bg-cream-100 text-forest-900' : 'bg-emerald-600 text-white hover:bg-emerald-500 mt-1'}`}
          >
            {auth.loggedIn ? <LogOut size={18} /> : <LogIn size={18} />}
            {auth.loggedIn ? t('common.logout') : t('profile.verify')}
          </button>
        </div>
      )}
    </div>
  );
}

function TopBar() {
  const { t } = useApp();
  const { pathname } = useLocation();
  const current = NAV.find((n) => (n.end ? pathname === n.to : pathname.startsWith(n.to)));
  return (
    // Floating pill navbar; the wrapper ignores clicks so the hero shows through the gaps.
    <header className="sticky top-0 z-30 px-3 md:px-6 pt-3 pointer-events-none">
      <div className="pointer-events-auto mx-auto max-w-7xl bg-white/95 backdrop-blur-md rounded-full border border-black/[0.05] shadow-[0_6px_24px_rgba(4,30,18,0.10)] pl-3 pr-2 py-2 flex items-center justify-between gap-2">
        <div className="lg:hidden pl-1">
          <Logo />
        </div>
        <div className="hidden lg:flex items-center gap-3 pl-3">
          <span className="pill-dot" />
          <span className="text-lg font-medium tracking-tight text-forest-900">{current ? t(current.key) : ''}</span>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2">
          <LanguageSwitcher variant="light" className="!border-transparent !bg-cream-100" />
          <NotificationBell />
          <ProfileMenu />
        </div>
      </div>
    </header>
  );
}

function BottomNav({ onMore }) {
  const { t } = useApp();
  const { pathname } = useLocation();
  const moreActive = !MOBILE_MAIN.includes(pathname);
  const items = NAV.filter((n) => MOBILE_MAIN.includes(n.to));
  return (
    <nav
      aria-label="Main"
      className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white border-t border-cream-300 pb-safe shadow-[0_-4px_16px_rgba(23,81,47,0.08)]"
    >
      <ul className="grid grid-cols-5">
        {items.map(({ to, key, icon: Icon, end }) => (
          <li key={to}>
            <NavLink
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center gap-0.5 min-h-[64px] text-[11px] font-bold ${
                  isActive ? 'text-forest-700' : 'text-forest-500/70'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <span className={`h-8 w-14 rounded-full grid place-items-center transition ${isActive ? 'bg-forest-100' : ''}`}>
                    <Icon size={22} aria-hidden />
                  </span>
                  <span className="truncate max-w-full px-1">{t(key)}</span>
                </>
              )}
            </NavLink>
          </li>
        ))}
        <li>
          <button
            onClick={onMore}
            className={`w-full flex flex-col items-center justify-center gap-0.5 min-h-[64px] text-[11px] font-bold ${
              moreActive ? 'text-forest-700' : 'text-forest-500/70'
            }`}
          >
            <span className={`h-8 w-14 rounded-full grid place-items-center ${moreActive ? 'bg-forest-100' : ''}`}>
              <Grid2x2 size={22} aria-hidden />
            </span>
            {t('nav.more')}
          </button>
        </li>
      </ul>
    </nav>
  );
}

function MoreSheet({ open, onClose }) {
  const { t, auth, setLoginOpen, logout, toast } = useApp();
  const nav = useNavigate();
  const rest = NAV.filter((n) => !MOBILE_MAIN.includes(n.to));
  return (
    <AnimatePresence>
      {open && (
        <div className="lg:hidden fixed inset-0 z-50 flex items-end" role="dialog" aria-modal="true" aria-label={t('nav.more')}>
          <motion.div className="absolute inset-0 bg-forest-900/50" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
          <motion.div
            className="relative w-full bg-cream-50 rounded-t-3xl p-5 pb-8"
            initial={{ y: 200 }}
            animate={{ y: 0 }}
            exit={{ y: 200 }}
            transition={{ type: 'spring', damping: 30, stiffness: 340 }}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-extrabold text-forest-800">{t('nav.more')}</h2>
              <button onClick={onClose} aria-label={t('common.close')} className="h-11 w-11 grid place-items-center rounded-full hover:bg-forest-50">
                <X size={22} />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {rest.map(({ to, key, icon: Icon }) => (
                <button
                  key={to}
                  onClick={() => {
                    onClose();
                    nav(to);
                  }}
                  className="card flex items-center gap-3 p-4 min-h-[64px] font-bold text-forest-800 text-left"
                >
                  <span className="h-11 w-11 rounded-xl bg-forest-50 text-forest-600 grid place-items-center">
                    <Icon size={22} />
                  </span>
                  {t(key)}
                </button>
              ))}
              <button
                onClick={() => {
                  onClose();
                  if (auth.loggedIn) {
                    logout();
                    toast(t('auth.loggedOut'), 'info');
                  } else setLoginOpen(true);
                }}
                className="card flex items-center gap-3 p-4 min-h-[64px] font-bold text-forest-800 text-left"
              >
                <span className="h-11 w-11 rounded-xl bg-earth-100 text-earth-600 grid place-items-center">
                  {auth.loggedIn ? <LogOut size={22} /> : <LogIn size={22} />}
                </span>
                {auth.loggedIn ? t('common.logout') : t('common.login')}
              </button>
            </div>
            <p className="mt-4 text-xs text-earth-700 flex gap-1.5">
              <FlaskConical size={14} className="shrink-0" /> {t('footer.demo')}
            </p>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

export default function AppLayout() {
  const [more, setMore] = useState(false);
  const { pathname } = useLocation();
  const isChat = pathname === '/assistant';
  const isHome = pathname === '/';

  useEffect(() => {
    setMore(false);
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <div className="min-h-screen">
      <Sidebar />
      <div className="lg:pl-72 min-h-screen flex flex-col">
        <TopBar />
        <main
          className={`flex-1 w-full ${
            isHome ? 'pb-28 lg:pb-0' : `max-w-7xl mx-auto px-4 md:px-8 ${isChat ? 'pt-3 pb-24 lg:pb-6' : 'pt-5 pb-28 lg:pb-10'}`
          }`}
        >
          <motion.div key={pathname} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
            <Outlet />
          </motion.div>
        </main>
      </div>
      <BottomNav onMore={() => setMore(true)} />
      <MoreSheet open={more} onClose={() => setMore(false)} />
      <LoginModal />
      <Toaster />
    </div>
  );
}
