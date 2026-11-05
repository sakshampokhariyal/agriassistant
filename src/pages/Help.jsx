import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  CalendarClock, Clock, ExternalLink, Headset, MapPin, MessageCircle, Navigation, Phone, Star, Store, Trash2, Users, Video,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import useLocalStorage from '../hooks/useLocalStorage';
import { cropCatalog } from '../data/farmer';
import { EXPERT_ROLES, RESOURCE_TYPES, helpExperts, resources } from '../data/help';
import { LANGUAGES } from '../translations';
import { addDays, fmtDate, todayISO } from '../utils/date';
import { Badge, DemoNote, EmptyState, Field, PageHeader } from '../components/ui';
import Modal from '../components/Modal';

const TYPE_STYLE = {
  seed: { pin: '#16a34a', chip: 'bg-emerald-50 text-emerald-800' },
  fertilizer: { pin: '#c98a2b', chip: 'bg-amber-50 text-amber-800' },
  cold: { pin: '#0284c7', chip: 'bg-sky-50 text-sky-800' },
  mandi: { pin: '#a8452c', chip: 'bg-red-50 text-red-800' },
};
const STOCK = { in: 'bg-emerald-100 text-emerald-800', low: 'bg-amber-100 text-amber-800', out: 'bg-red-100 text-red-800' };

export default function Help() {
  const { t } = useApp();
  const [params, setParams] = useSearchParams();
  const tab = params.get('tab') === 'resources' ? 'resources' : 'experts';
  return (
    <div>
      <PageHeader title={t('help.title')} subtitle={t('help.sub')} />
      <div className="flex gap-2 mb-5" role="tablist">
        {[
          ['experts', Users],
          ['resources', Store],
        ].map(([id, Icon]) => (
          <button key={id} role="tab" aria-selected={tab === id} onClick={() => setParams({ tab: id }, { replace: true })} className={`chip !min-h-[48px] !px-5 ${tab === id ? 'chip-on' : 'chip-off'}`}>
            <Icon size={18} /> {t(`help.tab.${id}`)}
          </button>
        ))}
      </div>
      {tab === 'experts' ? <Experts /> : <Resources />}
      <DemoNote className="mt-6" />
    </div>
  );
}

/* ───────────────────────── Experts ───────────────────────── */
function Experts() {
  const { t, L, lang: uiLang, toast, addTask } = useApp();
  const [maxKm, setMaxKm] = useState(0); // 0 = any
  const [lang, setLang] = useState('');
  const [crop, setCrop] = useState('');
  const [chatWith, setChatWith] = useState(null);
  const [bookWith, setBookWith] = useState(null);
  const [bookings, setBookings] = useLocalStorage('ks-bookings-v1', []);

  const list = useMemo(
    () =>
      helpExperts
        .filter((e) => (!maxKm || e.km <= maxKm) && (!lang || e.langs.includes(lang)) && (!crop || e.crops.includes(crop)))
        .sort((a, b) => Number(b.available) - Number(a.available) || a.km - b.km),
    [maxKm, lang, crop]
  );

  const call = (e) => toast(t('help.demoCall', { name: L(e.name) }), 'info');

  return (
    <div className="space-y-5">
      {/* Filters */}
      <section className="card p-4 grid md:grid-cols-[auto_auto_1fr] gap-4 items-end">
        <div>
          <span className="label">{t('help.distance')}</span>
          <div className="flex flex-wrap gap-2">
            {[0, 10, 25, 50].map((k) => (
              <button key={k} onClick={() => setMaxKm(k)} aria-pressed={maxKm === k} className={`chip !min-h-[40px] ${maxKm === k ? 'chip-on' : 'chip-off'}`}>
                {k ? `≤ ${k} ${t('market.km')}` : t('help.any')}
              </button>
            ))}
          </div>
        </div>
        <div>
          <span className="label">{t('common.language')}</span>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => setLang('')} aria-pressed={!lang} className={`chip !min-h-[40px] ${!lang ? 'chip-on' : 'chip-off'}`}>{t('help.any')}</button>
            {LANGUAGES.map((l) => (
              <button key={l.code} onClick={() => setLang(l.code)} aria-pressed={lang === l.code} className={`chip !min-h-[40px] ${lang === l.code ? 'chip-on' : 'chip-off'}`}>{l.label}</button>
            ))}
          </div>
        </div>
        <label className="block md:max-w-xs md:justify-self-end w-full">
          <span className="label">{t('market.crop')}</span>
          <select className="input" value={crop} onChange={(e) => setCrop(e.target.value)}>
            <option value="">{t('help.allCrops')}</option>
            {Object.values(cropCatalog).map((c) => <option key={c.id} value={c.id}>{L(c.name).split(' (')[0]}</option>)}
          </select>
        </label>
      </section>

      {bookings.length > 0 && (
        <section className="card p-4">
          <h2 className="font-semibold text-forest-900 mb-2 flex items-center gap-2"><CalendarClock size={18} className="text-emerald-600" /> {t('help.upcoming')}</h2>
          <ul className="divide-y divide-black/[0.06]">
            {bookings.map((b) => {
              const e = helpExperts.find((x) => x.id === b.expertId);
              return (
                <li key={b.id} className="flex items-center gap-3 py-2">
                  <Video size={18} className="text-emerald-600 shrink-0" />
                  <span className="flex-1 min-w-0 text-sm"><b>{e ? L(e.name) : '—'}</b> · {fmtDate(b.date, uiLang)} {b.slot}</span>
                  <button className="h-10 w-10 grid place-items-center rounded-full text-forest-500 hover:text-red-700 hover:bg-red-50" aria-label={t('help.cancel')} onClick={() => { setBookings((bs) => bs.filter((x) => x.id !== b.id)); toast(t('help.cancelled'), 'info'); }}>
                    <Trash2 size={16} />
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {list.length === 0 ? (
        <div className="card"><EmptyState icon={Users} text={t('help.noMatch')} /></div>
      ) : (
        <ul className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {list.map((e) => (
            <li key={e.id} className="card p-5 flex flex-col">
              <div className="flex items-start gap-3">
                <span className="h-12 w-12 rounded-full bg-emerald-50 text-emerald-700 grid place-items-center shrink-0"><Users size={22} /></span>
                <div className="min-w-0">
                  <h3 className="font-semibold text-forest-900 leading-tight">{L(e.name)}</h3>
                  <p className="text-sm text-forest-700">{t(`help.role.${e.role}`)}</p>
                  <p className="text-xs text-forest-600/80">{L(e.org)}</p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2 mt-3 text-sm text-forest-700">
                <span className="inline-flex items-center gap-1"><MapPin size={14} /> {e.km} {t('market.km')}</span>
                <span className="inline-flex items-center gap-1 text-earth-600"><Star size={14} fill="currentColor" /> {e.rating}</span>
                <span>· {e.years} {t('community.exp')}</span>
              </div>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {e.langs.map((c) => <Badge key={c} tone="gray">{LANGUAGES.find((l) => l.code === c).label}</Badge>)}
                {e.crops.slice(0, 3).map((c) => <Badge key={c} tone="green">{L(cropCatalog[c].name).split(' (')[0]}</Badge>)}
              </div>
              <div className="mt-2"><Badge tone={e.available ? 'green' : 'amber'}>{e.available ? t('community.available') : t('community.busy')}</Badge></div>
              <div className="grid grid-cols-3 gap-2 mt-4 pt-1">
                <button className="btn-soft !px-2 !min-h-[44px] text-sm flex-col !gap-0.5" onClick={() => call(e)}><Phone size={17} /> {t('help.call')}</button>
                <button className="btn-soft !px-2 !min-h-[44px] text-sm flex-col !gap-0.5" onClick={() => setChatWith(e)}><MessageCircle size={17} /> {t('help.chat')}</button>
                <button className="btn-primary !px-2 !min-h-[44px] text-sm flex-col !gap-0.5" onClick={() => setBookWith(e)}><Video size={17} /> {t('help.video')}</button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <section className="rounded-2xl bg-forest-800 text-white p-4 flex flex-wrap items-center gap-3">
        <Headset className="text-yellow-300" />
        <p className="flex-1 min-w-[12rem] text-sm">{t('community.helpline')} – {t('community.helplineNote')}</p>
        <a href="tel:18001801551" className="btn bg-white text-forest-900 hover:bg-cream-100"><Phone size={18} /> 1800-180-1551</a>
      </section>

      <ChatModal expert={chatWith} onClose={() => setChatWith(null)} />
      <BookModal
        expert={bookWith}
        onClose={() => setBookWith(null)}
        onBook={(b) => {
          setBookings((bs) => [...bs, b]);
          addTask({
            title: { en: `Video call: ${bookWith.name.en} (${b.slot})`, hi: `वीडियो कॉल: ${bookWith.name.hi} (${b.slot})`, kn: `ವೀಡಿಯೊ ಕರೆ: ${bookWith.name.kn} (${b.slot})` },
            date: b.date,
            category: 'other',
          });
          toast(t('help.booked'));
          setBookWith(null);
        }}
      />
    </div>
  );
}

function ChatModal({ expert, onClose }) {
  const { t, L, toast } = useApp();
  const [msg, setMsg] = useState('');
  return (
    <Modal open={!!expert} onClose={onClose} title={expert ? t('help.chatTitle', { name: L(expert.name) }) : ''} size="sm">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!msg.trim()) return;
          toast(t('help.sent'));
          setMsg('');
          onClose();
        }}
        className="space-y-4"
      >
        <textarea className="input !py-3 min-h-[120px]" value={msg} onChange={(e) => setMsg(e.target.value)} placeholder={t('help.chatPh')} autoFocus />
        <button className="btn-primary w-full" disabled={!msg.trim()}><MessageCircle size={18} /> {t('common.send')}</button>
      </form>
    </Modal>
  );
}

function BookModal({ expert, onClose, onBook }) {
  const { t, L } = useApp();
  const [date, setDate] = useState(addDays(1));
  const [slot, setSlot] = useState(null);
  return (
    <Modal open={!!expert} onClose={onClose} title={t('help.bookTitle')} size="sm">
      {expert && (
        <div className="space-y-4">
          <p className="font-semibold text-forest-900">{L(expert.name)} · <span className="font-normal text-forest-700">{t(`help.role.${expert.role}`)}</span></p>
          <Field label={t('calendar.date')}>
            <input type="date" className="input" value={date} min={todayISO()} onChange={(e) => setDate(e.target.value)} />
          </Field>
          <div>
            <span className="label">{t('community.slot')}</span>
            <div className="flex flex-wrap gap-2">
              {expert.slots.map((s) => (
                <button key={s} onClick={() => setSlot(s)} aria-pressed={slot === s} className={`chip ${slot === s ? 'chip-on' : 'chip-off'}`}><Clock size={14} /> {s}</button>
              ))}
            </div>
          </div>
          <button className="btn-primary w-full" disabled={!slot || !date} onClick={() => onBook({ id: `b${Date.now()}`, expertId: expert.id, date, slot })}>
            <Video size={18} /> {t('community.confirm')}
          </button>
        </div>
      )}
    </Modal>
  );
}

/* ───────────────────────── Resource locator ───────────────────────── */
function Resources() {
  const { t, L, toast } = useApp();
  const [type, setType] = useState('');
  const [sel, setSel] = useState(null);
  const list = resources.filter((r) => !type || r.type === type).sort((a, b) => a.km - b.km);

  return (
    <div className="grid lg:grid-cols-[1fr_22rem] gap-5">
      <div className="space-y-4 min-w-0 order-2 lg:order-1">
        <div className="flex gap-2 overflow-x-auto scrollbar-none pb-1 -mx-4 px-4 md:mx-0 md:px-0" role="tablist">
          <button role="tab" aria-selected={!type} onClick={() => setType('')} className={`chip shrink-0 ${!type ? 'chip-on' : 'chip-off'}`}>{t('common.all')}</button>
          {RESOURCE_TYPES.map((rt) => (
            <button key={rt} role="tab" aria-selected={type === rt} onClick={() => setType(rt)} className={`chip shrink-0 ${type === rt ? 'chip-on' : 'chip-off'}`}>
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: TYPE_STYLE[rt].pin }} /> {t(`help.res.${rt}`)}
            </button>
          ))}
        </div>
        <p className="text-sm text-forest-600">{t('help.nearest')}</p>
        <ul className="grid md:grid-cols-2 gap-4">
          {list.map((r) => (
            <li key={r.id}>
              <article
                onMouseEnter={() => setSel(r.id)}
                className={`card p-4 h-full flex flex-col transition ${sel === r.id ? 'ring-2 ring-emerald-500' : ''}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <span className={`text-xs font-medium rounded-full px-2.5 py-1 ${TYPE_STYLE[r.type].chip}`}>{t(`help.res.${r.type}`)}</span>
                  <span className="text-sm font-semibold text-forest-900 inline-flex items-center gap-1"><MapPin size={14} /> {r.km} {t('market.km')}</span>
                </div>
                <h3 className="font-semibold text-forest-900 mt-2 leading-snug">{L(r.name)}</h3>
                <p className="text-sm text-forest-600">{r.town}</p>
                <div className="text-sm text-forest-700 mt-2 space-y-1">
                  <p className="flex items-center gap-1.5"><Clock size={14} className="text-forest-500" /> {r.hours}</p>
                  <p className="flex items-center gap-1.5"><Phone size={14} className="text-forest-500" /> {r.phone} <span className="text-xs text-earth-700">({t('common.demo')})</span></p>
                </div>
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {r.stock.map((s, i) => (
                    <span key={i} className={`text-xs rounded-full px-2 py-0.5 font-medium ${STOCK[s.level]}`}>
                      {L(s.label)} · {t(`help.stock.${s.level}`)}
                    </span>
                  ))}
                </div>
                <div className="flex gap-2 mt-auto pt-4">
                  <a
                    className="btn-primary !min-h-[44px] text-sm flex-1"
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${r.name.en} ${r.town} Karnataka`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Navigation size={16} /> {t('help.directions')} <ExternalLink size={13} />
                  </a>
                  <button className="btn-ghost !min-h-[44px] text-sm" onClick={() => toast(t('help.demoCall', { name: L(r.name) }), 'info')}>
                    <Phone size={16} /> {t('help.call')}
                  </button>
                </div>
              </article>
            </li>
          ))}
        </ul>
      </div>

      {/* Schematic map */}
      <aside className="order-1 lg:order-2 lg:sticky lg:top-24 h-fit">
        <div className="card p-3">
          <h2 className="font-semibold text-forest-900 px-1 mb-2">{t('help.map')}</h2>
          <svg viewBox="0 0 100 100" className="w-full aspect-square rounded-2xl bg-[#eef3e6]" role="img" aria-label={t('help.map')}>
            {[20, 40, 60, 80].map((v) => (
              <g key={v} stroke="#d7e2c7" strokeWidth="0.4">
                <line x1={v} y1="0" x2={v} y2="100" />
                <line x1="0" y1={v} x2="100" y2={v} />
              </g>
            ))}
            <path d="M0 62 C 25 55, 40 70, 60 58 S 90 40, 100 46" stroke="#bcd0e6" strokeWidth="2.5" fill="none" />
            <path d="M48 0 L 50 100" stroke="#e7dcc4" strokeWidth="1.6" />
            {[15, 30, 45].map((r) => <circle key={r} cx="50" cy="50" r={r} fill="none" stroke="#c9d8b6" strokeDasharray="1.5 1.5" strokeWidth="0.4" />)}
            <circle cx="50" cy="50" r="2.6" fill="#0a2e1a" />
            <circle cx="50" cy="50" r="5" fill="#0a2e1a" opacity="0.15" />
            <text x="50" y="58" textAnchor="middle" fontSize="3.4" fill="#0a2e1a" fontWeight="700">{t('help.you')}</text>
            {list.map((r) => (
              <g key={r.id} onClick={() => setSel(r.id)} style={{ cursor: 'pointer' }}>
                <circle cx={r.x} cy={r.y} r={sel === r.id ? 4 : 3} fill={TYPE_STYLE[r.type].pin} stroke="#fff" strokeWidth="1" />
                {sel === r.id && <text x={r.x} y={r.y - 5} textAnchor="middle" fontSize="3" fill="#0a2e1a" fontWeight="700">{r.km} km</text>}
              </g>
            ))}
          </svg>
          <p className="text-xs text-forest-600 mt-2 px-1">{t('help.mapNote')}</p>
        </div>
      </aside>
    </div>
  );
}
