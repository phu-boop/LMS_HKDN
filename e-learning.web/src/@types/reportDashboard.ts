export type ReportTimeRange = '24h' | '7d' | '30d' | '90d';

export type ReportFilters = {
  tenantId: string;
  schoolId: string;
  partnerId: string;
  timeRange: ReportTimeRange;
};

export type ReportKpis = {
  activeUsers: number;
  concurrentUsers: number;
  storageUsedGb: number;
  bandwidthUsedGb: number;
};

export type ReportDistributionRow = {
  id: string;
  name: string;
  activeUsers: number;
  storageUsedGb: number;
  bandwidthUsedGb: number;
};

export type ReportDashboardData = {
  kpis: ReportKpis;
  bySchool: ReportDistributionRow[];
  byPartner: ReportDistributionRow[];
  generatedAt: string;
};
