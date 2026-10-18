import type { ReactNode } from 'react';

type Accent = 'green' | 'gold' | 'stone';

const ACCENT_BORDER: Record<Accent, string> = {
  green: 'border-uv3-green',
  gold: 'border-uv3-gold',
  stone: 'border-stone-400',
};

/**
 * Titular de sección estilo periódico: versalitas + regla gruesa inferior.
 */
export function SectionHeading({
  label,
  accent = 'green',
  hint,
  action,
}: {
  label: string;
  accent?: Accent;
  hint?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className={`flex items-end justify-between gap-2 border-b-4 ${ACCENT_BORDER[accent]} pb-1.5`}>
      <h3 className="font-heading text-xs font-bold uppercase tracking-[0.2em] text-uv3-green-dark">{label}</h3>
      {action}
      {hint ? <span className="shrink-0 text-[10px] font-bold uppercase tracking-wider text-stone-500">{hint}</span> : null}
    </div>
  );
}

/** Micro-etiqueta tipo folio ("UV3 DIARIO · SECCIÓN …"). */
export function Kicker({ children }: { children: ReactNode }) {
  return (
    <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-stone-400">{children}</p>
  );
}
