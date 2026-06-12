import type { ManagedSchool } from '../@types/schoolManagement';

export type SchoolTenantOption = { id: string; name: string };
export type SchoolProgramOption = { id: string; name: string };
export type SchoolPartnerOption = { id: string; name: string };

export const SCHOOL_TENANT_OPTIONS: SchoolTenantOption[] = [
  { id: 'tn-north', name: 'Sở GD&ĐT Miền Bắc' },
  { id: 'tn-central', name: 'Sở GD&ĐT Miền Trung' },
  { id: 'tn-south', name: 'Sở GD&ĐT Miền Nam' },
];

export const SCHOOL_PROGRAM_OPTIONS: SchoolProgramOption[] = [
  { id: 'prg-ela', name: 'English Learning Access' },
  { id: 'prg-stem', name: 'STEM Plus' },
  { id: 'prg-k12', name: 'K12 Core' },
];

export const SCHOOL_PARTNER_OPTIONS: SchoolPartnerOption[] = [
  { id: 'pt-alpha', name: 'Partner Alpha' },
  { id: 'pt-beta', name: 'Partner Beta' },
  { id: 'pt-gamma', name: 'Partner Gamma' },
];

const now = new Date().toISOString();

/** Mock tối giản — màn hình ưu tiên dữ liệu API. */
export const MANAGED_SCHOOLS_INITIAL: ManagedSchool[] = [
  {
    id: 'ms-1',
    schoolCode: 'THPT-NH',
    schoolName: 'THPT Nguyễn Huệ',
    province: 'Hà Nội',
    district: 'Ba Đình',
    startDate: '2026-01-01',
    endDate: '2026-12-31',
    apiStatus: 'ACTIVE',
    operationStatus: 'active',
    createdAt: now,
    updatedAt: now,
  },
];
