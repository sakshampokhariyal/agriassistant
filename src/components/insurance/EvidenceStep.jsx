import { useRef, useState } from 'react';
import { Camera, CheckCircle2, Circle, ImagePlus, LocateFixed, RefreshCw, Trash2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import useClaimHelpers from '../../hooks/useClaimHelpers';
import { CHECKLIST, PHOTO_LIMIT } from '../../data/insurance';
import { compressImage } from '../../utils/media';

export default function EvidenceStep({ draft, setDraft }) {
  const { t, toast } = useApp();
  const { fmtDateTime } = useClaimHelpers();
  const fileRef = useRef(null);
  const camRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const [locating, setLocating] = useState(null);

  const nextTag = (photos) => CHECKLIST.find((c) => !photos.some((p) => p.tag === c)) || '';

  const addFiles = async (fileList) => {
    const files = [...(fileList || [])].filter((f) => f.type.startsWith('image/'));
    if (!files.length) return;
    const room = PHOTO_LIMIT - draft.photos.length;
    if (room <= 0) return toast(t('ins.ev.limit', { n: PHOTO_LIMIT }), 'error');
    if (files.length > room) toast(t('ins.ev.limit', { n: PHOTO_LIMIT }), 'info');
    setBusy(true);
    try {
      const added = [];
      for (const f of files.slice(0, room)) {
        try {
          const data = await compressImage(f);
          added.push({
            id: `p${Date.now()}${Math.random().toString(16).slice(2, 6)}`,
            data,
            caption: '',
            tag: '',
            // File modification time reported by the device – NOT verified capture time.
            fileTime: Number.isFinite(f.lastModified) ? f.lastModified : null,
            gps: null,
            addedAt: Date.now(),
          });
        } catch {
          /* skip unreadable files */
        }
      }
      setDraft((d) => {
        const photos = [...d.photos];
        added.forEach((p) => photos.push({ ...p, tag: nextTag(photos) }));
        return { ...d, photos };
      });
    } finally {
      setBusy(false);
    }
  };

  const update = (id, patch) => setDraft((d) => ({ ...d, photos: d.photos.map((p) => (p.id === id ? { ...p, ...patch } : p)) }));
  const remove = (id) => setDraft((d) => ({ ...d, photos: d.photos.filter((p) => p.id !== id) }));

  const attachGps = (id) => {
    if (!('geolocation' in navigator)) return toast(t('ins.ev.gpsDenied'), 'error');
    setLocating(id);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        update(id, { gps: { lat: pos.coords.latitude, lon: pos.coords.longitude, acc: pos.coords.accuracy, at: Date.now() } });
        setLocating(null);
      },
      () => {
        toast(t('ins.ev.gpsDenied'), 'error');
        setLocating(null);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };

  return (
    <div className="space-y-5">
      <p className="text-forest-700">{t('ins.ev.help')}</p>

      <div className="flex flex-wrap gap-3">
        <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => { addFiles(e.target.files); e.target.value = ''; }} />
        <input ref={camRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => { addFiles(e.target.files); e.target.value = ''; }} />
        <button className="btn-primary" onClick={() => camRef.current?.click()} disabled={busy}><Camera size={18} /> {t('ins.ev.camera')}</button>
        <button className="btn-ghost" onClick={() => fileRef.current?.click()} disabled={busy}><ImagePlus size={18} /> {t('ins.ev.add')}</button>
        {busy && <span className="flex items-center gap-2 text-sm text-forest-700" role="status"><RefreshCw size={16} className="animate-spin" /> {t('ins.ev.processing')}</span>}
      </div>
      <p className="text-xs text-forest-600/80">
        {t('ins.ev.limit', { n: PHOTO_LIMIT })} {t('ins.ev.keepOriginals')}
      </p>

      {/* Checklist */}
      <section className="rounded-2xl bg-cream-100 p-4">
        <h3 className="font-semibold text-forest-900 mb-2">{t('ins.ev.checklist')}</h3>
        <ul className="grid sm:grid-cols-2 gap-1.5">
          {CHECKLIST.map((c) => {
            const done = draft.photos.some((p) => p.tag === c);
            return (
              <li key={c} className="flex items-center gap-2 text-sm">
                {done ? <CheckCircle2 size={18} className="text-emerald-600 shrink-0" /> : <Circle size={18} className="text-forest-300 shrink-0" />}
                <span className={done ? 'text-forest-900' : 'text-forest-600'}>{t(`ins.ev.c.${c}`)}</span>
              </li>
            );
          })}
        </ul>
      </section>

      {draft.photos.length === 0 ? (
        <p className="text-center text-forest-600/80 py-6 border-2 border-dashed border-forest-200 rounded-2xl">{t('ins.ev.empty')}</p>
      ) : (
        <ul className="grid sm:grid-cols-2 gap-4">
          {draft.photos.map((p, i) => (
            <li key={p.id} className="rounded-2xl border border-black/[0.06] bg-white p-3">
              <div className="relative">
                <img src={p.data} alt={p.caption || `${t('ins.pdf.photos')} ${i + 1}`} className="w-full h-48 object-cover rounded-xl" />
                <span className="absolute top-2 left-2 rounded-full bg-black/60 text-white text-xs px-2 py-0.5">#{i + 1}</span>
                <button onClick={() => remove(p.id)} aria-label={t('ins.ev.remove')} className="absolute top-2 right-2 h-10 w-10 rounded-full bg-white/90 text-clay-600 grid place-items-center hover:bg-white">
                  <Trash2 size={18} />
                </button>
              </div>
              <label className="block mt-3">
                <span className="label">{t('ins.ev.shows')}</span>
                <select className="input" value={p.tag} onChange={(e) => update(p.id, { tag: e.target.value })}>
                  <option value="">—</option>
                  {CHECKLIST.map((c) => <option key={c} value={c}>{t(`ins.ev.c.${c}`)}</option>)}
                </select>
              </label>
              <label className="block mt-2">
                <span className="label">{t('ins.ev.caption')}</span>
                <input className="input" value={p.caption} onChange={(e) => update(p.id, { caption: e.target.value })} maxLength={160} />
              </label>
              <div className="mt-2 text-xs text-forest-600 space-y-1">
                <p>{p.fileTime ? t('ins.ev.fileTime', { time: fmtDateTime(new Date(p.fileTime)) }) : t('ins.ev.noFileTime')}</p>
                {p.gps ? (
                  <p className="text-emerald-700">
                    {t('ins.ev.gps', { lat: p.gps.lat.toFixed(5), lon: p.gps.lon.toFixed(5), acc: Math.round(p.gps.acc), time: fmtDateTime(new Date(p.gps.at)) })}
                  </p>
                ) : (
                  <button className="btn-soft !min-h-[40px] text-xs !px-3" onClick={() => attachGps(p.id)} disabled={locating === p.id}>
                    <LocateFixed size={14} className={locating === p.id ? 'animate-pulse' : ''} /> {t('ins.ev.addGps')}
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
      <p className="text-xs text-forest-600/80">{t('ins.ev.gpsNote')}</p>
    </div>
  );
}
