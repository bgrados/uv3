import { createClient } from '@/utils/supabase/server';
import type { Reservation } from '@/types';

export const dynamic = 'force-dynamic';

const STATUS_LABEL: Record<string, string> = {
  confirmed: 'Confirmada',
  cancelled: 'Cancelada',
  completed: 'Finalizada',
  no_show: 'No asistió',
};

const PAYMENT_LABEL: Record<string, string> = {
  submitted: 'Por verificar',
  verified: 'Verificado',
  rejected: 'Rechazado',
};

const SPORT_LABEL: Record<string, string> = {
  futbol: 'Fútbol',
  futbol_sala: 'Fúlbito',
  basquet: 'Básquet',
  voley: 'Vóley',
  otro: 'Otro',
};

function lima(iso: string) {
  return new Date(iso).toLocaleString('es-PE', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'America/Lima' });
}

export default async function ReservasAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string; message?: string }>;
}) {
  const { filter = 'all', message } = await searchParams;
  const supabase = await createClient();
  const user = await supabase.auth.getUser();
  if (!user.data.user) return null;

  const { data: profile } = await supabase.from('users').select('role').eq('id', user.data.user.id).maybeSingle();
  if (profile?.role !== 'admin') {
    return (
      <main className="px-6 py-12">
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-6 py-4 text-amber-800">
          Este módulo es exclusivo del administrador de la plataforma.
        </p>
      </main>
    );
  }

  const { data } = await supabase
    .from('reservations')
    .select('*, space:spaces(name)')
    .order('start_at', { ascending: false })
    .limit(200);

  let reservations = (data ?? []) as (Reservation & { space?: { name: string } | null })[];

  if (filter === 'pending') reservations = reservations.filter((r) => r.payment_status === 'submitted');
  if (filter === 'today') {
    const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Lima' }).format(new Date());
    reservations = reservations.filter(
      (r) => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Lima' }).format(new Date(r.start_at)) === today
    );
  }
  if (filter === 'confirmed') reservations = reservations.filter((r) => r.status === 'confirmed');

  async function setPayment(formData: FormData) {
    'use server';
    const id = String(formData.get('id'));
    const value = String(formData.get('value')) as 'submitted' | 'verified' | 'rejected';
    const res = await (await import('@/app/actions/reservations')).updatePaymentStatusAction(id, value);
    const { redirect } = await import('next/navigation');
    redirect(`/dashboard/reservas?message=${encodeURIComponent(res.success ? 'Pago actualizado.' : res.error ?? 'Error')}`);
  }

  async function setStatus(formData: FormData) {
    'use server';
    const id = String(formData.get('id'));
    const value = String(formData.get('value')) as 'confirmed' | 'cancelled' | 'completed' | 'no_show';
    const res = await (await import('@/app/actions/reservations')).updateReservationStatusAction(id, value);
    const { redirect } = await import('next/navigation');
    redirect(`/dashboard/reservas?message=${encodeURIComponent(res.success ? 'Estado actualizado.' : res.error ?? 'Error')}`);
  }

  const totalConfirmed = reservations.filter((r) => r.status === 'confirmed').length;
  const totalPending = (data ?? []).filter((r: Reservation) => r.payment_status === 'submitted').length;
  const income = reservations.filter((r) => r.payment_status === 'verified').reduce((s, r) => s + Number(r.price), 0);

  const tabs = [
    { key: 'all', label: 'Todas' },
    { key: 'today', label: 'Hoy' },
    { key: 'pending', label: 'Pago por verificar' },
    { key: 'confirmed', label: 'Confirmadas' },
  ];

  return (
    <main className="mx-auto min-h-screen max-w-7xl px-6 py-10">
      <section className="mb-8 rounded-2xl bg-gradient-to-br from-uv3-green-dark to-uv3-green p-8 text-white shadow-lg">
        <p className="text-sm uppercase tracking-wide text-white/70">Módulo de reservas</p>
        <h1 className="mt-2 text-3xl font-bold">Reservas de canchas y eventos</h1>
        <p className="mt-3 max-w-3xl text-white/80">
          Revisa las solicitudes, verifica los comprobantes de Yape y administra la disponibilidad de cada espacio.
        </p>
      </section>

      {message && (
        <div className="mb-6 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-800">
          ✅ {message}
        </div>
      )}

      <section className="mb-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-stone-500">Reservas confirmadas (lista)</p>
          <p className="mt-1 text-3xl font-bold text-uv3-green-dark">{totalConfirmed}</p>
        </div>
        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-stone-500">Pagos por verificar</p>
          <p className="mt-1 text-3xl font-bold text-amber-600">{totalPending}</p>
        </div>
        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-stone-500">Ingresos verificados (lista)</p>
          <p className="mt-1 text-3xl font-bold text-uv3-green-dark">S/ {income.toFixed(2)}</p>
        </div>
      </section>

      <div className="mb-4 flex flex-wrap gap-2">
        {tabs.map((t) => (
          <a
            key={t.key}
            href={`/dashboard/reservas?filter=${t.key}`}
            className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition ${
              filter === t.key ? 'bg-uv3-green text-white' : 'border border-stone-300 text-stone-600 hover:bg-stone-50'
            }`}
          >
            {t.label}
          </a>
        ))}
      </div>

      {reservations.length === 0 ? (
        <div className="rounded-xl border bg-white p-10 text-center shadow-sm">
          <p className="text-4xl">📅</p>
          <p className="mt-3 font-semibold text-gray-700">No hay reservas para este filtro</p>
        </div>
      ) : (
        <div className="space-y-3">
          {reservations.map((r) => (
            <article key={r.id} className="rounded-xl border bg-white p-4 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-uv3-green">{r.code}</p>
                  <p className="mt-1 font-semibold text-stone-800">{r.space?.name ?? '—'}</p>
                  <p className="text-sm text-stone-600">
                    {lima(r.start_at)} → {new Date(r.end_at).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Lima' })}
                  </p>
                  <p className="mt-1 text-xs text-stone-500">
                    {r.usage_type === 'evento' ? `🎉 Evento: ${r.event_description ?? ''}` : `🏅 Deportivo: ${SPORT_LABEL[r.sport ?? ''] ?? r.sport ?? ''}`}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-uv3-green-dark">S/ {Number(r.price).toFixed(2)}</p>
                  <p className="text-xs text-stone-500">{r.customer_name}</p>
                  <p className="text-xs text-stone-500">📞 {r.customer_phone}</p>
                  {r.customer_email && <p className="text-xs text-stone-500">✉️ {r.customer_email}</p>}
                </div>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-3 border-t border-stone-100 pt-3">
                <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-semibold text-stone-700">Estado: {STATUS_LABEL[r.status] ?? r.status}</span>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    r.payment_status === 'verified'
                      ? 'bg-green-100 text-green-700'
                      : r.payment_status === 'rejected'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-amber-100 text-amber-700'
                  }`}
                >
                  Pago: {PAYMENT_LABEL[r.payment_status] ?? r.payment_status}
                </span>
                <a
                  href={`/dashboard/reservas/${r.id}`}
                  className="text-xs font-semibold text-uv3-green hover:underline"
                >
                  Ver detalle / comprobante
                </a>

                <form action={setPayment} className="ml-auto flex items-center gap-2">
                  <input type="hidden" name="id" value={r.id} />
                  <select name="value" defaultValue={r.payment_status} className="rounded-lg border px-2 py-1 text-xs">
                    <option value="submitted">submitted</option>
                    <option value="verified">verified</option>
                    <option value="rejected">rejected</option>
                  </select>
                  <button className="rounded-lg border border-uv3-green px-2 py-1 text-xs font-semibold text-uv3-green-dark hover:bg-uv3-green hover:text-white">
                    Guardar pago
                  </button>
                </form>

                <form action={setStatus} className="flex items-center gap-2">
                  <input type="hidden" name="id" value={r.id} />
                  <select name="value" defaultValue={r.status} className="rounded-lg border px-2 py-1 text-xs">
                    <option value="confirmed">confirmed</option>
                    <option value="cancelled">cancelled</option>
                    <option value="completed">completed</option>
                    <option value="no_show">no_show</option>
                  </select>
                  <button className="rounded-lg border border-stone-300 px-2 py-1 text-xs font-semibold text-stone-700 hover:bg-stone-100">
                    Guardar estado
                  </button>
                </form>
              </div>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}
