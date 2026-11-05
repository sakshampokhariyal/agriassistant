import { useEffect, useState } from 'react';
import { Eye, EyeOff, LogIn, Mail, MailCheck, RefreshCw, UserPlus, AlertTriangle } from 'lucide-react';
import Modal from './Modal';
import { Field } from './ui';
import { useApp } from '../context/AppContext';
import * as authService from '../services/auth';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Supabase email + password sign-in / sign-up. Optional – guests can keep using the app. */
export default function LoginModal() {
  const { loginOpen, setLoginOpen, login, t, toast } = useApp();
  const [mode, setMode] = useState('signIn'); // signIn | signUp | reset | checkEmail | resetSent
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (loginOpen) {
      setMode('signIn');
      setPassword('');
      setError('');
      setShowPw(false);
    }
  }, [loginOpen]);

  const close = () => setLoginOpen(false);
  const errText = (c) => t(`auth.err.${c}`) || t('auth.err.unknown');

  const submit = async (e) => {
    e.preventDefault();
    const em = email.trim().toLowerCase();
    if (!EMAIL_RE.test(em)) return setError(t('auth.invalidEmail'));
    if (mode !== 'reset' && password.length < 6) return setError(t('auth.passwordHint'));
    setError('');
    setBusy(true);
    try {
      if (mode === 'reset') {
        const { error: err } = await authService.resetPassword(em);
        if (err) return setError(errText(err));
        setMode('resetSent');
      } else if (mode === 'signUp') {
        const res = await authService.signUp(em, password);
        if (res.error) return setError(errText(res.error));
        if (res.needsConfirmation) return setMode('checkEmail');
        login(res.user);
        toast(t('auth.success'));
        close();
      } else {
        const res = await authService.signIn(em, password);
        if (res.error) return setError(errText(res.error));
        login(res.user);
        toast(t('auth.success'));
        close();
      }
    } finally {
      setBusy(false);
    }
  };

  const title = mode === 'reset' || mode === 'resetSent' ? t('auth.resetTitle') : mode === 'checkEmail' ? t('auth.checkEmail') : t('auth.title');

  return (
    <Modal open={loginOpen} onClose={close} title={title} size="sm">
      {!authService.isAuthConfigured && (
        <p className="mb-4 flex gap-2 rounded-xl bg-amber-50 border border-amber-200 p-3 text-sm text-amber-900">
          <AlertTriangle size={16} className="shrink-0 mt-0.5" /> {t('auth.err.not_configured')}
        </p>
      )}

      {mode === 'checkEmail' || mode === 'resetSent' ? (
        <div className="text-center space-y-4 py-2">
          <span className="h-16 w-16 rounded-full bg-emerald-50 text-emerald-700 grid place-items-center mx-auto"><MailCheck size={30} /></span>
          <p className="text-forest-800">{mode === 'checkEmail' ? t('auth.checkEmailBody', { email: email.trim() }) : t('auth.resetSent', { email: email.trim() })}</p>
          <button className="btn-primary w-full" onClick={() => { setMode('signIn'); setError(''); }}>{t('auth.backToSignIn')}</button>
        </div>
      ) : (
        <>
          {mode !== 'reset' && (
            <>
              <p className="text-forest-600/80 mb-4">{t('auth.sub')}</p>
              <div className="grid grid-cols-2 gap-1 rounded-full bg-cream-100 p-1 mb-4" role="tablist">
                {[
                  ['signIn', LogIn],
                  ['signUp', UserPlus],
                ].map(([m, Icon]) => (
                  <button
                    key={m}
                    role="tab"
                    aria-selected={mode === m}
                    onClick={() => { setMode(m); setError(''); }}
                    className={`rounded-full min-h-[44px] text-sm font-semibold inline-flex items-center justify-center gap-1.5 ${mode === m ? 'bg-white text-forest-900 shadow-sm' : 'text-forest-600'}`}
                  >
                    <Icon size={16} /> {t(`auth.tab.${m}`)}
                  </button>
                ))}
              </div>
            </>
          )}
          {mode === 'reset' && <p className="text-forest-600/80 mb-4">{t('auth.resetSub')}</p>}

          <form onSubmit={submit} className="space-y-4" noValidate>
            <Field label={t('auth.email')}>
              <div className="relative">
                <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-forest-500" aria-hidden />
                <input
                  className="input !pl-11"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  autoFocus
                />
              </div>
            </Field>

            {mode !== 'reset' && (
              <Field label={t('auth.password')}>
                <div className="relative">
                  <input
                    className="input !pr-12"
                    type={showPw ? 'text' : 'password'}
                    autoComplete={mode === 'signUp' ? 'new-password' : 'current-password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw((s) => !s)}
                    aria-label={showPw ? t('auth.hide') : t('auth.show')}
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-10 w-10 grid place-items-center rounded-full text-forest-600 hover:bg-cream-100"
                  >
                    {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {mode === 'signUp' && <span className="text-xs text-forest-600 mt-1 block">{t('auth.passwordHint')}</span>}
              </Field>
            )}

            {error && <p className="text-sm text-clay-600" role="alert">{error}</p>}

            <button className="btn-primary w-full" disabled={busy || !authService.isAuthConfigured}>
              {busy ? <RefreshCw size={18} className="animate-spin" /> : mode === 'signUp' ? <UserPlus size={18} /> : mode === 'reset' ? <Mail size={18} /> : <LogIn size={18} />}
              {mode === 'signUp' ? t('auth.tab.signUp') : mode === 'reset' ? t('auth.resetSend') : t('auth.tab.signIn')}
            </button>

            <div className="flex flex-wrap justify-between gap-2 text-sm">
              {mode === 'signIn' && (
                <button type="button" className="font-semibold text-forest-600 underline min-h-[44px]" onClick={() => { setMode('reset'); setError(''); }}>
                  {t('auth.forgot')}
                </button>
              )}
              {mode === 'reset' && (
                <button type="button" className="font-semibold text-forest-600 underline min-h-[44px]" onClick={() => { setMode('signIn'); setError(''); }}>
                  {t('auth.backToSignIn')}
                </button>
              )}
              <button type="button" className="font-semibold text-forest-600 underline min-h-[44px] ml-auto" onClick={close}>
                {t('auth.skip')}
              </button>
            </div>
          </form>
        </>
      )}
    </Modal>
  );
}
