import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import axios from '@/utils/axios';
import { API_ENDPOINTS } from '@/constants/apiEndpoints';
import type { ProgramTenant } from '@/@types/programTenant';
import { PROGRAM_TENANTS_INITIAL } from '@/_mock/_programTenants';
import { dispatch } from '../store';
import { sanitizeUiMessage } from '@/utils/sanitizeUiMessage';

type ProgramTenantState = {
  isLoading: boolean;
  loaded: boolean;
  error: string | null;
  items: ProgramTenant[];
};

const initialState: ProgramTenantState = {
  isLoading: false,
  loaded: false,
  error: null,
  items: [],
};

function normalizeStatus(raw: unknown): ProgramTenant['status'] {
  if (typeof raw !== 'string') return 'active';
  return raw.toLowerCase() === 'inactive' ? 'inactive' : 'active';
}

function normalizeProgramTenant(item: Record<string, unknown>): ProgramTenant | null {
  const idRaw = item.id ?? item.tenantId ?? item.programId ?? item.value;
  const nameRaw = item.name ?? item.programName ?? item.tenantName ?? item.displayName ?? item.title;
  const codeRaw = item.code ?? item.programCode ?? item.tenantCode;
  const subdomainRaw = item.subdomain ?? item.domain ?? item.subDomain;
  const statusRaw = item.status;

  const id = typeof idRaw === 'string' ? idRaw.trim() : typeof idRaw === 'number' ? String(idRaw) : '';
  const name = typeof nameRaw === 'string' ? nameRaw.trim() : '';
  const code =
    typeof codeRaw === 'string' && codeRaw.trim()
      ? codeRaw.trim()
      : name
          .toUpperCase()
          .replace(/[^A-Z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '')
          .slice(0, 12);
  const subdomain = typeof subdomainRaw === 'string' ? subdomainRaw.trim().toLowerCase() : '';

  if (!id || !name) return null;
  return {
    id,
    name,
    code,
    subdomain,
    status: normalizeStatus(statusRaw),
    createdAt: typeof item.createdAt === 'string' ? item.createdAt : new Date().toISOString(),
    updatedAt: typeof item.updatedAt === 'string' ? item.updatedAt : new Date().toISOString(),
  };
}

function extractProgramTenants(data: unknown): ProgramTenant[] {
  if (Array.isArray(data)) {
    return data
      .map((x) =>
        x && typeof x === 'object' ? normalizeProgramTenant(x as Record<string, unknown>) : null
      )
      .filter((x): x is ProgramTenant => Boolean(x));
  }
  if (data && typeof data === 'object') {
    const d = data as Record<string, unknown>;
    const candidates = [d.data, d.items, d.results, d.programs, d.tenants, (d.data as Record<string, unknown> | undefined)?.items];
    for (const c of candidates) {
      const rows = extractProgramTenants(c);
      if (rows.length) return rows;
    }
  }
  return [];
}

const slice = createSlice({
  name: 'programTenant',
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
    loadSuccess(state, action: PayloadAction<ProgramTenant[]>) {
      state.isLoading = false;
      state.loaded = true;
      state.error = null;
      state.items = action.payload;
    },
    upsertSuccess(state, action: PayloadAction<ProgramTenant>) {
      const idx = state.items.findIndex((x) => x.id === action.payload.id);
      if (idx >= 0) state.items[idx] = action.payload;
      else state.items = [action.payload, ...state.items];
      state.error = null;
    },
    updateStatusSuccess(state, action: PayloadAction<{ id: string; status: ProgramTenant['status'] }>) {
      state.items = state.items.map((x) =>
        x.id === action.payload.id ? { ...x, status: action.payload.status, updatedAt: new Date().toISOString() } : x
      );
      state.error = null;
    },
  },
});

export const { startLoading, hasError, loadSuccess, upsertSuccess, updateStatusSuccess } = slice.actions;
export default slice.reducer;

export function fetchProgramTenants() {
  return async () => {
    dispatch(startLoading());
    try {
      const res = await axios.get(API_ENDPOINTS.tenantsList, {
        params: { page: 1, pageSize: 1000 },
      });
      const rows = extractProgramTenants(res.data);
      dispatch(loadSuccess(rows.length ? rows : PROGRAM_TENANTS_INITIAL));
    } catch {
      dispatch(loadSuccess(PROGRAM_TENANTS_INITIAL));
    }
  };
}

export function upsertProgramTenant(input: {
  id?: string;
  name: string;
  code: string;
  subdomain: string;
  status: ProgramTenant['status'];
}) {
  return async () => {
    dispatch(startLoading());
    try {
      let res;
      if (input.id && !input.id.startsWith('tenant-')) {
        res = await axios.put(`/api/admin/tenants/${input.id}`, input);
      } else {
        res = await axios.post(API_ENDPOINTS.tenantsCreate, input);
      }
      const raw = (res.data as Record<string, unknown>)?.data ?? res.data;
      const created = normalizeProgramTenant(raw as Record<string, unknown>);
      if (created) {
        dispatch(upsertSuccess(created));
      }
      dispatch(fetchProgramTenants());
    } catch (e) {
      dispatch(hasError(sanitizeUiMessage((e as Error)?.message || 'Không thể lưu tenant chương trình')));
      throw e;
    }
  };
}

export function toggleProgramTenantStatus(id: string) {
  return async (dispatch: any, getState: () => { programTenant: ProgramTenantState }) => {
    const row = getState().programTenant.items.find((x) => x.id === id);
    if (!row) return;
    const nextStatus = row.status === 'active' ? 'inactive' : 'active';
    const apiStatus = nextStatus === 'active' ? 'ACTIVE' : 'INACTIVE';
    try {
      await axios.patch(API_ENDPOINTS.tenantsStatus(id), { status: apiStatus });
      dispatch(updateStatusSuccess({ id, status: nextStatus }));
    } catch (e) {
      dispatch(hasError(sanitizeUiMessage((e as Error)?.message || 'Không thể cập nhật trạng thái')));
    }
  };
}
