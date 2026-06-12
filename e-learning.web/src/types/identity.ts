/**
 * API response models for Identity module.
 * Derived from actual BE responses.
 */

// ----------------------------------------------------------------------

export type TenantBranding = {
  tenantCode: string;
  name: string;
  subdomain: string;
  domain: string;
  isWhiteLabel: boolean;
  avatarUrl: string | null;
  logoUrl: string | null;
  primaryColor?: string;
  watermarkSettings: unknown | null;
};

// POST /identity/identify
export type IdentifyResponse = {
  tenantBranding?: TenantBranding;
  nextStep: 'PASSWORD' | 'SELECT_WORKSPACE' | string;
};

// POST /identity/login (hoặc /api/identity/auth/login)
export type LoginResponse = {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: string;
  tenantBranding?: TenantBranding;
};

// GET /identity/workspaces
export type Workspace = {
  tenantId: string;
  tenantCode: string;
  name: string;
  subdomain: string;
  domain: string;
  logoUrl: string | null;
  avatarUrl: string | null;
  isWhiteLabel: boolean;
};

// POST /identity/workspaces/{tenantId}/select
export type SelectWorkspaceResponse = {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: string;
  tenantBranding?: TenantBranding;
};
