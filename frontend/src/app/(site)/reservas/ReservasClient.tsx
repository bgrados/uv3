'use client';

import { useEffect, useMemo, useState } from 'react';
import { SmartImage } from '@/components/SmartImage';
import { createClient } from '@/utils/supabase/client';
import { SPORT_LABEL } from '@/components/SportBadge';
import { computePrice, limaDateString } from '@/utils/reservations';
import { createReservationAction, getSpaceDayAction } from '@/app/actions/reservations';
import type { ReservationInterval, SiteSettings, Space, SportType } from '@/types';

const START_TIMES = Array.from({ length: 48 }, (_, i) => {
  const h = String(Math.floor(i / 2)).padStart(2, '0');
  const m = i % 2 === 0 ? '00' : '30';
  return `${h}:${m}`;
});

const DURATIONS: { value: number; label: string }[] = [
  { value: 30, label: '30 min' },
  { value: 60, label: '1 hora' },
  { value: 90, label: '1 h 30 min' },
  { value: 120, label: '2 horas' },
  { value: 180, label: '3 horas' },
  { value: 240, label: '4 horas' },
  { value: 360, label: '6 horas' },
  { value: 480, label: '8 horas' },
  { value: 720, label: '12 horas' },
];

const SPORT_EMOJI: Record<string, string> = {
  futbol: '⚽',
  futbol_sala: '🥅',
  basquet: '🏀',
  voley: '🏐',
  otro: '🏟️',
};

function money(value: number) {
  return `S/ ${value.toFixed(2)}`;
}

function toLimaLabel(ms: number) {
  return new Date(ms).toLocaleTimeString('es-PE', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'America/Lima',
  });
}

function startUtc(date: string, time: string) {
  return new Date(`${date}T${time}:00-05:00`);
}

interface Props {
  spaces: Space[];
  settings: SiteSettings;
}

export function ReservasClient({ spaces, settings }: Props) {
  const [spaceId, setSpaceId] = useState(spaces[0]?.id ?? '');
  const [date, setDate] = useState(limaDateString());
  const [occupancy, setOccupancy] = useState<ReservationInterval[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const [startTime, setStartTime] = useState('18:00');
  const [duration, setDuration] = useState(60);
  const [usageType, setUsageType] = useState<'deporte' | 'evento'>('deporte');
  const [sport, setSport] = useState('');
  const [description, setDescription] = useState('');

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [notes, setNotes] = useState('');
  const [file, setFile] = useState<File | null>(null);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<{ code: string; price: number } | null>(null);
  const [step, setStep] = useState(1);

  const selectedSpace = useMemo(() => spaces.find((s) => s.id === spaceId), [spaces, spaceId]);

  useEffect(() => {
    const available = selectedSpace?.sports ?? [];
    if (!available.includes(sport)) setSport(available[0] ?? '');
  }, [selectedSpace, sport]);

  useEffect(() => {
    if (!spaceId) return;
    let active = true;
    setLoadingSlots(true);
    getSpaceDayAction(spaceId, date).then((res) => {
      if (!active) return;
      setOccupancy(res.success ? res.data ?? [] : []);
      setLoadingSlots(false);
    });
    return () => {
      active = false;
    };
  }, [spaceId, date, refreshKey]);

  const range = useMemo(() => {
    const start = startUtc(date, startTime);
    const end = new Date(start.getTime() + duration * 60000);
    return { start, end };
  }, [date, startTime, duration]);

  const price = useMemo(
    () => (selectedSpace ? computePrice(selectedSpace, usageType, range.start, range.end).price : 0),
    [selectedSpace, usageType, range]
  );

  const hasOverlap = useMemo(
    () =>
      occupancy.some((o) => range.start.getTime() < new Date(o.end_at).getTime() && range.end.getTime() > new Date(o.start_at).getTime()),
    [occupancy, range]
  );

  // Marca cada hora de inicio como libre u ocupada según la duración elegida.
  const startSlots = useMemo(
    () =>
      START_TIMES.map((t) => {
        const s = startUtc(date, t);
        const e = new Date(s.getTime() + duration * 60000);
        const busy = occupancy.some(
          (o) => s.getTime() < new Date(o.end_at).getTime() && e.getTime() > new Date(o.start_at).getTime()
        );
        return { time: t, disabled: busy };
      }),
    [date, duration, occupancy]
  );

  const freeSlots = useMemo(() => startSlots.filter((s) => !s.disabled), [startSlots]);

  // Si la hora elegida queda ocupada (p. ej. al cambiar la duración), salta al horario libre más cercano.
  useEffect(() => {
    if (freeSlots.length === 0) return;
    if (freeSlots.some((s) => s.time === startTime)) return;
    const cur = Math.max(0, START_TIMES.indexOf(startTime));
    let best = freeSlots[freeSlots.length - 1];
    let bestDist = Infinity;
    for (let i = freeSlots.length - 1; i >= 0; i -= 1) {
      const dist = Math.abs(START_TIMES.indexOf(freeSlots[i].time) - cur);
      if (dist < bestDist) {
        bestDist = dist;
        best = freeSlots[i];
      }
    }
    setStartTime(best.time);
  }, [freeSlots, startTime]);

  // Siguiente horario libre después del actual (o el primero del día si ya no hay más).
  const nextFree = useMemo(() => {
    const after = freeSlots.find((s) => START_TIMES.indexOf(s.time) > START_TIMES.indexOf(startTime));
    return after ?? freeSlots[0];
  }, [freeSlots, startTime]);

  const bands = useMemo(() => {
    const dayStart = new Date(`${date}T00:00:00-05:00`).getTime();
    const dayMs = 24 * 3600 * 1000;
    return occupancy
      .map((o) => {
        const s = new Date(o.start_at).getTime();
        const e = new Date(o.end_at).getTime();
        const from = Math.max(0, s - dayStart);
        const to = Math.min(dayMs, e - dayStart);
        if (to <= from) return null;
        const blocked = o.kind !== 'reserva';
        return {
          left: (from / dayMs) * 100,
          width: ((to - from) / dayMs) * 100,
          label: toLimaLabel(s),
          blocked,
          reason: o.kind,
        };
      })
      .filter(Boolean) as { left: number; width: number; label: string; blocked: boolean; reason: string }[];
  }, [occupancy, date]);

  const selectedBand = useMemo(() => {
    const dayStart = new Date(`${date}T00:00:00-05:00`).getTime();
    const dayMs = 24 * 3600 * 1000;
    const from = Math.max(0, range.start.getTime() - dayStart);
    const to = Math.min(dayMs, range.end.getTime() - dayStart);
    return { left: (from / dayMs) * 100, width: (Math.max(0, to - from) / dayMs) * 100 };
  }, [date, range]);

  async function handleSubmit() {
    setError(null);
    if (!selectedSpace) return setError('Selecciona una cancha.');
    if (name.trim().length < 3) return setError('Escribe tu nombre completo.');
    if (phone.replace(/\D/g, '').length < 6) return setError('Escribe un teléfono válido.');
    if (usageType === 'evento' && !description.trim()) return setError('Describe tu evento (por ejemplo, pollada).');
    if (!file) return setError('Adjunta la captura de tu pago por Yape (obligatorio).');
    if (hasOverlap) return setError('Ese horario ya está ocupado. Elige otro.');

    setBusy(true);
    try {
      const supabase = createClient();
      const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
      const path = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from('payment-proofs')
        .upload(path, file, { contentType: file.type });
      if (uploadError) throw new Error(`No se pudo subir el comprobante: ${uploadError.message}`);

      const result = await createReservationAction({
        space_id: spaceId,
        customer_name: name,
        customer_phone: phone,
        customer_email: email || null,
        usage_type: usageType,
        sport: usageType === 'deporte' ? sport || null : null,
        event_description: usageType === 'evento' ? description : null,
        date,
        start_time: startTime,
        duration_minutes: duration,
        notes: notes || null,
        payment_proof_url: path,
      });

      if (!result.success || !result.data) {
        setError(result.error ?? 'No se pudo completar la reserva.');
      } else {
        setDone({ code: result.data.code, price: result.data.price });
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error inesperado.');
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    const waText = `Hola, reservé "${selectedSpace?.name}" para el ${date} a las ${startTime} (${duration} min). Código: ${done.code}.`;
    return (
      <div className="mx-auto max-w-xl rounded-lg border border-uv3-green/30 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-uv3-green/10 text-3xl">✅</div>
        <h2 className="font-heading text-2xl font-bold text-uv3-green-dark">¡Reserva registrada!</h2>
        <p className="mt-2 text-sm text-stone-600">
          {selectedSpace?.name} · {date} · {startTime} ({duration} min)
        </p>
        <p className="mt-4 text-xs uppercase tracking-wider text-stone-500">Código de reserva</p>
        <p className="font-heading text-3xl font-black tracking-widest text-uv3-green">{done.code}</p>
        <p className="mt-3 text-lg font-bold text-uv3-green-dark">Total: {money(done.price)}</p>
        <p className="mt-3 text-xs text-stone-500">Guarda tu código. La junta verificará tu comprobante de Yape.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <a href="/reservas/consultar" className="rounded-lg bg-uv3-green-dark px-4 py-2 text-sm font-bold text-white">
            Consultar mi reserva
          </a>
          <button
            type="button"
            onClick={() => {
              setDone(null);
              setFile(null);
              setNotes('');
            }}
            className="rounded-lg border border-stone-300 px-4 py-2 text-sm font-semibold text-stone-600"
          >
            Hacer otra reserva
          </button>
        </div>
        <p className="mt-4 text-[11px] text-stone-400">{waText}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Indicador de pasos */}
      <div className="flex items-center justify-center gap-2">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center gap-2">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${
                step >= s ? 'bg-uv3-green text-white' : 'bg-stone-200 text-stone-500'
              }`}
            >
              {s}
            </div>
            <span className={`hidden text-xs font-semibold sm:inline ${step >= s ? 'text-uv3-green-dark' : 'text-stone-400'}`}>
              {s === 1 ? 'Espacio' : s === 2 ? 'Fecha y horario' : 'Datos y pago'}
            </span>
            {s < 3 && <span className="h-px w-8 bg-stone-200" />}
          </div>
        ))}
      </div>

      <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-6">
          {step === 1 && (
            <section>
              <h2 className="mb-3 font-heading text-sm font-bold uppercase tracking-wider text-uv3-green-dark">1. Elige el espacio</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {spaces.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setSpaceId(s.id)}
                className={`overflow-hidden rounded-lg border bg-white text-left transition ${
                  s.id === spaceId ? 'border-uv3-green ring-2 ring-uv3-green/30' : 'border-stone-200 hover:border-uv3-green/40'
                }`}
              >
                <div className="relative h-32 w-full bg-stone-100">
                  {s.image_url ? (
                    <SmartImage src={s.image_url} alt={s.name} fill sizes="(max-width: 640px) 100vw, 320px" className="object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-4xl">🏟️</div>
                  )}
                </div>
                <div className="p-3">
                  <p className="font-semibold text-uv3-green-dark">{s.name}</p>
                  <p className="mt-0.5 text-[11px] text-stone-500">
                    Día {money(Number(s.day_rate))}/h · Noche {money(Number(s.night_rate))}/h
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {(s.sports ?? []).map((sp) => (
                      <span key={sp} className="rounded-full bg-stone-100 px-2 py-0.5 text-[10px] font-semibold text-stone-600">
                        {SPORT_EMOJI[sp] ?? ''} {SPORT_LABEL[sp as SportType] ?? sp}
                      </span>
                    ))}
                    {s.allows_events && (
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700">🎉 Eventos</span>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </section>
          )}

        {step === 2 && (
        <>
        <section>
          <h2 className="mb-3 font-heading text-sm font-bold uppercase tracking-wider text-uv3-green-dark">2. Fecha y disponibilidad</h2>
          <div className="rounded-lg border border-stone-200 bg-white p-4">
            <div className="flex flex-wrap items-center gap-3">
              <input
                type="date"
                value={date}
                min={limaDateString()}
                onChange={(e) => setDate(e.target.value)}
                className="rounded-lg border border-stone-300 px-3 py-2 text-sm"
              />
              <button
                type="button"
                onClick={() => setRefreshKey((k) => k + 1)}
                className="rounded-lg border border-stone-300 px-3 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-50"
              >
                ⟳ Actualizar
              </button>
              {loadingSlots && <span className="text-xs text-stone-400">Cargando…</span>}
            </div>

            <div className="relative mt-4 h-8 w-full overflow-hidden rounded bg-stone-100">
              {bands.map((b, i) => (
                <div
                  key={i}
                  className={`absolute top-0 h-full ${b.blocked ? 'bg-amber-400/70' : 'bg-red-400/70'}`}
                  style={{ left: `${b.left}%`, width: `${b.width}%` }}
                  title={b.blocked ? `Bloqueado (${b.reason}) desde ${b.label}` : `Reservado desde ${b.label}`}
                />
              ))}
              <div className="absolute top-0 h-full bg-uv3-green/25 ring-1 ring-uv3-green" style={{ left: `${selectedBand.left}%`, width: `${selectedBand.width}%` }} />
              {[0, 6, 12, 18, 24].map((h) => (
                <span key={h} className="absolute top-full translate-y-0.5 -translate-x-1/2 text-[9px] text-stone-400" style={{ left: `${(h / 24) * 100}%` }}>
                  {h}h
                </span>
              ))}
            </div>
            <div className="mt-6 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-stone-500">
              <span className="flex items-center gap-1"><span className="inline-block h-2 w-3 rounded-sm bg-red-400/70" /> Reservado</span>
              <span className="flex items-center gap-1"><span className="inline-block h-2 w-3 rounded-sm bg-amber-400/70" /> Bloqueado por la junta</span>
              <span className="flex items-center gap-1"><span className="inline-block h-2 w-3 rounded-sm bg-uv3-green/25 ring-1 ring-uv3-green" /> Tu reserva</span>
            </div>
          </div>
        </section>

        <section>
          <h2 className="mb-3 font-heading text-sm font-bold uppercase tracking-wider text-uv3-green-dark">3. Horario</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-xs font-semibold text-stone-600">
              Hora de inicio
              <select value={startTime} onChange={(e) => setStartTime(e.target.value)} className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm font-normal">
                {startSlots.map((s) => (
                  <option key={s.time} value={s.time} disabled={s.disabled}>
                    {s.time}{s.disabled ? ' — ocupado' : ''}
                  </option>
                ))}
              </select>
              <span className={`mt-1 block text-[11px] font-normal ${freeSlots.length === 0 ? 'text-red-500' : 'text-stone-400'}`}>
                {freeSlots.length > 0
                  ? `${freeSlots.length} horario${freeSlots.length === 1 ? '' : 's'} libre${freeSlots.length === 1 ? '' : 's'} para ${DURATIONS.find((d) => d.value === duration)?.label}`
                  : 'Sin horarios libres para esta duración. Prueba otra duración u otra fecha.'}
              </span>
            </label>
            <label className="text-xs font-semibold text-stone-600">
              Duración
              <select value={duration} onChange={(e) => setDuration(Number(e.target.value))} className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm font-normal">
                {DURATIONS.map((d) => (
                  <option key={d.value} value={d.value}>{d.label}</option>
                ))}
              </select>
            </label>
          </div>
          {freeSlots.length > 0 && nextFree && nextFree.time !== startTime && (
            <button
              type="button"
              onClick={() => setStartTime(nextFree.time)}
              className="mt-3 rounded-lg border border-uv3-green/40 bg-uv3-green/5 px-3 py-2 text-xs font-semibold text-uv3-green-dark hover:bg-uv3-green/10"
            >
              ⏱️ Ir al siguiente horario libre ({nextFree.time})
            </button>
          )}
          <label className="mt-4 block text-xs font-semibold text-stone-600">
            Tipo de uso
            <div className="mt-1 flex gap-2">
              {(['deporte', 'evento'] as const).map((u) => (
                <button
                  key={u}
                  type="button"
                  onClick={() => setUsageType(u)}
                  className={`rounded-lg px-4 py-2 text-sm font-semibold capitalize transition ${
                    usageType === u ? 'bg-uv3-green text-white' : 'border border-stone-300 text-stone-600'
                  }`}
                >
                  {u === 'deporte' ? 'Deportivo' : 'Evento (pollada, etc.)'}
                </button>
              ))}
            </div>
          </label>

          {usageType === 'deporte' ? (
            <label className="mt-4 block text-xs font-semibold text-stone-600">
              Deporte
              <select value={sport} onChange={(e) => setSport(e.target.value)} className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm font-normal">
                {(selectedSpace?.sports ?? []).map((sp) => (
                  <option key={sp} value={sp}>{SPORT_EMOJI[sp] ?? ''} {SPORT_LABEL[sp as SportType] ?? sp}</option>
                ))}
              </select>
            </label>
          ) : (
            <label className="mt-4 block text-xs font-semibold text-stone-600">
              ¿Para qué es el evento?
              <input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Pollada, cumpleaños, reunión…"
                className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm font-normal"
              />
            </label>
          )}
        </section>
        </>
      )}
      </div>

      {step === 3 && (
      <div className="space-y-6 lg:sticky lg:top-6 lg:self-start">
        <div className="rounded-lg border border-stone-200 bg-white p-5">
          <p className="text-[11px] font-bold uppercase tracking-wider text-uv3-green">Resumen</p>
          <p className="mt-2 font-heading text-lg font-bold text-uv3-green-dark">{selectedSpace?.name}</p>
          <p className="text-sm text-stone-500">
            {date} · {startTime} · {duration} min
          </p>
          {hasOverlap && (
            <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-600">
              ⚠️ Ese horario figura ocupado. Elige otro o revisa la fecha.
            </p>
          )}
          <div className="mt-4 flex items-center justify-between border-t border-stone-100 pt-3">
            <span className="text-sm text-stone-500">Total estimado</span>
            <span className="font-heading text-2xl font-black text-uv3-green-dark">{money(price)}</span>
          </div>
          <p className="mt-1 text-[11px] text-stone-400">
            Se calcula por hora, entre tarifa de día y de noche (las {String(selectedSpace?.night_start ?? '18:00').slice(0, 5)} a {String(selectedSpace?.night_end ?? '06:00').slice(0, 5)} aplica la tarifa nocturna).
          </p>
        </div>

        <div className="space-y-3 rounded-lg border border-stone-200 bg-white p-5">
          <p className="text-[11px] font-bold uppercase tracking-wider text-uv3-green">4. Tus datos</p>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nombre y apellido" className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm" />
          <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Teléfono / WhatsApp" className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm" />
          <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Correo (opcional)" className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm" />
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notas (opcional)" rows={2} className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm" />
        </div>

        <div className="space-y-3 rounded-lg border border-stone-200 bg-white p-5">
          <p className="text-[11px] font-bold uppercase tracking-wider text-uv3-green">5. Pago por Yape</p>
          <div className="rounded-lg bg-uv3-bg p-3 text-xs text-stone-600">
            <p className="font-semibold text-uv3-green-dark">Yape a la Junta UV3</p>
            <p className="mt-1">
              Número: <strong>{settings.yape_number || 'Por confirmar'}</strong>
              {settings.yape_holder ? <> · Titular: <strong>{settings.yape_holder}</strong></> : null}
            </p>
            <p className="mt-1 text-[11px] text-stone-500">
              Yapea el monto ({money(price)}) y sube la captura. El comprobante es <strong>obligatorio</strong>.
            </p>
          </div>
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="w-full text-xs"
          />
          {file && <p className="text-[11px] text-stone-500">Archivo: {file.name}</p>}
        </div>

        {error && <p className="rounded-lg bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">{error}</p>}

        <button
          type="button"
          disabled={busy || hasOverlap || freeSlots.length === 0}
          onClick={handleSubmit}
          className="w-full rounded-lg bg-uv3-green px-4 py-3 font-heading text-sm font-bold uppercase tracking-wide text-white transition hover:bg-uv3-green-dark disabled:cursor-not-allowed disabled:opacity-50"
        >
          {busy ? 'Registrando…' : hasOverlap ? 'Horario ocupado' : 'Confirmar reserva'}
        </button>
        <p className="text-center text-[11px] text-stone-400">
          Al confirmar aceptas las normas de uso del espacio y la verificación del pago por la junta.
        </p>
      </div>
      )}

      {/* Botones de navegación entre pasos */}
      <div className="flex items-center justify-between gap-3">
        {step > 1 && (
          <button
            type="button"
            onClick={() => setStep((s) => Math.max(1, s - 1))}
            className="rounded-lg border border-stone-300 px-5 py-2.5 text-sm font-semibold text-stone-600 hover:bg-stone-50"
          >
            ← Atrás
          </button>
        )}
        {step < 3 && (
          <button
            type="button"
            onClick={() => setStep((s) => Math.min(3, s + 1))}
            className="ml-auto rounded-lg bg-uv3-green px-5 py-2.5 text-sm font-bold text-white hover:bg-uv3-green-dark"
          >
            Continuar →
          </button>
        )}
      </div>
    </div>
    </div>
  );
}
