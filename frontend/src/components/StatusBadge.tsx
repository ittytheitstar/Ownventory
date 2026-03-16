import { ItemStatus, STATUS_COLORS, STATUS_LABELS } from '@/types';

interface Props {
  status: ItemStatus;
  className?: string;
}

export function StatusBadge({ status, className = '' }: Props) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[status]} ${className}`}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}
