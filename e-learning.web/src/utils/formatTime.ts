import { format, getTime, formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';

// ----------------------------------------------------------------------

export function fDate(date: Date | string | number) {
  if (!date) return '—';
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return '—';
  return format(d, 'dd MMMM yyyy', { locale: vi });
}

export function fDateTime(date: Date | string | number) {
  if (!date) return '—';
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return '—';
  return format(d, 'dd MMM yyyy p', { locale: vi });
}

export function fTimestamp(date: Date | string | number) {
  if (!date) return 0;
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return 0;
  return getTime(d);
}

export function fDateTimeSuffix(date: Date | string | number) {
  if (!date) return '—';
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return '—';
  return format(d, 'dd/MM/yyyy hh:mm p', { locale: vi });
}

export function fToNow(date: Date | string | number) {
  if (!date) return '—';
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return '—';
  return formatDistanceToNow(d, {
    addSuffix: true,
    locale: vi,
  });
}
