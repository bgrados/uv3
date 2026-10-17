import Image from 'next/image';

/**
 * Hosts de imagen configurados en `next.config.ts` (los que optimiza Next.js).
 * IMPORTANTE: debe coincidir con `images.remotePatterns`. Cualquier otro host
 * externo se renderiza con un `<img>` normal para que SIEMPRE se vea, en vez de
 * fallar con "hostname is not configured under images".
 */
const CONFIGURED_HOSTS = [
  /(^|\.)supabase\.co$/i,
  /^images\.unsplash\.com$/i,
  /^picsum\.photos$/i,
  /^fastly\.picsum\.photos$/i,
];

function hostIsConfigured(src: string): boolean {
  try {
    const { hostname } = new URL(src);
    return CONFIGURED_HOSTS.some((re) => re.test(hostname));
  } catch {
    // Ruta local (/...) o cadena no parseable: la maneja next/image.
    return true;
  }
}

interface SmartImageProps {
  src: string;
  alt: string;
  fill?: boolean;
  width?: number;
  height?: number;
  sizes?: string;
  className?: string;
  priority?: boolean;
  unoptimized?: boolean;
}

/**
 * Imagen "a prueba de balas": usa la optimización de Next.js para los hosts
 * permitidos y cae a un <img> normal para cualquier otra URL externa.
 */
export function SmartImage({ src, alt, fill, width, height, sizes, className, priority, unoptimized }: SmartImageProps) {
  const isRemote = /^https?:\/\//i.test(src);

  if (!isRemote || hostIsConfigured(src)) {
    return (
      <Image
        src={src}
        alt={alt}
        fill={fill}
        width={width}
        height={height}
        sizes={sizes}
        className={className}
        priority={priority}
        unoptimized={unoptimized}
      />
    );
  }

  const mergedClass = [className, fill ? 'absolute inset-0 h-full w-full' : ''].filter(Boolean).join(' ');
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      width={fill ? undefined : width}
      height={fill ? undefined : height}
      className={mergedClass || undefined}
      loading={priority ? 'eager' : 'lazy'}
    />
  );
}
