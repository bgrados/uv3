import Image from 'next/image';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/server';
import { updatePaymentStatusAction, updateReservationStatusAction } from '@/app/actions/reservations';
import type { Reservation } from '@/types';

export const dynamic = 'force-dynamic';

function lima(value: string) {
  return new Date(value).toLocaleString('es-PE', { dateStyle: 'full', timeStyle: 'short', timeZone: 'America/Lima' });
}

export default async function ReservaDetallePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: authUser } = await supabase.auth.getUser();
  if (!authUser.user) return null;
  const { data: profile } = await supabase.from('users').select('role').eq('id', authUser.user.id).maybeSingle();
  if (profile?.role !== 'admin') {
    return <main className="px-6 py-12 text-amber-700">Acceso exclusivo del administrador.</main>;
  }

  const { data } = await supabase
    .from('reservations')
    .select('*, space:spaces(name)')
    .eq('id', id)
    .maybeSingle();

  if (!data) {
    return (
      <main className="px-6 py-12">
        <p className="text-stone-600">Reserva no encontrada.</p>
        <Link href="/dashboard/reservas" className="text-sm font-semibold text-uv3-green hover:underline">
          ← Volver
        </Link>
      </main>
    );
  }

  const reservation = data as Reservation & { space?: { name: string } | null };

  let proofUrl: string | null = null;
  if (reservation.payment_proof_url) {
    const { data: signed } = await supabase.storage
      .from('payment-proofs')
      .createSignedUrl(reservation.payment_proof_url, 3600);
    proofUrl = signed?.signedUrl ?? null;
  }

  async function setPayment(formData: FormData) {
    'use server';
    const value = String(formData.get('value')) as 'submitted' | 'verified' | 'rejected';
    await updatePaymentStatusAction(id, value);
  }

  async function setStatus(formData: FormData) {
    'use server';
    const value = String(formData.get('value')) as 'confirmed' | 'cancelled' | 'completed' | 'no_show';
    await updateReservationStatusAction(id, value);
  }

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <Link href="/dashboard/reservas" className="text-sm font-semibold text-uv3-green hover:underline">
        ← Volver a reservas
      </Link>

      <h1 className="mt-4 font-heading text-2xl font-bold text-uv3-green-dark">Reserva {reservation.code}</h1>

      <dl className="mt-6 grid gap-3 rounded-xl border bg-white p-6 text-sm sm:grid-cols-2">
        <div><dt className="text-xs text-stone-400">Espacio</dt><dd className="font-semibold">{reservation.space?.name ?? '—'}</dd></div>
        <div><dt className="text-xs text-stone-400">Cliente</dt><dd className="font-semibold">{reservation.customer_name}</dd></div>
        <div><dt className="text-xs text-stone-400">Teléfono</dt><dd className="font-semibold">{reservation.customer_phone}</dd></div>
        <div><dt className="text-xs text-stone-400">Correo</dt><dd className="font-semibold">{reservation.customer_email ?? '—'}</dd></div>
        <div><dt className="text-xs text-stone-400">Inicio</dt><dd className="font-semibold">{lima(reservation.start_at)}</dd></div>
        <div><dt className="text-xs text-stone-400">Fin</dt><dd className="font-semibold">{lima(reservation.end_at)}</dd></div>
        <div><dt className="text-xs text-stone-400">Uso</dt><dd className="font-semibold">{reservation.usage_type === 'evento' ? 'Evento' : `Deportivo${reservation.sport ? ` (${reservation.sport})` : ''}`}</dd></div>
        <div><dt className="text-xs text-stone-400">Total</dt><dd className="font-semibold">S/ {Number(reservation.price).toFixed(2)}</dd></div>
        {reservation.event_description && (
          <div className="sm:col-span-2"><dt className="text-xs text-stone-400">Evento</dt><dd className="font-semibold">{reservation.event_description}</dd></div>
        )}
        {reservation.notes && (
          <div className="sm:col-span-2"><dt className="text-xs text-stone-400">Notas</dt><dd className="font-semibold">{reservation.notes}</dd></div>
        )}
      </dl>

      <section className="mt-6 rounded-xl border bg-white p-6">
        <h2 className="font-semibold text-uv3-green-dark">Comprobante de pago (Yape)</h2>
        {proofUrl ? (
          <div className="relative mt-3 max-w-sm overflow-hidden rounded-lg border">
            <Image src={proofUrl} alt="Comprobante de pago" width={480} height={640} className="h-auto w-full object-contain" unoptimized />
          </div>
        ) : (
          <p className="mt-2 text-sm text-stone-500">No hay comprobante adjunto.</p>
        )}

        <div className="mt-4 flex flex-wrap gap-3">
          <form action={setPayment}>
            <input type="hidden" name="value" value="verified" />
            <button className="rounded-lg bg-uv3-green px-4 py-2 text-sm font-bold text-white">Verificar pago</button>
          </form>
          <form action={setPayment}>
            <input type="hidden" name="value" value="rejected" />
            <button className="rounded-lg border border-red-300 px-4 py-2 text-sm font-semibold text-red-600">Rechazar</button>
          </form>
          <form action={setStatus}>
            <input type="hidden" name="value" value="completed" />
            <button className="rounded-lg border border-stone-300 px-4 py-2 text-sm font-semibold text-stone-700">Marcar finalizada</button>
          </form>
          <form action={setStatus}>
            <input type="hidden" name="value" value="cancelled" />
            <button className="rounded-lg border border-stone-300 px-4 py-2 text-sm font-semibold text-stone-700">Cancelar reserva</button>
          </form>
        </div>
      </section>
    </main>
  );
}
