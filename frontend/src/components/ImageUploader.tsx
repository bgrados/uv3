'use client';

import { useState } from 'react';
import { uploadMediaAction } from '@/app/actions/media';

interface ImageUploaderProps {
  /** Nombre del campo oculto que viaja al formulario. */
  name: string;
  bucket: 'team-logos' | 'player-photos' | 'tournament-banners' | 'branding' | 'business-media' | 'gallery-media';
  label?: string;
  initialValue?: string | null;
  hint?: string;
}

export function ImageUploader({ name, bucket, label = 'Imagen', initialValue = '', hint }: ImageUploaderProps) {
  const [url, setUrl] = useState(initialValue ?? '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    setError(null);
    const fd = new FormData();
    fd.set('file', file);
    fd.set('bucket', bucket);
    const res = await uploadMediaAction(fd);
    if (res.success && res.data) setUrl(res.data);
    else setError(res.error ?? 'No se pudo subir la imagen.');
    setBusy(false);
  }

  return (
    <div className="grid gap-2">
      <span className="text-sm font-medium text-gray-700">{label}</span>
      <div className="flex items-center gap-3">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-uv3-bg">
          {url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={url} alt="Vista previa" className="h-16 w-16 object-cover" />
          ) : (
            <span className="text-2xl">🖼️</span>
          )}
        </div>
        <div className="flex-1 space-y-1">
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp,image/svg+xml"
            onChange={(e) => handleFile(e.target.files?.[0])}
            className="block w-full text-xs"
          />
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://… (o sube un archivo)"
            className="w-full rounded-lg border px-3 py-1.5 text-xs outline-none focus:border-uv3-green"
          />
          {busy && <p className="text-xs text-stone-500">Subiendo…</p>}
          {error && <p className="text-xs text-red-600">{error}</p>}
          {hint && <p className="text-xs text-stone-400">{hint}</p>}
        </div>
      </div>
      <input type="hidden" name={name} value={url} />
    </div>
  );
}
