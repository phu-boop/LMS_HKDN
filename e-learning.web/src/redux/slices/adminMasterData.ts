import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import axios from '@/utils/axios';
import { API_ENDPOINTS } from '@/constants/apiEndpoints';
import type { SuperAdminSchool, SuperAdminTenant } from '@/_mock/_superAdmin';
import { dispatch } from '../store';

type AuthRole = { id: string; name: string; code?: string };

type AdminMasterDataState = {
  isLoading: boolean;
  loaded: boolean;
  error: string | null;
  roles: AuthRole[];
  tenants: SuperAdminTenant[];
  schools: SuperAdminSchool[];
};

const initialState: AdminMasterDataState = {
  isLoading: false,
  loaded: false,
  error: null,
  roles: [],
  tenants: [],
  schools: [],
};

function normalizeRole(item: Record<string, unknown>): AuthRole | null {
  const id = item.id ?? item.code ?? item.roleId ?? item.value ?? item.roleCode;
  const code = item.code ?? item.roleCode ?? item.roleId ?? item.id;
  const name = item.name ?? item.roleName ?? item.displayName ?? item.title ?? item.label;
  const roleId = typeof id === 'string' ? id.trim() : typeof id === 'number' ? String(id) : '';
  const roleCode = typeof code === 'string' ? code.trim() : '';
  if (!roleId) return null;
  if (typeof name !== 'string' || !name.trim()) return null;
  return { id: roleId, name: name.trim(), code: roleCode || undefined };
}

function extractRolesFromResponse(data: unknown): AuthRole[] {
  if (Array.isArray(data)) {
    return data
      .map((x) => (x && typeof x === 'object' ? normalizeRole(x as Record<string, unknown>) : null))
      .filter((x): x is AuthRole => Boolean(x));
  }
  if (data && typeof data === 'object') {
    const d = data as Record<string, unknown>;
    const candidates = [d.data, d.items, d.results, d.roles, (d.data as Record<string, unknown> | undefined)?.items];
    for (const c of candidates) {
      const roles = extractRolesFromResponse(c);
      if (roles.length) return roles;
    }
  }
  return [];
}

function normalizeSchoolRow(item: Record<string, unknown>): SuperAdminSchool | null {
  const id = item.id ?? item.schoolId ?? item.value;
  const name = item.name ?? item.schoolName ?? item.title ?? item.label;
  const tenantRaw = item.tenant;
  const tenantObj = tenantRaw && typeof tenantRaw === 'object' ? (tenantRaw as Record<string, unknown>) : undefined;
  const tenantId =
    (typeof item.tenantId === 'string' && item.tenantId) ||
    (typeof item.programId === 'string' && item.programId) ||
    (typeof item.tenantCode === 'string' && item.tenantCode) ||
    (typeof item.tenant_id === 'string' && item.tenant_id) ||
    (typeof item.organizationId === 'string' && item.organizationId) ||
    (typeof item.programId === 'number' && String(item.programId)) ||
    (typeof item.tenantId === 'number' && String(item.tenantId)) ||
    (tenantObj && typeof tenantObj.id === 'string' && tenantObj.id) ||
    (tenantObj && typeof tenantObj.id === 'number' && String(tenantObj.id)) ||
    '';
  const tenantName =
    (typeof item.tenantName === 'string' && item.tenantName) ||
    (typeof item.programName === 'string' && item.programName) ||
    (typeof item.tenant_name === 'string' && item.tenant_name) ||
    (tenantObj && typeof tenantObj.name === 'string' && tenantObj.name) ||
    '';
  const schoolId = typeof id === 'string' ? id.trim() : typeof id === 'number' ? String(id) : '';
  if (!schoolId) return null;
  if (typeof name !== 'string' || !name.trim()) return null;
  const tenantIdNormalized = typeof tenantId === 'string' ? tenantId.trim() : '';
  return {
    id: schoolId,
    name: name.trim(),
    tenantId: tenantIdNormalized,
    ...(tenantName.trim() ? { tenantName: tenantName.trim() } : {}),
  };
}

function extractSchoolsFromResponse(data: unknown): SuperAdminSchool[] {
  if (Array.isArray(data)) {
    return data
      .map((x) => (x && typeof x === 'object' ? normalizeSchoolRow(x as Record<string, unknown>) : null))
      .filter((x): x is SuperAdminSchool => Boolean(x));
  }
  if (data && typeof data === 'object') {
    const d = data as Record<string, unknown>;
    const candidates = [d.data, d.items, d.results, d.schools, (d.data as Record<string, unknown> | undefined)?.items];
    for (const c of candidates) {
      const schools = extractSchoolsFromResponse(c);
      if (schools.length) return schools;
    }
  }
  return [];
}

function normalizeTenantRow(item: Record<string, unknown>): SuperAdminTenant | null {
  const id = item.id ?? item.tenantId ?? item.programId ?? item.value ?? item.code;
  const name = item.name ?? item.tenantName ?? item.programName ?? item.displayName ?? item.title ?? item.label;
  const tenantId = typeof id === 'string' ? id.trim() : typeof id === 'number' ? String(id) : '';
  if (!tenantId) return null;
  if (typeof name !== 'string' || !name.trim()) return null;
  return { id: tenantId, name: name.trim() };
}

function extractTenantsFromResponse(data: unknown): SuperAdminTenant[] {
  if (Array.isArray(data)) {
    return data
      .map((x) => (x && typeof x === 'object' ? normalizeTenantRow(x as Record<string, unknown>) : null))
      .filter((x): x is SuperAdminTenant => Boolean(x));
  }
  if (data && typeof data === 'object') {
    const d = data as Record<string, unknown>;
    const candidates = [d.data, d.items, d.results, d.tenants, d.programs, (d.data as Record<string, unknown> | undefined)?.items];
    for (const c of candidates) {
      const tenants = extractTenantsFromResponse(c);
      if (tenants.length) return tenants;
    }
  }
  return [];
}

function deriveTenantsFromSchools(schools: SuperAdminSchool[]): SuperAdminTenant[] {
  const tenantMap = new Map<string, string>();
  for (const school of schools) {
    if (!school.tenantId) continue;
    if (!tenantMap.has(school.tenantId)) {
      tenantMap.set(school.tenantId, school.tenantName?.trim() || school.tenantId);
    }
  }
  return [...tenantMap.entries()].map(([id, name]) => ({ id, name }));
}

const slice = createSlice({
  name: 'adminMasterData',
  initialState,
  reducers: {
    startLoading(state) {
      state.isLoading = true;
      state.error = null;
    },
    hasError(state, action: PayloadAction<string>) {
      state.isLoading = false;
      state.loaded = true;
      state.error = action.payload;
    },
    loadSuccess(
      state,
      action: PayloadAction<{ roles: AuthRole[]; tenants: SuperAdminTenant[]; schools: SuperAdminSchool[] }>
    ) {
      state.isLoading = false;
      state.loaded = true;
      state.error = null;
      state.roles = action.payload.roles;
      state.tenants = action.payload.tenants;
      state.schools = action.payload.schools;
    },
  },
});

export const { startLoading, hasError, loadSuccess } = slice.actions;
export default slice.reducer;
export type { AuthRole };

export function fetchAdminMasterData() {
  return async () => {
    dispatch(startLoading());

    let roles: AuthRole[] = [];
    try {
      const res = await axios.get(API_ENDPOINTS.authRoles, {
        params: { roleType: 'admin' },
      });
      roles = extractRolesFromResponse(res.data);
    } catch {
      /* một API lỗi không được làm hỏng cả batch */
    }

    let schools: SuperAdminSchool[] = [];
    try {
      const res = await axios.get(API_ENDPOINTS.schoolsList, {
        params: { page: 1, pageSize: 1000, status: '', search: '' },
      });
      schools = extractSchoolsFromResponse(res.data);
    } catch {
      /* ignore */
    }

    let tenantsFromApi: SuperAdminTenant[] = [];
    if (API_ENDPOINTS.tenantsList) {
      try {
        const res = await axios.get(API_ENDPOINTS.tenantsList, {
          params: { page: 1, pageSize: 1000 },
        });
        tenantsFromApi = extractTenantsFromResponse(res.data);
      } catch {
        /* ignore — vẫn có thể suy tenant từ schools */
      }
    }

    // Some backends return schools without tenant/program reference.
    // If tenant API returns exactly one tenant, map all missing schools to that tenant to keep UI usable.
    let normalizedSchools = schools;
    if (tenantsFromApi.length === 1) {
      const onlyTenant = tenantsFromApi[0];
      normalizedSchools = schools.map((s) =>
        s.tenantId
          ? s
          : {
              ...s,
              tenantId: onlyTenant.id,
              tenantName: s.tenantName || onlyTenant.name,
            }
      );
    }

    const tenants = tenantsFromApi.length ? tenantsFromApi : deriveTenantsFromSchools(normalizedSchools);

    dispatch(loadSuccess({ roles, tenants, schools: normalizedSchools }));

    if (!roles.length && !normalizedSchools.length && !tenants.length) {
      dispatch(hasError('Không tải được danh mục tenant / trường / vai trò'));
    }
  };
}
