import type { Subscription, SubscriptionStatus } from '@/@types/subscription';

function str(v: unknown): string {
  return typeof v === 'string' ? v.trim() : typeof v === 'number' ? String(v) : '';
}

function normalizeStatus(raw: unknown): SubscriptionStatus {
  const s = str(raw).toLowerCase();
  if (s === 'active') return 'active';
  if (s === 'expired') return 'expired';
  if (s === 'inactive') return 'inactive';
  return 'active';
}

function calculateRemainingDays(endDateStr: string): number {
  if (!endDateStr) return 0;
  const end = new Date(endDateStr);
  const now = new Date();
  // Set to midnight for fair comparison
  now.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);
  const diffTime = end.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays > 0 ? diffDays : 0;
}

export function mapApiSubscriptionToModel(item: Record<string, unknown>): Subscription | null {
  const id = str(item.id ?? item.subscriptionId);
  const schoolId = str(item.schoolId);
  const schoolName = str(
    item.schoolName ?? 
    item.school_name ?? 
    (item.school as any)?.name ?? 
    (item.school as any)?.schoolName ?? 
    (item.school as any)?.displayName ?? 
    (item.school as any)?.label
  );
  const tenantId = str(item.tenantId ?? item.programId);
  const tenantName = str(
    item.tenantName ?? 
    item.programName ?? 
    (item.tenant as any)?.name ?? 
    (item.tenant as any)?.displayName ?? 
    (item.tenant as any)?.label
  );

  if (!id || !schoolId || !tenantId) return null;

  const startDate = str(item.contractStart ?? item.startDate ?? item.start_date).slice(0, 10);
  const endDate = str(item.contractEnd ?? item.endDate ?? item.end_date).slice(0, 10);

  return {
    id,
    schoolId,
    schoolName: schoolName || schoolId,
    schoolTaxId: str(item.schoolTaxId ?? (item.school as any)?.taxId),
    tenantId,
    tenantName: tenantName || `Tenant ${tenantId}`,
    startDate,
    endDate,
    maxSessions: Number(item.maxConcurrentSessions ?? item.maxSessions ?? item.max_sessions ?? 500),
    loginPolicy: (str(item.loginPolicy ?? item.login_policy) || 'BLOCK_NEW') as any,
    status: normalizeStatus(item.status),
    strictExpiry: Boolean(item.enforceExpiry ?? item.strictExpiry ?? item.strict_expiry),
    remainingDays: Number(item.remainingDays ?? item.remaining_days ?? calculateRemainingDays(endDate)),
    createdAt: str(item.createdAt ?? item.created_at),
    updatedAt: str(item.updatedAt ?? item.updated_at),
  };
}

export function extractSubscriptionsFromResponse(data: unknown): Subscription[] {
  if (Array.isArray(data)) {
    return data
      .map((x) => (x && typeof x === 'object' ? mapApiSubscriptionToModel(x as Record<string, unknown>) : null))
      .filter((x): x is Subscription => Boolean(x));
  }

  if (data && typeof data === 'object') {
    const d = data as Record<string, unknown>;
    const candidates = [d.data, d.items, d.results, d.subscriptions, (d.data as Record<string, unknown> | undefined)?.items];
    for (const c of candidates) {
      const rows = extractSubscriptionsFromResponse(c);
      if (rows.length) return rows;
    }
  }

  return [];
}
