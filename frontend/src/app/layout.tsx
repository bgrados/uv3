import type { Metadata } from 'next';
import { Inter, Poppins } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-heading',
  display: 'swap',
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL?.trim() || 'http://localhost:3000';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: 'UV3 Platform - Unidad Vecinal 3',
  description:
    'Plataforma digital comunitaria y deportiva de la Unidad Vecinal 3. Campeonatos, fixtures, resultados en vivo, noticias y reserva de canchas.',
  keywords: ['unidad vecinal 3', 'liga deportiva', 'campeonato', 'fútbol', 'comunidad', 'reserva de canchas'],
  icons: {
    icon: [{ url: '/icon', type: 'image/png', sizes: '512x512' }],
    apple: [{ url: '/apple-icon', sizes: '180x180', type: 'image/png' }],
  },
  openGraph: {
    type: 'website',
    locale: 'es_PE',
    siteName: 'UV3 — Unidad Vecinal 3',
    title: 'UV3 Platform - Unidad Vecinal 3',
    description:
      'Campeonatos, fixtures, resultados en vivo, noticias vecinales y reserva de canchas de la Unidad Vecinal 3.',
    images: ['/logo.jpg'],
  },
  twitter: {
    card: 'summary_large_image',
    images: ['/logo.jpg'],
  },
  appleWebApp: {
    capable: true,
    title: 'UV3',
    statusBarStyle: 'default',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${inter.variable} ${poppins.variable}`}>
      <body className="min-h-screen bg-uv3-bg antialiased">{children}</body>
    </html>
  );
}
