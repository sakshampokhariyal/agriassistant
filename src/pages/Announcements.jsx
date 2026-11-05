import { useCallback, useEffect, useRef, useState } from 'react';
import { AlertTriangle, BadgeCheck, CloudOff, ExternalLink, Landmark, Megaphone, RefreshCw, Sprout } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { PIB_FEED_URL, fetchPibFeed } from '../services/pib';
import { EmptyState, PageHeader, Skeleton } from '../components/ui';

const ERR = { timeout: 'timeout', no_records: 'empty', bad_xml: 'server', network: 'network' };
const errKey = (e) => (e?.startsWith('http_') ? 'server' : ERR[e] || 'network');

/** Official announcements from the Press Information Bureau RSS feed. */
export default function Announcements() {
  const { t, lang } = useApp();
  const [state, setState] = useState({ loading: true, result: null, error: null });
  const [chosenScope, setScope] = useState(null); // agri | all (null = automatic)
  const req = useRef(0);

  const load = useCallback(async () => {
    const id = ++req.current;
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const result = await fetchPibFeed();
      if (id === req.current) setState({ loading: false, result, error: null });
    } catch (e) {
      if (id === req.current) setState({ loading: false, result: null, error: e.message });
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const { loading, result, error } = state;
  const agriCount = result ? result.items.filter((i) => i.agri).length : 0;
  // Automatic: agriculture first; if PIB has none right now, show all latest releases.
  const scope = chosenScope || (result && agriCount === 0 ? 'all' : 'agri');
  const autoAll = !chosenScope && result && agriCount === 0;
  const items = result ? result.items.filter((i) => scope === 'all' || i.agri) : [];
  const time = (ms) => new Date(ms).toLocaleString(lang === 'en' ? 'en-IN' : `${lang}-IN`, { dateStyle: 'medium', timeStyle: 'short' });

  return (
    <div className="max-w-4xl">
      <PageHeader
        title={t('ann.title')}
        subtitle={t('ann.subLive')}
        action={
          <button className="btn-ghost" onClick={load} disabled={loading}>
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} /> {t('wx.refresh')}
          </button>
        }
      />

      {/* Source banner */}
      <div className="flex flex-wrap items-center gap-3 rounded-2xl bg-forest-800 text-white p-4 mb-4">
        <span className="h-10 w-10 rounded-xl bg-white/15 grid place-items-center shrink-0"><Landmark size={20} className="text-yellow-300" /></span>
        <div className="flex-1 min-w-[14rem] text-sm">
          <div className="font-semibold">{t('ann.source')}</div>
          <div className="text-white/75">
            {result?.source === 'live' && t('ann.fetched', { time: time(result.fetchedAt) })}
            {result?.source === 'cache' && t('ann.cached', { time: time(result.fetchedAt) })}
            {!result && (loading ? t('mk.live.loading') : '')}
          </div>
        </div>
        <a href={PIB_FEED_URL} target="_blank" rel="noopener noreferrer" className="btn bg-white/15 text-white hover:bg-white/25 !min-h-[40px] text-sm">
          pib.gov.in <ExternalLink size={14} />
        </a>
      </div>

      {result?.source === 'cache' && (
        <p className="mb-4 flex items-center gap-2 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 p-3 text-sm">
          <CloudOff size={16} /> {t('ann.cachedNote')} {result.error && `(${t(`mk.err.${errKey(result.error)}`)})`}
        </p>
      )}

      <div className="flex gap-2 mb-4" role="tablist">
        {[
          ['agri', Sprout, `${t('ann.agriOnly')}${result ? ` · ${agriCount}` : ''}`],
          ['all', Megaphone, `${t('ann.allPib')}${result ? ` · ${result.items.length}` : ''}`],
        ].map(([id, Icon, label]) => (
          <button key={id} role="tab" aria-selected={scope === id} onClick={() => setScope(id)} className={`chip !min-h-[44px] ${scope === id ? 'chip-on' : 'chip-off'}`}>
            <Icon size={16} /> {label}
          </button>
        ))}
      </div>

      {autoAll && <p className="mb-4 text-sm text-forest-700 rounded-2xl bg-cream-100 p-3">{t('ann.autoAll')}</p>}

      {loading && !result ? (
        <div className="space-y-3">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-24" />)}</div>
      ) : error && !result ? (
        <div className="card p-8 text-center">
          <AlertTriangle size={32} className="mx-auto text-clay-600" />
          <p className="mt-2 text-forest-800">{t('ann.error')}</p>
          <p className="text-sm text-forest-600 mt-1">{t(`mk.err.${errKey(error)}`)}</p>
          <div className="flex flex-wrap justify-center gap-2 mt-4">
            <button className="btn-primary" onClick={load}><RefreshCw size={16} /> {t('wx.retry')}</button>
            <a className="btn-ghost" href={PIB_FEED_URL} target="_blank" rel="noopener noreferrer">pib.gov.in <ExternalLink size={14} /></a>
          </div>
        </div>
      ) : items.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={Megaphone}
            text={t('ann.noAgri')}
            action={<button className="btn-soft" onClick={() => setScope('all')}>{t('ann.allPib')}</button>}
          />
        </div>
      ) : (
        <ul className="space-y-3">
          {items.map((it) => (
            <li key={it.id} className="card p-4 md:p-5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 text-emerald-800 px-2.5 py-1 text-xs font-semibold">
                  <BadgeCheck size={13} /> {t('ann.tagPib')}
                </span>
                {it.dept && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 text-amber-900 px-2.5 py-1 text-xs font-semibold">
                    <Sprout size={13} /> {t('ann.tagDept')}
                  </span>
                )}
                {!it.dept && it.agri && <span className="rounded-full bg-cream-200 text-forest-800 px-2.5 py-1 text-xs font-medium">{t('ann.tagAgri')}</span>}
                <span className="text-xs text-forest-600">
                  {it.pubDate ? time(it.pubDate) : it.prid ? `PRID ${it.prid}` : ''}
                </span>
              </div>
              <h3 className="font-semibold text-forest-900 text-lg leading-snug mt-2">{it.title}</h3>
              {it.link && (
                <a href={it.link} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-emerald-700 hover:text-emerald-600 min-h-[40px]">
                  {t('ann.read')} <ExternalLink size={14} />
                </a>
              )}
            </li>
          ))}
        </ul>
      )}
      <p className="text-xs text-forest-600/80 mt-6">{t('ann.langNote')}</p>
    </div>
  );
}
