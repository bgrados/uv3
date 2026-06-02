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

export const metadata: Metadata = {
  title: 'UV3 Platform - Unidad Vecinal 3',
  description:
    'Plataforma digital comunitaria y deportiva de la Unidad Vecinal 3. Campeonatos, fixtures, resultados en vivo, noticias y más.',
  keywords: ['unidad vecinal 3', 'liga deportiva', 'campeonato', 'fútbol', 'comunidad'],
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
