'use client';

import React from 'react';
import Link from 'next/link';
import { Button } from '../../components/ui/Button';

export default function AlertasPage() {
  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <p className="text-xs text-zinc-500 mb-1">Módulo en desarrollo</p>
          <h1 className="text-2xl font-bold text-zinc-900">
            Alertas Sísmicas y Puntos de Evacuación
          </h1>
          <p className="text-sm text-zinc-500">
            Gestión de alertas tempranas, suscripciones zonales y georreferenciación de zonas seguras.
          </p>
        </div>
        <Link href="/mapa">
          <Button variant="outline" className="text-xs">
            ← Ver Mapa General
          </Button>
        </Link>
      </div>

      {/* BANNER DE ALERTA DEMO */}
      <div className="bg-amber-500 text-white p-5 rounded-lg shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xl">⚠️</span>
            <strong className="text-base font-bold">ALERTA SÍSMICA MODERADA (DEMO)</strong>
          </div>
          <p className="text-xs text-white/95">
            Evento sísmico perceptible en macrodistritos Cotahuma y San Antonio. Mantenga la calma y siga las rutas de evacuación.
          </p>
        </div>
      </div>

    </div>
  );
}
