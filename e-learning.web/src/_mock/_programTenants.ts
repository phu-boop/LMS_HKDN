import type { ProgramTenant } from '../@types/programTenant';

const now = new Date().toISOString();

export const PROGRAM_TENANTS_INITIAL: ProgramTenant[] = [
  {
    id: 'tenant-stem',
    name: 'STEM Program',
    code: 'STEM',
    subdomain: 'stem',
    status: 'active',
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'tenant-english',
    name: 'English Program',
    code: 'ENG',
    subdomain: 'english',
    status: 'active',
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'tenant-kns',
    name: 'KNS Program',
    code: 'KNS',
    subdomain: 'kns',
    status: 'inactive',
    createdAt: now,
    updatedAt: now,
  },
];
