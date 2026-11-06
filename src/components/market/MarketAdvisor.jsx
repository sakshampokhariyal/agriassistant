import { Archive, Factory, Landmark, ShoppingCart, TrendingDown, TrendingUp, Minus, Info } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { marketCrops, median } from '../../data/markets';
import { MARKET_SEASONS, PHASE_TREND, observedTrend, seasonPhase } from '../../data/marketSeasons';
import { cachedPrices } from '../../services/agmarknet';
import { fmtDate, fmtNum, toISO } from '../../utils/date';
import { localeOf } from '../../translations';

const SIGNAL = {
  sell: { Icon: ShoppingCart, cls: 'bg-brand-gold text-forest-900' },
  hold: { Icon: Archive, cls: 'bg-forest-700 text-cream-50' },
  msp: { Icon: Landmark, cls: 'bg-navy-700 text-white' },
  mill: { Icon: Factory, cls: 'bg-navy-700 text-white' },
};
const TREND = {
  up: { Icon: TrendingUp, cls: 'text-forest-700' },
  down: { Icon: TrendingDown, cls: 'text-clay-600' },
  peak: { Icon: Minus, cls: 'text-earth-700' },
};

/**
 * Hold vs Sell recommendation for one crop: where the market is in its yearly arrival cycle,
 * today's live (or last saved) mandi price, the MSP and whether the crop stores well.
 * Works offline: the seasonal calendar is local and the price falls back to the last saved one.
 */
export function adviseCrop(cropId, live, month) {
  const s = MARKET_SEASONS[cropId];
  const c = marketCrops[cropId];
  if (!s || !c) return null;

  // Price: live rows for this crop, else the last saved Agmarknet load.
  let rows = live?.cropId === cropId ? live.rows || [] : [];
  let savedAt = live?.cropId === cropId && live.source === 'cache' ? live.fetchedAt : null;
  if (!rows.length) {
    const cached = cachedPrices(cropId);
    if (cached?.rows?.length) {
      rows = cached.rows;
      savedAt = cached.at;
    }
  }
  const price = rows.length ? median(rows.map((r) => r.modal)) : null;

  const phase = seasonPhase(cropId, month);
  let signal;
  let reason;
  if (s.storage === 'none') [signal, reason] = ['sell', 'perishable'];
  else if (s.storage === 'mill') [signal, reason] = ['mill', 'mill'];
  else if (c.msp && price && price < c.msp && (phase === 'arrivals' || phase === 'preArrival')) [signal, reason] = ['msp', 'belowMsp'];
  else if (phase === 'arrivals') [signal, reason] = ['hold', 'arrivals'];
  else if (phase === 'recovery') [signal, reason] = ['hold', 'recovery'];
  else if (phase === 'lean') [signal, reason] = ['sell', 'lean'];
  else [signal, reason] = ['sell', 'preArrival'];

  return {
    cropId,
    signal,
    reason,
    phase,
    trend: phase ? PHASE_TREND[phase] : null,
    price,
    n: rows.length,
    savedAt,
    msp: c.msp,
    season: s,
    observed: observedTrend(cropId),
  };
}

export default function MarketAdvisor({ cropId, live }) {
  const { t, L, lang, crops } = useApp();
  const month = new Date().getMonth() + 1;
  const a = adviseCrop(cropId, live, month);
  const mine = [...new Set(crops.map((c) => c.cropId))].filter((id) => id !== cropId && MARKET_SEASONS[id]);
  if (!a) return null;

  const crop = L(marketCrops[cropId].name);
  const S = SIGNAL[a.signal];
  const T = a.trend ? TREND[a.trend] : null;
  const monthName = (m) => new Intl.DateTimeFormat(localeOf(lang), { month: 'short' }).format(new Date(2024, m - 1, 1));
  const span = (ms) => (ms.length ? `${monthName(ms[0])}–${monthName(ms[ms.length - 1])}` : '');

  return (
    <section className="card p-5 h-full flex flex-col" aria-labelledby="mk-adv">
      <h2 id="mk-adv" className="h-section">{t('adv.title')}</h2>
      <p className="text-sm text-forest-600 -mt-0.5 mb-3">{t('adv.sub', { crop })}</p>

      <div className="flex flex-wrap items-center gap-2">
        <span className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-bold ${S.cls}`}>
          <S.Icon size={16} aria-hidden /> {t(`adv.sig.${a.signal}`)}
        </span>
        {T && (
          <span className={`inline-flex items-center gap-1 text-sm font-semibold ${T.cls}`}>
            <T.Icon size={16} aria-hidden /> {t(`adv.trend.${a.trend}`)}
          </span>
        )}
      </div>

      <div className="mt-3 space-y-2 text-sm text-forest-800">
        {a.price ? (
          <p>
            {t('adv.price', { crop, price: fmtNum(a.price, lang), n: a.n })}
            {a.savedAt ? ` ${t('adv.savedOn', { date: fmtDate(toISO(new Date(a.savedAt)), lang) })}` : ''}
          </p>
        ) : (
          <p className="text-forest-600">{t('adv.noPrice')}</p>
        )}
        <p>{t(`adv.why.${a.reason}`, { msp: a.msp ? fmtNum(a.msp, lang) : '', arrivals: span(a.season.arrivals), lean: span(a.season.lean) })}</p>
        {a.signal === 'hold' && a.season.moisture && <p className="rounded-xl bg-forest-50 px-3 py-2">{t(`adv.store.${a.season.kind}`, { m: a.season.moisture })}</p>}
        {a.observed && (
          <p className="text-forest-700">
            {t(a.observed.pct >= 0 ? 'adv.observed.up' : 'adv.observed.down', { pct: Math.abs(a.observed.pct).toFixed(1), days: a.observed.days })}
          </p>
        )}
      </div>

      {a.season.arrivals.length > 0 && (
        <dl className="mt-3 grid grid-cols-2 gap-2 text-xs">
          <div className="rounded-xl bg-cream-100 p-2.5">
            <dt className="text-forest-600">{t('adv.arrivals')}</dt>
            <dd className="font-semibold text-forest-900">{span(a.season.arrivals)}</dd>
          </div>
          <div className="rounded-xl bg-cream-100 p-2.5">
            <dt className="text-forest-600">{t('adv.leanMonths')}</dt>
            <dd className="font-semibold text-forest-900">{span(a.season.lean)}</dd>
          </div>
        </dl>
      )}

      {mine.length > 0 && (
        <div className="mt-4 border-t border-black/[0.06] pt-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-forest-600 mb-2">{t('adv.yours')}</p>
          <ul className="space-y-1.5">
            {mine.map((id) => {
              const x = adviseCrop(id, live, month);
              const X = SIGNAL[x.signal];
              return (
                <li key={id} className="flex items-center justify-between gap-2 text-sm">
                  <span className="text-forest-800 truncate">{L(marketCrops[id].name)}</span>
                  <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold shrink-0 ${X.cls}`}>
                    <X.Icon size={12} aria-hidden /> {t(`adv.sig.${x.signal}`)}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <p className="text-[11px] text-forest-600/80 mt-auto pt-3 flex gap-1.5"><Info size={13} className="shrink-0 mt-0.5" /> {t('adv.note')}</p>
    </section>
  );
}
