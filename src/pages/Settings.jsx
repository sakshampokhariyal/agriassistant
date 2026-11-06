import { useMemo } from 'react';
import { fmtStamp } from '../utils/date';
import { Link } from 'react-router-dom';
import { CloudOff, Database, Feather, Globe, HardDrive, ImageOff, RefreshCw, UserRound, Wifi, Zap, ChevronRight } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useWeather } from '../context/WeatherContext';
import useOnline from '../hooks/useOnline';
import { PageHeader } from '../components/ui';
import LanguageSwitcher from '../components/LanguageSwitcher';

function storageKB() {
  try {
    return Math.round(
      Object.keys(localStorage)
        .filter((k) => k.startsWith('ks-'))
        .reduce((s, k) => s + (localStorage.getItem(k)?.length || 0) * 2, 0) / 1024
    );
  } catch {
    return null;
  }
}

export default function Settings() {
  const { t, lang, dataSaver, setDataSaver, crops, tasks, toast } = useApp();
  const weather = useWeather();
  const online = useOnline();
  const kb = useMemo(storageKB, [crops, tasks, weather.updatedAt, dataSaver]);
  const time = (ms) => fmtStamp(ms, lang);

  const toggle = () => {
    setDataSaver(!dataSaver);
    toast(!dataSaver ? t('set.onToast') : t('set.offToast'), 'info');
  };

  return (
    <div className="max-w-3xl">
      <PageHeader title={t('set.title')} subtitle={t('set.sub')} />

      {/* Data Saver */}
      <section className="card p-5">
        <div className="flex items-start gap-4">
          <span className="h-12 w-12 rounded-2xl bg-emerald-50 text-emerald-700 grid place-items-center shrink-0"><Feather size={24} /></span>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-semibold text-forest-900">{t('set.dataSaver')}</h2>
            <p className="text-forest-700 text-sm">{t('set.dataSaverSub')}</p>
          </div>
          <button
            role="switch"
            aria-checked={dataSaver}
            aria-label={t('set.dataSaver')}
            onClick={toggle}
            className={`relative h-8 w-14 rounded-full shrink-0 transition ${dataSaver ? 'bg-emerald-600' : 'bg-cream-300'}`}
          >
            <span className={`absolute top-1 h-6 w-6 rounded-full bg-white shadow transition-all ${dataSaver ? 'left-7' : 'left-1'}`} />
          </button>
        </div>
        <ul className="mt-4 grid sm:grid-cols-2 gap-2 text-sm">
          {[
            [Zap, 'set.e.graphics'],
            [ImageOff, 'set.e.images'],
            [HardDrive, 'set.e.compress'],
            [Database, 'set.e.cache'],
          ].map(([Icon, key]) => (
            <li key={key} className={`flex items-start gap-2 rounded-xl p-2.5 ${dataSaver ? 'bg-emerald-50 text-emerald-900' : 'bg-cream-100 text-forest-700'}`}>
              <Icon size={16} className="shrink-0 mt-0.5" /> {t(key)}
            </li>
          ))}
        </ul>
      </section>

      {/* Offline status */}
      <section className="card p-5 mt-5">
        <h2 className="text-lg font-semibold text-forest-900 mb-3">{t('set.offline')}</h2>
        <div className="grid sm:grid-cols-2 gap-3">
          <div className={`rounded-xl p-3 flex items-center gap-3 ${online ? 'bg-emerald-50' : 'bg-red-50'}`}>
            {online ? <Wifi className="text-emerald-700" /> : <CloudOff className="text-red-700" />}
            <div>
              <div className="font-semibold text-forest-900">{online ? t('set.online') : t('set.isOffline')}</div>
              <div className="text-xs text-forest-600">{online ? t('set.onlineSub') : t('set.offlineSub')}</div>
            </div>
          </div>
          <div className="rounded-xl p-3 bg-cream-100 flex items-center gap-3">
            <Database className="text-forest-600" />
            <div>
              <div className="font-semibold text-forest-900">{t('set.cachedWeather')}</div>
              <div className="text-xs text-forest-600">{weather.updatedAt ? time(weather.updatedAt) : '—'}{weather.fromCache ? ` · ${t('set.fromCache')}` : ''}</div>
            </div>
          </div>
        </div>
        <dl className="mt-3 grid grid-cols-3 gap-3 text-center">
          <div className="rounded-xl bg-cream-100 p-3"><dt className="text-xs text-forest-600">{t('fld.fields')}</dt><dd className="text-xl font-semibold text-forest-900">{crops.length}</dd></div>
          <div className="rounded-xl bg-cream-100 p-3"><dt className="text-xs text-forest-600">{t('set.tasks')}</dt><dd className="text-xl font-semibold text-forest-900">{tasks.length}</dd></div>
          <div className="rounded-xl bg-cream-100 p-3"><dt className="text-xs text-forest-600">{t('set.storage')}</dt><dd className="text-xl font-semibold text-forest-900">{kb != null ? `${kb} KB` : '—'}</dd></div>
        </dl>
        <p className="text-xs text-forest-600 mt-3">{t('set.offlineNote')}</p>
        <button className="btn-ghost mt-3" onClick={weather.refresh} disabled={!online || weather.status === 'refreshing' || weather.status === 'loading'}>
          <RefreshCw size={16} className={weather.status === 'refreshing' ? 'animate-spin' : ''} /> {t('set.refreshNow')}
        </button>
      </section>

      {/* Language & account */}
      <section className="card p-5 mt-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-semibold text-forest-900 flex items-center gap-2"><Globe size={18} className="text-emerald-600" /> {t('common.language')}</h2>
          <LanguageSwitcher />
        </div>
        <Link to="/profile" className="flex items-center gap-3 rounded-xl bg-cream-100 p-3 hover:bg-emerald-50">
          <UserRound className="text-forest-600" />
          <span className="flex-1 font-medium text-forest-900">{t('nav.profile')}</span>
          <ChevronRight size={18} className="text-forest-500" />
        </Link>
      </section>
    </div>
  );
}
