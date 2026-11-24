'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { ProtectedRoute } from '../../components/auth/ProtectedRoute';
import { getStoredToken, getStoredUser } from '../../lib/api';

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const token = getStoredToken();
    const u = getStoredUser();
    if (!token || !u) {
      router.push('/login');
      return;
    }
    setUser(u);
  }, []);

  if (!user) {
    return <div className="p-8 text-center text-zinc-500">Cargando...</div>;
  }

  const isAdmin = user.roles?.includes('Administrador');
  const isSismologo = user.roles?.includes('Sismólogo') || isAdmin;

  return (
    <ProtectedRoute>
      <div className="space-y-6">
        {/* BIENVENIDA */}
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">
            Bienvenido, {user.nombre}
          </h1>
          <p className="text-sm text-zinc-500">
            Panel principal del Sistema de Información Sísmica La Paz.
          </p>
          <div className="flex gap-2 mt-2">
            <Badge
              variant={
                isAdmin ? 'severe' : isSismologo ? 'warning' : 'info'
              }
            >
              {user.roles?.[0] || 'Ciudadano'}
            </Badge>
          </div>
        </div>

      {/* ACCESO PÚBLICO */}
      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-3">
          Acceso Público
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link href="/mapa">
            <Card className="hover:border-orange-300 hover:shadow-md transition-all cursor-pointer">
              <div className="flex items-start gap-3">
                <span className="text-2xl">🗺️</span>
                <div>
                  <h3 className="font-bold text-zinc-900 text-sm">
                    Visor Cartográfico
                  </h3>
                  <p className="text-xs text-zinc-500 mt-1">
                    Mapa interactivo de sismos georreferenciados en La Paz.
                  </p>
                </div>
              </div>
            </Card>
          </Link>
          <Link href="/alertas">
            <Card className="hover:border-orange-300 hover:shadow-md transition-all cursor-pointer">
              <div className="flex items-start gap-3">
                <span className="text-2xl">🔔</span>
                <div>
                  <h3 className="font-bold text-zinc-900 text-sm">
                    Alertas y Evacuación
                  </h3>
                  <p className="text-xs text-zinc-500 mt-1">
                    Alertas sísmicas activas y puntos de evacuación.
                  </p>
                </div>
              </div>
            </Card>
          </Link>
          <Link href="/prevencion">
            <Card className="hover:border-orange-300 hover:shadow-md transition-all cursor-pointer">
              <div className="flex items-start gap-3">
                <span className="text-2xl">🛡️</span>
                <div>
                  <h3 className="font-bold text-zinc-900 text-sm">
                    Guías de Prevención
                  </h3>
                  <p className="text-xs text-zinc-500 mt-1">
                    Instrucciones antes, durante y después de un sismo.
                  </p>
                </div>
              </div>
            </Card>
          </Link>
        </div>
      </div>

      {/* CIUDADANO REGISTRADO */}
      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-3">
          Ciudadano Registrado
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link href="/perfil">
            <Card className="hover:border-orange-300 hover:shadow-md transition-all cursor-pointer">
              <div className="flex items-start gap-3">
                <span className="text-2xl">👤</span>
                <div>
                  <h3 className="font-bold text-zinc-900 text-sm">
                    Mi Perfil y Suscripciones
                  </h3>
                  <p className="text-xs text-zinc-500 mt-1">
                    Gestiona tus datos personales, contraseña y zonas de alerta.
                  </p>
                </div>
              </div>
            </Card>
          </Link>
          <Link href="/reportar">
            <Card className="hover:border-orange-300 hover:shadow-md transition-all cursor-pointer">
              <div className="flex items-start gap-3">
                <span className="text-2xl">📝</span>
                <div>
                  <h3 className="font-bold text-zinc-900 text-sm">
                    Reportar Percepción Sísmica
                  </h3>
                  <p className="text-xs text-zinc-500 mt-1">
                    Reporta la intensidad percibida durante un sismo (Escala MMI).
                  </p>
                </div>
              </div>
            </Card>
          </Link>
        </div>
      </div>

      {/* PANEL TÉCNICO - SISMÓLOGO */}
      {isSismologo && (
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-3">
            Panel Técnico (Sismólogo)
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link href="/monitoreo">
              <Card className="hover:border-orange-300 hover:shadow-md transition-all cursor-pointer">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">📡</span>
                  <div>
                    <h3 className="font-bold text-zinc-900 text-sm">
                      Catálogo Sísmico
                    </h3>
                    <p className="text-xs text-zinc-500 mt-1">
                      Registro, monitoreo y revisión de eventos sísmicos.
                    </p>
                  </div>
                </div>
              </Card>
            </Link>
            <Link href="/auditoria">
              <Card className="hover:border-orange-300 hover:shadow-md transition-all cursor-pointer">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">✅</span>
                  <div>
                    <h3 className="font-bold text-zinc-900 text-sm">
                      Auditoría de Reportes
                    </h3>
                    <p className="text-xs text-zinc-500 mt-1">
                      Validar o rechazar reportes ciudadanos de intensidad.
                    </p>
                  </div>
                </div>
              </Card>
            </Link>
            <Link href="/estadisticas">
              <Card className="hover:border-orange-300 hover:shadow-md transition-all cursor-pointer">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">📊</span>
                  <div>
                    <h3 className="font-bold text-zinc-900 text-sm">
                      Reportes Estadísticos
                    </h3>
                    <p className="text-xs text-zinc-500 mt-1">
                      Informes consolidados y exportación PDF/CSV/XLSX.
                    </p>
                  </div>
                </div>
              </Card>
            </Link>
          </div>
        </div>
      )}

      {/* PANEL ADMIN */}
      {isAdmin && (
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-3">
            Administración del Sistema
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link href="/admin/usuarios">
              <Card className="hover:border-orange-300 hover:shadow-md transition-all cursor-pointer">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">⚙️</span>
                  <div>
                    <h3 className="font-bold text-zinc-900 text-sm">
                      Gestión de Cuentas y Roles
                    </h3>
                    <p className="text-xs text-zinc-500 mt-1">
                      Habilitar/suspender cuentas y asignar rol de Sismólogo.
                    </p>
                  </div>
                </div>
              </Card>
            </Link>
          </div>
        </div>
      )}
    </div>
    </ProtectedRoute>
  );
}
