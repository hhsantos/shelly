import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';

import { ComparisonView } from '@/components/dashboard/comparison-view';
import type { ComparisonResponse } from '@/lib/api/consumption';
import { useComparison } from '@/lib/hooks/use-consumption';

vi.mock('@/lib/hooks/use-consumption', () => ({
  useComparison: vi.fn(),
}));

const mockedUseComparison = vi.mocked(useComparison);

const comparisonData: ComparisonResponse = {
  baselineLabel: 'Periodo base',
  targetLabel: 'Periodo actual',
  deltaConsumption: 10,
  deltaCost: -5,
  baseline: [
    { period: 'Semana 1', consumptionKwh: 50, cost: 20 },
    { period: 'Semana 2', consumptionKwh: 45, cost: 18 },
  ],
  target: [
    { period: 'Semana 1', consumptionKwh: 55, cost: 19 },
    { period: 'Semana 2', consumptionKwh: 50, cost: 16 },
  ],
};

describe('ComparisonView', () => {
  it('muestra métricas de comparación', () => {
    mockedUseComparison.mockReturnValue({
      data: comparisonData,
      isLoading: false,
      isError: false,
      error: undefined,
      refetch: vi.fn(),
    } as never);

    render(<ComparisonView jwt="token" />);

    expect(screen.getByText('Comparativa por periodos')).toBeInTheDocument();
    expect(screen.getByText('10 kWh')).toBeInTheDocument();
    expect(screen.getByText('-5 €')).toBeInTheDocument();
  });

  it('muestra un mensaje de error', () => {
    mockedUseComparison.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      error: new Error('Error comparando periodos'),
      refetch: vi.fn(),
    } as never);

    render(<ComparisonView jwt="token" />);

    expect(screen.getByRole('alert')).toHaveTextContent('Error comparando periodos');
  });
});
