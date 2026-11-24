'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { apiFetch, setStoredToken, setStoredUser } from '../../lib/api';

export default function RegisterPage() {
  const router = useRouter();
  const [nombre, setNombre] = useState('');
  const [apellidos, setApellidos] = useState('');
  const [correo, setCorreo] = useState('');
  const [password, setPassword] = useState('');
  const [telefono, setTelefono] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const data = await apiFetch('/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          nombre,
          apellidos,
          correo,
          password,
          telefono: telefono || undefined,
        }),
      });

      setStoredToken(data.token);
      setStoredUser(data.usuario);
      router.push('/perfil');
    } catch (err: any) {
      setError(err.message || 'Error en el registro');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-10">
      <Card
        title="Crear Cuenta Ciudadana"
        subtitle="Registro seguro con credenciales trazables"
      >
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-1">
          <Input
            label="Nombres *"
            placeholder="Ej. Carlos"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            required
          />

          <Input
            label="Apellidos *"
            placeholder="Ej. Mendoza Quispe"
            value={apellidos}
            onChange={(e) => setApellidos(e.target.value)}
            required
          />

          <Input
            label="Correo Electrónico *"
            type="email"
            placeholder="carlos@correo.com"
            value={correo}
            onChange={(e) => setCorreo(e.target.value)}
            required
          />

          <Input
            label="Teléfono de Contacto"
            placeholder="Ej. 72001122"
            value={telefono}
            onChange={(e) => setTelefono(e.target.value)}
          />

          <Input
            label="Contraseña (mínimo 8 caracteres) *"
            type="password"
            placeholder="Al menos 1 mayúscula, 1 número y 1 símbolo"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <div className="pt-3">
            <Button
              type="submit"
              variant="accent"
              className="w-full"
              disabled={loading}
            >
              {loading ? 'Creando cuenta...' : 'Registrarme'}
            </Button>
          </div>
        </form>

        <div className="mt-6 pt-4 border-t border-zinc-200 text-center text-sm text-zinc-600">
          ¿Ya tienes cuenta?{' '}
          <Link href="/login" className="text-orange-600 font-semibold hover:underline">
            Inicia sesión
          </Link>
        </div>
      </Card>
    </div>
  );
}
