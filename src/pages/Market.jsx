import { useMemo, useState } from 'react';
import { ArrowDownRight, ArrowUpRight, BellRing, MapPin, Lightbulb, Trophy } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useApp } from '../context/AppContext';
import { getRecommendation, getSeries, mandis, marketCrops, todayPrices } from '../data/markets';
import { fmtDate, fmtNum } from '../utils/date';
import { Badge, DemoNote, PageHeader, SectionTitle } from '../components/ui';
import MspTracker from '../components/market/MspTracker';
import SellCalculator from '../components/market/SellCalculator';
import LivePrices from '../components/market/LivePrices';

const COLORS = { mandya: '#1f6541', mysuru: '#c98a2b', bengaluru: '#3d8fa8', hassan: '#a8452c', tumakuru: '#6b7d33' };
const RANGES = [7, 14, 30];

export default function Market() {
  const { t, L, lang, toast, pushNotification } = useApp();
  const [crop, setCrop] = useState('ragi');
  const [live, setLive] = useState(null);
  const [range, setRange] = useState(14);
  const [visible, setVisible] = useState(['mandya', 'mysuru', 'bengaluru']);
  const [mandiId, setMandiId] = useState('mandya');
  const [sort, setSort] = useState('price');

  const rows = useMemo(() => todayPrices(crop), [crop]);
  const sorted = [...rows].sort((a, b) => (sort === 'price' ? b.net - a.net : a.km - b.km));
  const sel = rows.find((r) => r.id === mandiId) || rows[0];
  const c = marketCrops[crop];
  const rec = useMemo(() => getRecommendation(lang, crop), [lang, crop]);

  const chartData = useMemo(() => {
    const series = Object.fromEntries(visible.map((id) => [id, getSeries(crop, id, range)]));
    return Array.from({ length: range }, (_, i) => {
      const row = { date: fmtDate(series[visible[0]]?.[i]?.date || '2000-01-01', lang) };
      visible.forEach((id) => (row[id] = series[id][i].modal));
      return row;
    });
  }, [crop, range, visible, lang]);

  const toggleMandi = (id) =>
    setVisible((v) => (v.includes(id) ? (v.length > 1 ? v.filter((x) => x !== id) : v) : [...v, id]));

  const barData = sorted.map((r) => ({ name: L(r.name).split(' ')[0], modal: r.modal, net: r.net, id: r.id }));

  const setAlert = () => {
    pushNotification({
      type: 'market',
      title: { en: 'Price alert set', hi: 'भाव अलर्ट लगाया', kn: 'ಬೆಲೆ ಎಚ್ಚರಿಕೆ ಹೊಂದಿಸಲಾಗಿದೆ' },
      body: { en: `${c.name.en}: ${L(sel.name)} ₹${sel.modal}`, hi: `${c.name.hi}: ${sel.name.hi} ₹${sel.modal}`, kn: `${c.name.kn}: ${sel.name.kn} ₹${sel.modal}` },
      to: '/market',
    });
    toast(t('market.alertSet'));
  };

  return (
    <div>
      <PageHeader title={t('market.title')} subtitle={t('market.sub')} demo />

      <div className="flex flex-wrap gap-2 mb-4" role="tablist" aria-label={t('market.crop')}>
        {Object.entries(marketCrops).map(([id, m]) => (
          <button key={id} role="tab" aria-selected={crop === id} onClick={() => setCrop(id)} className={`chip ${crop === id ? 'chip-on' : 'chip-off'}`}>
            {L(m.name)}
          </button>
        ))}
      </div>

      {/* Recommendation */}
      <section className="rounded-3xl bg-forest-700 text-cream-50 p-5 md:p-6 shadow-lift mb-5 grid md:grid-cols-[auto_1fr] gap-4 items-start">
        <span className="h-14 w-14 rounded-2xl bg-white/15 grid place-items-center"><Lightbulb size={28} className="text-earth-400" /></span>
        <div>
          <h2 className="text-xl font-extrabold">{t('market.recommend')}</h2>
          <p className="mt-1.5 text-cream-100 text-base md:text-lg">{rec.text}</p>
          <div className="mt-3 flex flex-wrap gap-2 items-center">
            <Badge tone="amber"><Trophy size={14} /> {t('market.best')}: {L(rec.best.name)}</Badge>
            {c.msp && <span className="text-cream-200 text-sm">{t('market.msp')}: ₹{fmtNum(c.msp, lang)}</span>}
          </div>
        </div>
      </section>

      {/* Live Agmarknet prices (official) – falls back to cached / demo data */}
      <div className="mb-5">
        <LivePrices cropId={crop} onRows={setLive} />
      </div>

      {/* Mandi price vs MSP tracker + selling-price calculator */}
      <div className="grid lg:grid-cols-2 gap-5 mb-5">
        <MspTracker onPick={setCrop} />
        <SellCalculator cropId={crop} live={live} />
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-5">
          {/* Trend chart */}
          <section className="card p-5">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
              <SectionTitle>{t('market.trend')} <span className="text-sm font-semibold text-forest-500">({t('market.perQ')})</span></SectionTitle>
              <div className="flex gap-1.5" role="group" aria-label={t('market.range')}>
                {RANGES.map((r) => (
                  <button key={r} onClick={() => setRange(r)} aria-pressed={range === r} className={`chip !min-h-[40px] ${range === r ? 'chip-on' : 'chip-off'}`}>
                    {t('market.d' + r)}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex flex-wrap gap-2 mb-3">
              {mandis.map((m) => {
                const on = visible.includes(m.id);
                return (
                  <button key={m.id} onClick={() => toggleMandi(m.id)} aria-pressed={on} className={`chip !min-h-[36px] text-xs ${on ? 'bg-white border-forest-300 text-forest-800' : 'bg-cream-100 border-transparent text-forest-500/70'}`}>
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: on ? COLORS[m.id] : '#cbd5c0' }} />
                    {L(m.name).split(' ')[0]}
                  </button>
                );
              })}
            </div>
            <div className="h-64" role="img" aria-label={t('market.trend')}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 6, right: 8, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e4dac0" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#2f7d52' }} axisLine={false} tickLine={false} interval="preserveStartEnd" minTickGap={24} />
                  <YAxis tick={{ fontSize: 11, fill: '#2f7d52' }} axisLine={false} tickLine={false} domain={['auto', 'auto']} width={52} />
                  <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e4dac0' }} formatter={(v, n) => [`₹${fmtNum(v, lang)}`, L(mandis.find((m) => m.id === n)?.name)]} />
                  {visible.map((id) => (
                    <Line key={id} type="monotone" dataKey={id} stroke={COLORS[id]} strokeWidth={id === 'mandya' ? 3.5 : 2.5} dot={false} activeDot={{ r: 5 }} />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </section>

          {/* Comparison chart */}
          <section className="card p-5">
            <SectionTitle>{t('market.compare')}</SectionTitle>
            <div className="h-60" role="img" aria-label={t('market.compare')}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} margin={{ top: 6, right: 0, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e4dac0" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#2f7d52' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#2f7d52' }} axisLine={false} tickLine={false} domain={['dataMin - 200', 'auto']} width={52} />
                  <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e4dac0' }} formatter={(v, n) => [`₹${fmtNum(v, lang)}`, n === 'modal' ? t('market.modal') : t('market.netAfter')]} />
                  <Legend formatter={(v) => (v === 'modal' ? t('market.modal') : t('market.netAfter'))} wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="modal" radius={[6, 6, 0, 0]}>
                    {barData.map((d) => <Cell key={d.id} fill={d.id === rec.best.id ? '#1f6541' : '#7fb893'} />)}
                  </Bar>
                  <Bar dataKey="net" fill="#d9a24f" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>
        </div>

        <div className="space-y-5">
          {/* Selected mandi stats */}
          <section className="card p-5">
            <SectionTitle icon={MapPin}>{t('market.selected')}</SectionTitle>
            <select aria-label={t('market.mandi')} className="input mb-3" value={sel.id} onChange={(e) => setMandiId(e.target.value)}>
              {mandis.map((m) => <option key={m.id} value={m.id}>{L(m.name)}</option>)}
            </select>
            <div className="text-4xl font-extrabold text-forest-800">₹{fmtNum(sel.modal, lang)}</div>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-sm text-forest-600/80">{t('market.perQ')}</span>
              <Badge tone={sel.change >= 0 ? 'green' : 'red'}>{sel.change >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />} ₹{Math.abs(sel.change)}</Badge>
            </div>
            <div className="grid grid-cols-2 gap-3 mt-4">
              <div className="rounded-xl bg-cream-100 p-3"><div className="text-xs font-bold text-forest-500">{t('market.min')}</div><div className="font-extrabold text-lg">₹{fmtNum(sel.min, lang)}</div></div>
              <div className="rounded-xl bg-cream-100 p-3"><div className="text-xs font-bold text-forest-500">{t('market.max')}</div><div className="font-extrabold text-lg">₹{fmtNum(sel.max, lang)}</div></div>
            </div>
            {c.msp && (
              <p className="mt-3 text-sm text-forest-700">
                {t('market.vsMsp')}: <strong className={sel.modal >= c.msp ? 'text-forest-600' : 'text-clay-600'}>{sel.modal >= c.msp ? '+' : '−'}₹{Math.abs(sel.modal - c.msp)}</strong>
              </p>
            )}
            <button className="btn-soft w-full mt-4" onClick={setAlert}><BellRing size={18} /> {t('market.setAlert')}</button>
          </section>

          {/* Table */}
          <section className="card p-5">
            <div className="flex items-center justify-between gap-2 mb-3">
              <h2 className="h-section">{t('market.mandi')}</h2>
              <div className="flex gap-1.5" role="group" aria-label={t('market.sortBy')}>
                <button onClick={() => setSort('price')} aria-pressed={sort === 'price'} className={`chip !min-h-[36px] text-xs ${sort === 'price' ? 'chip-on' : 'chip-off'}`}>{t('market.sortPrice')}</button>
                <button onClick={() => setSort('km')} aria-pressed={sort === 'km'} className={`chip !min-h-[36px] text-xs ${sort === 'km' ? 'chip-on' : 'chip-off'}`}>{t('market.sortDistance')}</button>
              </div>
            </div>
            <ul className="divide-y divide-cream-200">
              {sorted.map((r) => (
                <li key={r.id}>
                  <button onClick={() => setMandiId(r.id)} className={`w-full text-left py-3 flex items-center gap-3 min-h-[60px] rounded-lg px-1 ${sel.id === r.id ? 'bg-forest-50' : ''}`}>
                    <span className="h-3 w-3 rounded-full shrink-0" style={{ background: COLORS[r.id] }} />
                    <span className="flex-1 min-w-0">
                      <span className="block font-bold text-forest-800 truncate">{L(r.name)} {r.id === rec.best.id && '★'}</span>
                      <span className="block text-xs text-forest-600/80">{r.km} {t('market.km')} · ₹{fmtNum(r.min, lang)}–{fmtNum(r.max, lang)}</span>
                    </span>
                    <span className="text-right">
                      <span className="block font-extrabold text-forest-800">₹{fmtNum(r.modal, lang)}</span>
                      <span className="block text-xs text-earth-700">≈ ₹{fmtNum(r.net, lang)}</span>
                    </span>
                  </button>
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
