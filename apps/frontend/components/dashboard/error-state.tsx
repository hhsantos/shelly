'use client';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface ErrorStateProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
}

export function ErrorState({ title = 'No se pudo cargar la información', description, onRetry }: ErrorStateProps) {
  return (
    <Alert>
      <AlertTitle>{title}</AlertTitle>
      {description ? <AlertDescription>{description}</AlertDescription> : null}
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="mt-3 text-sm font-medium underline-offset-4 hover:underline"
        >
          Reintentar
        </button>
      ) : null}
    </Alert>
  );
}
