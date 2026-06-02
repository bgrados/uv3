'use client';

import { useState } from 'react';
import Link from 'next/link';
import { forgotPasswordAction } from '@/app/auth/actions';

export default function ForgotPasswordPage() {
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError('');
    const result = await forgotPasswordAction(formData);
    if (result.success) {
      setSuccess(true);
    } else if (result.error) {
      setError(result.error);
    }
    setLoading(false);
  }

  if (success) {
    return (
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-uv3-green/10">
          <span className="text-3xl text-uv3-green">✉</span>
        </div>
        <h2 className="mb-2 font-heading text-2xl font-bold text-gray-900">Revisa tu correo</h2>
        <p className="mb-6 text-sm text-muted">
          Te hemos enviado un enlace para restablecer tu contraseña.
        </p>
        <Link href="/login" className="font-medium text-uv3-green transition-colors hover:text-uv3-green-dark">
          Volver al inicio de sesión
        </Link>
      </div>
    );
  }

  return (
    <>
      <h2 className="mb-2 text-center font-heading text-2xl font-bold text-gray-900">
        Recuperar contraseña
      </h2>
      <p className="mb-6 text-center text-sm text-muted">
        Ingresa tu correo y te enviaremos un enlace de recuperación
      </p>

      {error && <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-destructive">{error}</div>}

      <form action={handleSubmit} className="space-y-4">
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

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-uv3-green py-2.5 font-semibold text-white transition-colors hover:bg-uv3-green-dark disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? 'Enviando...' : 'Enviar enlace'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-muted">
        <Link href="/login" className="font-medium text-uv3-green transition-colors hover:text-uv3-green-dark">
          Volver al inicio de sesión
        </Link>
      </p>
    </>
  );
}
