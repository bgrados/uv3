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
        <div className="w-16 h-16 bg-uv3-green/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-uv3-green text-3xl">✉</span>
        </div>
        <h2 className="font-heading text-2xl font-bold text-gray-900 mb-2">
          Revisa tu correo
        </h2>
        <p className="text-muted text-sm mb-6">
          Te hemos enviado un enlace para restablecer tu contraseña.
        </p>
        <Link href="/login" className="text-uv3-green font-medium hover:text-uv3-green-dark">
          Volver al inicio de sesión
        </Link>
      </div>
    );
  }

  return (
    <>
      <h2 className="font-heading text-2xl font-bold text-center text-gray-900 mb-2">
        Recuperar Contraseña
      </h2>
      <p className="text-center text-muted text-sm mb-6">
        Ingresa tu correo y te enviaremos un enlace de recuperación
      </p>

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

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 bg-uv3-green text-white font-semibold rounded-lg hover:bg-uv3-green-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Enviando...' : 'Enviar enlace'}
        </button>
      </form>

      <p className="text-center text-sm text-muted mt-6">
        <Link href="/login" className="text-uv3-green font-medium hover:text-uv3-green-dark">
          Volver al inicio de sesión
        </Link>
      </p>
    </>
  );
}
