'use client';

import { useFormStatus } from 'react-dom';

interface SubmitButtonProps {
  label: string;
  pendingLabel?: string;
  className?: string;
}

/**
 * Botón de envío que muestra su estado mientras la Server Action se ejecuta.
 * Evita la sensación de "no pasó nada" al guardar/crear en el panel.
 */
export function SubmitButton({
  label,
  pendingLabel = 'Guardando…',
  className,
}: SubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className={
        className ??
        'inline-flex items-center gap-2 rounded-lg bg-uv3-green px-5 py-2.5 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60'
      }
    >
      {pending && (
        <span
          className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white"
          aria-hidden
        />
      )}
      {pending ? pendingLabel : label}
    </button>
  );
}
