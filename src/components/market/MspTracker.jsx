import { Landmark } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { marketCrops } from '../../data/markets';
import { fmtNum } from '../../utils/date';
import { SectionTitle } from '../ui';

/** Officially announced Minimum Support Prices (₹/quintal); tap a crop to see its live mandi prices. */
export default function MspTable({ selected, onPick }) {
  const { t, L, lang } = useApp();
  const rows = Object.entries(marketCrops).filter(([, c]) => c.msp);
  return (
    <section className="card p-5">
      <SectionTitle icon={Landmark}>{t('mk.mspTable')}</SectionTitle>
      <p className="text-sm text-forest-600 -mt-2 mb-3">{t('mk.mspTableSub')}</p>
      <ul className="divide-y divide-black/[0.06]">
        {rows.map(([id, c]) => (
          <li key={id}>
            <button
              onClick={() => onPick?.(id)}
              aria-pressed={selected === id}
              className={`w-full text-left py-2.5 px-2 flex items-center gap-3 rounded-lg ${selected === id ? 'bg-emerald-50' : 'hover:bg-cream-100/60'}`}
            >
              <span className="flex-1 font-medium text-forest-900">{L(c.name)}</span>
              <span className="text-xs text-forest-600">{c.mspSeason}</span>
              <span className="font-semibold text-forest-900 w-24 text-right">₹{fmtNum(c.msp, lang)}</span>
            </button>
          </li>
        ))}
      </ul>
      <p className="text-xs text-forest-600/80 mt-2">{t('mk.mspSource')}</p>
    </section>
  );
}
