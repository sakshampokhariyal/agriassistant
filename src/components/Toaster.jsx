import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, Info, AlertTriangle } from 'lucide-react';
import { useApp } from '../context/AppContext';

const icons = { success: CheckCircle2, info: Info, error: AlertTriangle };
const tones = {
  success: 'bg-forest-700 text-cream-50',
  info: 'bg-forest-800 text-cream-50',
  error: 'bg-clay-600 text-white',
};

export default function Toaster() {
  const { toasts, dismissToast } = useApp();
  return (
    <div className="fixed z-[80] left-0 right-0 bottom-44 lg:bottom-24 md:left-auto md:right-6 flex flex-col items-center md:items-end gap-2 px-4 pointer-events-none" aria-live="polite">
      <AnimatePresence>
        {toasts.map((m) => {
          const Icon = icons[m.type] || Info;
          return (
            <motion.button
              key={m.id}
              onClick={() => dismissToast(m.id)}
              initial={{ opacity: 0, y: 20, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10 }}
              className={`pointer-events-auto flex items-center gap-2.5 rounded-2xl px-4 py-3 shadow-lift text-left font-semibold max-w-sm ${tones[m.type]}`}
            >
              <Icon size={20} className="shrink-0" aria-hidden />
              <span>{m.message}</span>
            </motion.button>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
