import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Droplets, Wind, CloudRain, Thermometer, AlertTriangle, Sprout, BellPlus, Sparkles, Ban, CheckCircle2, Gauge, Sun, ChevronDown } from 'lucide-react';
import { Bar, CartesianGrid, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useApp } from '../context/AppContext';
import { currentWeather, forecast, weatherAlerts, irrigationAdvice, tomatoAdvice } from '../data/weather';
import { demoQuestion } from '../data/ai';
import { addDays, fmtDate, fmtWeekday } from '../utils/date';
import { Badge, DemoNote, PageHeader, ProgressBar, SectionTitle } from '../components/ui';
import WeatherIcon from '../components/WeatherIcon';

const levelTone = {
  high: { box: 'bg-clay-100 border-clay-500/30', icon: 'text-clay-600', badge: 'red' },
  medium: { box: 'bg-earth-100 border-earth-500/30', icon: 'text-earth-600', badge: 'amber' },
  low: { box: 'bg-sky-100 border-sky-500/30', icon: 'text-sky-500', badge: 'sky' },
};

export default function Weather() {
  const { t, L, lang, profile, tasks, addTask, toast } = useApp();
  const nav = useNavigate();
  const [why, setWhy] = useState(true);
  const w = currentWeather;
  const fc = forecast();
  const tomorrow = fc[1];
  const totalRain = fc.slice(0, 3).reduce((s, d) => s + d.mm, 0);

  const data = fc.map((d) => ({ day: fmtWeekday(d.date, lang), rain: d.rain, temp: d.hi, mm: d.mm }));

  const reminderExists = tasks.some((x) => x.id === 'wx-reminder');
  const remind = () => {
    if (reminderExists) return toast(t('weather.reminderAdded'), 'info');
    addTask({
      id: 'wx-reminder',
      title: { en: 'Re-check rain forecast before irrigating ragi', hi: 'रागी में सिंचाई से पहले बारिश का पूर्वानुमान देखें', kn: 'ರಾಗಿಗೆ ನೀರು ಹಾಯಿಸುವ ಮುನ್ನ ಮಳೆ ಮುನ್ಸೂಚನೆ ನೋಡಿ' },
      date: addDays(4),
      category: 'irrigation',
      cropId: 'ragi',
    });
    toast(t('weather.reminderAdded'));
  };

  return (
    <div>
      <PageHeader title={t('weather.title')} subtitle={`${profile.village}, ${profile.district}`} demo />

      <div className="grid lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-5">
          {/* Irrigation recommendation – the headline answer */}
          <section className="rounded-3xl bg-forest-700 text-cream-50 p-5 md:p-6 shadow-lift relative overflow-hidden">
            <div className="absolute -right-8 -bottom-10 opacity-15" aria-hidden><Droplets size={180} /></div>
            <div className="relative">
              <div className="flex items-center gap-2 text-cream-200 font-bold text-sm">
                <Sprout size={18} /> {t('weather.ragi')} · {t('common.tomorrow')}, {fmtDate(tomorrow.date, lang)}
              </div>
              <div className="flex items-start gap-4 mt-3">
                <span className="h-14 w-14 rounded-2xl bg-clay-500 grid place-items-center shrink-0"><Ban size={30} /></span>
                <div>
                  <h2 className="text-2xl md:text-3xl font-extrabold leading-tight">{L(irrigationAdvice.title)}</h2>
                  <p className="mt-2 text-cream-100 text-base md:text-lg">{L(irrigationAdvice.summary)}</p>
                </div>
              </div>
              <button onClick={() => setWhy((x) => !x)} aria-expanded={why} className="mt-4 inline-flex items-center gap-1.5 font-bold text-earth-400 min-h-[44px]">
                {t('weather.why')} <ChevronDown size={18} className={`transition ${why ? 'rotate-180' : ''}`} />
              </button>
              {why && (
                <div className="mt-1 space-y-2">
                  {irrigationAdvice.reasons.map((r, i) => (
                    <p key={i} className="flex gap-2 items-start"><CheckCircle2 size={20} className="text-earth-400 shrink-0 mt-0.5" />{L(r)}</p>
                  ))}
                  <p className="rounded-xl bg-white/10 p-3 mt-2">{L(irrigationAdvice.next)}</p>
                </div>
              )}
              <div className="flex flex-wrap gap-3 mt-4">
                <button onClick={remind} className="btn bg-cream-50 text-forest-800 hover:bg-white"><BellPlus size={18} /> {t('weather.addTask')}</button>
                <button onClick={() => nav('/assistant', { state: { ask: L(demoQuestion) } })} className="btn bg-white/15 text-cream-50 hover:bg-white/25"><Sparkles size={18} /> {t('weather.askAi')}</button>
              </div>
            </div>
          </section>

          {/* Current */}
          <section className="card p-5">
            <SectionTitle icon={Sun}>{t('weather.now')}</SectionTitle>
            <div className="flex items-center gap-4">
              <WeatherIcon cond={w.condition} size={56} />
              <div>
                <div className="text-5xl font-extrabold text-forest-800 leading-none">{w.temp}°C</div>
                <div className="text-forest-600/80 mt-1">{t('cond.' + w.condition)} · {t('dash.high')} {w.high}° / {t('dash.low')} {w.low}°</div>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
              <Stat icon={Thermometer} label={t('weather.temp')} value={`${w.temp}°C`} />
              <Stat icon={Droplets} label={t('weather.humidity')} value={`${w.humidity}%`} />
              <Stat icon={CloudRain} label={t('weather.rain')} value={`${w.rainChance}%`} />
              <Stat icon={Wind} label={t('weather.wind')} value={`${w.wind} ${t('weather.kmh')}`} />
            </div>
            <div className="grid sm:grid-cols-2 gap-3 mt-3">
              <div className="rounded-xl bg-forest-50 p-3">
                <div className="flex justify-between font-bold text-forest-700 text-sm mb-1.5"><span className="flex items-center gap-1.5"><Gauge size={16} /> {t('weather.soil')}</span><span>{w.soilMoisture}%</span></div>
                <ProgressBar value={w.soilMoisture} tone="bg-sky-500" />
              </div>
              <div className="rounded-xl bg-sky-100 p-3 flex justify-between items-center">
                <span className="font-bold text-forest-700 text-sm">{t('weather.rainfall')} (3 {t('common.days')})</span>
                <span className="font-extrabold text-sky-500 text-lg">{totalRain} {t('weather.mm')}</span>
              </div>
            </div>
            <p className="mt-3 text-sm text-forest-700 bg-cream-100 rounded-xl p-3">{L(tomatoAdvice)}</p>
          </section>

          {/* Chart */}
          <section className="card p-5">
            <SectionTitle>{t('weather.chart')}</SectionTitle>
            <div className="h-60" role="img" aria-label={t('weather.chart')}>
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={data} margin={{ top: 8, right: 0, left: -18, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e4dac0" vertical={false} />
                  <XAxis dataKey="day" tick={{ fontSize: 12, fill: '#2f7d52' }} axisLine={false} tickLine={false} />
                  <YAxis yAxisId="l" tick={{ fontSize: 12, fill: '#3d8fa8' }} axisLine={false} tickLine={false} unit="%" domain={[0, 100]} />
                  <YAxis yAxisId="r" orientation="right" tick={{ fontSize: 12, fill: '#c98a2b' }} axisLine={false} tickLine={false} unit="°" domain={[20, 36]} />
                  <Tooltip
                    contentStyle={{ borderRadius: 12, border: '1px solid #e4dac0' }}
                    formatter={(v, n) => (n === 'rain' ? [`${v}%`, t('weather.rain')] : [`${v}°C`, t('weather.temp')])}
                  />
                  <Bar yAxisId="l" dataKey="rain" fill="#7bb8cc" radius={[6, 6, 0, 0]} barSize={26} />
                  <Line yAxisId="r" type="monotone" dataKey="temp" stroke="#c98a2b" strokeWidth={3} dot={{ r: 4, fill: '#c98a2b' }} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </section>
        </div>

        <div className="space-y-5">
          <section className="card p-5">
            <SectionTitle icon={AlertTriangle}>{t('weather.alerts')}</SectionTitle>
            <ul className="space-y-3">
              {weatherAlerts.map((a) => {
                const s = levelTone[a.level];
                return (
                  <li key={a.id} className={`rounded-2xl border p-4 ${s.box}`}>
                    <div className="flex items-start gap-2.5">
                      <AlertTriangle size={20} className={`${s.icon} shrink-0 mt-0.5`} />
                      <div>
                        <div className="font-extrabold text-forest-800">{L(a.title)}</div>
                        <p className="text-forest-800/80 mt-0.5">{L(a.body)}</p>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>

          <section className="card p-5">
            <SectionTitle>{t('weather.forecast')}</SectionTitle>
            <ul className="divide-y divide-cream-200">
              {fc.map((d, i) => (
                <li key={d.date} className="flex items-center gap-3 py-2.5 min-h-[56px]">
                  <div className="w-16">
                    <div className="font-extrabold text-forest-800">{i === 0 ? t('common.today') : fmtWeekday(d.date, lang)}</div>
                    <div className="text-xs text-forest-600/70">{fmtDate(d.date, lang)}</div>
                  </div>
                  <WeatherIcon cond={d.cond} size={28} />
                  <div className="flex-1 text-sm text-forest-600/80 min-w-0 truncate">{t('cond.' + d.cond)}</div>
                  <Badge tone={d.rain >= 60 ? 'sky' : 'gray'}>{d.rain}%</Badge>
                  <div className="w-14 text-right font-bold text-forest-800">{d.hi}°/<span className="text-forest-500/70">{d.lo}°</span></div>
                </li>
              ))}
            </ul>
          </section>
          <DemoNote />
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
      <div className="font-extrabold text-forest-800">{value}</div>
    </div>
  );
}
