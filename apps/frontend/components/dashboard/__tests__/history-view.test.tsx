import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';

import { HistoryView } from '@/components/dashboard/history-view';
import type { HistoryResponse } from '@/lib/api/consumption';
import { useHistory } from '@/lib/hooks/use-consumption';

vi.mock('@/lib/hooks/use-consumption', () => ({
  useHistory: vi.fn(),
}));

const mockedUseHistory = vi.mocked(useHistory);

const historyData: HistoryResponse = {
  range: 'month',
  periods: [
    { period: 'Enero', consumptionKwh: 100, cost: 45 },
    { period: 'Febrero', consumptionKwh: 120, cost: 55 },
  ],
};

describe('HistoryView', () => {
  it('renderiza la gráfica y la tabla con datos', () => {
    mockedUseHistory.mockReturnValue({
      data: historyData,
      isLoading: false,
      isError: false,
      error: undefined,
      refetch: vi.fn(),
    } as never);

    render(<HistoryView jwt="token" />);

    expect(screen.getByText('Histórico de consumo')).toBeInTheDocument();
    expect(screen.getByText('Enero')).toBeInTheDocument();
    expect(screen.getByText('120')).toBeInTheDocument();
  });

  it('muestra estado de error', () => {
    mockedUseHistory.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      error: new Error('Error al cargar'),
      refetch: vi.fn(),
    } as never);

    render(<HistoryView jwt="token" />);

    expect(screen.getByRole('alert')).toHaveTextContent('Error al cargar');
  });
});
