'use client';

import React from 'react';
import Link from 'next/link';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { ProtectedRoute } from '../../components/auth/ProtectedRoute';

export default function EstadisticasPage() {
  return (
    <ProtectedRoute requiredRoles={['Sismólogo', 'Administrador']}>
      <div className="space-y-6 max-w-5xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs text-zinc-500">Módulo en Desarrollo</span>
            </div>
            <h1 className="text-2xl font-bold text-zinc-900">
              Análisis Estadístico y Telemetría Sísmica
            </h1>
            <p className="text-sm text-zinc-500">
              Consolidación de métricas de sismicidad en La Paz, distribución macrodistrital y exportación formal (PDF, CSV, XLSX).
            </p>
          </div>
          <Link href="/dashboard">
            <Button variant="outline" className="text-xs">
              ← Volver al Panel
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider block mb-1">
              Eventos Registrados (Mes)
            </span>
            <div className="text-3xl font-extrabold text-zinc-900">14</div>
            <span className="text-xs text-emerald-600 font-medium">Actividad normal para la cuenca</span>
          </Card>
          <Card>
            <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider block mb-1">
              Magnitud Promedio
            </span>
            <div className="text-3xl font-extrabold text-zinc-900">3.4 Mw</div>
            <span className="text-xs text-zinc-500 font-medium">Rango: 2.1 – 4.5 Mw</span>
          </Card>
          <Card>
            <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider block mb-1">
              Macrodistrito con Mayor Percepción
            </span>
            <div className="text-2xl font-extrabold text-orange-600 truncate">Cotahuma</div>
            <span className="text-xs text-zinc-500 font-medium">6 reportes ciudadanos validados</span>
          </Card>
        </div>

        <Card title="Opciones de exportación institucional">
          <p className="text-sm text-zinc-600 mb-4">
            Generación de consolidados estructurados para el Gobierno Autónomo Municipal de La Paz (GAMLP) y el Observatorio San Calixto:
          </p>
          <div className="flex flex-wrap gap-3">
            <Button variant="primary" className="text-xs">
              📄 Descargar Reporte Técnico (PDF)
            </Button>
            <Button variant="outline" className="text-xs">
              📊 Exportar Matriz de Datos (CSV)
            </Button>
            <Button variant="outline" className="text-xs">
              📗 Exportar Hoja de Cálculo (XLSX)
            </Button>
          </div>
        </Card>
      </div>
    </ProtectedRoute>
  );
}
