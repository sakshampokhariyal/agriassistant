import { useEffect, useState } from 'react';
import { LogIn, LogOut, MapPin, Pencil, RotateCcw, ShieldCheck, Sprout, Save, X, UserRound } from 'lucide-react';
import { useApp } from '../context/AppContext';
import useCropViews from '../hooks/useCropViews';
import { irrigationOptions, landTypeOptions, soilOptions } from '../data/farmer';
import { LANGUAGES } from '../translations';
import { fmtDate } from '../utils/date';
import { Badge, Field, PageHeader, SectionTitle } from '../components/ui';
import LanguageSwitcher from '../components/LanguageSwitcher';
import { formatPhone } from '../services/auth';

export default function Profile() {
  const { t, L, lang, setLang, profile, setProfile, displayName, auth, logout, setLoginOpen, toast, resetDemo } = useApp();
  const crops = useCropViews();
  const [edit, setEdit] = useState(false);
  const [form, setForm] = useState(profile);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!edit) setForm(profile);
  }, [profile, edit]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const save = (e) => {
    e.preventDefault();
    if (!form.name.trim()) return setErrors({ name: t('profile.nameRequired') });
    setErrors({});
    const next = { ...form, name: form.name.trim(), landSize: Math.max(0, Number(form.landSize) || 0) };
    setProfile(next);
    if (next.language !== lang) setLang(next.language);
    setEdit(false);
    toast(t('profile.saved'));
  };

  const initials = (profile.name || '').trim().split(/\s+/).filter(Boolean).map((w) => w[0]).slice(0, 2).join('').toUpperCase();

  const Row = ({ label, value }) => (
    <div className="flex justify-between gap-4 py-3 border-b border-cream-200 last:border-0">
      <dt className="text-forest-600/80">{label}</dt>
      <dd className="font-bold text-forest-800 text-right">{value}</dd>
    </div>
  );

  return (
    <div>
      <PageHeader
        title={t('profile.title')}
        subtitle={t('profile.sub')}
        action={
          !edit ? (
            <button className="btn-primary" onClick={() => setEdit(true)}><Pencil size={18} /> {t('common.edit')}</button>
          ) : (
            <button className="btn-ghost" onClick={() => { setEdit(false); setErrors({}); }}><X size={18} /> {t('common.cancel')}</button>
          )
        }
      />

      <div className="grid lg:grid-cols-3 gap-5">
        <div className="space-y-5">
          <section className="card p-6 text-center">
            <span className={`h-24 w-24 rounded-full text-3xl font-semibold grid place-items-center mx-auto ${initials ? 'bg-emerald-600 text-white' : 'bg-cream-200 text-forest-700'}`}>
              {initials || <UserRound size={44} />}
            </span>
            <h2 className="mt-3 text-xl font-extrabold text-forest-800">{displayName}</h2>
            <p className="text-forest-600/80 flex items-center justify-center gap-1"><MapPin size={16} /> {profile.village}, {profile.district}, {profile.state}</p>
            <div className="mt-3">
              {auth.loggedIn ? <Badge tone="green"><ShieldCheck size={14} /> {t('profile.loggedIn')} · {auth.email || formatPhone(auth.phone)}</Badge> : <Badge tone="amber">{t('common.guest')}</Badge>}
            </div>
            {!auth.loggedIn && <p className="text-sm text-forest-600/80 mt-2">{t('profile.guestMode')}</p>}
            <div className="mt-4">
              {auth.loggedIn ? (
                <button className="btn-ghost w-full" onClick={() => { logout(); toast(t('auth.loggedOut'), 'info'); }}><LogOut size={18} /> {t('common.logout')}</button>
              ) : (
                <button className="btn-primary w-full" onClick={() => setLoginOpen(true)}><LogIn size={18} /> {t('profile.verify')}</button>
              )}
            </div>
          </section>

          <section className="card p-5">
            <h2 className="h-section mb-3">{t('common.language')}</h2>
            <LanguageSwitcher className="w-full justify-between" />
            <p className="text-sm text-forest-600/80 mt-2">{LANGUAGES.find((l) => l.code === lang)?.label}</p>
          </section>

          <button
            className="btn-ghost w-full !text-forest-600"
            onClick={() => {
              if (window.confirm(t('profile.resetConfirm'))) {
                resetDemo();
                toast(t('profile.resetDone'), 'info');
              }
            }}
          >
            <RotateCcw size={18} /> {t('profile.reset')}
          </button>
        </div>

        <div className="lg:col-span-2 space-y-5">
          {!edit ? (
            <>
              <section className="card p-5">
                <SectionTitle>{t('profile.personal')}</SectionTitle>
                <dl>
                  <Row label={t('profile.name')} value={profile.name || '—'} />
                  <Row label={t('profile.village')} value={profile.village} />
                  <Row label={t('profile.district')} value={profile.district} />
                  <Row label={t('profile.state')} value={profile.state} />
                  {auth.phone ? (
                    <Row label={t('profile.phone')} value={formatPhone(auth.phone)} />
                  ) : (
                    <Row label={t('profile.email')} value={auth.loggedIn ? auth.email : '—'} />
                  )}
                  <Row label={t('profile.language')} value={LANGUAGES.find((l) => l.code === profile.language)?.label} />
                </dl>
              </section>
              <section className="card p-5">
                <SectionTitle>{t('profile.farmDetails')}</SectionTitle>
                <dl>
                  <Row label={t('profile.land')} value={`${profile.landSize} ${t('common.acres')}`} />
                  <Row label={t('profile.landType')} value={t('opt.landType.' + profile.landType)} />
                  <Row label={t('profile.soil')} value={t('opt.soil.' + profile.soil)} />
                  <Row label={t('profile.irrigation')} value={t('opt.irr.' + profile.irrigation)} />
                </dl>
              </section>
              <section className="card p-5">
                <SectionTitle icon={Sprout}>{t('profile.crops')}</SectionTitle>
                <ul className="grid sm:grid-cols-2 gap-3">
                  {crops.map((c) => (
                    <li key={c.id} className="rounded-xl bg-cream-100 p-3">
                      <div className="font-extrabold text-forest-800">{L(c.cat.name)}</div>
                      <div className="text-sm text-forest-600/80">{c.acres} {t('common.acres')} · {t('crops.sown')} {fmtDate(c.sowDate, lang, { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                      <div className="text-sm text-forest-700 mt-0.5">{L(c.stage)}</div>
                    </li>
                  ))}
                </ul>
              </section>
            </>
          ) : (
            <form onSubmit={save} className="card p-5 space-y-5">
              <SectionTitle>{t('profile.personal')}</SectionTitle>
              <div className="grid sm:grid-cols-2 gap-4">
                <Field label={t('profile.name')} error={errors.name}><input className="input" value={form.name} onChange={set('name')} autoFocus /></Field>
                <Field label={t('profile.language')}>
                  <select className="input" value={form.language} onChange={set('language')}>
                    {LANGUAGES.map((l) => <option key={l.code} value={l.code}>{l.label}</option>)}
                  </select>
                </Field>
                <Field label={t('profile.village')}><input className="input" value={form.village} onChange={set('village')} /></Field>
                <Field label={t('profile.district')}><input className="input" value={form.district} onChange={set('district')} /></Field>
                <Field label={t('profile.state')}><input className="input" value={form.state} onChange={set('state')} /></Field>
              </div>
              <SectionTitle>{t('profile.farmDetails')}</SectionTitle>
              <div className="grid sm:grid-cols-2 gap-4">
                <Field label={t('profile.land')}><input className="input" type="number" min="0" step="0.1" value={form.landSize} onChange={set('landSize')} /></Field>
                <Field label={t('profile.landType')}>
                  <select className="input" value={form.landType} onChange={set('landType')}>
                    {landTypeOptions.map((o) => <option key={o} value={o}>{t('opt.landType.' + o)}</option>)}
                  </select>
                </Field>
                <Field label={t('profile.soil')}>
                  <select className="input" value={form.soil} onChange={set('soil')}>
                    {soilOptions.map((o) => <option key={o} value={o}>{t('opt.soil.' + o)}</option>)}
                  </select>
                </Field>
                <Field label={t('profile.irrigation')}>
                  <select className="input" value={form.irrigation} onChange={set('irrigation')}>
                    {irrigationOptions.map((o) => <option key={o} value={o}>{t('opt.irr.' + o)}</option>)}
                  </select>
                </Field>
              </div>
              <div className="flex justify-end gap-3">
                <button type="button" className="btn-ghost" onClick={() => setEdit(false)}>{t('common.cancel')}</button>
                <button className="btn-primary"><Save size={18} /> {t('common.save')}</button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
