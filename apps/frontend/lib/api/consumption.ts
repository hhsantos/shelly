import { strapiFetch } from '@/lib/auth/strapi-client';

export type PeriodKey = 'day' | 'week' | 'month' | 'quarter' | 'year';

export interface PeriodConsumption {
  period: string;
  consumptionKwh: number;
  cost: number;
}

export interface DailySummaryResponse {
  date: string;
  totalConsumption: number;
  totalCost: number;
  trendConsumption: number;
  trendCost: number;
  breakdown: PeriodConsumption[];
}

export interface HistoryResponse {
  range: PeriodKey;
  periods: PeriodConsumption[];
}

export interface ComparisonResponse {
  baselineLabel: string;
  targetLabel: string;
  deltaConsumption: number;
  deltaCost: number;
  baseline: PeriodConsumption[];
  target: PeriodConsumption[];
}

export interface AuthenticatedRequest {
  jwt?: string;
}

export async function fetchDailySummary(
  params: AuthenticatedRequest & { date: string },
): Promise<DailySummaryResponse> {
  const search = new URLSearchParams({ date: params.date });
  return strapiFetch<DailySummaryResponse>(
    `/api/consumption/daily-summary?${search.toString()}`,
    { jwt: params.jwt },
  );
}

export async function fetchHistory(
  params: AuthenticatedRequest & { range: PeriodKey },
): Promise<HistoryResponse> {
  const search = new URLSearchParams({ range: params.range });
  return strapiFetch<HistoryResponse>(
    `/api/consumption/history?${search.toString()}`,
    { jwt: params.jwt },
  );
}

export interface ComparisonParams {
  baseline: PeriodKey;
  target: PeriodKey;
}

export async function fetchComparison(
  params: AuthenticatedRequest & ComparisonParams,
): Promise<ComparisonResponse> {
  const search = new URLSearchParams({ baseline: params.baseline, target: params.target });
  return strapiFetch<ComparisonResponse>(
    `/api/consumption/comparison?${search.toString()}`,
    { jwt: params.jwt },
  );
}
