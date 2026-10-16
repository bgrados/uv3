'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { loginAction } from '@/app/auth/actions';

function LoginForm() {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const searchParams = useSearchParams();
  const message = searchParams.get('message');

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError('');
    const result = await loginAction(formData);
    if (!result.success && result.error) {
      setError(result.error);
    }
    setLoading(false);
  }

  return (
    <>
      <h2 className="mb-2 text-center font-heading text-2xl font-bold text-gray-900">
        Panel de Control UV3
      </h2>
      <p className="mb-6 text-center text-sm text-muted">
        Acceso para administradores, organizadores de torneos y árbitros
      </p>

      {message && (
        <div className="mb-4 rounded-lg bg-uv3-green/10 p-3 text-sm text-uv3-green">{message}</div>
      )}

      {error && <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-destructive">{error}</div>}

      <div className="mb-5 rounded-lg border border-uv3-green/20 bg-uv3-green/5 p-3.5 text-xs text-gray-700">
        <p className="font-bold text-uv3-green-dark mb-1 flex items-center gap-1.5">
          <span className="inline-block h-2 w-2 rounded-full bg-uv3-green"></span>
          Credenciales de acceso:
        </p>
        <p className="text-gray-600">
          • <strong>Admin:</strong> <code className="rounded bg-white px-1.5 py-0.5 font-mono text-stone-800 border">admin@uv3.com</code> | Clave: <code className="rounded bg-white px-1.5 py-0.5 font-mono text-stone-800 border">password123</code>
        </p>
        <p className="text-gray-600 mt-1">
          • <strong>Organizador:</strong> <code className="rounded bg-white px-1.5 py-0.5 font-mono text-stone-800 border">organizador@uv3.com</code> | Clave: <code className="rounded bg-white px-1.5 py-0.5 font-mono text-stone-800 border">password123</code>
        </p>
      </div>

      <form action={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="mb-1 block text-sm font-medium text-gray-700">
            Correo del administrador
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            className="w-full rounded-lg border border-gray-200 px-4 py-2.5 outline-none transition-all focus:border-transparent focus:ring-2 focus:ring-uv3-green"
            placeholder="admin@uv3.com"
          />
        </div>

        <div>
          <label htmlFor="password" className="mb-1 block text-sm font-medium text-gray-700">
            Clave
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            className="w-full rounded-lg border border-gray-200 px-4 py-2.5 outline-none transition-all focus:border-transparent focus:ring-2 focus:ring-uv3-green"
            placeholder="••••••••"
          />
        </div>

        <div className="flex justify-end">
          <Link
            href="/forgot-password"
            className="text-sm text-uv3-green transition-colors hover:text-uv3-green-dark"
          >
            ¿Olvidaste tu clave?
          </Link>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-uv3-green py-2.5 font-semibold text-white transition-colors hover:bg-uv3-green-dark disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? 'Ingresando...' : 'Entrar al panel'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-muted">
        Si necesitas una cuenta nueva, usa el registro general del sistema.
      </p>
    </>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
