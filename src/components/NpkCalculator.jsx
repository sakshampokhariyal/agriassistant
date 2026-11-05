import { useEffect, useMemo, useState } from 'react';
import { FlaskConical, Beaker, Info, Sprout } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { SectionTitle } from './ui';
import { NPK_LIMITS, RDF, rateLevel, fertilizerPlan } from '../data/communityTools';

/** NPK soil-test fertilizer calculator (shown on My Crops). */
const NUTRIENT_STYLE = {
  N: { dot: 'bg-blue-500', input: 'focus:ring-blue-300', badge: { low: 'bg-blue-50 text-blue-700 border-blue-200', medium: 'bg-forest-50 text-forest-700 border-forest-200', high: 'bg-emerald-600 text-white border-emerald-600' } },
  P: { dot: 'bg-amber-500', input: 'focus:ring-amber-300', badge: { low: 'bg-amber-50 text-amber-700 border-amber-200', medium: 'bg-amber-100 text-amber-800 border-amber-300', high: 'bg-amber-500 text-white border-amber-500' } },
  K: { dot: 'bg-violet-500', input: 'focus:ring-violet-300', badge: { low: 'bg-violet-50 text-violet-700 border-violet-200', medium: 'bg-violet-100 text-violet-800 border-violet-300', high: 'bg-violet-600 text-white border-violet-600' } },
};
const fmt = (n, d = 0) => Number(n).toLocaleString('en-IN', { maximumFractionDigits: d, minimumFractionDigits: d });

/** Calculator crop for a My Crops field (ragi splits by irrigation); null when the crop has no dose table. */
function rdfKeyFor(field) {
  if (!field?.cropId) return null;
  if (field.cropId === 'ragi') return field.irrigation === 'rainfed' ? 'ragiRainfed' : 'ragiIrrigated';
  return RDF[field.cropId] ? field.cropId : null;
}

export default function NpkCalculator({ field }) {
  const { t, L } = useApp();
  const [soil, setSoil] = useState({ N: '', P: '', K: '' });
  const [crop, setCrop] = useState(() => rdfKeyFor(field) || 'ragiIrrigated');
  const [acres, setAcres] = useState(() => String(field?.acres || 1));

  // Follow the field selected on My Crops (the farmer can still change both by hand).
  useEffect(() => {
    if (!field) return;
    const key = rdfKeyFor(field);
    if (key) setCrop(key);
    if (field.acres) setAcres(String(field.acres));
  }, [field?.id, field?.cropId, field?.irrigation, field?.acres]); // eslint-disable-line react-hooks/exhaustive-deps

  const levels = useMemo(
    () => ({ N: rateLevel('N', soil.N), P: rateLevel('P', soil.P), K: rateLevel('K', soil.K) }),
    [soil],
  );
  const area = Math.min(Math.max(Number(acres) || 0, 0), 1000);
  const ready = levels.N && levels.P && levels.K && area > 0;
  const plan = ready ? fertilizerPlan(crop, levels, area) : null;
  const rdf = RDF[crop];

  const setVal = (k) => (e) => {
    const v = e.target.value;
    if (v === '' || (/^\d*\.?\d*$/.test(v) && Number(v) <= 5000)) setSoil((s) => ({ ...s, [k]: v }));
  };

  return (
    <section aria-labelledby="cm-npk" className="mt-8">
      <SectionTitle icon={FlaskConical}><span id="cm-npk">{t('cm.npk.title')}</span></SectionTitle>
      <p className="text-sm text-forest-700/70 -mt-1 mb-3">{t('cm.npk.sub')}</p>

      <div className="card p-4 md:p-5 grid gap-5 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
        {/* Inputs */}
        <div className="min-w-0">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="label">{t('cm.npk.crop')}</span>
              <select className="input" value={crop} onChange={(e) => setCrop(e.target.value)}>
                {Object.entries(RDF).map(([k, v]) => <option key={k} value={k}>{L(v.name)}</option>)}
              </select>
            </label>
            <label className="block">
              <span className="label">{t('cm.npk.area')}</span>
              <input className="input" type="number" inputMode="decimal" min="0.1" step="0.1" value={acres} onChange={(e) => setAcres(e.target.value)} />
            </label>
          </div>

          <p className="label mt-4">{t('cm.npk.soil')}</p>
          <div className="grid gap-3 sm:grid-cols-3">
            {['N', 'P', 'K'].map((k) => {
              const st = NUTRIENT_STYLE[k];
              const lv = levels[k];
              return (
                <div key={k} className="rounded-2xl bg-cream-50 border border-black/[0.06] p-3 min-w-0">
                  <label className="flex items-center gap-2 text-sm font-bold text-forest-800" htmlFor={`npk-${k}`}>
                    <span className={`h-2.5 w-2.5 rounded-full ${st.dot}`} aria-hidden />
                    {t(`cm.npk.${k}`)}
                  </label>
                  <input
                    id={`npk-${k}`}
                    className={`input mt-1.5 ${st.input}`}
                    inputMode="decimal"
                    placeholder={t('cm.npk.kgha')}
                    value={soil[k]}
                    onChange={setVal(k)}
                  />
                  <div className="mt-2 flex flex-col items-start gap-1">
                    {lv ? (
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${st.badge[lv]}`}>{t(`cm.lvl.${lv}`)}</span>
                    ) : (
                      <span className="text-xs text-forest-600/60 py-1">—</span>
                    )}
                    <span className="text-[11px] text-forest-600/60">
                      {t('cm.npk.range', { low: NPK_LIMITS[k].low, high: NPK_LIMITS[k].high })}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
          <button type="button" className="btn-ghost text-sm mt-3" onClick={() => setSoil({ N: '240', P: '30', K: '120' })}>
            <Beaker size={16} aria-hidden /> {t('cm.npk.sample')}
          </button>
        </div>

        {/* Results */}
        <div className="min-w-0 rounded-3xl bg-forest-700 text-cream-50 p-4 md:p-5 flex flex-col">
          <h3 className="font-extrabold text-lg flex items-center gap-2"><Sprout size={20} className="text-earth-400" aria-hidden /> {t('cm.npk.result')}</h3>
          <p className="text-xs text-cream-200 mt-1">
            {t('cm.npk.rdf', { n: rdf.N, p: rdf.P, k: rdf.K })}
          </p>
          {plan ? (
            <>
              <div className="mt-4 grid grid-cols-3 gap-2">
                {plan.products.map((p) => (
                  <div key={p.id} className="rounded-2xl bg-white/10 p-3 text-center min-w-0">
                    <p className="text-xs font-semibold text-cream-200 truncate">{t(`cm.fert.${p.id}`)}</p>
                    <p className="text-3xl font-extrabold leading-tight mt-1">{fmt(p.bags, p.bags % 1 ? 1 : 0)}</p>
                    <p className="text-[11px] text-cream-200">{t('cm.npk.bags', { kg: p.bagKg })}</p>
                    <p className="text-[11px] text-cream-300/80 mt-0.5">≈ {fmt(p.kg)} kg</p>
                  </div>
                ))}
              </div>
              <p className="text-xs text-cream-200 mt-3">
                {t('cm.npk.need', { n: fmt(plan.need.N), p: fmt(plan.need.P), k: fmt(plan.need.K), a: fmt(area, area % 1 ? 1 : 0) })}
              </p>
              <ul className="mt-3 space-y-1.5 text-sm text-cream-100">
                <li className="flex gap-2"><Info size={16} className="shrink-0 mt-0.5 text-earth-400" aria-hidden />{t('cm.npk.tipSplit')}</li>
                <li className="flex gap-2"><Info size={16} className="shrink-0 mt-0.5 text-earth-400" aria-hidden />{t('cm.npk.tipFym')}</li>
              </ul>
            </>
          ) : (
            <p className="mt-6 text-cream-200 text-sm">{t('cm.npk.empty')}</p>
          )}
          <p className="text-[11px] text-cream-300/80 mt-auto pt-4">{t('cm.npk.source')}</p>
        </div>
      </div>
    </section>
  );
}
