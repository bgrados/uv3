'use client';

import { useFormStatus } from 'react-dom';

interface ConfirmSubmitButtonProps {
  label: string;
  confirmMessage: string;
  className?: string;
  pendingLabel?: string;
  /** Nombre del campo que viaja al formulario (opcional, para botones múltiples). */
  name?: string;
  /** Valor del campo asociado a este botón (opcional). */
  value?: string;
}

/**
 * Botón de envío con confirmación previa y estado de carga.
 * Se usa para acciones destructivas (eliminar equipo, jugador, foto, etc.).
 */
export function ConfirmSubmitButton({
  label,
  confirmMessage,
  className,
  pendingLabel = 'Procesando...',
  name,
  value,
}: ConfirmSubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      name={name}
      value={value}
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
