'use client';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { signupAction } from '@/app/auth/actions';

const ROLE_LABEL: Record<string, string> = {
  delegate: 'Delegado',
  referee: 'Árbitro',
  organizer: 'Organizador',
};

function RegisterForm() {
  const searchParams = useSearchParams();
  const rol = searchParams.get('rol') ?? '';
  const rolLabel = ROLE_LABEL[rol];
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError('');
    const result = await signupAction(formData);
    if (!result.success && result.error) {
      setError(result.error);
    }
    setLoading(false);
  }

  return (
    <>
      <h2 className="mb-2 text-center font-heading text-2xl font-bold text-gray-900">Crear cuenta</h2>
      <p className="mb-6 text-center text-sm text-muted">Únete a la comunidad UV3</p>

      {rolLabel && (
        <div className="mb-4 rounded-lg border border-uv3-green/20 bg-uv3-green/5 p-3 text-sm text-stone-700">
          Te estás registrando como <strong>{rolLabel}</strong>. Después de crear tu cuenta, el administrador la aprobará y le asignará el rol correspondiente.
        </div>
      )}
      {error && <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-destructive">{error}</div>}

      <form action={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="full_name" className="mb-1 block text-sm font-medium text-gray-700">
            Nombre completo
          </label>
          <input
            id="full_name"
            name="full_name"
            type="text"
            required
            className="w-full rounded-lg border border-gray-200 px-4 py-2.5 outline-none transition-all focus:border-transparent focus:ring-2 focus:ring-uv3-green"
            placeholder="Juan Pérez"
          />
        </div>

        <div>
          <label htmlFor="username" className="mb-1 block text-sm font-medium text-gray-700">
            Nombre de usuario
          </label>
          <input
            id="username"
            name="username"
            type="text"
            required
            className="w-full rounded-lg border border-gray-200 px-4 py-2.5 outline-none transition-all focus:border-transparent focus:ring-2 focus:ring-uv3-green"
            placeholder="juanperez"
          />
        </div>

        <div>
          <label htmlFor="email" className="mb-1 block text-sm font-medium text-gray-700">
            Correo electrónico
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            className="w-full rounded-lg border border-gray-200 px-4 py-2.5 outline-none transition-all focus:border-transparent focus:ring-2 focus:ring-uv3-green"
            placeholder="tu@correo.com"
          />
        </div>

        <div>
          <label htmlFor="password" className="mb-1 block text-sm font-medium text-gray-700">
            Contraseña
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            minLength={6}
            className="w-full rounded-lg border border-gray-200 px-4 py-2.5 outline-none transition-all focus:border-transparent focus:ring-2 focus:ring-uv3-green"
            placeholder="Mínimo 6 caracteres"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-uv3-green py-2.5 font-semibold text-white transition-colors hover:bg-uv3-green-dark disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? 'Registrando...' : 'Crear cuenta'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-muted">
        ¿Ya tienes cuenta?{' '}
        <Link href="/login" className="font-medium text-uv3-green transition-colors hover:text-uv3-green-dark">
          Inicia sesión
        </Link>
      </p>
    </>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="text-center text-sm text-muted">Cargando...</div>}>
      <RegisterForm />
    </Suspense>
  );
}
