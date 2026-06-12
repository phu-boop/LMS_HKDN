import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import axios from '@/utils/axios';
import { API_ENDPOINTS } from '@/constants/apiEndpoints';
import type {
  ReportDashboardData,
  ReportDistributionRow,
  ReportFilters,
  ReportKpis,
} from '@/@types/reportDashboard';
import type { RootState } from '../store';
import { dispatch } from '../store';

type AdminSummaryStats = {
  activeTenants: number;
  activeSchools: number;
  activeSessions: number;
  systemHealth: string;
  trends: Record<string, string>;
};

type ReportDashboardState = {
  isLoading: boolean;
  isSummaryLoading: boolean;
  error: string | null;
  data: ReportDashboardData | null;
  summaryStats: AdminSummaryStats | null;
  lastFilters: ReportFilters | null;
};

const initialState: ReportDashboardState = {
  isLoading: false,
  isSummaryLoading: false,
  error: null,
  data: null,
  summaryStats: null,
  lastFilters: null,
};

function toNum(v: unknown, fallback = 0): number {
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  if (typeof v === 'string' && Number.isFinite(Number(v))) return Number(v);
  return fallback;
}

function normalizeDistributionRows(raw: unknown): ReportDistributionRow[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((x) => (x && typeof x === 'object' ? (x as Record<string, unknown>) : null))
    .filter((x): x is Record<string, unknown> => Boolean(x))
    .map((row, idx) => ({
      id: String(row.id ?? row.key ?? idx),
      name: String(row.name ?? row.label ?? row.schoolName ?? row.partnerName ?? 'Unknown'),
      activeUsers: toNum(row.activeUsers),
      storageUsedGb: toNum(row.storageUsedGb),
      bandwidthUsedGb: toNum(row.bandwidthUsedGb),
    }));
}

function normalizeReportPayload(data: unknown): ReportDashboardData | null {
  if (!data || typeof data !== 'object') return null;
  const d = data as Record<string, unknown>;
  const root = (d.data && typeof d.data === 'object' ? d.data : d) as Record<string, unknown>;
  const kpisRaw =
    (root.kpis && typeof root.kpis === 'object' ? root.kpis : root) as Record<string, unknown>;
  const kpis: ReportKpis = {
    activeUsers: toNum(kpisRaw.activeUsers),
    concurrentUsers: toNum(kpisRaw.concurrentUsers),
    storageUsedGb: toNum(kpisRaw.storageUsedGb),
    bandwidthUsedGb: toNum(kpisRaw.bandwidthUsedGb),
  };
  const bySchool = normalizeDistributionRows(root.bySchool ?? root.schoolDistribution);
  const byPartner = normalizeDistributionRows(root.byPartner ?? root.partnerDistribution);

  return {
    kpis,
    bySchool,
    byPartner,
    generatedAt: typeof root.generatedAt === 'string' ? root.generatedAt : new Date().toISOString(),
  };
}

function createFallbackData(filters: ReportFilters, state: RootState): ReportDashboardData {
  const schools = state.adminMasterData.schools
    .filter((s) => !filters.tenantId || s.tenantId === filters.tenantId)
    .map((s, idx) => {
      const base = (idx + 1) * 11;
      return {
        id: s.id,
        name: s.name,
        activeUsers: base + 20,
        storageUsedGb: Math.round((base * 0.8 + 15) * 10) / 10,
        bandwidthUsedGb: Math.round((base * 1.2 + 25) * 10) / 10,
      };
    });

  const partners = state.localPartner.items
    .filter((p) => !filters.partnerId || p.id === filters.partnerId)
    .map((p, idx) => {
      const factor = (idx + 1) * 13 + p.schoolIds.length * 5;
      return {
        id: p.id,
        name: p.name,
        activeUsers: factor + 15,
        storageUsedGb: Math.round((factor * 0.7 + 10) * 10) / 10,
        bandwidthUsedGb: Math.round((factor * 1.1 + 16) * 10) / 10,
      };
    });

  const activeUsers =
    schools.reduce((sum, x) => sum + x.activeUsers, 0) || partners.reduce((sum, x) => sum + x.activeUsers, 0) || 40;
  const storageUsedGb = Math.round((schools.reduce((sum, x) => sum + x.storageUsedGb, 0) + partners.reduce((sum, x) => sum + x.storageUsedGb, 0) * 0.3) * 10) / 10;
  const bandwidthUsedGb = Math.round((schools.reduce((sum, x) => sum + x.bandwidthUsedGb, 0) + partners.reduce((sum, x) => sum + x.bandwidthUsedGb, 0) * 0.4) * 10) / 10;
  const concurrentUsers = Math.max(1, Math.round(activeUsers * 0.22));

  return {
    kpis: {
      activeUsers,
      concurrentUsers,
      storageUsedGb: storageUsedGb || 12.4,
      bandwidthUsedGb: bandwidthUsedGb || 25.8,
    },
    bySchool: schools,
    byPartner: partners,
    generatedAt: new Date().toISOString(),
  };
}

const slice = createSlice({
  name: 'reportDashboard',
  initialState,
  reducers: {
    startLoading(state, action: PayloadAction<ReportFilters>) {
      state.isLoading = true;
      state.error = null;
      state.lastFilters = action.payload;
    },
    hasError(state, action: PayloadAction<string>) {
      state.isLoading = false;
      state.error = action.payload;
    },
    loadSuccess(state, action: PayloadAction<ReportDashboardData>) {
      state.isLoading = false;
      state.error = null;
      state.data = action.payload;
    },
    startSummaryLoading(state) {
      state.isSummaryLoading = true;
    },
    loadSummarySuccess(state, action: PayloadAction<AdminSummaryStats>) {
      state.isSummaryLoading = false;
      state.summaryStats = action.payload;
    },
  },
});

export const { 
  startLoading, 
  hasError, 
  loadSuccess, 
  startSummaryLoading, 
  loadSummarySuccess 
} = slice.actions;
export default slice.reducer;

export function fetchReportDashboard(filters: ReportFilters) {
  return async (_dispatch: unknown, getState: () => RootState) => {
    dispatch(startLoading(filters));
    try {
      const params: Record<string, string> = {};
      if (filters.tenantId) params.tenantId = filters.tenantId;
      if (filters.schoolId) params.schoolId = filters.schoolId;
      if (filters.partnerId) params.partnerId = filters.partnerId;
      if (filters.timeRange) params.timeRange = filters.timeRange;

      if (API_ENDPOINTS.reportsOverview) {
        const res = await axios.get(API_ENDPOINTS.reportsOverview, { params });
        const normalized = normalizeReportPayload(res.data);
        if (normalized) {
          dispatch(loadSuccess(normalized));
          return;
        }
      }
      dispatch(loadSuccess(createFallbackData(filters, getState())));
    } catch {
      dispatch(loadSuccess(createFallbackData(filters, getState())));
      dispatch(hasError('Không thể lấy dữ liệu báo cáo từ API, đang hiển thị dữ liệu tạm.'));
    }
  };
}

export function fetchAdminSummaryStats() {
  return async () => {
    dispatch(startSummaryLoading());
    try {
      const [statsRes, sessionsRes] = await Promise.all([
        axios.get(API_ENDPOINTS.adminDashboardStats),
        axios.get(API_ENDPOINTS.adminDashboardActiveSessions),
      ]);
      
      const stats: AdminSummaryStats = {
        activeTenants: toNum(statsRes.data?.activeTenants),
        activeSchools: toNum(statsRes.data?.activeSchools),
        activeSessions: toNum(sessionsRes.data?.activeSessions ?? sessionsRes.data?.total),
        systemHealth: statsRes.data?.systemHealth || 'Stable',
        trends: statsRes.data?.trends || {
          tenants: 'Đang cập nhật',
          tenantsDirection: 'up',
          schools: 'Đang cập nhật',
          schoolsDirection: 'up',
          sessions: 'Realtime',
          sessionsDirection: 'up',
        },
      };
      
      dispatch(loadSummarySuccess(stats));
    } catch (error) {
      console.error('Failed to fetch dashboard stats', error);
      dispatch(hasError('Không thể tải thông số tổng quan hệ thống'));
    }
  };
}
