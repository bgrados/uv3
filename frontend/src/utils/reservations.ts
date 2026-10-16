// UV3 Platform — utilidades de reservas (compartidas servidor/cliente)

import type { Space } from '@/types';

export const LIMA_OFFSET_MS = 5 * 60 * 60 * 1000; // America/Lima = UTC-5 (sin DST)
export const LIMA_TIMEZONE = 'America/Lima';

/** Convierte una fecha (YYYY-MM-DD) y hora (HH:MM) de Lima a Date. */
export function limaToUtc(date: string, time: string): Date {
  return new Date(`${date}T${time.slice(0, 5)}:00-05:00`);
}

/** Minutos desde medianoche en hora de Lima. */
export function limaMinutes(d: Date): number {
  const local = new Date(d.getTime() - LIMA_OFFSET_MS);
  return local.getUTCHours() * 60 + local.getUTCMinutes();
}

export function parseHhMm(value: string): number {
  const [h, m] = value.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

export function isNightMinute(minute: number, startMin: number, endMin: number): boolean {
  if (startMin === endMin) return false;
  if (startMin < endMin) return minute >= startMin && minute < endMin;
  return minute >= startMin || minute < endMin;
}

/** Devuelve la fecha (YYYY-MM-DD) en hora de Lima. */
export function limaDateString(d: Date = new Date()): string {
  const local = new Date(d.getTime() - LIMA_OFFSET_MS);
  return local.toISOString().slice(0, 10);
}

export interface PriceBreakdown {
  price: number;
  minutes: number;
  dayRate: number;
  nightRate: number;
}

/** Tarifas efectivas (evento puede sobrescribir día/noche). */
export function effectiveRates(space: Space, usageType: string) {
  const isEvent = usageType === 'evento';
  return {
    dayRate: Number((isEvent ? space.event_day_rate : null) ?? space.day_rate ?? 0),
    nightRate: Number((isEvent ? space.event_night_rate : null) ?? space.night_rate ?? 0),
  };
}

/** Precio prorrateado por minuto entre día y noche. */
export function computePrice(space: Space, usageType: string, start: Date, end: Date): PriceBreakdown {
  const nightStart = parseHhMm(String(space.night_start).slice(0, 5));
  const nightEnd = parseHhMm(String(space.night_end).slice(0, 5));
  const { dayRate, nightRate } = effectiveRates(space, usageType);

  let price = 0;
  let minutes = 0;
  const cursor = new Date(start.getTime());
  while (cursor < end && minutes < 24 * 60) {
    const night = isNightMinute(limaMinutes(cursor), nightStart, nightEnd);
    price += (night ? nightRate : dayRate) / 60;
    cursor.setMinutes(cursor.getMinutes() + 1);
    minutes += 1;
  }

  return { price: Math.round(price * 100) / 100, minutes, dayRate, nightRate };
}
