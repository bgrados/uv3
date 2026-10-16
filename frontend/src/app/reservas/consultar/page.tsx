'use client';

import { useState } from 'react';
import Link from 'next/link';
import { cancelReservationAction, lookupReservationAction } from '@/app/actions/reservations';

interface ReservationRow {
  code: string;
  customer_name: string;
  customer_phone: string;
  space_name: string;
  start_at: string;
  end_at: string;
  usage_type: string;
  sport: string | null;
  status: string;
  price: number;
  payment_status: string;
}

const STATUS_LABEL: Record<string, string> = {
  confirmed: 'Confirmada',
  cancelled: 'Cancelada',
  completed: 'Finalizada',
  no_show: 'No asistió',
};

const PAYMENT_LABEL: Record<string, string> = {
  submitted: 'Comprobante enviado (por verificar)',
  verified: 'Pago verificado',
  rejected: 'Pago rechazado',
};

export default function ConsultarReservaPage() {
  const [code, setCode] = useState('');
  const [phone, setPhone] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ReservationRow | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function handleLookup() {
    setBusy(true);
    setError(null);
    setMessage(null);
    setResult(null);
    const res = await lookupReservationAction(code.trim(), phone.trim());
    if (res.success && res.data) {
      setResult(res.data as unknown as ReservationRow);
    } else {
      setError(res.error ?? 'No encontramos la reserva.');
    }
    setBusy(false);
  }

  async function handleCancel() {
    if (!result) return;
    setBusy(true);
    setError(null);
    const res = await cancelReservationAction(result.code, phone.trim());
    if (res.success) {
      setMessage('Reserva cancelada.');
      setResult({ ...result, status: 'cancelled' });
    } else {
      setError(res.error ?? 'No se pudo cancelar.');
    }
    setBusy(false);
  }

  return (
    <main className="min-h-screen bg-uv3-bg pb-16">
      <div className="bg-uv3-green-dark text-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
          <h1 className="font-heading text-xl font-black uppercase tracking-tight">Consultar mi reserva</h1>
          <Link href="/reservas" className="rounded-lg border border-white/30 px-3 py-1.5 text-xs font-semibold hover:bg-white/10">
            Hacer una reserva
          </Link>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-6 py-8">
        <div className="rounded-lg border border-stone-200 bg-white p-6">
          <p className="text-sm text-stone-600">
            Ingresa el <strong>código de reserva</strong> y el <strong>teléfono</strong> que registraste.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="UV3-XXXXXX" className="rounded-lg border border-stone-300 px-3 py-2 text-sm" />
            <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Teléfono" className="rounded-lg border border-stone-300 px-3 py-2 text-sm" />
          </div>
          <button
            type="button"
            disabled={busy || !code || !phone}
            onClick={handleLookup}
            className="mt-4 rounded-lg bg-uv3-green px-5 py-2.5 text-sm font-bold text-white disabled:opacity-60"
          >
            {busy ? 'Buscando…' : 'Buscar reserva'}
          </button>
        </div>

        {error && <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">{error}</p>}
        {message && <p className="mt-4 rounded-lg bg-green-50 px-4 py-3 text-sm font-semibold text-green-700">{message}</p>}

        {result && (
          <div className="mt-6 rounded-lg border border-stone-200 bg-white p-6">
            <div className="flex items-center justify-between">
              <p className="font-heading text-2xl font-black tracking-widest text-uv3-green">{result.code}</p>
              <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-bold text-stone-700">
                {STATUS_LABEL[result.status] ?? result.status}
              </span>
            </div>
            <dl className="mt-4 grid gap-2 text-sm text-stone-700 sm:grid-cols-2">
              <div><dt className="text-xs text-stone-400">Espacio</dt><dd className="font-semibold">{result.space_name}</dd></div>
              <div><dt className="text-xs text-stone-400">A nombre de</dt><dd className="font-semibold">{result.customer_name}</dd></div>
              <div>
                <dt className="text-xs text-stone-400">Inicio</dt>
                <dd className="font-semibold">{new Date(result.start_at).toLocaleString('es-PE', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'America/Lima' })}</dd>
              </div>
              <div>
                <dt className="text-xs text-stone-400">Fin</dt>
                <dd className="font-semibold">{new Date(result.end_at).toLocaleString('es-PE', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'America/Lima' })}</dd>
              </div>
              <div><dt className="text-xs text-stone-400">Uso</dt><dd className="font-semibold">{result.usage_type === 'evento' ? 'Evento' : `Deportivo${result.sport ? ` (${result.sport})` : ''}`}</dd></div>
              <div><dt className="text-xs text-stone-400">Total</dt><dd className="font-semibold">S/ {Number(result.price).toFixed(2)}</dd></div>
              <div className="sm:col-span-2"><dt className="text-xs text-stone-400">Pago</dt><dd className="font-semibold">{PAYMENT_LABEL[result.payment_status] ?? result.payment_status}</dd></div>
            </dl>

            {result.status === 'confirmed' && (
              <button
                type="button"
                disabled={busy}
                onClick={handleCancel}
                className="mt-5 rounded-lg border border-red-300 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-60"
              >
                Cancelar esta reserva
              </button>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
