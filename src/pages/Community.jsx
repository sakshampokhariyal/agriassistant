import { useState } from 'react';
import { ChevronDown, Headset, MessageSquarePlus, Phone, MessageCircle, Video, Star, ThumbsUp, Send, HelpCircle, Users, GraduationCap } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { experts, faqs } from '../data/community';
import { LANGUAGES } from '../translations';
import { Badge, DemoNote, Field, PageHeader, SectionTitle } from '../components/ui';
import Modal from '../components/Modal';

export default function Community() {
  const { t, L, discussions, setDiscussions, profile, toast } = useApp();
  const [book, setBook] = useState(null);
  const [askOpen, setAskOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState('f1');
  const [openThread, setOpenThread] = useState(null);
  const [liked, setLiked] = useState({});
  const [reply, setReply] = useState('');

  const like = (id) => {
    if (liked[id]) return;
    setLiked((l) => ({ ...l, [id]: true }));
    setDiscussions((ds) => ds.map((d) => (d.id === id ? { ...d, helpful: d.helpful + 1 } : d)));
  };

  const sendReply = (id) => {
    if (!reply.trim()) return;
    setDiscussions((ds) =>
      ds.map((d) => (d.id === id ? { ...d, answers: [...d.answers, { by: profile.name, text: reply.trim() }] } : d))
    );
    setReply('');
    toast(t('community.replied'));
  };

  return (
    <div>
      <PageHeader
        title={t('community.title')}
        subtitle={t('community.sub')}
        action={<button className="btn-primary" onClick={() => setAskOpen(true)}><MessageSquarePlus size={20} /> {t('community.askQ')}</button>}
      />

      {/* Helpline */}
      <section className="rounded-3xl bg-forest-700 text-cream-50 p-5 md:p-6 flex flex-wrap items-center gap-4 mb-6 shadow-lift">
        <span className="h-14 w-14 rounded-2xl bg-white/15 grid place-items-center"><Headset size={28} className="text-earth-400" /></span>
        <div className="flex-1 min-w-[14rem]">
          <h2 className="font-extrabold text-xl">{t('community.helpline')}</h2>
          <p className="text-cream-200">{t('community.helplineNote')}</p>
        </div>
        <a href="tel:18001801551" className="btn bg-cream-50 text-forest-800 hover:bg-white text-lg"><Phone size={20} /> 1800-180-1551</a>
      </section>

      {/* Experts */}
      <SectionTitle icon={GraduationCap}>{t('community.experts')} <Badge tone="amber">{t('common.demo')}</Badge></SectionTitle>
      <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        {experts.map((e) => (
          <article key={e.id} className="card p-5 flex flex-col">
            <div className="flex items-center gap-3">
              <span className="h-14 w-14 rounded-full bg-moss-200 text-forest-800 font-extrabold text-xl grid place-items-center shrink-0">
                {L(e.name).replace(/^(Dr\.|Mr\.|डॉ\.|श्री|ಡಾ\.|ಶ್ರೀ)\s*/, '').charAt(0)}
              </span>
              <div className="min-w-0">
                <h3 className="font-extrabold text-forest-800 leading-tight">{L(e.name)}</h3>
                <p className="text-xs text-forest-600/80">{L(e.org)}</p>
              </div>
            </div>
            <p className="mt-3 font-bold text-forest-700">{L(e.field)}</p>
            <div className="flex flex-wrap items-center gap-2 mt-2 text-sm text-forest-600/80">
              <span className="flex items-center gap-1 font-bold text-earth-600"><Star size={15} fill="currentColor" /> {e.rating}</span>
              <span>· {e.years} {t('community.exp')}</span>
            </div>
            <div className="flex gap-1.5 mt-2">
              {e.langs.map((c) => <Badge key={c} tone="gray">{LANGUAGES.find((l) => l.code === c).short}</Badge>)}
            </div>
            <div className="mt-3"><Badge tone={e.available ? 'green' : 'amber'}>{e.available ? t('community.available') : t('community.busy')}</Badge></div>
            <button className="btn-primary mt-4 w-full" onClick={() => setBook(e)}>{t('community.book')}</button>
          </article>
        ))}
      </div>

      <div className="grid lg:grid-cols-5 gap-6">
        {/* Discussions */}
        <section className="lg:col-span-3">
          <SectionTitle icon={Users}>{t('community.discussions')}</SectionTitle>
          <ul className="space-y-3">
            {discussions.map((d) => {
              const isOpen = openThread === d.id;
              return (
                <li key={d.id} className="card p-4 md:p-5">
                  <div className="flex items-center gap-2 text-sm text-forest-600/80">
                    <span className="font-bold text-forest-700">{L(d.author)}</span> · {L(d.ago)}
                  </div>
                  <h3 className="font-extrabold text-forest-800 text-lg mt-1 leading-snug">{L(d.q)}</h3>
                  <div className="flex flex-wrap items-center gap-2 mt-3">
                    <button onClick={() => like(d.id)} aria-pressed={!!liked[d.id]} className={`chip !min-h-[40px] ${liked[d.id] ? 'chip-on' : 'chip-off'}`}>
                      <ThumbsUp size={15} /> {t('community.helpful')} · {d.helpful}
                    </button>
                    <button onClick={() => setOpenThread(isOpen ? null : d.id)} aria-expanded={isOpen} className="chip chip-off !min-h-[40px]">
                      <MessageCircle size={15} /> {d.answers.length} {t('community.answers')}
                      <ChevronDown size={15} className={`transition ${isOpen ? 'rotate-180' : ''}`} />
                    </button>
                  </div>
                  {isOpen && (
                    <div className="mt-3 space-y-2.5">
                      {d.answers.map((a, i) => (
                        <div key={i} className="rounded-xl bg-forest-50 p-3">
                          <div className="text-sm font-bold text-forest-700">{L(a.by)}</div>
                          <p className="mt-0.5">{L(a.text)}</p>
                        </div>
                      ))}
                      <div className="flex gap-2">
                        <input className="input" value={reply} onChange={(e) => setReply(e.target.value)} placeholder={t('community.reply')} onKeyDown={(e) => e.key === 'Enter' && sendReply(d.id)} />
                        <button className="btn-primary !px-4" aria-label={t('common.send')} onClick={() => sendReply(d.id)}><Send size={18} /></button>
                      </div>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </section>

        {/* FAQs */}
        <section className="lg:col-span-2">
          <SectionTitle icon={HelpCircle}>{t('community.faqs')}</SectionTitle>
          <ul className="space-y-2">
            {faqs.map((f) => {
              const on = openFaq === f.id;
              return (
                <li key={f.id} className="card overflow-hidden">
                  <button onClick={() => setOpenFaq(on ? null : f.id)} aria-expanded={on} className="w-full flex items-center justify-between gap-3 text-left p-4 min-h-[56px] font-bold text-forest-800">
                    {L(f.q)} <ChevronDown size={20} className={`shrink-0 transition ${on ? 'rotate-180' : ''}`} />
                  </button>
                  {on && <p className="px-4 pb-4 text-forest-700">{L(f.a)}</p>}
                </li>
              );
            })}
          </ul>
          <DemoNote className="mt-4" />
        </section>
      </div>

      <BookModal expert={book} onClose={() => setBook(null)} />
      <AskModal
        open={askOpen}
        onClose={() => setAskOpen(false)}
        onPost={(q) => {
          setDiscussions((ds) => [{ id: `d${Date.now()}`, author: `${profile.name}, ${profile.village}`, q, answers: [], helpful: 0, ago: { en: 'Just now', hi: 'अभी', kn: 'ಈಗಷ್ಟೇ' } }, ...ds]);
          setAskOpen(false);
          toast(t('community.posted'));
        }}
      />
    </div>
  );
}

function BookModal({ expert, onClose }) {
  const { t, L, toast } = useApp();
  const [slot, setSlot] = useState(null);
  const [mode, setMode] = useState('call');
  const modes = [
    { id: 'call', icon: Phone },
    { id: 'chat', icon: MessageCircle },
    { id: 'video', icon: Video },
  ];
  const close = () => {
    setSlot(null);
    setMode('call');
    onClose();
  };
  return (
    <Modal
      open={!!expert}
      onClose={close}
      title={expert ? L(expert.name) : ''}
      size="sm"
      footer={
        <>
          <button className="btn-ghost" onClick={close}>{t('common.cancel')}</button>
          <button
            className="btn-primary"
            disabled={!slot}
            onClick={() => {
              toast(t('community.booked'));
              close();
            }}
          >
            {t('community.confirm')}
          </button>
        </>
      }
    >
      {expert && (
        <div className="space-y-5">
          <p className="text-forest-600/80">{L(expert.field)} · {L(expert.org)}</p>
          <div>
            <span className="label">{t('community.slot')} · {t('common.tomorrow')}</span>
            <div className="flex flex-wrap gap-2">
              {expert.slots.map((s) => (
                <button key={s} onClick={() => setSlot(s)} aria-pressed={slot === s} className={`chip ${slot === s ? 'chip-on' : 'chip-off'}`}>{s}</button>
              ))}
            </div>
          </div>
          <div>
            <span className="label">{t('community.mode')}</span>
            <div className="grid grid-cols-3 gap-2">
              {modes.map(({ id, icon: Icon }) => (
                <button key={id} onClick={() => setMode(id)} aria-pressed={mode === id} className={`rounded-2xl border min-h-[72px] flex flex-col items-center justify-center gap-1 font-bold text-sm ${mode === id ? 'bg-forest-700 text-cream-50 border-forest-700' : 'bg-white border-forest-200 text-forest-700'}`}>
                  <Icon size={22} /> {t('community.mode.' + id)}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}

function AskModal({ open, onClose, onPost }) {
  const { t, lang } = useApp();
  const [q, setQ] = useState('');
  const [err, setErr] = useState('');
  const submit = (e) => {
    e.preventDefault();
    if (!q.trim()) return setErr(t('community.qRequired'));
    onPost({ en: q.trim(), hi: q.trim(), kn: q.trim(), [lang]: q.trim() });
    setQ('');
    setErr('');
  };
  return (
    <Modal open={open} onClose={onClose} title={t('community.askQ')} size="sm">
      <form onSubmit={submit} className="space-y-4">
        <Field label={t('community.yourQ')} error={err}>
          <textarea className="input !py-3 min-h-[120px]" value={q} onChange={(e) => setQ(e.target.value)} autoFocus />
        </Field>
        <div className="flex justify-end gap-3">
          <button type="button" className="btn-ghost" onClick={onClose}>{t('common.cancel')}</button>
          <button className="btn-primary"><Send size={18} /> {t('community.post')}</button>
        </div>
      </form>
    </Modal>
  );
}
