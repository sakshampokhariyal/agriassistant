import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Home, Sprout, CloudSun, Landmark, LineChart, CalendarDays, Users, UserRound,
  Grid2x2, LogIn, LogOut, X, ChevronDown, ShieldCheck, Megaphone, Umbrella,
  Stethoscope, Settings2, Feather, CloudOff, Smartphone, Store,
} from 'lucide-react';
import { MotionConfig } from 'framer-motion';
import { useApp } from '../context/AppContext';
import { useWeather } from '../context/WeatherContext';
import useOnline from '../hooks/useOnline';
import LanguageSwitcher from '../components/LanguageSwitcher';
import LoginModal from '../components/LoginModal';
import Toaster from '../components/Toaster';
import ChatWidget from '../components/ChatWidget';
import BrandLogo from '../components/BrandLogo';
import { formatPhone } from '../services/auth';

export const NAV = [
  { to: '/', key: 'nav.dashboard', icon: Home, end: true },
  { to: '/announcements', key: 'nav.announcements', icon: Megaphone },
  { to: '/crops', key: 'nav.crops', icon: Sprout },
  { to: '/crop-doctor', key: 'nav.cropDoctor', icon: Stethoscope },
  { to: '/weather', key: 'nav.weather', icon: CloudSun },
  { to: '/calendar', key: 'nav.calendar', icon: CalendarDays },
  { to: '/market', key: 'nav.market', icon: LineChart },
  { to: '/nearby', key: 'nav.nearby', icon: Store },
  { to: '/schemes', key: 'nav.schemes', icon: Landmark },
  { to: '/insurance', key: 'nav.insurance', icon: Umbrella },
  // Not in the sidebar / More menu; still reached from the chat and Crop Doctor "Ask an expert" links.
  { to: '/community', key: 'nav.community', icon: Users },
  { to: '/settings', key: 'nav.settings', icon: Settings2 },
  { to: '/profile', key: 'nav.profile', icon: UserRound },
];

/** Shows when offline or in Data Saver mode, so farmers know they may be seeing cached data. */
function ConnectionStatus() {
  const { t, dataSaver, lang } = useApp();
  const online = useOnline();
  const weather = useWeather();
  if (online && !dataSaver) return null;
  const time = weather.updatedAt ? new Date(weather.updatedAt).toLocaleTimeString(lang === 'en' ? 'en-IN' : `${lang}-IN`, { hour: 'numeric', minute: '2-digit' }) : null;
  return (
    <NavLink
      to="/settings"
      title={online ? t('set.dataSaverOn') : t('set.isOffline')}
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 min-h-[36px] text-xs font-semibold ${online ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-800'}`}
    >
      {online ? <Feather size={15} /> : <CloudOff size={15} />}
      <span className="hidden md:inline">{online ? t('set.dataSaverOn') : t('set.isOffline')}</span>
      {time && <span className="hidden xl:inline font-normal">· {t('set.cachedAt', { time })}</span>}
    </NavLink>
  );
}

// The assistant is the floating chat button, so the bottom bar keeps four everyday sections.
const MOBILE_MAIN = ['/', '/crops', '/weather', '/market'];

/** Brand lockup linking home. Sidebar: full lockup with tagline; mobile top bar: emblem + wordmark. */
function Logo({ light = false }) {
  const { t } = useApp();
  return (
    <Link to="/" aria-label={t('app.name')} className="rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold">
      {light ? (
        <BrandLogo light size="md" tagline={t('app.tagline')} />
      ) : (
        <BrandLogo size="sm" compact />
      )}
    </Link>
  );
}

/** Site footer with the full brand lockup – shown under every page. */
function Footer() {
  const { t } = useApp();
  return (
    <footer className="border-t border-black/[0.06] bg-brand-cream/70">
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <BrandLogo size="sm" tagline={t('app.tagline')} />
        <p className="text-xs text-forest-700/70 sm:text-right max-w-md">
          © {new Date().getFullYear()} {t('app.name')} · {t('footer.sources')}
        </p>
      </div>
    </footer>
  );
}

/** What identifies the signed-in account: email, or the formatted +91 mobile number. */
const accountLabel = (auth) => auth.email || formatPhone(auth.phone);

/** Initials when a name is known (signed-in user), otherwise a neutral person icon. */
function Avatar({ name, size = 44 }) {
  const initials = (name || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
  return (
    <span
      style={{ width: size, height: size }}
      className={`rounded-full font-semibold grid place-items-center shrink-0 ${initials ? 'bg-emerald-600 text-white' : 'bg-cream-200 text-forest-700'}`}
      aria-hidden
    >
      {initials || <UserRound size={Math.round(size * 0.5)} />}
    </span>
  );
}

/** Navigation only – account controls live in the top-right ProfileMenu. */
function Sidebar() {
  const { t } = useApp();
  return (
    <aside className="hidden lg:flex fixed inset-y-0 left-0 w-72 flex-col bg-[#071f13] text-white/85 p-5 z-30">
      <Logo light />
      <nav className="mt-6 flex-1 space-y-1 overflow-y-auto scrollbar-none -mr-2 pr-2" aria-label="Main">
        {NAV.filter((n) => n.to !== '/profile' && !n.hidden).map(({ to, key, icon: Icon, end }) => (
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
    </aside>
  );
}

/**
 * Top-right account widget – the single place for profile + sign-in.
 * Guest: neutral icon + "Sign in". Signed in: initials + email.
 * Sign-in itself goes through services/auth.js (mock now, Supabase-ready).
 */
function ProfileMenu() {
  const { t, profile, auth, setLoginOpen, logout, toast } = useApp();
  const signedIn = auth.loggedIn;
  const name = signedIn ? profile.name?.trim() : '';
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
        <Avatar name={name} size={40} />
        <span className="hidden xl:block text-left leading-tight">
          <span className="block text-sm font-semibold text-forest-900">{signedIn ? name.split(' ')[0] || t('common.farmer') : t('common.guest')}</span>
          <span className="block text-[11px] text-forest-600/70">{signedIn ? accountLabel(auth) : t('common.signIn')}</span>
        </span>
        <ChevronDown size={16} className="hidden sm:block text-forest-600" />
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl border border-black/[0.06] shadow-lift p-2 z-50">
          <div className="px-3 py-2">
            {signedIn ? (
              <>
                <div className="font-semibold text-forest-900">{name || t('common.farmer')}</div>
                <div className="text-xs text-forest-600/80 break-all flex items-center gap-1">
                  {auth.phone ? <Smartphone size={12} aria-hidden /> : null}
                  {accountLabel(auth)}
                </div>
                <div className="mt-1 text-xs font-medium text-emerald-700 flex items-center gap-1"><ShieldCheck size={13} /> {t('profile.loggedIn')}</div>
                {auth.local && <div className="mt-0.5 text-[11px] text-forest-600/70">{t('auth.localBadge')}</div>}
              </>
            ) : (
              <>
                <div className="font-semibold text-forest-900">{t('common.guest')}</div>
                <div className="text-xs text-forest-600/80 mt-0.5">{t('common.guestNote')}</div>
              </>
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
            {auth.loggedIn ? t('common.logout') : t('common.signIn')}
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
          <ConnectionStatus />
          <LanguageSwitcher variant="light" className="!border-transparent !bg-cream-100" />
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
  const rest = NAV.filter((n) => !MOBILE_MAIN.includes(n.to) && !n.hidden);
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
            <div className="flex items-center justify-between gap-3 mb-4">
              <BrandLogo size="sm" tagline={t('app.tagline')} />
              <h2 className="sr-only">{t('nav.more')}</h2>
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
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

export default function AppLayout() {
  const [more, setMore] = useState(false);
  const { pathname } = useLocation();
  const { dataSaver } = useApp();
  const isHome = pathname === '/';

  useEffect(() => {
    setMore(false);
    window.scrollTo(0, 0);
  }, [pathname]);

  // Data Saver: lighter CSS (no blur/shadows) + reduced motion everywhere.
  useEffect(() => {
    document.documentElement.classList.toggle('data-saver', !!dataSaver);
  }, [dataSaver]);

  return (
    <MotionConfig reducedMotion={dataSaver ? 'always' : 'user'}>
    <div className="min-h-screen">
      <Sidebar />
      <div className="lg:pl-72 min-h-screen flex flex-col">
        <TopBar />
        <main
          className={`flex-1 w-full ${
            isHome ? 'pb-8 lg:pb-0' : 'max-w-7xl mx-auto px-4 md:px-8 pt-5 pb-10 lg:pb-16'
          }`}
        >
          <motion.div key={pathname} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
            <Outlet />
          </motion.div>
        </main>
        {/* Bottom padding on mobile clears the fixed bottom nav + chat button. */}
        <div className="pb-24 lg:pb-0">
          <Footer />
        </div>
      </div>
      <BottomNav onMore={() => setMore(true)} />
      <MoreSheet open={more} onClose={() => setMore(false)} />
      <ChatWidget />
      <LoginModal />
      <Toaster />
    </div>
    </MotionConfig>
  );
}
