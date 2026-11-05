import { ShieldAlert, CheckCircle2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Badge, ProgressBar } from './ui';

const tone = { low: 'green', medium: 'amber', high: 'red' };

export default function DiseaseResult({ result, compact = false }) {
  const { t, L } = useApp();
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone="amber">{t('common.demo')}</Badge>
        <span className="text-xs font-bold text-forest-500 uppercase tracking-wide">{t('crops.result')}</span>
      </div>
      <div className="flex items-start gap-3">
        <span className="h-11 w-11 shrink-0 rounded-2xl bg-clay-100 text-clay-600 grid place-items-center">
          <ShieldAlert size={22} />
        </span>
        <div>
          <h3 className="font-extrabold text-forest-800 text-lg leading-tight">{L(result.name)}</h3>
          <p className="text-forest-700 mt-1">{L(result.summary)}</p>
        </div>
      </div>
      <div className={`grid gap-3 ${compact ? 'grid-cols-1' : 'sm:grid-cols-2'}`}>
        <div className="rounded-xl bg-cream-100 p-3">
          <div className="flex justify-between text-sm font-bold text-forest-700 mb-1.5">
            <span>{t('crops.confidence')}</span>
            <span>{result.confidence}%</span>
          </div>
          <ProgressBar value={result.confidence} />
        </div>
        <div className="rounded-xl bg-cream-100 p-3 flex items-center justify-between">
          <span className="text-sm font-bold text-forest-700">{t('crops.severity')}</span>
          <Badge tone={tone[result.severity]}>{t('sev.' + result.severity)}</Badge>
        </div>
      </div>
      <div>
        <h4 className="font-extrabold text-forest-800 mb-2">{t('crops.nextSteps')}</h4>
        <ol className="space-y-2">
          {result.steps.map((s, i) => (
            <li key={i} className="flex gap-2.5">
              <CheckCircle2 size={20} className="text-forest-500 shrink-0 mt-0.5" aria-hidden />
              <span>{L(s)}</span>
            </li>
          ))}
        </ol>
      </div>
      <p className="text-xs text-earth-700">{t('common.demoNote')}</p>
    </div>
  );
}
