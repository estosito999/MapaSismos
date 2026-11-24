'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { ProtectedRoute } from '../../components/auth/ProtectedRoute';

export default function ReportarPage() {
  const [macrodistrito, setMacrodistrito] = useState('Cotahuma');
  const [intensidad, setIntensidad] = useState('IV');
  const [comentario, setComentario] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <ProtectedRoute>
      <div className="space-y-6 max-w-3xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs text-zinc-500">Módulo en Desarrollo</span>
            </div>
            <h1 className="text-2xl font-bold text-zinc-900">
              Reportar Percepción Sísmica Ciudadana
            </h1>
            <p className="text-sm text-zinc-500">
              Captura de reportes de intensidad en superficie bajo la Escala de Mercalli Modificada (MMI).
            </p>
          </div>
          <Link href="/dashboard">
            <Button variant="outline" className="text-xs">
              ← Volver al Panel
            </Button>
          </Link>
        </div>

        {submitted ? (
          <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-xl text-center space-y-3">
            <span className="text-4xl">✅</span>
            <h2 className="text-lg font-bold text-emerald-900">
              ¡Reporte Registrado con Éxito!
            </h2>
            <p className="text-sm text-emerald-700 max-w-md mx-auto">
              Tu reporte ha quedado guardado con estado <strong className="font-semibold">"Pendiente"</strong> y será auditado por el equipo técnico sismológico (RF4.01 / RF4.02).
            </p>
            <Button
              variant="outline"
              onClick={() => {
                setSubmitted(false);
                setComentario('');
              }}
              className="text-xs mt-2"
            >
              Enviar otro reporte
            </Button>
          </div>
        ) : (
          <Card title="Formulario de reporte técnico">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-1.5 text-zinc-900">
                  Macrodistrito de Percepción
                </label>
                <select
                  value={macrodistrito}
                  onChange={(e) => setMacrodistrito(e.target.value)}
                  className="w-full min-h-[44px] px-4 py-2 bg-white border border-zinc-200 rounded-lg text-sm text-zinc-800 focus:outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/15"
                >
                  <option value="Cotahuma">Cotahuma</option>
                  <option value="Max Paredes">Max Paredes</option>
                  <option value="Periférica">Periférica</option>
                  <option value="San Antonio">San Antonio</option>
                  <option value="Sur">Sur</option>
                  <option value="Mallasa">Mallasa</option>
                  <option value="Centro">Centro</option>
                  <option value="Hampaturi">Hampaturi</option>
                  <option value="Zongo">Zongo</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1.5 text-zinc-900">
                  Intensidad Percibida (Escala Mercalli Modificada - MMI)
                </label>
                <select
                  value={intensidad}
                  onChange={(e) => setIntensidad(e.target.value)}
                  className="w-full min-h-[44px] px-4 py-2 bg-white border border-zinc-200 rounded-lg text-sm text-zinc-800 focus:outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/15"
                >
                  <option value="I">I - No sentido</option>
                  <option value="II">II - Muy débil (reposo)</option>
                  <option value="III">III - Leve (vibración interior)</option>
                  <option value="IV">IV - Moderado (sentido por muchos)</option>
                  <option value="V">V - Fuerte (oscilación de objetos)</option>
                  <option value="VI">VI - Bastante fuerte (daños leves)</option>
                  <option value="VII">VII - Muy fuerte (daño estructural)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1.5 text-zinc-900">
                  Comentario u Observaciones Adicionales
                </label>
                <textarea
                  rows={3}
                  value={comentario}
                  onChange={(e) => setComentario(e.target.value)}
                  placeholder="Describe lo que sentiste, ruidos subterráneos, objetos caídos, etc..."
                  className="w-full p-3 bg-white border border-zinc-200 rounded-lg text-sm text-zinc-800 focus:outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/15"
                />
              </div>

              <div className="pt-2">
                <Button type="submit" variant="accent" className="w-full">
                  Enviar Reporte Ciudadano
                </Button>
              </div>
            </form>
          </Card>
        )}
      </div>
    </ProtectedRoute>
  );
}
