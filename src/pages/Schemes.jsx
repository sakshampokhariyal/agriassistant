import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { BadgeCheck, BellPlus, ExternalLink, Globe, IndianRupee, Landmark, Search, ShieldCheck, X } from 'lucide-react';
import { useApp } from '../context/AppContext';
import useCropViews from '../hooks/useCropViews';
import { isRelevant, portalHost, schemeCategories, schemes } from '../data/schemes';
import { addDays } from '../utils/date';
import { Badge, EmptyState, PageHeader } from '../components/ui';
import Modal from '../components/Modal';

/** The explicit outbound link to a scheme's official registration page. */
function RegisterButton({ s, className = '' }) {
  const { t } = useApp();
  return (
    <a
      href={s.portal.url}
      target="_blank"
      rel="noopener noreferrer"
      className={`btn-primary !px-4 text-sm text-center leading-tight ${className}`}
      onClick={(e) => e.stopPropagation()}
    >
      <span>{t('schemes.register', { portal: s.portal.name })}</span>
      <ExternalLink size={16} className="shrink-0" aria-hidden />
    </a>
  );
}

export default function Schemes() {
  const { t, L, profile, tasks, addTask, toast } = useApp();
  const crops = useCropViews();
  const [cat, setCat] = useState('all');
  const [query, setQuery] = useState('');
  const [openId, setOpenId] = useState(null);
  const [params, setParams] = useSearchParams();

  useEffect(() => {
    const o = params.get('open');
    if (o) {
      setOpenId(o);
      setParams({}, { replace: true });
    }
  }, [params, setParams]);

  const relevant = (s) => isRelevant(s, profile, crops);

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return schemes
      .filter((s) => (cat === 'all' ? true : cat === 'forYou' ? relevant(s) : s.category === cat))
      .filter((s) => !q || s.name.toLowerCase().includes(q) || L(s.benefit).toLowerCase().includes(q) || s.portal.name.toLowerCase().includes(q))
      // Schemes flagged `last` always sit at the bottom; otherwise relevant ones first.
      .sort((a, b) => Number(!!a.last) - Number(!!b.last) || Number(relevant(b)) - Number(relevant(a)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cat, query, profile, crops, L]);

  const open = schemes.find((s) => s.id === openId);

  const remind = (s) => {
    const id = `sch-${s.id}`;
    if (!tasks.some((x) => x.id === id)) {
      addTask({
        id,
        title: {
          en: `Register for ${s.name} on ${s.portal.name}`,
          hi: `${s.portal.name} पर ${s.name} के लिए पंजीकरण करें`,
          kn: `${s.portal.name} ನಲ್ಲಿ ${s.name} ಗೆ ನೋಂದಾಯಿಸಿ`,
        },
        date: addDays(3),
        category: 'other',
      });
    }
    toast(t('schemes.reminderAdded'));
  };

  const chips = ['all', 'forYou', ...schemeCategories];

  return (
    <div>
      <PageHeader title={t('schemes.title')} subtitle={t('schemes.sub')} />

      <div className="flex items-start gap-3 rounded-2xl bg-emerald-50 border border-emerald-100 p-4 mb-5 text-forest-800">
        <ShieldCheck size={20} className="text-emerald-700 shrink-0 mt-0.5" aria-hidden />
        <p className="text-sm">
          {t('schemes.official')} {t('schemes.verify')}
        </p>
      </div>

      <div className="flex flex-col md:flex-row md:items-center gap-3 mb-4">
        <label className="relative md:w-80 shrink-0">
          <span className="sr-only">{t('schemes.search')}</span>
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-forest-500" aria-hidden />
          <input className="input !rounded-full !pl-11 !bg-white" value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t('schemes.search')} />
          {query && (
            <button onClick={() => setQuery('')} aria-label={t('common.close')} className="absolute right-2 top-1/2 -translate-y-1/2 h-9 w-9 grid place-items-center rounded-full hover:bg-cream-100">
              <X size={16} />
            </button>
          )}
        </label>
        <div className="flex gap-2 overflow-x-auto scrollbar-none pb-1 -mx-4 px-4 md:mx-0 md:px-0 min-w-0" role="tablist" aria-label={t('calendar.category')}>
          {chips.map((c) => (
            <button key={c} role="tab" aria-selected={cat === c} onClick={() => setCat(c)} className={`chip shrink-0 ${cat === c ? 'chip-on' : 'chip-off'}`}>
              {c === 'forYou' && <BadgeCheck size={15} />}
              {c === 'all' ? t('common.all') : c === 'forYou' ? t('schemes.forYou') : t('schemes.cat.' + c)}
            </button>
          ))}
        </div>
      </div>

      <p className="text-sm text-forest-600/80 mb-3">{t('schemes.count', { n: list.length })}</p>

      {list.length === 0 ? (
        <div className="card"><EmptyState icon={Landmark} text={t('schemes.empty')} /></div>
      ) : (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {list.map((s) => (
            <article key={s.id} className="card p-5 flex flex-col gap-3">
              <div className="flex flex-wrap gap-2">
                <Badge tone="gray">{t('schemes.cat.' + s.category)}</Badge>
                {relevant(s) && <Badge tone="green"><BadgeCheck size={14} /> {t('schemes.likely')}</Badge>}
              </div>
              <button onClick={() => setOpenId(s.id)} className="text-left">
                <h3 className="font-semibold text-lg text-forest-900 leading-snug hover:text-emerald-700">{s.name}</h3>
              </button>
              <p className="flex items-start gap-2 text-forest-700">
                <IndianRupee size={16} className="text-earth-600 shrink-0 mt-1" aria-hidden />
                <span>{L(s.benefit)}</span>
              </p>
              <div className="mt-auto pt-2 border-t border-black/[0.06] flex items-center gap-2 text-xs text-forest-600/80 min-w-0">
                <Globe size={14} className="shrink-0" aria-hidden />
                <span className="truncate">{s.portal.name} · {portalHost(s.portal.url)}</span>
              </div>
              <div className="flex gap-2">
                <RegisterButton s={s} className="flex-1" />
                <button onClick={() => setOpenId(s.id)} className="btn-ghost !px-4 text-sm shrink-0">{t('common.details')}</button>
              </div>
            </article>
          ))}
        </div>
      )}

      <Modal open={!!open} onClose={() => setOpenId(null)} title={open ? open.name : ''} size="md">
        {open && (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Badge tone="gray">{t('schemes.cat.' + open.category)}</Badge>
              {relevant(open) && <Badge tone="green"><BadgeCheck size={14} /> {t('schemes.likely')}</Badge>}
            </div>
            <div className="rounded-2xl bg-white border border-black/[0.06] p-4">
              <h3 className="font-semibold text-forest-900 flex items-center gap-2 mb-1.5"><IndianRupee size={18} className="text-earth-600" /> {t('schemes.benefit')}</h3>
              <p className="text-forest-800">{L(open.benefit)}</p>
            </div>
            <div className="rounded-2xl bg-white border border-black/[0.06] p-4">
              <h3 className="font-semibold text-forest-900 flex items-center gap-2 mb-1.5"><Globe size={18} className="text-emerald-700" /> {t('schemes.portal')}</h3>
              <p className="text-forest-800">{open.portal.name}</p>
              <a href={open.portal.url} target="_blank" rel="noopener noreferrer" className="text-sm text-emerald-700 underline break-all">
                {open.portal.url}
              </a>
            </div>
            <RegisterButton s={open} className="w-full" />
            <button className="btn-ghost w-full" onClick={() => remind(open)}><BellPlus size={18} /> {t('schemes.remind')}</button>
            <p className="text-xs text-forest-600/80">{t('schemes.verify')}</p>
          </div>
        )}
      </Modal>
    </div>
  );
}
