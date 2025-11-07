import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';

import { DailySummary } from '@/components/dashboard/daily-summary';
import type { DailySummaryResponse } from '@/lib/api/consumption';
import { useDailySummary } from '@/lib/hooks/use-consumption';

vi.mock('@/lib/hooks/use-consumption', () => ({
  useDailySummary: vi.fn(),
}));

const mockedUseDailySummary = vi.mocked(useDailySummary);

const baseData: DailySummaryResponse = {
  date: '2024-01-01',
  totalConsumption: 12.5,
  totalCost: 4.2,
  trendConsumption: 5,
  trendCost: -3,
  breakdown: [
    { period: '00:00', consumptionKwh: 1, cost: 0.3 },
    { period: '01:00', consumptionKwh: 2, cost: 0.4 },
  ],
};

describe('DailySummary', () => {
  beforeEach(() => {
    mockedUseDailySummary.mockReturnValue({
      data: baseData,
      isLoading: false,
      isError: false,
      error: undefined,
      refetch: vi.fn(),
      isFetching: false,
    } as never);
  });

  it('muestra los valores del resumen diario', () => {
    render(<DailySummary jwt="token" />);

    expect(screen.getByText('Resumen diario')).toBeInTheDocument();
    expect(screen.getByText('12.5 kWh')).toBeInTheDocument();
    expect(screen.getByText('4.2 €')).toBeInTheDocument();
  });

  it('muestra el estado de error', () => {
    mockedUseDailySummary.mockReturnValueOnce({
      data: undefined,
      isLoading: false,
      isError: true,
      error: new Error('Fallo en la API'),
      refetch: vi.fn(),
      isFetching: false,
    } as never);

    render(<DailySummary jwt="token" />);

    expect(screen.getByRole('alert')).toHaveTextContent('Fallo en la API');
  });
});
