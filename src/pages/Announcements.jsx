import { Megaphone } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { EmptyState, PageHeader } from '../components/ui';

/** Announcements tab – intentionally empty for now; content will come from the backend later. */
export default function Announcements() {
  const { t } = useApp();
  return (
    <div className="max-w-4xl">
      <PageHeader title={t('ann.title')} />
      <div className="card">
        <EmptyState icon={Megaphone} text={t('ann.none')} />
      </div>
    </div>
  );
}
