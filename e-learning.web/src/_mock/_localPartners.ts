import type { LocalPartner } from '../@types/localPartner';

const now = new Date().toISOString();

export const LOCAL_PARTNERS_INITIAL: LocalPartner[] = [
  {
    id: 'lp-alpha',
    name: 'Local Partner Alpha',
    contactName: 'Nguyen Van A',
    contactEmail: 'alpha.partner@aig.vn',
    quotaSchools: 2,
    schoolIds: [],
    status: 'active',
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'lp-beta',
    name: 'Local Partner Beta',
    contactName: 'Tran Thi B',
    contactEmail: 'beta.partner@aig.vn',
    quotaSchools: 3,
    schoolIds: [],
    status: 'active',
    createdAt: now,
    updatedAt: now,
  },
];
