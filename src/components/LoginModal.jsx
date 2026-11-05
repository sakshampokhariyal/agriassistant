import { useEffect, useRef, useState } from 'react';
import { Phone, ShieldCheck } from 'lucide-react';
import Modal from './Modal';
import { Field } from './ui';
import { useApp } from '../context/AppContext';

export default function LoginModal() {
  const { loginOpen, setLoginOpen, login, t, toast } = useApp();
  const [step, setStep] = useState('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  const refs = useRef([]);

  useEffect(() => {
    if (loginOpen) {
      setStep('phone');
      setPhone('');
      setOtp(['', '', '', '', '', '']);
      setError('');
    }
  }, [loginOpen]);

  const close = () => setLoginOpen(false);

  const sendOtp = (e) => {
    e?.preventDefault();
    if (!/^[6-9]\d{9}$/.test(phone)) {
      setError(t('auth.invalidPhone'));
      return;
    }
    setError('');
    setSending(true);
    setTimeout(() => {
      setSending(false);
      setStep('otp');
      toast(t('auth.otpSent'), 'info');
      setTimeout(() => refs.current[0]?.focus(), 50);
    }, 900);
  };

  const setDigit = (i, v) => {
    const d = v.replace(/\D/g, '').slice(-1);
    setOtp((o) => o.map((x, idx) => (idx === i ? d : x)));
    if (d && i < 5) refs.current[i + 1]?.focus();
  };

  const onKey = (i, e) => {
    if (e.key === 'Backspace' && !otp[i] && i > 0) refs.current[i - 1]?.focus();
  };

  const verify = (e) => {
    e.preventDefault();
    if (otp.join('') !== '123456') {
      setError(t('auth.invalidOtp'));
      return;
    }
    login(phone);
    toast(t('auth.success'));
    close();
  };

  return (
    <Modal open={loginOpen} onClose={close} title={t('auth.title')} size="sm">
      <p className="text-forest-600/80 mb-4">{t('auth.sub')}</p>
      {step === 'phone' ? (
        <form onSubmit={sendOtp} className="space-y-4">
          <Field label={t('auth.phone')} error={error}>
            <div className="flex gap-2">
              <span className="input !w-auto flex items-center font-bold text-forest-700">+91</span>
              <input
                className="input"
                inputMode="numeric"
                autoComplete="tel-national"
                maxLength={10}
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                placeholder="98xxxxxxxx"
                autoFocus
              />
            </div>
          </Field>
          <button className="btn-primary w-full" disabled={sending}>
            <Phone size={18} /> {sending ? t('common.loading') : t('auth.sendOtp')}
          </button>
          <button type="button" className="btn-ghost w-full" onClick={close}>
            {t('auth.skip')}
          </button>
        </form>
      ) : (
        <form onSubmit={verify} className="space-y-4">
          <div>
            <span className="label">{t('auth.enterOtp')}</span>
            <div className="flex gap-2 justify-between">
              {otp.map((d, i) => (
                <input
                  key={i}
                  ref={(el) => (refs.current[i] = el)}
                  value={d}
                  inputMode="numeric"
                  maxLength={1}
                  aria-label={`OTP ${i + 1}`}
                  onChange={(e) => setDigit(i, e.target.value)}
                  onKeyDown={(e) => onKey(i, e)}
                  className="input !px-0 text-center text-xl font-extrabold !w-12"
                />
              ))}
            </div>
            <p className="text-sm text-earth-700 mt-2 font-semibold">{t('auth.otpHint')}</p>
            {error && <p className="text-sm text-clay-600 mt-1">{error}</p>}
          </div>
          <button className="btn-primary w-full">
            <ShieldCheck size={18} /> {t('auth.verify')}
          </button>
          <div className="flex justify-between text-sm">
            <button type="button" className="font-bold text-forest-600 underline min-h-[44px]" onClick={() => setStep('phone')}>
              {t('auth.change')}
            </button>
            <button type="button" className="font-bold text-forest-600 underline min-h-[44px]" onClick={sendOtp}>
              {t('auth.resend')}
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
}
