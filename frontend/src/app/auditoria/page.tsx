'use client';

import React from 'react';
import Link from 'next/link';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { ProtectedRoute } from '../../components/auth/ProtectedRoute';

export default function AuditoriaPage() {
  return (
    <ProtectedRoute requiredRoles={['Sismólogo', 'Administrador']}>
      <div className="space-y-6 max-w-5xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs text-zinc-500">Módulo en Desarrollo</span>
            </div>
            <h1 className="text-2xl font-bold text-zinc-900">
              Auditoría y Validación de Reportes Ciudadanos
            </h1>
            <p className="text-sm text-zinc-500">
              Inspección técnica de reportes de campo, vinculación a eventos sísmicos y dictamen de estado (Validado/Rechazado).
            </p>
          </div>
          <Link href="/dashboard">
            <Button variant="outline" className="text-xs">
              ← Volver al Panel
            </Button>
          </Link>
        </div>

        <Card title="Bandeja de reportes recibidos">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-zinc-50 border-b border-zinc-200 text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                  <th className="p-3">ID Reporte</th>
                  <th className="p-3">Macrodistrito</th>
                  <th className="p-3">Intensidad MMI</th>
                  <th className="p-3">Fecha / Hora</th>
                  <th className="p-3">Estado</th>
                  <th className="p-3 text-right">Dictamen</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200">
                <tr className="hover:bg-zinc-50">
                  <td className="p-3 font-mono text-xs">#REP-001</td>
                  <td className="p-3 font-medium text-zinc-900">Sur (Calacoto)</td>
                  <td className="p-3">
                    <Badge variant="warning">Grado IV (Moderado)</Badge>
                  </td>
                  <td className="p-3 text-xs text-zinc-500">18 Nov 2026 03:20 BOT</td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
                      Pendiente
                    </span>
                  </td>
                  <td className="p-3 text-right">
                    <div className="flex justify-end gap-1.5">
                      <Button variant="accent" className="text-xs py-1 px-2.5 min-h-[32px]">
                        Validar
                      </Button>
                      <Button variant="outline" className="text-xs py-1 px-2.5 min-h-[32px] text-rose-600">
                        Rechazar
                      </Button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </ProtectedRoute>
  );
}
