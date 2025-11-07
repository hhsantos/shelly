'use client';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PeriodKey } from '@/lib/api/consumption';

const periodLabels: Record<PeriodKey, string> = {
  day: 'Diario',
  week: 'Semanal',
  month: 'Mensual',
  quarter: 'Trimestral',
  year: 'Anual',
};

interface PeriodSelectProps {
  value: PeriodKey;
  onChange: (value: PeriodKey) => void;
  label?: string;
}

export function PeriodSelect({ value, onChange, label }: PeriodSelectProps) {
  return (
    <div className="flex flex-col gap-1">
      {label ? <span className="text-sm font-medium text-muted-foreground">{label}</span> : null}
      <Select value={value} onValueChange={(newValue) => onChange(newValue as PeriodKey)}>
        <SelectTrigger className="w-48">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {Object.entries(periodLabels).map(([key, optionLabel]) => (
            <SelectItem key={key} value={key}>
              {optionLabel}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
