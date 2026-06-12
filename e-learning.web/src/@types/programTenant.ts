export type ProgramTenantStatus = 'active' | 'inactive';

export type ProgramTenant = {
  id: string;
  name: string;
  code: string;
  subdomain: string;
  status: ProgramTenantStatus;
  createdAt: string;
  updatedAt: string;
};

export type CreateProgramTenantRequest = {
  name: string;
  code: string;
  subdomain: string;
  status: ProgramTenantStatus;
  logoUrl?: string | null;
  avatarUrl?: string | null;
  description?: string | null;
  watermarkSettings?: string | null;
};
