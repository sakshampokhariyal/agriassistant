import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  MapPin, Search, Mic, Droplets, Wind, CloudRain, ArrowRight, ArrowUpRight, ArrowDownRight, AlertTriangle,
  Circle, Sprout, CalendarDays, LineChart, Landmark,
} from 'lucide-react';
import { Area, AreaChart, ResponsiveContainer } from 'recharts';
import { useApp } from '../context/AppContext';
import useCropViews from '../hooks/useCropViews';
import { currentWeather, dashboardAdvisory, weatherAlerts } from '../data/weather';
import { schemes, isRelevant } from '../data/schemes';
import { demoQuestion } from '../data/ai';
import { getSeries, todayPrices } from '../data/markets';
import { categoryStyle } from '../data/tasks';
import { fmtDate, fmtLong, fmtNum, todayISO } from '../utils/date';
import { Badge, ProgressBar } from '../components/ui';
import WeatherIcon from '../components/WeatherIcon';
import CropArt from '../components/CropArt';
import AerialFields, { Photo } from '../components/AerialFields';

const greetingKey = () => {
  const h = new Date().getHours();
  return h < 12 ? 'greet.morning' : h < 17 ? 'greet.afternoon' : 'greet.evening';
};

const SERVICES = [
  { to: '/crops', k: 'nav.crops', d: 'svc.crops', photo: 'photo-1523348837708-15d4a09cfac2', icon: Sprout },
  { to: '/weather', k: 'nav.weather', d: 'svc.weather', photo: 'photo-1560493676-04071c5f467b', icon: CloudRain },
  { to: '/schemes', k: 'nav.schemes', d: 'svc.schemes', photo: 'photo-1574943320219-553eb213f72d', icon: Landmark },
  { to: '/market', k: 'nav.market', d: 'svc.market', photo: 'photo-1464226184884-fa280b87c399', icon: LineChart },
  { to: '/calendar', k: 'nav.calendar', d: 'svc.calendar', photo: 'photo-1586771107445-d3ca888129ff', icon: CalendarDays },
  { to: '/community', k: 'nav.community', d: 'svc.community', photo: 'photo-1500937386664-56d1dfef3854', icon: MapPin },
];

const JOURNEY = ['/', '/weather', '/assistant', '/crops', '/schemes', '/market', '/calendar'];
const JOURNEY_KEYS = ['nav.dashboard', 'nav.weather', 'nav.assistant', 'nav.crops', 'nav.schemes', 'nav.market', 'nav.calendar'];

function SectionBadge({ children, glass = false }) {
  return (
    <span className={glass ? 'pill-badge-glass' : 'pill-badge'}>
      <span className="pill-dot" /> {children}
    </span>
  );
}

function MoreLink({ to, children }) {
  return (
    <Link to={to} className="inline-flex items-center gap-1 text-sm font-medium text-emerald-700 hover:text-emerald-600 min-h-[40px]">
      {children} <ArrowRight size={15} />
    </Link>
  );
}

export default function Dashboard() {
  const { t, L, lang, profile, tasks, toggleTask, toast } = useApp();
  const crops = useCropViews();
  const nav = useNavigate();
  const [q, setQ] = useState('');
  const w = currentWeather;
  const today = todayISO();

  const pendingTasks = tasks.filter((x) => !x.done);
  const upcoming = [...pendingTasks].sort((a, b) => a.date.localeCompare(b.date)).slice(0, 4);
  const ragiPrices = todayPrices('ragi').sort((a, b) => b.net - a.net);
  const local = ragiPrices.find((p) => p.id === 'mandya');
  const ragiSeries = getSeries('ragi', 'mandya', 14);
  const lead = crops.find((c) => c.cropId === 'ragi') || crops[0];
  const matched = schemes
    .filter((s) => isRelevant(s, profile, crops))
    .sort((a, b) => Number(!!b.needsCrop) - Number(!!a.needsCrop))
    .slice(0, 3);

  const ask = (text) => nav('/assistant', { state: { ask: text } });
  const submit = (e) => {
    e.preventDefault();
    if (q.trim()) ask(q.trim());
  };

  const stats = [
    { v: profile.landSize, unit: t('common.acres'), label: t('stat.land') },
    { v: crops.length, label: t('stat.crops') },
    { v: pendingTasks.length, label: t('stat.tasks') },
    { v: `₹${fmtNum(local.modal, lang)}`, label: t('stat.ragi') },
  ];

  return (
    <div>
      {/* ───────────── Hero over aerial fields ───────────── */}
      <section className="relative -mt-[72px] overflow-hidden text-white">
        <AerialFields className="absolute inset-0 h-full w-full" />
        <div className="relative max-w-7xl mx-auto px-4 md:px-8 pt-28 md:pt-36 pb-6 md:pb-10 min-h-[100svh] lg:min-h-[760px] flex flex-col">
          <div className="self-start"><SectionBadge glass>{t('hero.badge')}</SectionBadge></div>
          <p className="mt-5 text-white/80 flex flex-wrap items-center gap-x-2">
            <span>{t(greetingKey())}, {profile.name.split(' ')[0]}</span>
            <span className="text-white/40">·</span>
            <span className="inline-flex items-center gap-1"><MapPin size={15} aria-hidden /> {profile.village}, {profile.district}</span>
            <span className="hidden sm:inline text-white/40">·</span>
            <span className="hidden sm:inline">{fmtLong(lang)}</span>
          </p>
          <h1 className="display mt-3 max-w-4xl text-[2.6rem] sm:text-6xl lg:text-7xl xl:text-[5.4rem] break-words">{t('hero.title')}</h1>

          <div className="flex-1 min-h-10" />

          <div className="grid gap-4 lg:grid-cols-[minmax(0,23rem)_minmax(0,19rem)_1fr] items-end">
            {/* Right block: copy + CTA + search (first on mobile) */}
            <div className="order-first lg:order-last lg:justify-self-end lg:max-w-sm space-y-4">
              <p className="text-white/85 text-base md:text-lg leading-relaxed">{t('hero.sub')}</p>
              <form onSubmit={submit}>
                <label className="sr-only" htmlFor="dash-search">{t('dash.search')}</label>
                <div className="flex items-center gap-2 rounded-full bg-white/15 backdrop-blur-md border border-white/20 pl-4 pr-1.5 min-h-[52px] focus-within:bg-white/25">
                  <Search size={18} aria-hidden className="text-white/80" />
                  <input
                    id="dash-search"
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder={t('dash.search')}
                    className="flex-1 bg-transparent outline-none placeholder:text-white/70 min-w-0"
                  />
                  <button type="button" onClick={() => ask(L(demoQuestion))} aria-label={t('assistant.voice')} className="h-10 w-10 rounded-full bg-white text-emerald-800 grid place-items-center hover:bg-cream-100">
                    <Mic size={18} />
                  </button>
                </div>
              </form>
              <button onClick={() => ask(L(demoQuestion))} className="btn-primary">
                {t('hero.cta')} <ArrowRight size={18} />
              </button>
            </div>

            {/* Weather glass card */}
            <Link to="/weather" className="glass-card block hover:bg-emerald-950/70 transition">
              <div className="flex items-center justify-between gap-2 text-xs uppercase tracking-wider text-white/70">
                <span>{profile.district} · {t('dash.weatherNow')}</span>
                <span className="rounded-full bg-yellow-400/20 text-yellow-200 px-2 py-0.5 normal-case tracking-normal">{t('common.demo')}</span>
              </div>
              <div className="flex items-center justify-between mt-2">
                <div>
                  <div className="text-5xl font-light tracking-tight">{w.temp}°C</div>
                  <div className="text-sm text-white/75">{t('cond.' + w.condition)} · {t('dash.high')} {w.high}° / {t('dash.low')} {w.low}°</div>
                </div>
                <WeatherIcon cond={w.condition} size={52} />
              </div>
              <div className="grid grid-cols-3 gap-2 mt-3 text-sm">
                {[
                  [Droplets, `${w.humidity}%`, t('dash.humidity')],
                  [CloudRain, `${w.rainChance}%`, t('dash.rain')],
                  [Wind, `${w.wind}`, t('weather.kmh')],
                ].map(([I, v, l]) => (
                  <div key={l} className="rounded-xl bg-white/10 px-2.5 py-2">
                    <I size={15} className="text-white/70" aria-hidden />
                    <div className="font-semibold mt-0.5">{v}</div>
                    <div className="text-[11px] text-white/65 truncate">{l}</div>
                  </div>
                ))}
              </div>
              <p className="mt-3 text-sm text-white/90 border-t border-white/10 pt-3">
                <span className="text-yellow-300 font-medium">{t('dash.advisory')}: </span>
                {L(dashboardAdvisory)}
              </p>
            </Link>

            {/* Lead crop glass card */}
            {lead && (
              <Link to="/crops" className="glass-card block hover:bg-emerald-950/70 transition">
                <div className="relative">
                  <Photo id="photo-1592982537447-7440770cbfc9" className="h-28 rounded-xl" />
                  <span className="absolute inset-0 grid place-items-center">
                    <span className="h-10 w-10 rounded-full bg-white/30 backdrop-blur grid place-items-center"><Sprout size={20} /></span>
                  </span>
                </div>
                <div className="mt-3 text-lg">{L(lead.cat.name)}</div>
                <div className="text-sm text-white/75">{t('dash.stage')}: {L(lead.stage)}</div>
                <div className="mt-2 h-1.5 rounded-full bg-white/15 overflow-hidden">
                  <div className="h-full rounded-full bg-yellow-400" style={{ width: `${lead.progress}%` }} />
                </div>
                <div className="mt-1.5 text-xs text-white/65">{lead.daysToHarvest} {t('common.daysLeft')}</div>
              </Link>
            )}
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 md:px-8 py-12 md:py-16 space-y-16 md:space-y-20">
        {/* ───────────── Your farm today + stats ───────────── */}
        <section>
          <div className="grid lg:grid-cols-[1fr_1.6fr] gap-6 items-start">
            <div><SectionBadge>{t('sec.farm')}</SectionBadge></div>
            <h2 className="display text-3xl md:text-5xl text-forest-900">{t('sec.farmTitle')}</h2>
          </div>
          <div className="h-px bg-black/[0.08] my-8 md:my-10" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
            {stats.map((s) => (
              <div key={s.label}>
                <div className="text-4xl md:text-5xl font-normal tracking-tight text-forest-900">
                  {s.v}
                  {s.unit && <span className="text-lg text-forest-600/70 ml-1.5">{s.unit}</span>}
                </div>
                <div className="mt-1 text-forest-600/80">{s.label}</div>
              </div>
            ))}
          </div>

          <Link to="/weather" className="mt-10 flex items-start gap-3 rounded-2xl bg-white border border-black/[0.05] p-4 hover:border-clay-500/40 transition">
            <span className="h-10 w-10 rounded-full bg-clay-100 text-clay-600 grid place-items-center shrink-0"><AlertTriangle size={20} /></span>
            <div className="min-w-0">
              <div className="font-semibold text-forest-900">{L(weatherAlerts[0].title)}</div>
              <p className="text-forest-600/90">{L(weatherAlerts[0].body)}</p>
            </div>
            <ArrowRight size={18} className="ml-auto shrink-0 text-forest-500 mt-2" />
          </Link>
        </section>

        {/* ───────────── Tasks · Market · Schemes ───────────── */}
        <section className="grid lg:grid-cols-3 gap-5">
          <div className="card p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-medium text-forest-900">{t('dash.upcoming')}</h3>
              <MoreLink to="/calendar">{t('common.viewAll')}</MoreLink>
            </div>
            <ul className="space-y-2">
              {upcoming.map((tk) => (
                <li key={tk.id} className="flex items-center gap-2 rounded-xl bg-cream-100 pr-3 min-h-[56px]">
                  <button
                    onClick={() => {
                      toggleTask(tk.id);
                      toast(t('calendar.completed'));
                    }}
                    aria-label={t('common.done')}
                    className="h-11 w-11 grid place-items-center text-emerald-600 shrink-0"
                  >
                    <Circle size={22} />
                  </button>
                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-forest-900 truncate">{L(tk.title)}</div>
                    <div className="text-xs text-forest-600/80">{tk.date === today ? t('common.today') : fmtDate(tk.date, lang)}</div>
                  </div>
                  <span className={`h-2.5 w-2.5 rounded-full shrink-0 ${categoryStyle[tk.category].dot}`} aria-hidden />
                </li>
              ))}
              {upcoming.length === 0 && <li className="text-forest-600/70 py-4 text-center">{t('calendar.noTasks')}</li>}
            </ul>
          </div>

          <div className="card p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-medium text-forest-900">{t('dash.marketSnap')}</h3>
              <MoreLink to="/market">{t('common.viewAll')}</MoreLink>
            </div>
            <div className="flex items-end justify-between">
              <div>
                <div className="text-sm text-forest-600/80">{L(local.name)}</div>
                <div className="text-4xl font-normal tracking-tight text-forest-900">₹{fmtNum(local.modal, lang)}</div>
                <div className="text-xs text-forest-600/80">{t('market.perQ')}</div>
              </div>
              <Badge tone={local.change >= 0 ? 'green' : 'red'}>
                {local.change >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />} ₹{Math.abs(local.change)}
              </Badge>
            </div>
            <div className="h-16 -mx-1 mt-2" aria-hidden>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={ragiSeries}>
                  <defs>
                    <linearGradient id="sp" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0" stopColor="#059669" stopOpacity={0.3} />
                      <stop offset="1" stopColor="#059669" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <Area type="monotone" dataKey="modal" stroke="#059669" strokeWidth={2.5} fill="url(#sp)" dot={false} isAnimationActive={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <ul className="mt-2 divide-y divide-black/[0.06]">
              {ragiPrices.slice(0, 3).map((p, i) => (
                <li key={p.id} className="flex justify-between py-2 text-sm">
                  <span className="text-forest-800">{i === 0 && '★ '}{L(p.name)}</span>
                  <span className="font-semibold text-forest-900">₹{fmtNum(p.modal, lang)}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="card p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-medium text-forest-900">{t('dash.schemesForYou')}</h3>
              <MoreLink to="/schemes">{t('common.viewAll')}</MoreLink>
            </div>
            <ul className="space-y-2.5">
              {matched.map((s) => (
                <li key={s.id}>
                  <Link to={`/schemes?open=${s.id}`} className="block rounded-xl bg-cream-100 hover:bg-emerald-50 p-3 transition">
                    <div className="font-medium text-forest-900">{L(s.name)}</div>
                    <div className="text-sm text-forest-600/80 line-clamp-2">{L(s.benefit)}</div>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* ───────────── Active crops ───────────── */}
        <section>
          <div className="flex items-end justify-between gap-4 mb-5">
            <div>
              <SectionBadge>{t('dash.activeCrops')}</SectionBadge>
            </div>
            <MoreLink to="/crops">{t('common.viewAll')}</MoreLink>
          </div>
          <div className="flex gap-4 overflow-x-auto scrollbar-none pb-1 -mx-4 px-4 md:mx-0 md:px-0 snap-x">
            {crops.map((c) => (
              <Link key={c.id} to="/crops" className="card shrink-0 w-72 snap-start p-3 hover:shadow-lift transition">
                <CropArt type={c.cat.art} className="h-36 w-full rounded-xl" />
                <div className="px-1 pt-3 pb-1">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-medium text-lg text-forest-900 truncate">{L(c.cat.name)}</h3>
                    <Badge tone={c.health === 'healthy' ? 'green' : 'amber'}>
                      {c.health === 'healthy' ? t('crops.healthy') : t('crops.watch')}
                    </Badge>
                  </div>
                  <p className="text-sm text-forest-600/80">{t('dash.stage')}: {L(c.stage)}</p>
                  <div className="mt-3"><ProgressBar value={c.progress} tone="bg-emerald-600" /></div>
                  <p className="text-xs text-forest-600/80 mt-1.5">{c.daysToHarvest} {t('common.daysLeft')}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* ───────────── Services (6 core tabs) ───────────── */}
        <section>
          <div className="text-center">
            <SectionBadge>{t('sec.services')}</SectionBadge>
            <h2 className="display text-3xl md:text-5xl text-forest-900 mt-4 max-w-2xl mx-auto">{t('sec.servicesTitle')}</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 mt-10">
            {SERVICES.map((s) => (
              <Link key={s.to} to={s.to} className="group card p-3 hover:shadow-lift transition">
                <Photo id={s.photo} className="h-48 rounded-xl" />
                <div className="px-1.5 pt-4 pb-2 flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-medium text-forest-900">{t(s.k)}</h3>
                    <p className="text-forest-600/85 mt-1">{t(s.d)}</p>
                  </div>
                  <span className="h-10 w-10 shrink-0 rounded-full bg-cream-100 group-hover:bg-emerald-600 group-hover:text-white text-forest-800 grid place-items-center transition">
                    <ArrowUpRight size={18} />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </div>

      {/* ───────────── Closing band ───────────── */}
      <section className="relative overflow-hidden text-white lg:mx-8 lg:mb-8 lg:rounded-3xl">
        <AerialFields seed={21} className="absolute inset-0 h-full w-full" />
        <div className="relative max-w-4xl mx-auto px-4 py-16 md:py-24 text-center">
          <SectionBadge glass>{t('sec.closingBadge')}</SectionBadge>
          <h2 className="display text-4xl md:text-6xl mt-5">{t('sec.closingTitle')}</h2>
          <button onClick={() => ask(L(demoQuestion))} className="btn-primary mt-7">
            {t('hero.cta')} <ArrowRight size={18} />
          </button>
          <div className="glass-card mt-10 text-left">
            <div className="text-xs uppercase tracking-wider text-white/70 mb-3">{t('dash.journey')} · {t('dash.journeyHint')}</div>
            <ol className="flex flex-wrap gap-2">
              {JOURNEY.map((to, i) => (
                <li key={to}>
                  <Link to={to} className="inline-flex items-center gap-2 rounded-full bg-white/10 hover:bg-white/20 border border-white/10 px-3.5 min-h-[40px] text-sm">
                    <span className="h-5 w-5 rounded-full bg-yellow-400 text-emerald-950 text-xs font-semibold grid place-items-center">{i + 1}</span>
                    {t(JOURNEY_KEYS[i])}
                  </Link>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>
    </div>
  );
}
