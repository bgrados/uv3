import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useRouter } from 'next/navigation';

export default function SignIn() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/api/auth/callback`,
        },
      });
      if (error) setError(error.message);
    } catch (e: any) {
      setError(e.message || 'Error');
    }
  };

  return (
    <div className="p-8 bg-white rounded shadow-md w-full max-w-sm">
      <h2 className="text-2xl font-semibold mb-4">Iniciar sesión</h2>
      {error && (
        <p className="text-red-600 mb-4">{error}</p>
      )}
      <button
        onClick={handleGoogleSignIn}
        className="w-full py-2 px-4 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        Iniciar con Google
      </button>
    </div>
  );
}
