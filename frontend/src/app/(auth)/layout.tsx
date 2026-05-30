import Link from 'next/link';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-uv3-green-dark via-uv3-green to-uv3-green-dark px-4">
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-0 w-96 h-96 bg-uv3-gold rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-uv3-gold rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />
      </div>

      <Link
        href="/"
        className="relative z-10 flex items-center gap-3 mb-8"
      >
        <div className="w-12 h-12 bg-uv3-gold rounded-xl flex items-center justify-center font-heading font-bold text-uv3-green-dark text-xl shadow-lg">
          UV3
        </div>
        <span className="text-white font-heading font-bold text-2xl">
          Unidad Vecinal 3
        </span>
      </Link>

      <div className="relative z-10 w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-2xl p-8">{children}</div>
      </div>

      <p className="relative z-10 text-white/50 text-sm mt-8">
        © 2026 Unidad Vecinal 3
      </p>
    </div>
  );
}
