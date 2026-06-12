import type { ManagedSchool, SchoolOperationStatus } from '@/@types/schoolManagement';

function str(v: unknown): string {
  return typeof v === 'string' ? v.trim() : typeof v === 'number' ? String(v) : '';
}

function toIsoDate(value: unknown): string {
  if (typeof value !== 'string' || !value.trim()) return new Date().toISOString();
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return new Date().toISOString();
  return d.toISOString();
}

/** yyyy-mm-dd cho input date; rỗng nếu null/invalid. */
function toDateInput(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (typeof value !== 'string' || !value.trim()) return '';
  const s = value.trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return '';
  return d.toISOString().slice(0, 10);
}

function normalizeOperationStatus(raw: unknown): SchoolOperationStatus {
  const u = str(raw).toUpperCase();
  if (u === 'ACTIVE') return 'active';
  if (u === 'INACTIVE' || u === 'SUSPENDED' || u === 'DISABLED') return 'inactive';
  const lower = str(raw).toLowerCase();
  if (lower === 'inactive' || lower === 'suspended' || lower === 'disabled') return 'inactive';
  return 'active';
}

/** Map GET list/detail item → ManagedSchool (schema admin schools). */
export function mapApiSchoolToManaged(item: Record<string, unknown>): ManagedSchool | null {
  const idRaw = item.id ?? item.schoolId ?? item._id ?? item.value ?? item.code;
  const id = typeof idRaw === 'string' ? idRaw.trim() : typeof idRaw === 'number' ? String(idRaw) : '';
  const schoolName = str(item.schoolName ?? item.name ?? item.displayName ?? item.label ?? item.title) || id;
  const schoolCode = str(item.schoolCode ?? item.code ?? item.identifier) || schoolName;
  if (!id) return null;

  const startDate = toDateInput(item.contractStartDate ?? item.contract_start_date);
  const endDate = toDateInput(item.contractEndDate ?? item.contract_end_date);

  const apiStatusRaw = str(item.status ?? item.state);
  const apiStatus = apiStatusRaw || 'ACTIVE';
  const operationStatus = normalizeOperationStatus(apiStatusRaw || 'ACTIVE');

  const address = str(item.address);
  const province = str(item.province);
  const district = str(item.district);
  const taxId = str(item.taxId ?? item.tax_id);
  const contactName = str(item.contactName ?? item.contact_name);
  const contactEmail = str(item.contactEmail ?? item.contact_email);
  const contactPhone = str(item.contactPhone ?? item.contact_phone);

  const row: ManagedSchool = {
    id,
    schoolCode,
    schoolName,
    startDate,
    endDate,
    apiStatus,
    operationStatus,
    createdAt: toIsoDate(item.createdAt ?? item.created_at),
    updatedAt: toIsoDate(item.updatedAt ?? item.updated_at ?? item.createdAt),
  };
  if (address) row.address = address;
  if (province) row.province = province;
  if (district) row.district = district;
  if (taxId) row.taxId = taxId;
  if (contactName) row.contactName = contactName;
  if (contactEmail) row.contactEmail = contactEmail;
  if (contactPhone) row.contactPhone = contactPhone;
  return row;
}

export function extractSchoolsFromListResponse(data: unknown): ManagedSchool[] {
  if (Array.isArray(data)) {
    return data
      .map((x) => (x && typeof x === 'object' ? mapApiSchoolToManaged(x as Record<string, unknown>) : null))
      .filter((x): x is ManagedSchool => Boolean(x));
  }

  if (data && typeof data === 'object') {
    const d = data as Record<string, unknown>;
    const candidates = [
      d.data,
      d.items,
      d.results,
      d.schools,
      d.payload,
      d.content,
      (d.data as Record<string, unknown> | undefined)?.items,
      (d.data as Record<string, unknown> | undefined)?.data,
    ];
    for (const candidate of candidates) {
      const rows = extractSchoolsFromListResponse(candidate);
      if (rows.length) return rows;
    }
  }

  return [];
}

function nullIfEmpty(s: string): string | null {
  const t = s.trim();
  return t.length ? t : null;
}

/** Body POST/PUT — các field nhập trên form; ngày hợp đồng không có trên UI → null. */
export function buildSchoolWritePayload(input: {
  schoolCode: string;
  schoolName: string;
  address: string;
  province: string;
  district: string;
  taxId: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  contractStartDate?: string;
  contractEndDate?: string;
}): Record<string, string | null> {
  return {
    code: input.schoolCode.trim(),
    name: input.schoolName.trim(),
    address: nullIfEmpty(input.address),
    province: nullIfEmpty(input.province),
    district: nullIfEmpty(input.district),
    taxId: nullIfEmpty(input.taxId),
    contactName: nullIfEmpty(input.contactName),
    contactEmail: nullIfEmpty(input.contactEmail),
    contactPhone: nullIfEmpty(input.contactPhone),
    contractStartDate: input.contractStartDate ? input.contractStartDate : null,
    contractEndDate: input.contractEndDate ? input.contractEndDate : null,
  };
}

export type TenantOption = { id: string; name: string };

export function extractTenantOptionsFromResponse(data: unknown): TenantOption[] {
  const rows: TenantOption[] = [];
  const pushRow = (item: Record<string, unknown>) => {
    const idRaw = item.id ?? item.tenantId ?? item.programId ?? item.value ?? item.code;
    const nameRaw =
      item.name ?? item.tenantName ?? item.programName ?? item.displayName ?? item.title ?? item.label;
    const id = typeof idRaw === 'string' ? idRaw.trim() : typeof idRaw === 'number' ? String(idRaw) : '';
    const name = typeof nameRaw === 'string' ? nameRaw.trim() : '';
    if (id && name) rows.push({ id, name });
  };

  if (Array.isArray(data)) {
    data.forEach((x) => {
      if (x && typeof x === 'object') pushRow(x as Record<string, unknown>);
    });
    return rows;
  }
  if (data && typeof data === 'object') {
    const d = data as Record<string, unknown>;
    const candidates = [d.data, d.items, d.results, d.tenants, d.programs, (d.data as Record<string, unknown> | undefined)?.items];
    for (const c of candidates) {
      const inner = extractTenantOptionsFromResponse(c);
      if (inner.length) return inner;
    }
  }
  return rows;
}
