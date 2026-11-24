'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';

export default function PrevencionPage() {
  const [faseActiva, setFaseActiva] = useState<'antes' | 'durante' | 'despues'>('antes');

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <p className="text-xs text-zinc-500 mb-1">Módulo en desarrollo</p>
          <h1 className="text-2xl font-bold text-zinc-900">
            Guías de Prevención y Difusión
          </h1>
          <p className="text-sm text-zinc-500">
            Medidas preventivas de protección civil estructuradas cronológicamente (Antes, Durante y Después).
          </p>
        </div>
        <Link href="/dashboard">
          <Button variant="outline" className="text-xs">
            ← Volver al Panel
          </Button>
        </Link>
      </div>

      {/* Navegación por fases de prevención */}
      <div className="flex border-b border-zinc-200">
        <button
          onClick={() => setFaseActiva('antes')}
          className={`px-6 py-3 font-semibold text-sm border-b-2 transition-colors ${
            faseActiva === 'antes'
              ? 'border-orange-500 text-orange-600'
              : 'border-transparent text-zinc-500 hover:text-zinc-800'
          }`}
        >
          1. Antes del Sismo (Preparación)
        </button>
        <button
          onClick={() => setFaseActiva('durante')}
          className={`px-6 py-3 font-semibold text-sm border-b-2 transition-colors ${
            faseActiva === 'durante'
              ? 'border-orange-500 text-orange-600'
              : 'border-transparent text-zinc-500 hover:text-zinc-800'
          }`}
        >
          2. Durante el Sismo (Protección)
        </button>
        <button
          onClick={() => setFaseActiva('despues')}
          className={`px-6 py-3 font-semibold text-sm border-b-2 transition-colors ${
            faseActiva === 'despues'
              ? 'border-orange-500 text-orange-600'
              : 'border-transparent text-zinc-500 hover:text-zinc-800'
          }`}
        >
          3. Después del Sismo (Respuesta)
        </button>
      </div>

      {/* CONTENIDO SEGÚN FASE */}
      <Card title={`Recomendaciones: Fase ${faseActiva.toUpperCase()}`}>
        {faseActiva === 'antes' && (
          <div className="space-y-3 text-sm text-zinc-700">
            <p>• Identifique las zonas seguras en su vivienda o lugar de trabajo.</p>
            <p>• Prepare una mochila de emergencia con botiquín, agua, linterna y radio portátil.</p>
            <p>• Conozca los puntos de evacuación oficiales de su macrodistrito en La Paz.</p>
            <p>• Asegure objetos pesados y verifique las instalaciones de gas y electricidad.</p>
          </div>
        )}
        {faseActiva === 'durante' && (
          <div className="space-y-3 text-sm text-zinc-700">
            <p>• Mantenga la calma. No corra ni empuje a otras personas.</p>
            <p>• Agáchese, cúbrase y agárrese bajo una mesa o estructura resistente.</p>
            <p>• Aléjese de ventanas, cristales, muros exteriores y cables eléctricos.</p>
            <p>• Si se encuentra en vía pública, diríjase a espacios abiertos libres de cables y cornisas.</p>
          </div>
        )}
        {faseActiva === 'despues' && (
          <div className="space-y-3 text-sm text-zinc-700">
            <p>• Evacúe de forma ordenada utilizando las escaleras (nunca elevadores).</p>
            <p>• Cierre llaves de paso de agua y gas. Corte el suministro eléctrico.</p>
            <p>• Diríjase al punto de evacuación más cercano y reporte su estado a sus familiares.</p>
            <p>• Use el sistema SismoPaz para reportar la intensidad percibida en su zona.</p>
          </div>
        )}
      </Card>

    </div>
  );
}
