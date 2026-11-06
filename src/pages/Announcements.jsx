import { useCallback, useEffect, useRef, useState } from 'react';
import { fmtStamp } from '../utils/date';
import { AlertTriangle, CloudOff, ExternalLink, Info, Newspaper, RefreshCw } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { NEWSDATA_URL, fetchAgriNews } from '../services/news';
import { PageHeader, Skeleton } from '../components/ui';

/** Announcements: live agriculture news from Indian publishers (newsdata.io). */
export default function Announcements() {
  return (
    <div className="max-w-4xl">
      <NewsFeed />
    </div>
  );
}

const NEWS_ERR = { not_configured: 'news.err.config', key: 'news.err.key', rate: 'news.err.rate', empty: 'news.err.empty', timeout: 'mk.err.timeout', server: 'mk.err.server', network: 'mk.err.network' };
const newsErr = (e) => NEWS_ERR[e] || 'mk.err.network';

/** Live agriculture headlines from Indian news sources, in the app language. */
function NewsFeed() {
  const { t, lang, dataSaver } = useApp();
  const [state, setState] = useState({ loading: true, result: null, error: null });
  const req = useRef(0);

  const load = useCallback(
    async (force = false) => {
      const id = ++req.current;
      setState((s) => ({ ...s, loading: true, error: null }));
      try {
        const result = await fetchAgriNews(lang, { force });
        if (id === req.current) setState({ loading: false, result, error: null });
      } catch (e) {
        if (id === req.current) setState({ loading: false, result: null, error: e.message });
      }
    },
    [lang]
  );

  useEffect(() => {
    load();
  }, [load]);

  const { loading, result, error } = state;
  const locale = lang === 'en' ? 'en-IN' : `${lang}-IN`;
  const time = (ms) => fmtStamp(ms, lang);
  const ago = (ms) => {
    const mins = Math.round((ms - Date.now()) / 60000);
    const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
    if (Math.abs(mins) < 60) return rtf.format(mins, 'minute');
    if (Math.abs(mins) < 48 * 60) return rtf.format(Math.round(mins / 60), 'hour');
    return rtf.format(Math.round(mins / 1440), 'day');
  };

  return (
    <div>
      <PageHeader
        title={t('news.title')}
        subtitle={t('news.sub')}
        action={
          <button className="btn-ghost" onClick={() => load(true)} disabled={loading}>
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} /> {t('wx.refresh')}
          </button>
        }
      />

      <div className="flex flex-wrap items-center gap-3 rounded-2xl bg-forest-800 text-white p-4 mb-4">
        <span className="h-10 w-10 rounded-xl bg-white/15 grid place-items-center shrink-0"><Newspaper size={20} className="text-brand-gold-light" /></span>
        <div className="flex-1 min-w-[14rem] text-sm">
          <div className="font-semibold">{t('news.source')}</div>
          <div className="text-white/75">
            {result?.source === 'live' && t('ann.fetched', { time: time(result.fetchedAt) })}
            {result?.source === 'cache' && t('ann.cached', { time: time(result.fetchedAt) })}
            {!result && (loading ? t('mk.live.loading') : '')}
          </div>
        </div>
        <a href={NEWSDATA_URL} target="_blank" rel="noopener noreferrer" className="btn bg-white/15 text-white hover:bg-white/25 !min-h-[40px] text-sm">
          newsdata.io <ExternalLink size={14} />
        </a>
      </div>

      {result?.source === 'cache' && (
        <p className="mb-4 flex items-center gap-2 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 p-3 text-sm">
          <CloudOff size={16} className="shrink-0" /> {t('news.cachedNote')} ({t(newsErr(result.error))})
        </p>
      )}

      {loading && !result ? (
        <div className="space-y-3">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-28" />)}</div>
      ) : error && !result ? (
        <div className="card p-8 text-center">
          <AlertTriangle size={32} className="mx-auto text-clay-600" />
          <p className="mt-2 text-forest-800">{t('news.error')}</p>
          <p className="text-sm text-forest-600 mt-1">{t(newsErr(error))}</p>
          <button className="btn-primary mt-4" onClick={() => load(true)}><RefreshCw size={16} /> {t('wx.retry')}</button>
        </div>
      ) : (
        <ul className="space-y-3">
          {result.items.map((it) => (
            <li key={it.id} className="card p-4 md:p-5 flex gap-4 min-w-0">
              {it.image && !dataSaver && (
                <img
                  src={it.image}
                  alt=""
                  loading="lazy"
                  referrerPolicy="no-referrer"
                  className="hidden sm:block h-24 w-32 rounded-xl object-cover shrink-0 bg-cream-100"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              )}
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2 text-xs text-forest-600">
                  <span className="inline-flex items-center gap-1 rounded-full bg-navy-100 text-navy-500 px-2.5 py-1 font-semibold">
                    <Newspaper size={13} /> {it.source}
                  </span>
                  {it.pubDate && <span title={time(it.pubDate)}>{ago(it.pubDate)}</span>}
                </div>
                <h3 className="font-semibold text-forest-900 text-lg leading-snug mt-2">{it.title}</h3>
                {it.description && <p className="text-sm text-forest-700 mt-1">{it.description}</p>}
                <a href={it.link} target="_blank" rel="noopener noreferrer" className="mt-1 inline-flex items-center gap-1 text-sm font-medium text-emerald-700 hover:text-emerald-600 min-h-[40px]">
                  {t('news.read')} <ExternalLink size={14} />
                </a>
              </div>
            </li>
          ))}
        </ul>
      )}
      <p className="text-xs text-forest-600/80 mt-6 flex gap-1.5"><Info size={14} className="shrink-0 mt-0.5" /> {t('news.disclaimer')}</p>
    </div>
  );
}
