import { Plus } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { fieldLabel } from '../utils/fields';

/** Field / crop sub-tabs ("Field 1 · Ragi"). Active field is shared app-wide. */
export default function FieldTabs({ onAdd, className = '' }) {
  const { t, L, crops, activeField, setActiveFieldId } = useApp();
  return (
    <div className={`flex gap-2 overflow-x-auto scrollbar-none pb-1 -mx-4 px-4 md:mx-0 md:px-0 ${className}`} role="tablist" aria-label={t('fld.fields')}>
      {crops.map((f) => {
        const on = activeField?.id === f.id;
        return (
          <button
            key={f.id}
            role="tab"
            aria-selected={on}
            onClick={() => setActiveFieldId(f.id)}
            className={`chip shrink-0 !min-h-[46px] !px-4 ${on ? 'chip-on' : 'chip-off'}`}
          >
            {fieldLabel(f, t, L)}
          </button>
        );
      })}
      {onAdd && (
        <button onClick={onAdd} className="chip chip-off shrink-0 !min-h-[46px] border-dashed">
          <Plus size={16} /> {t('fld.add')}
        </button>
      )}
    </div>
  );
}
