export type LocalPartnerStatus = 'active' | 'inactive';

export type LocalPartner = {
  id: string;
  name: string;
  contactName: string;
  contactEmail: string;
  quotaSchools: number;
  schoolIds: string[];
  status: LocalPartnerStatus;
  createdAt: string;
  updatedAt: string;
};
