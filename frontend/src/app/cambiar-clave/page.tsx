'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import {
  apiFetch,
  getStoredToken,
  getStoredUser,
  setStoredToken,
  setStoredUser,
} from '../../lib/api';

export default function CambiarClavePage() {
  const router = useRouter();
  const [actual, setActual] = useState('');
  const [nueva, setNueva] = useState('');
  const [repetir, setRepetir] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!getStoredToken()) router.push('/login');
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (nueva !== repetir) {
      setError('La nueva contraseña y la confirmación no coinciden');
      return;
    }

    setLoading(true);
    try {
      await apiFetch('/users/password', {
        method: 'PATCH',
        body: JSON.stringify({
          passwordActual: actual,
          passwordNuevo: nueva,
          repetirPassword: repetir,
        }),
      });

      const correo = getStoredUser()?.correo;
      if (!correo) throw new Error('No se pudo identificar su cuenta. Inicie sesión nuevamente.');

      const data = await apiFetch('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ correo, password: nueva }),
      });
      setStoredToken(data.token);
      setStoredUser(data.usuario);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Error al cambiar la contraseña');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-12">
      <Card
        title="Cambio obligatorio de contraseña"
        subtitle="Debe actualizar su contraseña antes de acceder al sistema"
      >
        <div className="mb-4 p-3 rounded-lg bg-amber-50 border border-amber-200 text-sm text-amber-900">
          Su cuenta fue creada por el administrador. Ingrese como contraseña actual su <strong>CI</strong> y elija una nueva contraseña.
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-2">
          <Input
            label="Contraseña actual (su CI)"
            type="password"
            value={actual}
            onChange={(e) => setActual(e.target.value)}
            required
          />
          <Input
            label="Nueva contraseña"
            type="password"
            value={nueva}
            onChange={(e) => setNueva(e.target.value)}
            required
          />
          <Input
            label="Repetir nueva contraseña"
            type="password"
            value={repetir}
            onChange={(e) => setRepetir(e.target.value)}
            required
          />
          <p className="text-xs text-zinc-500">
            Mínimo 8 caracteres, con mayúscula, minúscula, número y carácter especial (@$!%*?&.).
          </p>
          <div className="pt-2">
            <Button type="submit" variant="accent" className="w-full" disabled={loading}>
              {loading ? 'Actualizando...' : 'Cambiar contraseña'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
