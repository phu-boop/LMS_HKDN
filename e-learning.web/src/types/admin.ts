export type CatalogItem = {
  id: string;
  name: string;
  code: string;
  description?: string;
  type: string;
  isActive: boolean;
};

export type Tenant = {
  id: string;
  name: string;
  code: string;
  subdomain: string;
  domain?: string;
  status: 'active' | 'inactive' | 'pending';
  logoUrl?: string;
  createdAt: string;
};

export type CreateTenantRequest = {
  name: string;
  code: string;
  subdomain: string;
  adminEmail: string;
};
