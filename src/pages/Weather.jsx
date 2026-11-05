import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle, BellPlus, CheckCircle2, Circle, CloudRain, Droplets, MapPin, RefreshCw, Sparkles, Thermometer,
  Umbrella, Wind, Sun, Ban, Clock, Sprout, Info,
} from 'lucide-react';
import { Bar, CartesianGrid, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useApp } from '../context/AppContext';
import { useWeather } from '../context/WeatherContext';
import { useChat } from '../context/ChatContext';
import { conditionFromCode } from '../services/weather';
import { demoQuestion } from '../data/ai';
import { addDays, fmtDate, fmtWeekday, toISO } from '../utils/date';
import { alertText, dayLabel, fmt, placeLabel } from '../utils/weatherText';
import { Badge, PageHeader, SectionTitle, Skeleton } from '../components/ui';
import WeatherIcon from '../components/WeatherIcon';

/** Colour system for the four irrigation outcomes. */
export const TONE = {
  red: { panel: 'bg-red-700', chip: 'bg-red-100 text-red-800', dot: 'bg-red-500', icon: Ban },
  amber: { panel: 'bg-amber-700', chip: 'bg-amber-100 text-amber-800', dot: 'bg-amber-500', icon: Clock },
  blue: { panel: 'bg-sky-700', chip: 'bg-sky-100 text-sky-800', dot: 'bg-sky-500', icon: Sun },
  green: { panel: 'bg-emerald-700', chip: 'bg-emerald-100 text-emerald-800', dot: 'bg-emerald-500', icon: CheckCircle2 },
  gray: { panel: 'bg-forest-700', chip: 'bg-cream-200 text-forest-800', dot: 'bg-forest-400', icon: Info },
};

const RULE_ORDER = [
  ['doNot', 'red'],
  ['postpone', 'amber'],
  ['scheduled', 'blue'],
  ['safe', 'green'],
];

export default function Weather() {
  const { t, L, lang, tasks, addTask, toast, today: todayDate } = useApp();
  const w = useWeather();
  const chat = useChat();

  const loading = w.status === 'loading' && !w.data;
  const failed = w.status === 'error' && !w.data;
  const busy = w.status === 'loading' || w.status === 'refreshing';
  const d = w.data;
  const today = d?.daily?.[0];
  const decision = w.decision;
  const tone = TONE[decision?.tone || 'gray'];

  const remind = () => {
    if (!tasks.some((x) => x.id === 'wx-reminder')) {
      addTask({
        id: 'wx-reminder',
        title: { en: 'Re-check the rain forecast before irrigating', hi: 'सिंचाई से पहले बारिश का पूर्वानुमान फिर देखें', kn: 'ನೀರು ಹಾಯಿಸುವ ಮುನ್ನ ಮಳೆ ಮುನ್ಸೂಚನೆ ಮತ್ತೆ ನೋಡಿ' },
        date: addDays(1),
        category: 'irrigation',
      });
    }
    toast(t('weather.reminderAdded'));
  };

  const header = (
    <PageHeader
      title={t('weather.title')}
      subtitle={
        <span className="inline-flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="inline-flex items-center gap-1"><MapPin size={15} /> {placeLabel(w, t)}</span>
          {w.updatedAt && <span className="text-forest-500/80">· {t('wx.updated', { time: new Date(w.updatedAt).toLocaleString(lang === 'en' ? 'en-IN' : `${lang}-IN`, toISO(new Date(w.updatedAt)) === todayDate ? { hour: '2-digit', minute: '2-digit' } : { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) })}</span>}
        </span>
      }
      action={
        <button className="btn-ghost" onClick={w.refresh} disabled={busy} aria-live="polite">
          <RefreshCw size={18} className={busy ? 'animate-spin' : ''} /> {busy && d ? t('wx.refreshing') : t('wx.refresh')}
        </button>
      }
    />
  );

  if (loading) {
    return (
      <div>
        {header}
        <p className="flex items-center gap-2 text-forest-700 mb-4" role="status"><RefreshCw size={18} className="animate-spin" /> {t('wx.loading')}</p>
        <div className="grid lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 space-y-5"><Skeleton className="h-64" /><Skeleton className="h-40" /></div>
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  if (failed) {
    return (
      <div>
        {header}
        <div className="card p-8 text-center max-w-lg mx-auto">
          <AlertTriangle size={36} className="mx-auto text-clay-600" />
          <p className="mt-3 text-forest-800">{t('wx.error')}</p>
          <p className="mt-1 text-xs text-forest-500">{w.error}</p>
          <button className="btn-primary mt-5" onClick={w.refresh}><RefreshCw size={18} /> {t('wx.retry')}</button>
        </div>
      </div>
    );
  }

  const chartData = d.daily.map((x) => ({ day: fmtWeekday(x.date, lang), rain: x.prob ?? 0, temp: x.hi }));
  const status = decision.status;

  return (
    <div>
      {header}

      {w.locIssue && (
        <p className="mb-4 flex items-start gap-2 rounded-2xl bg-earth-100/70 text-earth-700 p-3 text-sm">
          <MapPin size={16} className="shrink-0 mt-0.5" /> {t(w.locIssue === 'denied' ? 'wx.locDenied' : 'wx.locUnavailable')}
        </p>
      )}
      {w.status === 'error' && (
        <p className="mb-4 flex items-start gap-2 rounded-2xl bg-clay-100 text-clay-600 p-3 text-sm">
          <AlertTriangle size={16} className="shrink-0 mt-0.5" /> {t('wx.errorStale')}
        </p>
      )}

      <div className="grid lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-5 min-w-0">
          {/* Irrigation advisory card */}
          <section className={`rounded-3xl ${tone.panel} text-white p-5 md:p-6 shadow-lift relative overflow-hidden`} aria-live="polite">
            <div className="absolute -right-8 -bottom-10 opacity-10" aria-hidden><Droplets size={180} /></div>
            <div className="relative">
              <div className="flex flex-wrap items-center gap-2 text-white/80 text-sm">
                <Sprout size={16} /> {t('wx.advisory')} · {t('wx.today24')}
                <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2.5 py-0.5 text-xs"><span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" /> {t('wx.live')}</span>
              </div>
              <div className="flex items-start gap-4 mt-3">
                <span className="h-14 w-14 rounded-2xl bg-white/20 grid place-items-center shrink-0"><tone.icon size={30} /></span>
                <div className="min-w-0">
                  <span className="inline-block rounded-full bg-white text-forest-900 text-xs font-semibold uppercase tracking-wider px-3 py-1">{t(`wx.status.${status}`)}</span>
                  <p className="mt-2 text-lg md:text-xl leading-snug">{t(`wx.reason.${status}`)}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-5">
                {[
                  [t('wx.rain24'), `${fmt(today?.prob)}%`],
                  [t('wx.rainMm'), `${fmt(today?.mm, 1)} ${t('weather.mm')}`],
                  [t('weather.temp'), `${fmt(d.current.temp, 1)}°C`],
                  [t('weather.humidity'), `${fmt(d.current.humidity)}%`],
                ].map(([k, v]) => (
                  <div key={k} className="rounded-xl bg-white/10 px-3 py-2">
                    <div className="text-[11px] text-white/70 leading-tight">{k}</div>
                    <div className="font-semibold text-lg">{v}</div>
                  </div>
                ))}
              </div>

              <details className="mt-4 group">
                <summary className="cursor-pointer list-none inline-flex items-center gap-1.5 font-medium text-white/90 min-h-[44px]">
                  <Info size={16} /> {t('wx.rules')}
                </summary>
                <ol className="mt-1 space-y-1.5">
                  {RULE_ORDER.map(([key, ruleTone], i) => {
                    const active = status === key;
                    return (
                      <li key={key} className={`flex items-center gap-2.5 rounded-xl px-3 py-2 ${active ? 'bg-white text-forest-900' : 'bg-white/10'}`}>
                        <span className={`h-2.5 w-2.5 rounded-full shrink-0 ${TONE[ruleTone].dot}`} />
                        <span className="text-sm flex-1"><b>{i + 1}. {t(`wx.status.${key}`)}</b> – {t(`wx.rule.${key}`)}</span>
                        {active && <span className="text-xs font-semibold text-emerald-700 shrink-0">{t('wx.applies')}</span>}
                      </li>
                    );
                  })}
                </ol>
              </details>

              <div className="flex flex-wrap gap-3 mt-4">
                <button onClick={remind} className="btn bg-white text-forest-900 hover:bg-cream-100"><BellPlus size={18} /> {t('weather.addTask')}</button>
                <button onClick={() => chat.ask(L(demoQuestion))} className="btn bg-white/15 text-white hover:bg-white/25"><Sparkles size={18} /> {t('weather.askAi')}</button>
              </div>
            </div>
          </section>
          <p className="text-xs text-forest-600/80 -mt-2 flex gap-1.5"><Info size={14} className="shrink-0 mt-0.5" /> {t('wx.checkSoil')}</p>

          {/* Current conditions */}
          <section className="card p-5">
            <SectionTitle icon={Sun}>{t('weather.now')}</SectionTitle>
            <div className="flex items-center gap-4">
              <WeatherIcon cond={conditionFromCode(d.current.code)} size={56} />
              <div>
                <div className="text-5xl font-light tracking-tight text-forest-900 leading-none">{fmt(d.current.temp, 1)}°C</div>
                <div className="text-forest-600/80 mt-1">
                  {t('cond.' + conditionFromCode(d.current.code))}
                  {today?.hi != null && <> · {t('dash.high')} {fmt(today.hi)}° / {t('dash.low')} {fmt(today.lo)}°</>}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
              <Stat icon={Thermometer} label={t('weather.temp')} value={`${fmt(d.current.temp, 1)}°C`} />
              <Stat icon={Droplets} label={t('weather.humidity')} value={`${fmt(d.current.humidity)}%`} />
              <Stat icon={Umbrella} label={t('wx.rain24')} value={`${fmt(today?.prob)}%`} />
              <Stat icon={CloudRain} label={t('wx.rainMm')} value={`${fmt(today?.mm, 1)} ${t('weather.mm')}`} />
            </div>
            {d.current.wind != null && (
              <p className="mt-3 text-sm text-forest-700 flex items-center gap-2"><Wind size={16} className="text-forest-500" /> {t('weather.wind')}: {fmt(d.current.wind)} {t('weather.kmh')}</p>
            )}
          </section>

          {/* Chart */}
          <section className="card p-5">
            <SectionTitle>{t('weather.chart')}</SectionTitle>
            <div className="h-60" role="img" aria-label={t('weather.chart')}>
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData} margin={{ top: 8, right: 0, left: -18, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e2db" vertical={false} />
                  <XAxis dataKey="day" tick={{ fontSize: 12, fill: '#2f7d52' }} axisLine={false} tickLine={false} />
                  <YAxis yAxisId="l" tick={{ fontSize: 12, fill: '#3d8fa8' }} axisLine={false} tickLine={false} unit="%" domain={[0, 100]} />
                  <YAxis yAxisId="r" orientation="right" tick={{ fontSize: 12, fill: '#c98a2b' }} axisLine={false} tickLine={false} unit="°" domain={['dataMin - 3', 'dataMax + 3']} />
                  <Tooltip
                    contentStyle={{ borderRadius: 12, border: '1px solid #e2e2db' }}
                    formatter={(v, n) => (n === 'rain' ? [`${v}%`, t('weather.rain')] : [`${v}°C`, t('weather.temp')])}
                  />
                  <Bar yAxisId="l" dataKey="rain" fill="#7bb8cc" radius={[6, 6, 0, 0]} barSize={26} />
                  <Line yAxisId="r" type="monotone" dataKey="temp" stroke="#c98a2b" strokeWidth={3} dot={{ r: 4, fill: '#c98a2b' }} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </section>
        </div>

        <div className="space-y-5 min-w-0">
          <section className="card p-5">
            <SectionTitle icon={AlertTriangle}>{t('weather.alerts')}</SectionTitle>
            {w.alerts.length === 0 ? (
              <p className="flex items-center gap-2 text-forest-700 rounded-2xl bg-emerald-50 p-4"><CheckCircle2 size={18} className="text-emerald-600" /> {t('wx.noAlerts')}</p>
            ) : (
              <ul className="space-y-3">
                {w.alerts.map((a) => {
                  const txt = alertText(a, t, lang);
                  const box = a.level === 'high' ? 'bg-clay-100 border-clay-500/30' : a.type === 'heat' ? 'bg-earth-100 border-earth-500/30' : 'bg-sky-100 border-sky-500/30';
                  return (
                    <li key={a.type} className={`rounded-2xl border p-4 ${box}`}>
                      <div className="font-semibold text-forest-900">{txt.title}</div>
                      <p className="text-forest-800/80 mt-0.5">{txt.body}</p>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          <section className="card p-5">
            <SectionTitle>{t('weather.forecast')}</SectionTitle>
            <ul className="divide-y divide-black/[0.06]">
              {d.daily.map((x) => {
                const cond = conditionFromCode(x.code);
                return (
                  <li key={x.date} className="flex items-center gap-3 py-2.5 min-h-[56px]">
                    <div className="w-20">
                      <div className="font-semibold text-forest-900">{dayLabel(x.date, t, lang).split(',')[0]}</div>
                      <div className="text-xs text-forest-600/70">{fmtDate(x.date, lang)}</div>
                    </div>
                    <WeatherIcon cond={cond} size={26} />
                    <div className="flex-1 text-sm text-forest-600/80 min-w-0 truncate">{t('cond.' + cond)}</div>
                    <Badge tone={(x.prob ?? 0) >= 60 ? 'sky' : 'gray'}>{fmt(x.prob)}%</Badge>
                    <div className="w-14 text-right font-semibold text-forest-900">{fmt(x.hi)}°/<span className="text-forest-500/70">{fmt(x.lo)}°</span></div>
                  </li>
                );
              })}
            </ul>
          </section>
          <p className="text-xs text-forest-600/80">{t('wx.source')} (open-meteo.com)</p>
        </div>
      </div>
    </div>
  );
}

function Stat({ icon: Icon, label, value }) {
  return (
    <div className="rounded-xl bg-cream-100 p-3">
      <Icon size={18} className="text-forest-500" aria-hidden />
      <div className="text-xs text-forest-600/80 mt-1">{label}</div>
      <div className="font-semibold text-forest-900">{value}</div>
    </div>
  );
}
