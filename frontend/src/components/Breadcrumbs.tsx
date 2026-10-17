import Link from 'next/link';

interface Crumb {
  label: string;
  href?: string;
}

/**
 * Breadcrumbs con datos estructurados JSON-LD (schema.org) para SEO.
 * Recibe la ruta como lista de migas; la última no lleva enlace.
 */
export function Breadcrumbs({ items }: { items: Crumb[] }) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.label,
      item: item.href ? `__SITE_URL__${item.href}` : undefined,
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/__SITE_URL__/g, '') }}
      />
      <nav aria-label="breadcrumb" className="mb-6 flex items-center gap-1.5 text-xs text-stone-500">
        <Link href="/" className="hover:text-uv3-green">
          Inicio
        </Link>
        {items.map((item, i) => (
          <span key={i} className="flex items-center gap-1.5">
            <span aria-hidden>›</span>
            {item.href ? (
              <Link href={item.href} className="hover:text-uv3-green">
                {item.label}
              </Link>
            ) : (
              <span className="font-semibold text-uv3-green-dark">{item.label}</span>
            )}
          </span>
        ))}
      </nav>
    </>
  );
}
