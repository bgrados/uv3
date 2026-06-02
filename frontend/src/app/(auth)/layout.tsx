import Link from 'next/link';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-uv3-green-dark via-uv3-green to-uv3-green-dark px-4">
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-0 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-uv3-gold blur-3xl" />
        <div className="absolute bottom-0 right-0 h-96 w-96 translate-x-1/2 translate-y-1/2 rounded-full bg-uv3-gold blur-3xl" />
      </div>

      <Link href="/" className="relative z-10 mb-8 flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-uv3-gold text-xl font-bold text-uv3-green-dark shadow-lg">
          UV3
        </div>
        <span className="text-2xl font-bold text-white">Unidad Vecinal 3</span>
      </Link>

      <div className="relative z-10 w-full max-w-md">
        <div className="rounded-2xl bg-white p-8 shadow-2xl">{children}</div>
      </div>

      <p className="relative z-10 mt-8 text-sm text-white/50">© 2026 Unidad Vecinal 3</p>
    </div>
  );
}
