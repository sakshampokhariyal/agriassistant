import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Building2, ExternalLink, FlaskConical, Info, Landmark, LocateFixed, MapPin, Navigation, Phone, RefreshCw, Search, Sprout, Store, Warehouse,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useFarmLocation } from '../context/LocationContext';
import { DEFAULT_COORDS } from '../services/weather';
import {
  cacheResults, directionsUrl, geocodeProfile, mapsSearchUrl, mergeResults, openStatus, readCachedResults, searchNominatim, searchOverpass, telHref,
} from '../services/nearby';
import { Badge, EmptyState, PageHeader, Skeleton } from '../components/ui';

const RADII = [10, 25, 50];
const FILTERS = ['all', 'store', 'kvk', 'market'];
const CAT = {
  store: { icon: Store, tone: 'bg-emerald-50 text-emerald-700' },
  kvk: { icon: Building2, tone: 'bg-sky-100 text-sky-500' },
  govt: { icon: Landmark, tone: 'bg-amber-50 text-amber-700' },
  market: { icon: Warehouse, tone: 'bg-violet-50 text-violet-700' },
};
/** One-tap Google Maps searches around the farmer (real local listings with phones & hours). */
const MAPS_SEARCHES = [
  { key: 'fert', icon: Sprout, query: 'fertilizer and seed shop' },
  { key: 'pest', icon: FlaskConical, query: 'pesticide agro shop' },
  { key: 'kvk', icon: Building2, query: 'Krishi Vigyan Kendra' },
  { key: 'rsk', icon: Landmark, query: 'Raitha Samparka Kendra' },
  { key: 'apmc', icon: Warehouse, query: 'APMC market yard' },
];

/** Nearby Agricultural Services: input shops, KVKs, Raitha Samparka Kendras and mandis around the farmer. */
export default function NearbyServices() {
  const { t, lang, profile } = useApp();
  const location = useFarmLocation();
  const [origin, setOrigin] = useState(null); // { lat, lon, label, source: 'gps' | 'profile' | 'default' }
  const [radius, setRadius] = useState(25);
  const [filter, setFilter] = useState('all');
  const [state, setState] = useState({ items: [], loading: false, background: false, at: null, error: null });
  const run = useRef(null);

  // Where to search from: detected device location, else the profile village (geocoded), else Bengaluru.
  const gpsPlace = profile.locationSource === 'gps' ? location.place : null;
  const profileLabel = [...new Set([profile.village, profile.district].filter(Boolean))].join(', ');
  useEffect(() => {
    let alive = true;
    if (gpsPlace) {
      setOrigin({ lat: gpsPlace.lat, lon: gpsPlace.lon, label: gpsPlace.label, source: 'gps' });
      return undefined;
    }
    geocodeProfile(profile)
      .then((p) => alive && setOrigin({ ...p, label: profileLabel, source: 'profile' }))
      .catch(() => alive && setOrigin({ ...DEFAULT_COORDS, label: 'Bengaluru', source: 'default' }));
    return () => {
      alive = false;
    };
  }, [gpsPlace?.lat, gpsPlace?.lon, gpsPlace?.label, profile.village, profile.district, profile.state]); // eslint-disable-line react-hooks/exhaustive-deps

  const load = useCallback(
    async (force = false) => {
      if (!origin) return;
      run.current?.abort();
      const ctrl = new AbortController();
      run.current = ctrl;
      const cached = !force && readCachedResults(origin, radius);
      if (cached) {
        setState({ items: cached.items, loading: false, background: false, at: cached.at, error: null });
        if (cached.overpassDone) return;
      } else {
        setState({ items: [], loading: true, background: true, at: null, error: null });
      }
      // Results already found with a smaller radius stay in the list when the radius grows.
      const smaller = RADII.filter((r) => r < radius)
        .map((r) => readCachedResults(origin, r)?.items || [])
        .flat();
      let items = mergeResults(cached ? cached.items : [], smaller);
      if (!cached && items.length) setState((s) => ({ ...s, items, loading: false }));
      let overpassDone = false;
      // Overpass is slow on the free public servers – run it alongside and merge when it lands.
      const overpass = searchOverpass(origin, radius, { signal: ctrl.signal })
        .then((list) => {
          overpassDone = true;
          return list;
        })
        .catch(() => []);
      const nominatim = await searchNominatim(origin, radius, {
        signal: ctrl.signal,
        onItems: (found) => {
          items = mergeResults(items, found);
          if (!ctrl.signal.aborted) setState((s) => ({ ...s, items, loading: false }));
        },
      });
      if (ctrl.signal.aborted) return;
      items = mergeResults(items, nominatim);
      setState((s) => ({ ...s, items, loading: false }));
      const fromOverpass = await overpass;
      if (ctrl.signal.aborted) return;
      items = mergeResults(items, fromOverpass);
      const at = Date.now();
      setState({ items, loading: false, background: false, at, error: null });
      cacheResults(origin, radius, items, overpassDone);
    },
    [origin, radius]
  );

  useEffect(() => {
    load();
    return () => run.current?.abort();
  }, [load]);

  const counts = useMemo(() => {
    const c = { all: state.items.length, store: 0, kvk: 0, market: 0 };
    state.items.forEach((x) => (c[x.category === 'govt' ? 'kvk' : x.category] += 1));
    return c;
  }, [state.items]);
  const shown = state.items.filter((x) => filter === 'all' || x.category === filter || (filter === 'kvk' && x.category === 'govt'));
  const time = (ms) => new Date(ms).toLocaleTimeString(lang === 'en' ? 'en-IN' : `${lang}-IN`, { hour: 'numeric', minute: '2-digit' });

  return (
    <div className="max-w-5xl">
      <PageHeader
        title={t('nb.title')}
        subtitle={t('nb.sub')}
        action={
          <button className="btn-ghost" onClick={() => load(true)} disabled={!origin || state.loading}>
            <RefreshCw size={18} className={state.loading || state.background ? 'animate-spin' : ''} /> {t('wx.refresh')}
          </button>
        }
      />

      {/* Search origin + radius */}
      <section className="card p-4 md:p-5 mb-5">
        <div className="flex flex-wrap items-center gap-3">
          <span className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-700 grid place-items-center shrink-0"><MapPin size={20} /></span>
          <div className="flex-1 min-w-[12rem]">
            <p className="font-semibold text-forest-900">{origin ? t('nb.around', { place: origin.label }) : t('nb.locating')}</p>
            <p className="text-xs text-forest-600">{origin && t(`nb.src.${origin.source}`)}</p>
          </div>
          {origin?.source !== 'gps' && (
            <button className="btn-soft !min-h-[40px] text-sm" onClick={() => location.refresh({ force: true })} disabled={location.status === 'detecting'}>
              <LocateFixed size={16} /> {t('loc.useCurrent')}
            </button>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2 mt-3" role="radiogroup" aria-label={t('nb.radius')}>
          <span className="text-sm text-forest-700 mr-1">{t('nb.radius')}:</span>
          {RADII.map((r) => (
            <button key={r} role="radio" aria-checked={radius === r} onClick={() => setRadius(r)} className={`chip !min-h-[38px] text-sm ${radius === r ? 'chip-on' : 'chip-off'}`}>
              {r} km
            </button>
          ))}
        </div>
      </section>

      {/* Google Maps searches */}
      <section className="mb-6">
        <h2 className="h-section flex items-center gap-2 mb-1"><Search size={20} className="text-emerald-600" /> {t('nb.maps.title')}</h2>
        <p className="text-sm text-forest-600 mb-3">{t('nb.maps.sub')}</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
          {MAPS_SEARCHES.map(({ key, icon: Icon, query }) => (
            <a
              key={key}
              href={origin ? mapsSearchUrl(query, origin) : undefined}
              target="_blank"
              rel="noopener noreferrer"
              aria-disabled={!origin}
              className={`card p-3 flex flex-col gap-2 hover:shadow-lift transition min-w-0 ${origin ? '' : 'pointer-events-none opacity-50'}`}
            >
              <span className="h-9 w-9 rounded-xl bg-emerald-50 text-emerald-700 grid place-items-center"><Icon size={18} /></span>
              <span className="font-semibold text-sm text-forest-900 leading-snug">{t(`nb.maps.${key}`)}</span>
              <span className="text-xs text-emerald-700 inline-flex items-center gap-1 mt-auto">{t('nb.maps.open')} <ExternalLink size={12} /></span>
            </a>
          ))}
        </div>
      </section>

      {/* OpenStreetMap listings */}
      <section>
        <h2 className="h-section flex items-center gap-2 mb-1"><Store size={20} className="text-emerald-600" /> {t('nb.listed.title')}</h2>
        <p className="text-sm text-forest-600 mb-3">
          {t('nb.listed.sub', { r: radius })}
          {state.at && <span className="text-forest-500"> · {t('nb.checkedAt', { time: time(state.at) })}</span>}
        </p>
        <div className="flex gap-2 overflow-x-auto scrollbar-none pb-2 mb-2" role="tablist">
          {FILTERS.map((f) => (
            <button key={f} role="tab" aria-selected={filter === f} onClick={() => setFilter(f)} className={`chip shrink-0 !min-h-[40px] text-sm ${filter === f ? 'chip-on' : 'chip-off'}`}>
              {t(`nb.f.${f}`)} · {counts[f]}
            </button>
          ))}
        </div>
        {state.background && !state.loading && (
          <p className="text-xs text-forest-600 mb-3 flex items-center gap-1.5"><RefreshCw size={12} className="animate-spin" /> {t('nb.moreLoading')}</p>
        )}

        {state.loading && !state.items.length ? (
          <div className="space-y-3">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-28" />)}</div>
        ) : shown.length === 0 ? (
          <div className="card">
            <EmptyState icon={Store} text={t(state.background ? 'nb.searching' : 'nb.empty', { r: radius })} />
          </div>
        ) : (
          <ul className="space-y-3">
            {shown.map((x) => <ServiceCard key={x.id} x={x} />)}
          </ul>
        )}
      </section>

      {/* Official directories */}
      <section className="mt-6 grid sm:grid-cols-2 gap-3">
        <a href="https://kvk.icar.gov.in/" target="_blank" rel="noopener noreferrer" className="card p-4 flex items-start gap-3 hover:shadow-lift transition">
          <Building2 size={22} className="text-sky-500 shrink-0 mt-0.5" />
          <span>
            <span className="font-semibold text-forest-900 flex items-center gap-1">{t('nb.kvkDir')} <ExternalLink size={13} /></span>
            <span className="text-sm text-forest-600">{t('nb.kvkDirSub')}</span>
          </span>
        </a>
        <a href="tel:18001801551" className="card p-4 flex items-start gap-3 hover:shadow-lift transition">
          <Phone size={22} className="text-emerald-600 shrink-0 mt-0.5" />
          <span>
            <span className="font-semibold text-forest-900">{t('nb.kcc')} · 1800-180-1551</span>
            <span className="block text-sm text-forest-600">{t('nb.kccSub')}</span>
          </span>
        </a>
      </section>

      <p className="text-xs text-forest-600/80 mt-6 flex gap-1.5">
        <Info size={14} className="shrink-0 mt-0.5" />
        <span>
          {t('nb.note')}{' '}
          <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer" className="underline">© OpenStreetMap contributors</a>
        </span>
      </p>
    </div>
  );
}

function ServiceCard({ x }) {
  const { t } = useApp();
  const cat = CAT[x.category] || CAT.store;
  const Icon = cat.icon;
  const status = openStatus(x.hours);
  const km = x.km < 1 ? `${Math.round(x.km * 1000)} m` : `${x.km.toFixed(x.km < 10 ? 1 : 0)} km`;
  return (
    <li className="card p-4 md:p-5 flex gap-4 min-w-0">
      <span className={`h-11 w-11 rounded-2xl grid place-items-center shrink-0 ${cat.tone}`}><Icon size={22} /></span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="font-semibold text-forest-900 text-lg leading-snug mr-1">{x.name}</h3>
          <Badge tone="gray">{t(`nb.cat.${x.category}`)}</Badge>
          {status === 'open' && <Badge tone="green">{t('nb.open')}</Badge>}
          {status === 'closed' && <Badge tone="red">{t('nb.closed')}</Badge>}
          {status === 'unknown' && <span className="text-xs text-forest-500">{t('nb.hoursUnknown')}</span>}
        </div>
        <p className="text-sm text-forest-700 mt-1 flex items-start gap-1.5">
          <MapPin size={14} className="shrink-0 mt-0.5 text-forest-500" />
          <span>{x.address || t('nb.noAddress')}</span>
        </p>
        <p className="text-sm text-forest-700 mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1">
          <span className="font-semibold text-forest-900">{t('nb.away', { d: km })}</span>
          {x.phone ? <span className="inline-flex items-center gap-1"><Phone size={13} /> {x.phone}</span> : <span className="text-forest-500">{t('nb.noPhone')}</span>}
          {x.hours && status !== 'unknown' && <span className="text-xs text-forest-500">{x.hours}</span>}
        </p>
        <div className="flex flex-wrap gap-2 mt-3">
          <a href={directionsUrl(x)} target="_blank" rel="noopener noreferrer" className="btn-primary !min-h-[42px] text-sm">
            <Navigation size={16} /> {t('nb.directions')}
          </a>
          {x.phone ? (
            <a href={telHref(x.phone)} className="btn-soft !min-h-[42px] text-sm"><Phone size={16} /> {t('nb.call')}</a>
          ) : (
            <a href={mapsSearchUrl(x.name, x)} target="_blank" rel="noopener noreferrer" className="btn-ghost !min-h-[42px] text-sm">
              <Search size={16} /> {t('nb.findPhone')}
            </a>
          )}
        </div>
      </div>
    </li>
  );
}
