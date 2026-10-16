import { ImageResponse } from 'next/og';
import fs from 'node:fs';
import path from 'node:path';

export const size = { width: 512, height: 512 };
export const contentType = 'image/png';
export const dynamic = 'force-dynamic';

/**
 * Lee el logo configurado en `site_settings` (editable desde el panel) y lo
 * usa como favicon. Si no hay configuración, cae al logo del repositorio.
 */
async function resolveLogo(): Promise<string | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (url && key && !url.includes('placeholder')) {
    try {
      const res = await fetch(
        `${url}/rest/v1/site_settings?select=logo_url,favicon_url&id=eq.1`,
        {
          headers: { apikey: key, Authorization: `Bearer ${key}` },
          cache: 'no-store',
        }
      );
      if (res.ok) {
        const rows = (await res.json()) as { logo_url: string | null; favicon_url: string | null }[];
        const remote = rows?.[0]?.favicon_url || rows?.[0]?.logo_url;
        if (remote) return remote;
      }
    } catch {
      // Sin conexión: se usa el fallback local.
    }
  }

  try {
    const file = fs.readFileSync(path.join(process.cwd(), 'public', 'logo.jpg'));
    return `data:image/jpeg;base64,${file.toString('base64')}`;
  } catch {
    return null;
  }
}

export default async function Icon() {
  const src = await resolveLogo();

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#14833B',
        }}
      >
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={src} alt="UV3" width={512} height={512} style={{ objectFit: 'cover' }} />
        ) : (
          <span style={{ color: '#D8B400', fontSize: 260, fontWeight: 800 }}>U</span>
        )}
      </div>
    ),
    size
  );
}
