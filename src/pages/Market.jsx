import { useEffect, useMemo, useState } from 'react';
import { Landmark, ShoppingCart, TrendingUp } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { marketCrops, median } from '../data/markets';
import { fmtNum } from '../utils/date';
import { PageHeader } from '../components/ui';
import MspTable from '../components/market/MspTracker';
import SellCalculator from '../components/market/SellCalculator';
import LivePrices from '../components/market/LivePrices';
import MarketAdvisor from '../components/market/MarketAdvisor';
import { recordPrice } from '../data/marketSeasons';

/**
 * Mandi prices: everything on this page is either live Agmarknet data (data.gov.in) or the
 * officially announced MSP. The crops the farmer actually grows are listed first.
 */
export default function Market() {
  const { t, L, crops, today } = useApp();
  const mine = useMemo(() => [...new Set(crops.map((c) => c.cropId))].filter((id) => marketCrops[id]), [crops]);
  const order = useMemo(() => [...mine, ...Object.keys(marketCrops).filter((id) => !mine.includes(id))], [mine]);
  const [crop, setCrop] = useState(() => mine[0] || 'ragi');
  const [live, setLive] = useState(null);

  // Each live load adds today's median price to the local history used for the observed trend.
  useEffect(() => {
    if (live?.source === 'live' && live.rows?.length) recordPrice(live.cropId, today, median(live.rows.map((r) => r.modal)));
  }, [live, today]);

  return (
    <div>
      <PageHeader title={t('market.title')} subtitle={t('mk.sub.live')} />

      <div className="flex flex-wrap gap-2 mb-4" role="tablist" aria-label={t('market.crop')}>
        {order.map((id) => (
          <button key={id} role="tab" aria-selected={crop === id} onClick={() => setCrop(id)} className={`chip ${crop === id ? 'chip-on' : 'chip-off'}`}>
            {L(marketCrops[id].name)}
            {mine.includes(id) && <span className="ml-1 text-[10px] font-semibold opacity-70">· {t('mk.mine')}</span>}
          </button>
        ))}
      </div>

      <PriceSummary cropId={crop} live={live} />

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_22rem] gap-5 mb-5 items-start">
        <div className="min-w-0"><LivePrices cropId={crop} onRows={setLive} /></div>
        <MarketAdvisor cropId={crop} live={live} />
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        <SellCalculator cropId={crop} live={live} />
        <MspTable selected={crop} onPick={setCrop} />
      </div>
    </div>
  );
}

/** What the live numbers say for the selected crop: typical price, range and MSP comparison. */
function PriceSummary({ cropId, live }) {
  const { t, L, lang } = useApp();
  const c = marketCrops[cropId];
  const rows = live?.cropId === cropId ? live.rows || [] : [];
  if (!rows.length) return null;

  const typical = median(rows.map((r) => r.modal));
  const high = rows[0];
  const low = rows[rows.length - 1];
  const below = c.msp ? rows.filter((r) => r.modal < c.msp).length : 0;
  const advice = !c.msp ? 'noMsp' : typical < c.msp ? 'belowMsp' : below > 0 ? 'someBelow' : 'aboveMsp';
  const Icon = advice === 'belowMsp' ? Landmark : advice === 'noMsp' ? TrendingUp : ShoppingCart;

  return (
    <section className="rounded-3xl bg-forest-700 text-cream-50 p-5 md:p-6 shadow-lift mb-5">
      <div className="flex items-start gap-4">
        <span className="h-12 w-12 rounded-2xl bg-white/15 grid place-items-center shrink-0"><Icon size={24} className="text-earth-400" /></span>
        <div className="min-w-0 flex-1">
          <h2 className="text-xl font-extrabold">
            {t('mk.sum.title', { crop: L(c.name) })}
            {live.source === 'sample' && <span className="ml-2 align-middle inline-block rounded-full bg-earth-400 text-forest-900 text-xs font-bold px-2.5 py-0.5">{t('mk.sample.tag')}</span>}
          </h2>
          <p className="mt-1 text-cream-100">
            {t(`mk.sum.${advice}`, {
              msp: c.msp ? fmtNum(c.msp, lang) : '',
              n: below,
              total: rows.length,
              market: high.market,
              price: fmtNum(high.modal, lang),
            })}
          </p>
        </div>
      </div>
      <dl className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4 text-sm">
        <Stat label={t('mk.sum.typical')} value={`₹${fmtNum(typical, lang)}`} />
        <Stat label={t('mk.sum.high')} value={`₹${fmtNum(high.modal, lang)}`} sub={high.market} />
        <Stat label={t('mk.sum.low')} value={`₹${fmtNum(low.modal, lang)}`} sub={low.market} />
        <Stat label={c.msp ? `${t('market.msp')} ${c.mspSeason}` : t('market.msp')} value={c.msp ? `₹${fmtNum(c.msp, lang)}` : t('mk.noMsp')} />
      </dl>
      <p className="text-xs text-cream-200 mt-3">{live.source === 'sample' ? t('mk.sample.basis', { n: rows.length }) : t('mk.sum.basis', { n: rows.length })} · {t('market.perQ')}</p>
    </section>
  );
}

function Stat({ label, value, sub }) {
  return (
    <div className="rounded-2xl bg-white/10 p-3 min-w-0">
      <dt className="text-xs text-cream-200">{label}</dt>
      <dd className="text-lg font-bold">{value}</dd>
      {sub && <dd className="text-[11px] text-cream-200 truncate">{sub}</dd>}
    </div>
  );
}
