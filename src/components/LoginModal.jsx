import { useEffect, useRef, useState } from 'react';
import { Eye, EyeOff, HardDrive, KeyRound, LogIn, Mail, MailCheck, MessageSquareText, RefreshCw, ShieldCheck, Smartphone, UserPlus } from 'lucide-react';
import Modal from './Modal';
import { Field } from './ui';
import { LogoMark, Wordmark } from './BrandLogo';
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
  const [method, setMethod] = useState('phone'); // phone | email – phone first for farmers
  // True once a call fell back to on-device accounts (Supabase missing or unreachable).
  const [localMode, setLocalMode] = useState(authService.authMode() === 'local');

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
      setLocalMode(authService.authMode() === 'local');
    }
  };

  const title = mode === 'reset' || mode === 'resetSent' ? t('auth.resetTitle') : mode === 'checkEmail' ? t('auth.checkEmail') : t('auth.title');

  return (
    <Modal open={loginOpen} onClose={close} title={title} size="sm">
      <div className="-mt-1 mb-4 flex flex-col items-center text-center gap-1.5 rounded-2xl bg-brand-cream py-4 px-3">
        <LogoMark className="h-16 w-16" />
        <Wordmark className="text-2xl" />
        <span className="text-xs font-medium text-brand-navy-dark/80">{t('app.tagline')}</span>
      </div>

      {/* Sign-in method: phone (OTP) or email (password) */}
      <div className="grid grid-cols-2 gap-1 rounded-2xl bg-forest-50 p-1 mb-4" role="tablist" aria-label={t('auth.method')}>
        {[
          ['phone', Smartphone, t('auth.method.phone')],
          ['email', Mail, t('auth.method.email')],
        ].map(([m, Icon, label]) => (
          <button
            key={m}
            type="button"
            role="tab"
            aria-selected={method === m}
            onClick={() => { setMethod(m); setError(''); }}
            className={`rounded-xl min-h-[44px] text-sm font-bold inline-flex items-center justify-center gap-1.5 transition ${method === m ? 'bg-forest-700 text-white shadow-sm' : 'text-forest-700 hover:bg-white/70'}`}
          >
            <Icon size={16} aria-hidden /> {label}
          </button>
        ))}
      </div>

      {method === 'phone' ? (
        <PhoneFlow onDone={close} />
      ) : (
      <>
      {localMode && (
        <p className="mb-4 flex gap-2 rounded-xl bg-sky-100/70 border border-sky-500/20 p-3 text-sm text-forest-800">
          <HardDrive size={16} className="shrink-0 mt-0.5 text-sky-500" /> {t('auth.localNote')}
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

            <button className="btn-primary w-full" disabled={busy}>
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
      </>
      )}
    </Modal>
  );
}

/**
 * Phone + OTP sign-in, fully local: no SMS is sent. Step 1 enters a +91 mobile number,
 * step 2 checks the 4-digit code (demo code shown on screen, with a one-tap fill).
 */
function PhoneFlow({ onDone }) {
  const { login, t, toast, profile, setProfile } = useApp();
  const [step, setStep] = useState('phone'); // phone | otp
  const [phone, setPhone] = useState('');
  const [sentTo, setSentTo] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [resendIn, setResendIn] = useState(0);
  const otpRef = useRef(null);

  useEffect(() => {
    if (resendIn <= 0) return undefined;
    const id = setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [resendIn]);

  useEffect(() => {
    if (step === 'otp') otpRef.current?.focus();
  }, [step]);

  const errText = (c) => t(`auth.err.${c}`) || t('auth.err.unknown');

  const send = async (e) => {
    e?.preventDefault();
    setError('');
    if (!authService.normalizeIndianPhone(phone)) return setError(errText('invalid_phone'));
    setBusy(true);
    const res = await authService.sendPhoneOtp(phone);
    setBusy(false);
    if (res.error) return setError(errText(res.error));
    setSentTo(res.phone);
    setOtp('');
    setStep('otp');
    setResendIn(30);
    toast(t('auth.otpSentTo', { phone: authService.formatPhone(res.phone) }), 'info');
  };

  const verify = async (e, code = otp) => {
    e?.preventDefault();
    setError('');
    if (!/^\d{4}$/.test(code)) return setError(errText('invalid_otp'));
    setBusy(true);
    const res = await authService.verifyPhoneOtp(sentTo, code);
    setBusy(false);
    if (res.error) return setError(errText(res.error));
    login(res.user);
    // Pre-fill the profile's mobile number so forms (e.g. crop-loss claims) can use it.
    if (!profile?.phone) setProfile((p) => ({ ...p, phone: res.user.phone.slice(3) }));
    toast(t('auth.success'));
    onDone();
  };

  if (step === 'otp') {
    return (
      <form onSubmit={verify} className="space-y-4" noValidate>
        <p className="text-forest-700">
          {t('auth.otpSentTo', { phone: authService.formatPhone(sentTo) })}{' '}
          <button type="button" className="font-semibold text-forest-600 underline" onClick={() => { setStep('phone'); setError(''); }}>
            {t('auth.changeNumber')}
          </button>
        </p>
        <Field label={t('auth.otpLabel')}>
          <input
            ref={otpRef}
            className="input text-center text-2xl font-bold tracking-[0.6em]"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={4}
            value={otp}
            onChange={(e) => {
              const v = e.target.value.replace(/\D/g, '').slice(0, 4);
              setOtp(v);
              if (v.length === 4) verify(null, v); // auto-verify when 4 digits are in
            }}
            placeholder="••••"
            aria-describedby="otp-demo"
          />
        </Field>
        <div id="otp-demo" className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-earth-100/70 px-3 py-2 text-sm text-earth-700">
          <span className="flex items-center gap-1.5"><KeyRound size={15} aria-hidden /> {t('auth.otpDemo', { code: authService.DEMO_OTP })}</span>
          <button type="button" className="font-bold underline" onClick={() => { setOtp(authService.DEMO_OTP); verify(null, authService.DEMO_OTP); }}>
            {t('auth.otpFill')}
          </button>
        </div>
        {error && <p className="text-sm text-clay-600" role="alert">{error}</p>}
        <button className="btn-primary w-full" disabled={busy}>
          {busy ? <RefreshCw size={18} className="animate-spin" /> : <ShieldCheck size={18} />} {t('auth.verify')}
        </button>
        <button type="button" className="text-sm font-semibold text-forest-600 underline min-h-[44px] disabled:no-underline disabled:opacity-60" disabled={resendIn > 0 || busy} onClick={send}>
          {resendIn > 0 ? t('auth.resendIn', { s: resendIn }) : t('auth.resend')}
        </button>
      </form>
    );
  }

  return (
    <form onSubmit={send} className="space-y-4" noValidate>
      <Field label={t('auth.phoneLabel')}>
        <div className="flex items-stretch gap-2">
          <span className="input !w-auto shrink-0 flex items-center gap-1 font-semibold text-forest-800 bg-cream-100" aria-hidden>+91</span>
          <input
            className="input min-w-0 text-lg tracking-wide"
            type="tel"
            inputMode="numeric"
            autoComplete="tel-national"
            maxLength={14}
            value={phone}
            onChange={(e) => setPhone(e.target.value.replace(/[^\d\s+-]/g, ''))}
            placeholder="98765 43210"
            aria-label={t('auth.phoneLabel')}
            autoFocus
          />
        </div>
      </Field>
      {error && <p className="text-sm text-clay-600" role="alert">{error}</p>}
      <button className="btn-primary w-full" disabled={busy}>
        {busy ? <RefreshCw size={18} className="animate-spin" /> : <MessageSquareText size={18} />} {t('auth.sendOtp')}
      </button>
      <p className="flex gap-2 rounded-xl bg-sky-100/70 border border-sky-500/20 p-3 text-xs text-forest-800">
        <HardDrive size={15} className="shrink-0 mt-0.5 text-sky-500" aria-hidden /> {t('auth.phoneLocalNote')}
      </p>
      <div className="text-right">
        <button type="button" className="text-sm font-semibold text-forest-600 underline min-h-[44px]" onClick={onDone}>
          {t('auth.skip')}
        </button>
      </div>
    </form>
  );
}
