import { useCallback, useEffect, useRef, useState } from 'react';
import { BadgeCheck, CloudOff, ExternalLink, RefreshCw, Trophy } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { AGMARKNET_PAGE, fetchMandiPrices } from '../../services/agmarknet';
import { marketCrops } from '../../data/markets';
import { fmtNum, fmtStamp } from '../../utils/date';
import { SectionTitle, Skeleton } from '../ui';

const ERR = { timeout: 'timeout', rate_limited: 'rate', no_records: 'empty', network: 'network' };
const errKey = (e) => (e?.startsWith('http_') ? 'server' : ERR[e] || 'network');

/** Live Agmarknet mandi prices for the selected crop, with MSP comparison and safe fallbacks. */
export default function LivePrices({ cropId, onRows }) {
  const { t, L, lang, dataSaver } = useApp();
  const [state, setState] = useState({ loading: true, result: null });
  const req = useRef(0);

  const load = useCallback(
    async (force = false) => {
      const id = ++req.current;
      setState((s) => ({ loading: true, result: s.result }));
      const result = await fetchMandiPrices(cropId, { preferCache: dataSaver && !force });
      if (id !== req.current) return; // a newer request (crop changed) won
      setState({ loading: false, result });
      onRows?.({ ...result, cropId });
    },
    [cropId, dataSaver, onRows]
  );

  useEffect(() => {
    load();
  }, [load]);

  const r = state.result;
  const msp = marketCrops[cropId]?.msp;
  const time = (ms) => fmtStamp(ms, lang);
  const best = r?.rows?.[0];

  return (
    <section className="card p-5" aria-live="polite">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <SectionTitle>{t('mk.live.title')} · {L(marketCrops[cropId].name)}</SectionTitle>
          <div className="-mt-2 flex flex-wrap items-center gap-2 text-xs">
            {state.loading && !r ? (
              <span className="text-forest-600 inline-flex items-center gap-1"><RefreshCw size={13} className="animate-spin" /> {t('mk.live.loading')}</span>
            ) : r?.source === 'live' ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 text-emerald-800 px-2.5 py-1 font-semibold">
                <BadgeCheck size={13} /> {t('mk.live.badge')} · {r.scope === 'India' ? t('mk.live.india') : 'Karnataka'} · {time(r.fetchedAt)}
              </span>
            ) : r?.source === 'cache' ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 text-amber-800 px-2.5 py-1 font-semibold">
                <CloudOff size={13} /> {t('mk.live.cached', { time: time(r.fetchedAt) })}
              </span>
            ) : r?.source === 'sample' ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 text-amber-900 px-2.5 py-1 font-semibold">
                <CloudOff size={13} /> {t('mk.sample.badge')}
              </span>
            ) : null}
            {r?.error && r.source !== 'live' && r.source !== 'sample' && <span className="text-forest-600">{t(`mk.err.${errKey(r.error)}`)}</span>}
          </div>
        </div>
        <button className="btn-ghost !min-h-[40px] text-sm" onClick={() => load(true)} disabled={state.loading}>
          <RefreshCw size={16} className={state.loading ? 'animate-spin' : ''} /> {t('wx.refresh')}
        </button>
      </div>

      {state.loading && !r ? (
        <div className="space-y-2 mt-4">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-12" />)}</div>
      ) : r && !r.rows.length ? (
        <div className="mt-4 rounded-2xl bg-cream-100 p-4 text-sm text-forest-700 flex gap-2">
          <CloudOff size={18} className="shrink-0 text-forest-500" />
          <span>{t(r.error === 'no_records' ? 'mk.live.noRecords' : 'mk.live.unavailable')}</span>
        </div>
      ) : r ? (
        <>
          {best && (
            <div className="mt-4 rounded-2xl bg-emerald-50 p-3 flex flex-wrap items-center gap-3">
              <Trophy size={18} className="text-emerald-700" />
              <span className="text-sm text-forest-800 flex-1 min-w-[12rem]">
                {t('mk.live.best')}: <b>{best.market}</b>{best.district ? `, ${best.district}` : ''}
              </span>
              <span className="text-xl font-semibold text-forest-900">₹{fmtNum(best.modal, lang)}</span>
            </div>
          )}

          <div className="mt-3 hidden md:grid grid-cols-[1.6fr_1fr_0.8fr_0.8fr_0.9fr_0.9fr] gap-3 px-2 text-xs font-semibold text-forest-600 uppercase tracking-wide">
            <span>{t('market.mandi')}</span><span>{t('mk.live.variety')}</span><span>{t('market.min')}</span><span>{t('market.max')}</span><span>{t('market.modal')}</span><span>{t('market.vsMsp')}</span>
          </div>
          <ul className="mt-1 divide-y divide-black/[0.06] max-h-[26rem] overflow-y-auto">
            {r.rows.slice(0, 40).map((row) => {
              const diff = msp ? ((row.modal - msp) / msp) * 100 : null;
              return (
                <li key={row.id} className="grid grid-cols-2 md:grid-cols-[1.6fr_1fr_0.8fr_0.8fr_0.9fr_0.9fr] gap-x-3 gap-y-1 py-2.5 px-2 text-sm">
                  <span className="col-span-2 md:col-span-1 min-w-0">
                    <b className="text-forest-900">{row.market}</b>
                    <span className="block text-xs text-forest-600">{[row.district, row.state].filter(Boolean).join(', ')}{row.date ? ` · ${row.date}` : ''}</span>
                  </span>
                  <span className="text-forest-700 truncate">{row.variety || '—'}</span>
                  <span className="text-forest-700"><span className="md:hidden text-xs text-forest-500">{t('market.min')} </span>₹{fmtNum(row.min, lang)}</span>
                  <span className="text-forest-700"><span className="md:hidden text-xs text-forest-500">{t('market.max')} </span>₹{fmtNum(row.max, lang)}</span>
                  <span className="font-semibold text-forest-900"><span className="md:hidden text-xs font-normal text-forest-500">{t('market.modal')} </span>₹{fmtNum(row.modal, lang)}</span>
                  <span className={diff == null ? 'text-forest-500' : diff >= 0 ? 'text-emerald-700 font-medium' : 'text-red-700 font-medium'}>
                    {diff == null ? t('mk.noMsp') : `${diff >= 0 ? '+' : ''}${diff.toFixed(1)}%`}
                  </span>
                </li>
              );
            })}
          </ul>
          <p className="text-xs text-forest-600/80 mt-3 flex flex-wrap items-center gap-x-2">
            <span>{r.source === 'sample' ? t('mk.sample.note') : t('mk.live.note')}</span>
            {msp && <span>{t('market.msp')} {marketCrops[cropId].mspSeason}: ₹{fmtNum(msp, lang)}</span>}
            <a href={AGMARKNET_PAGE} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-emerald-700 underline">
              data.gov.in <ExternalLink size={12} />
            </a>
          </p>
        </>
      ) : null}
    </section>
  );
}
