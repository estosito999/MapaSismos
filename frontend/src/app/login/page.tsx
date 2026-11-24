'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { apiFetch, setStoredToken, setStoredUser } from '../../lib/api';

export default function LoginPage() {
  const router = useRouter();
  const [correo, setCorreo] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const data = await apiFetch('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ correo, password }),
      });

      setStoredToken(data.token);
      setStoredUser(data.usuario);
      router.push(data.usuario.requiereCambioClave ? '/cambiar-clave' : '/dashboard');
    } catch (err: any) {
      setError(err.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-12">
      <Card
        title="Iniciar Sesión"
        subtitle="Acceso al Sistema de Información Sísmica La Paz"
      >
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-2">
          <Input
            label="Correo Electrónico"
            type="email"
            placeholder="ejemplo@correo.com"
            value={correo}
            onChange={(e) => setCorreo(e.target.value)}
            required
          />

          <Input
            label="Contraseña"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <div className="pt-2">
            <Button
              type="submit"
              variant="primary"
              className="w-full"
              disabled={loading}
            >
              {loading ? 'Validando credenciales...' : 'Ingresar'}
            </Button>
          </div>
        </form>

        <div className="mt-6 pt-4 border-t border-zinc-200 text-center text-sm text-zinc-600">
          ¿No tienes una cuenta?{' '}
          <Link href="/register" className="text-orange-600 font-semibold hover:underline">
            Regístrate aquí
          </Link>
        </div>

        <div className="mt-4 p-3 bg-zinc-50 rounded-lg text-xs text-zinc-500 border border-zinc-200">
          <p className="font-semibold text-zinc-700 mb-1">Cuentas de prueba preconfiguradas:</p>
          <p>• <strong>Administrador:</strong> <span className="font-mono text-zinc-800">admin@sismopaz.bo</span> (pass: <span className="font-mono text-zinc-800">Admin2026!</span>)</p>
          <p>• <strong>Sismólogo:</strong> <span className="font-mono text-zinc-800">sismologo@sismopaz.bo</span> (pass: <span className="font-mono text-zinc-800">Sismologo2026!</span>)</p>
          <p>• <strong>Ciudadano:</strong> <span className="font-mono text-zinc-800">ciudadano@sismopaz.bo</span> (pass: <span className="font-mono text-zinc-800">Ciudadano2026!</span>)</p>
        </div>
      </Card>
    </div>
  );
}
