import { Link } from 'react-router-dom';
import {
  MapPin, Droplets, Wind, CloudRain, ArrowRight, AlertTriangle, Stethoscope, LineChart, Store, Landmark, Sprout, Plus, CalendarDays,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import useCropViews from '../hooks/useCropViews';
import { useWeather } from '../context/WeatherContext';
import TodayAction from '../components/TodayAction';
import { conditionFromCode } from '../services/weather';
import { alertText, fmt } from '../utils/weatherText';
import { placeText, useFarmLocation } from '../context/LocationContext';
import { savedPlaceNear } from '../services/location';
import { dateLabelKey } from '../data/farmer';
import { fieldLabel } from '../utils/fields';
import { fmtDate, fmtLong } from '../utils/date';
import WeatherIcon from '../components/WeatherIcon';
import CropArt from '../components/CropArt';
import AerialFields from '../components/AerialFields';

const ADVICE_CHIP = {
  red: 'bg-red-500 text-white',
  amber: 'bg-amber-400 text-amber-950',
  blue: 'bg-sky-400 text-sky-950',
  green: 'bg-emerald-400 text-emerald-950',
  gray: 'bg-white/20 text-white',
};

const QUICK = [
  { to: '/crop-doctor', key: 'nav.cropDoctor', sub: 'home.q.doctor', icon: Stethoscope, tone: 'bg-emerald-50 text-emerald-700' },
  { to: '/market', key: 'nav.market', sub: 'home.q.market', icon: LineChart, tone: 'bg-amber-50 text-amber-700' },
  { to: '/nearby', key: 'home.q.shops', sub: 'home.q.shopsSub', icon: Store, tone: 'bg-sky-50 text-sky-700' },
  { to: '/schemes', key: 'nav.schemes', sub: 'home.q.schemes', icon: Landmark, tone: 'bg-indigo-50 text-indigo-700' },
];

/** The four growth phases shown on Home, mapped from each crop's own stage keys. */
const PHASES = ['sow', 'veg', 'flower', 'harvest'];
const PHASE_OF = {
  nursery: 0, emergence: 0, germination: 0, establish: 0,
  vegetative: 1, tillering: 1, jointing: 1, grandGrowth: 1, branching: 1, kneeHigh: 1, squaring: 1, topping: 1,
  flowering: 2, heading: 2, panicle: 2, silking: 2, pegging: 2, podding: 2, pods: 2, fruitSet: 2, bolls: 2, fruitDev: 2,
  grainFill: 3, maturity: 3, ripening: 3, priming: 3, harvest: 3,
};
const phaseIndex = (c) => {
  if (c.elapsed < 0) return -1;
  if (c.stageKey in PHASE_OF) return PHASE_OF[c.stageKey];
  return Math.min(3, Math.floor((c.progress / 100) * 4));
};

const greetingKey = () => {
  const h = new Date().getHours();
  return h < 12 ? 'greet.morning' : h < 17 ? 'greet.afternoon' : 'greet.evening';
};

export default function Dashboard() {
  const { t, lang, profile } = useApp();
  const wx = useWeather();
  const farmLocation = useFarmLocation();
  const first = profile.name?.trim().split(' ')[0];

  return (
    <div>
      {/* Header: greeting, live date, detected location, then today's to-do */}
      <section className="relative -mt-[72px] overflow-hidden text-white">
        <AerialFields className="absolute inset-0 h-full w-full" />
        <div className="relative max-w-7xl mx-auto px-4 md:px-8 pt-24 md:pt-28 pb-8 md:pb-12">
          <h1 className="display text-[2.2rem] sm:text-5xl break-words">
            {t(greetingKey())}{first ? `, ${first}` : ''}
          </h1>
          <p className="mt-3 text-white/85 flex flex-wrap items-center gap-x-3 gap-y-1 text-base md:text-lg">
            <span className="inline-flex items-center gap-1.5"><CalendarDays size={17} aria-hidden /> {fmtLong(lang)}</span>
            <span className="inline-flex items-center gap-1.5"><MapPin size={17} aria-hidden /> {placeText(profile, farmLocation)}</span>
          </p>
          <div className="mt-6 md:mt-8">
            <TodayAction />
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 md:py-12 space-y-8 md:space-y-10">
        <QuickActions />
        <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] gap-6 items-start">
          <WeatherCard wx={wx} />
          <ActiveCrops />
        </div>
      </div>
    </div>
  );
}

function QuickActions() {
  const { t } = useApp();
  return (
    <section aria-labelledby="home-quick">
      <h2 id="home-quick" className="text-lg font-semibold text-forest-900 mb-3">{t('dash.quickActions')}</h2>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {QUICK.map(({ to, key, sub, icon: Icon, tone }) => (
          <Link key={to} to={to} className="card p-4 md:p-5 flex items-center gap-3 hover:shadow-lift transition min-h-[84px]">
            <span className={`h-12 w-12 rounded-2xl grid place-items-center shrink-0 ${tone}`}><Icon size={24} /></span>
            <span className="min-w-0">
              <span className="block font-semibold text-forest-900 leading-tight">{t(key)}</span>
              <span className="hidden sm:block text-xs text-forest-600 mt-0.5">{t(sub)}</span>
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}

function WeatherCard({ wx }) {
  const { t, lang } = useApp();
  const wd = wx.data;
  const near = wx.source === 'gps' ? savedPlaceNear(wx.coords) : null;
  const place = near ? near.city || near.label : wx.source === 'gps' ? '' : t('wx.locDefault').split(' (')[0];
  const alerts = wx.alerts.slice(0, 3).map((a) => ({ a, ...alertText(a, t, lang) }));

  return (
    <section className="space-y-3">
      <Link to="/weather" className="block rounded-3xl bg-gradient-to-br from-[#12324a] to-[#0b3b24] text-white p-5 md:p-6 hover:opacity-95 transition">
        <div className="flex items-center justify-between gap-2 text-xs uppercase tracking-wider text-white/70">
          <span className="truncate">{place ? `${place} · ` : ''}{t('dash.weatherNow')}</span>
          <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2 py-0.5 normal-case tracking-normal shrink-0">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-300 animate-pulse" /> {t('wx.live')}
          </span>
        </div>
        {!wd ? (
          <p className="mt-4 mb-2 text-sm text-white/80">{wx.status === 'error' ? t('wx.error') : t('wx.loading')}</p>
        ) : (
          <>
            <div className="flex items-center justify-between mt-2">
              <div>
                <div className="text-5xl font-light tracking-tight">{fmt(wd.current.temp)}°C</div>
                <div className="text-sm text-white/75">
                  {t('cond.' + conditionFromCode(wd.current.code))} · {t('dash.high')} {fmt(wd.daily[0]?.hi)}° / {t('dash.low')} {fmt(wd.daily[0]?.lo)}°
                </div>
              </div>
              <WeatherIcon cond={conditionFromCode(wd.current.code)} size={56} />
            </div>
            <div className="grid grid-cols-3 gap-2 mt-4 text-sm">
              {[
                [Droplets, `${fmt(wd.current.humidity)}%`, t('dash.humidity')],
                [CloudRain, `${fmt(wd.daily[0]?.prob)}%`, t('wx.rain24')],
                [Wind, `${fmt(wd.daily[0]?.mm, 1)} ${t('weather.mm')}`, t('wx.rainMm')],
              ].map(([I, v, l]) => (
                <div key={l} className="rounded-xl bg-white/10 px-2.5 py-2">
                  <I size={15} className="text-white/70" aria-hidden />
                  <div className="font-semibold mt-0.5">{v}</div>
                  <div className="text-[11px] text-white/65 truncate">{l}</div>
                </div>
              ))}
            </div>
            <p className="mt-4 text-sm text-white/90 border-t border-white/10 pt-3">
              <span className={`inline-block rounded-full px-2 py-0.5 mr-1.5 text-xs font-semibold ${ADVICE_CHIP[wx.decision.tone]}`}>{t(`wx.status.${wx.decision.status}`)}</span>
              {t(`wx.reason.${wx.decision.status}`)}
            </p>
          </>
        )}
      </Link>

      {alerts.map(({ a, title, body }) => (
        <Link key={`${a.type}-${a.day.date}`} to="/weather" role="alert" className="flex items-start gap-3 rounded-2xl bg-red-50 border border-red-200 p-4 hover:border-red-300 transition">
          <span className="h-10 w-10 rounded-full bg-red-100 text-red-600 grid place-items-center shrink-0"><AlertTriangle size={20} /></span>
          <span className="min-w-0">
            <span className="block font-semibold text-red-900">{title}</span>
            <span className="block text-sm text-red-900/80">{body}</span>
          </span>
        </Link>
      ))}
    </section>
  );
}

function ActiveCrops() {
  const { t, L, lang } = useApp();
  const crops = useCropViews();
  return (
    <section className="card p-5 md:p-6">
      <div className="flex items-center justify-between gap-3 mb-4">
        <h2 className="text-lg font-semibold text-forest-900 flex items-center gap-2"><Sprout size={20} className="text-emerald-600" /> {t('home.crops.title')}</h2>
        {crops.length > 0 && (
          <Link to="/crops" className="inline-flex items-center gap-1 text-sm font-medium text-emerald-700 hover:text-emerald-600 min-h-[40px]">
            {t('common.viewAll')} <ArrowRight size={15} />
          </Link>
        )}
      </div>

      {crops.length === 0 ? (
        <div className="text-center py-6">
          <p className="text-forest-700">{t('home.crops.empty')}</p>
          <Link to="/crops" className="btn-primary mt-4 inline-flex"><Plus size={18} /> {t('fld.add')}</Link>
        </div>
      ) : (
        <ul className="space-y-4">
          {crops.map((c) => {
            const idx = phaseIndex(c);
            return (
              <li key={c.id} className="rounded-2xl border border-black/[0.06] p-3 md:p-4">
                <div className="flex items-center gap-3">
                  <CropArt type={c.cat?.art || 'ragi'} className="h-14 w-14 rounded-xl shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-forest-900 truncate">{fieldLabel(c, t, L)}</div>
                    <div className="text-xs text-forest-600">
                      {t(dateLabelKey(c.cropId))}: {fmtDate(c.sowDate, lang, { day: 'numeric', month: 'short', year: 'numeric' })}
                    </div>
                    <div className="text-sm text-forest-700 mt-0.5">{t('dash.stage')}: <b>{L(c.stage)}</b></div>
                  </div>
                  <div className="text-right shrink-0 text-xs text-forest-600">
                    {c.perennial ? t('kb.yearRound') : c.elapsed < 0 ? t('sch.sowIn', { n: c.sowIn }) : `${c.daysToHarvest} ${t('common.daysLeft')}`}
                  </div>
                </div>
                {c.perennial ? (
                  <p className="mt-3 text-xs rounded-xl bg-emerald-50 text-emerald-800 px-3 py-2">{t('home.crops.perennial')}</p>
                ) : (
                  <ol className="mt-3 grid grid-cols-4 gap-1" aria-label={t('crops.progress')}>
                    {PHASES.map((ph, i) => (
                      <li key={ph} className="min-w-0">
                        <div className={`h-2 rounded-full ${i < idx ? 'bg-emerald-600' : i === idx ? 'bg-yellow-400' : 'bg-cream-200'}`} />
                        <div className={`mt-1 text-[11px] truncate ${i === idx ? 'font-semibold text-forest-900' : 'text-forest-600'}`}>{t(`home.ph.${ph}`)}</div>
                      </li>
                    ))}
                  </ol>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
