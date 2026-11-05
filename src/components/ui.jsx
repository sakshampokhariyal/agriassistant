import { FlaskConical, Inbox } from 'lucide-react';
import { useApp } from '../context/AppContext';

export function DemoBadge({ className = '' }) {
  const { t } = useApp();
  return (
    <span
      title={t('common.demoNote')}
      className={`inline-flex items-center gap-1 rounded-full bg-earth-100 text-earth-700 text-xs font-bold px-2.5 py-1 ${className}`}
    >
      <FlaskConical size={13} aria-hidden /> {t('common.demo')}
    </span>
  );
}

export function DemoNote({ className = '' }) {
  const { t } = useApp();
  return (
    <p className={`flex items-start gap-2 text-xs text-earth-700 bg-earth-100/70 rounded-xl px-3 py-2 ${className}`}>
      <FlaskConical size={14} className="mt-0.5 shrink-0" aria-hidden />
      <span>{t('common.demoNote')}</span>
    </p>
  );
}

export function PageHeader({ title, subtitle, action, demo = false }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3 mb-5">
      <div className="min-w-0">
        <h1 className="text-2xl md:text-3xl font-extrabold text-forest-800 leading-tight">{title}</h1>
        {subtitle && <p className="text-forest-600/80 mt-1 max-w-2xl">{subtitle}</p>}
        {demo && <DemoBadge className="mt-2" />}
      </div>
      {action}
    </div>
  );
}

export function SectionTitle({ children, action, icon: Icon }) {
  return (
    <div className="flex items-center justify-between gap-2 mb-3">
      <h2 className="h-section flex items-center gap-2">
        {Icon && <Icon size={20} className="text-forest-500" aria-hidden />}
        {children}
      </h2>
      {action}
    </div>
  );
}

export function Badge({ children, tone = 'green', className = '' }) {
  const tones = {
    green: 'bg-forest-50 text-forest-700',
    amber: 'bg-earth-100 text-earth-700',
    red: 'bg-clay-100 text-clay-600',
    sky: 'bg-sky-100 text-sky-500',
    gray: 'bg-cream-200 text-forest-700',
  };
  return (
    <span className={`inline-flex items-center gap-1 rounded-full text-xs font-bold px-2.5 py-1 ${tones[tone]} ${className}`}>
      {children}
    </span>
  );
}

export function ProgressBar({ value, tone = 'bg-forest-500' }) {
  return (
    <div
      className="h-2.5 rounded-full bg-cream-200 overflow-hidden"
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div className={`h-full rounded-full ${tone} transition-all duration-700`} style={{ width: `${value}%` }} />
    </div>
  );
}

export function EmptyState({ icon: Icon = Inbox, text, action }) {
  return (
    <div className="flex flex-col items-center text-center py-10 px-4 text-forest-600/70">
      <div className="h-14 w-14 rounded-full bg-forest-50 grid place-items-center mb-3">
        <Icon size={26} className="text-forest-400" aria-hidden />
      </div>
      <p className="max-w-xs">{text}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function Skeleton({ className = '' }) {
  return <div className={`animate-pulse rounded-xl bg-cream-200 ${className}`} />;
}

export function Field({ label, children, error }) {
  return (
    <label className="block">
      <span className="label">{label}</span>
      {children}
      {error && <span className="text-sm text-clay-600 mt-1 block">{error}</span>}
    </label>
  );
}

/** Render **bold**, *italic* and "• " bullet lines from assistant text. */
export function RichText({ text }) {
  const inline = (s) =>
    s.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g).map((part, i) => {
      if (part.startsWith('**')) return <strong key={i}>{part.slice(2, -2)}</strong>;
      if (part.startsWith('*') && part.length > 2) return <em key={i}>{part.slice(1, -1)}</em>;
      return part;
    });
  return (
    <div className="space-y-1.5">
      {text.split('\n').map((line, i) =>
        line.trim() === '' ? (
          <div key={i} className="h-1" />
        ) : line.startsWith('• ') ? (
          <p key={i} className="pl-4 relative">
            <span className="absolute left-0 text-forest-500">•</span>
            {inline(line.slice(2))}
          </p>
        ) : (
          <p key={i}>{inline(line)}</p>
        )
      )}
    </div>
  );
}
