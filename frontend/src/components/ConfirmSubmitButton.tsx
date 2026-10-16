'use client';

import { useFormStatus } from 'react-dom';

interface ConfirmSubmitButtonProps {
  label: string;
  confirmMessage: string;
  className?: string;
  pendingLabel?: string;
}

/**
 * Botón de envío con confirmación previa y estado de carga.
 * Se usa para acciones destructivas (eliminar equipo, jugador, etc.).
 */
export function ConfirmSubmitButton({
  label,
  confirmMessage,
  className,
  pendingLabel = 'Procesando...',
}: ConfirmSubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      onClick={(event) => {
        if (!window.confirm(confirmMessage)) {
          event.preventDefault();
        }
      }}
      className={
        className ??
        'rounded-lg border border-destructive/40 px-3 py-1.5 text-xs font-semibold text-destructive transition-colors hover:bg-destructive/10 disabled:cursor-not-allowed disabled:opacity-50'
      }
    >
      {pending ? pendingLabel : label}
    </button>
  );
}
