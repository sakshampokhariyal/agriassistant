import { useCallback, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { BookOpen, ClipboardList, FilePenLine, ShieldAlert } from 'lucide-react';
import { useApp } from '../context/AppContext';
import useCropViews from '../hooks/useCropViews';
import useLocalStorage from '../hooks/useLocalStorage';
import { makeRef, newDraft } from '../utils/claims';
import { PageHeader } from '../components/ui';
import ReportLoss from '../components/insurance/ReportLoss';
import MyClaims from '../components/insurance/MyClaims';
import PmfbyInfo from '../components/insurance/PmfbyInfo';

const TABS = [
  { id: 'report', icon: FilePenLine },
  { id: 'claims', icon: ClipboardList },
  { id: 'info', icon: BookOpen },
];

export default function Insurance() {
  const { t, toast, profile } = useApp();
  const crops = useCropViews();
  const [params, setParams] = useSearchParams();
  const tab = TABS.some((x) => x.id === params.get('tab')) ? params.get('tab') : 'report';
  const setTab = (id) => setParams({ tab: id }, { replace: true });

  const onStorageError = useCallback(() => toast(t('ins.ev.storageFull'), 'error'), [toast, t]);
  const [claims, setClaims] = useLocalStorage('ks-claims-v1', [], { onError: onStorageError });
  const [draft, setDraft] = useLocalStorage('ks-claim-draft-v1', () => newDraft(profile, crops), { onError: onStorageError });
  const [view, setView] = useState({ step: 0 });

  const updateClaim = (id, patch) =>
    setClaims((cs) => cs.map((c) => (c.id === id ? { ...c, ...patch, updatedAt: Date.now() } : c)));

  const saveClaim = (claim) => {
    const now = Date.now();
    const saved = {
      ...claim,
      id: claim.id || `c${now}`,
      ref: claim.ref || makeRef(),
      createdAt: claim.createdAt || now,
      updatedAt: now,
      status: claim.status === 'draft' ? 'prepared' : claim.status,
    };
    setClaims((cs) => (cs.some((c) => c.id === saved.id) ? cs.map((c) => (c.id === saved.id ? saved : c)) : [saved, ...cs]));
    setDraft(saved);
    toast(t('ins.claimSaved'));
    setTab('claims');
  };

  const deleteClaim = (id) => {
    setClaims((cs) => cs.filter((c) => c.id !== id));
    if (draft.id === id) setDraft(newDraft(profile, crops));
    toast(t('ins.my.deleted'), 'info');
  };

  const openClaim = (id) => {
    const c = claims.find((x) => x.id === id);
    if (!c) return;
    setDraft({ ...c });
    setView({ step: 4, key: Date.now() });
    setTab('report');
  };

  const startNew = () => {
    if (!window.confirm(t('ins.confirmNew'))) return;
    setDraft(newDraft(profile, crops));
    setView({ step: 0, key: Date.now() });
  };

  return (
    <div>
      <PageHeader title={t('ins.title')} subtitle={t('ins.sub')} />

      <p className="flex gap-2 rounded-2xl bg-forest-800 text-white/90 p-3 md:p-4 mb-5 text-sm">
        <ShieldAlert size={18} className="shrink-0 mt-0.5 text-brand-gold-light" /> {t('ins.disclaimer')}
      </p>

      <div className="flex gap-2 overflow-x-auto scrollbar-none pb-1 mb-5 -mx-4 px-4 md:mx-0 md:px-0" role="tablist" aria-label={t('ins.title')}>
        {TABS.map(({ id, icon: Icon }) => (
          <button
            key={id}
            role="tab"
            aria-selected={tab === id}
            onClick={() => setTab(id)}
            className={`chip shrink-0 !min-h-[48px] !px-5 ${tab === id ? 'chip-on' : 'chip-off'}`}
          >
            <Icon size={18} /> {t(`ins.tab.${id}`)}
            {id === 'claims' && claims.length > 0 && (
              <span className={`ml-1 rounded-full px-2 text-xs ${tab === id ? 'bg-white/20' : 'bg-cream-100'}`}>{claims.length}</span>
            )}
          </button>
        ))}
      </div>

      {tab === 'report' && (
        <ReportLoss
          key={view.key || 'draft'}
          initialStep={view.step || 0}
          draft={draft}
          setDraft={setDraft}
          onSave={saveClaim}
          onNew={startNew}
          editingRef={draft.id ? draft.ref : null}
        />
      )}
      {tab === 'claims' && (
        <MyClaims claims={claims} updateClaim={updateClaim} deleteClaim={deleteClaim} openClaim={openClaim} onReport={() => setTab('report')} />
      )}
      {tab === 'info' && <PmfbyInfo />}
    </div>
  );
}
