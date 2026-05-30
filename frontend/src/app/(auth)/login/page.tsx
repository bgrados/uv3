'use client';

import { useState } from 'react';
import { Suspense } from 'react';
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
      <h2 className="font-heading text-2xl font-bold text-center text-gray-900 mb-2">
        Iniciar Sesión
      </h2>
      <p className="text-center text-muted text-sm mb-6">
        Accede a tu cuenta de la UV3
      </p>

      {message && (
        <div className="mb-4 p-3 bg-uv3-green/10 text-uv3-green text-sm rounded-lg">
          {message}
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 bg-red-50 text-destructive text-sm rounded-lg">
          {error}
        </div>
      )}

      <form action={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Correo electrónico
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-uv3-green focus:border-transparent outline-none transition-all"
            placeholder="tu@correo.com"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
            Contraseña
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-uv3-green focus:border-transparent outline-none transition-all"
            placeholder="••••••••"
          />
        </div>

        <div className="flex justify-end">
          <Link
            href="/forgot-password"
            className="text-sm text-uv3-green hover:text-uv3-green-dark transition-colors"
          >
            ¿Olvidaste tu contraseña?
          </Link>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 bg-uv3-green text-white font-semibold rounded-lg hover:bg-uv3-green-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Ingresando...' : 'Iniciar Sesión'}
        </button>
      </form>

      <p className="text-center text-sm text-muted mt-6">
        ¿No tienes cuenta?{' '}
        <Link href="/register" className="text-uv3-green font-medium hover:text-uv3-green-dark">
          Regístrate aquí
        </Link>
      </p>
    </>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
