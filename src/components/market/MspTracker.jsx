import { ArrowDownRight, ArrowUpRight, Hourglass, Minus, ShoppingCart, Landmark } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { getSeries, marketCrops } from '../../data/markets';
import { fmtNum } from '../../utils/date';
import { SectionTitle } from '../ui';

/**
 * Mandi price vs MSP with a simple, explainable signal:
 *  – below MSP            → sell at a government procurement centre (MSP)
 *  – rising > 0.5% / week → wait
 *  – perishable / flat    → sell now
 */
export function priceSignal(cropId) {
  const c = marketCrops[cropId];
  const s = getSeries(cropId, 'mandya', 14);
  const now = s[s.length - 1].modal;
  const weekAgo = s[s.length - 8].modal;
  const trendPct = ((now - weekAgo) / weekAgo) * 100;
  const vsMsp = c.msp ? ((now - c.msp) / c.msp) * 100 : null;
  let signal;
  if (c.msp && now < c.msp) signal = 'msp';
  else if (cropId === 'tomato') signal = 'sell';
  else if (trendPct > 0.5) signal = 'wait';
  else signal = 'sell';
  return { now, weekAgo, trendPct, vsMsp, msp: c.msp, signal };
}

const SIGNAL = {
  sell: { cls: 'bg-emerald-600 text-white', Icon: ShoppingCart },
  wait: { cls: 'bg-amber-400 text-amber-950', Icon: Hourglass },
  msp: { cls: 'bg-sky-600 text-white', Icon: Landmark },
};

export default function MspTracker({ onPick }) {
  const { t, L, lang } = useApp();
  return (
    <section className="card p-5">
      <SectionTitle>{t('mk.tracker')}</SectionTitle>
      <p className="text-sm text-forest-600 -mt-2 mb-3">{t('mk.trackerSub')}</p>
      <ul className="divide-y divide-black/[0.06]">
        {Object.keys(marketCrops).map((id) => {
          const p = priceSignal(id);
          const S = SIGNAL[p.signal];
          const TrendIcon = p.trendPct > 0.2 ? ArrowUpRight : p.trendPct < -0.2 ? ArrowDownRight : Minus;
          return (
            <li key={id}>
              <button onClick={() => onPick?.(id)} className="w-full text-left py-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 hover:bg-cream-100/60 rounded-lg px-1">
                <span className="font-semibold text-forest-900 w-24">{L(marketCrops[id].name)}</span>
                <span className="text-forest-900">₹{fmtNum(p.now, lang)}</span>
                <span className={`inline-flex items-center text-xs font-medium ${p.trendPct >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                  <TrendIcon size={14} /> {p.trendPct >= 0 ? '+' : ''}{p.trendPct.toFixed(1)}% {t('mk.week')}
                </span>
                <span className="text-xs text-forest-600 flex-1 min-w-[8rem]">
                  {p.msp ? (
                    <>
                      {t('market.msp')} ₹{fmtNum(p.msp, lang)} ·{' '}
                      <b className={p.vsMsp >= 0 ? 'text-emerald-700' : 'text-red-700'}>{p.vsMsp >= 0 ? '+' : ''}{p.vsMsp.toFixed(1)}%</b>
                    </>
                  ) : (
                    t('mk.noMsp')
                  )}
                </span>
                <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${S.cls}`}>
                  <S.Icon size={13} /> {t(`mk.sig.${p.signal}`)}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
      <p className="text-xs text-forest-600/80 mt-2">{t('mk.signalNote')}</p>
    </section>
  );
}
