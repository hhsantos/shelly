import { useQuery } from '@tanstack/react-query';

import {
  ComparisonParams,
  ComparisonResponse,
  DailySummaryResponse,
  HistoryResponse,
  PeriodKey,
  fetchComparison,
  fetchDailySummary,
  fetchHistory,
} from '@/lib/api/consumption';

interface DailySummaryArgs {
  jwt?: string;
  date: string;
}

interface HistoryArgs {
  jwt?: string;
  range: PeriodKey;
}

interface ComparisonArgs extends ComparisonParams {
  jwt?: string;
}

export function useDailySummary({ jwt, date }: DailySummaryArgs) {
  return useQuery<DailySummaryResponse>({
    queryKey: ['daily-summary', date, jwt],
    queryFn: () => fetchDailySummary({ jwt, date }),
    enabled: Boolean(jwt && date),
    staleTime: 1000 * 60 * 5,
  });
}

export function useHistory({ jwt, range }: HistoryArgs) {
  return useQuery<HistoryResponse>({
    queryKey: ['history', range, jwt],
    queryFn: () => fetchHistory({ jwt, range }),
    enabled: Boolean(jwt && range),
    staleTime: 1000 * 60 * 10,
  });
}

export function useComparison({ jwt, baseline, target }: ComparisonArgs) {
  return useQuery<ComparisonResponse>({
    queryKey: ['comparison', baseline, target, jwt],
    queryFn: () => fetchComparison({ jwt, baseline, target }),
    enabled: Boolean(jwt && baseline && target),
    staleTime: 1000 * 60 * 10,
  });
}
