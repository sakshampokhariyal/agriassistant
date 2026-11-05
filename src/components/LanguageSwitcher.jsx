import { LANGUAGES } from '../translations';
import { useApp } from '../context/AppContext';

export default function LanguageSwitcher({ variant = 'light', className = '' }) {
  const { lang, setLang, t } = useApp();
  const dark = variant === 'dark';
  return (
    <div
      role="radiogroup"
      aria-label={t('common.language')}
      className={`inline-flex rounded-full p-1 ${dark ? 'bg-white/15' : 'bg-white border border-cream-300'} ${className}`}
    >
      {LANGUAGES.map((l) => {
        const on = lang === l.code;
        return (
          <button
            key={l.code}
            role="radio"
            aria-checked={on}
            onClick={() => on || setLang(l.code)}
            className={`min-h-[40px] min-w-[38px] sm:min-w-[44px] px-2 sm:px-3 rounded-full text-sm font-bold transition ${
              on
                ? dark
                  ? 'bg-cream-50 text-forest-800'
                  : 'bg-forest-700 text-cream-50'
                : dark
                ? 'text-cream-50 hover:bg-white/10'
                : 'text-forest-700 hover:bg-forest-50'
            }`}
          >
            {l.short}
          </button>
        );
      })}
    </div>
  );
}
