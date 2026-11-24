'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { getStoredUser } from '../lib/api';

export default function LandingPage() {
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const syncUser = () => {
      setUser(getStoredUser());
    };
    syncUser();

    window.addEventListener('auth-change', syncUser);
    window.addEventListener('storage', syncUser);

    return () => {
      window.removeEventListener('auth-change', syncUser);
      window.removeEventListener('storage', syncUser);
    };
  }, [pathname]);

  return (
    <div className="space-y-16 py-4 max-w-6xl mx-auto">
      {/* SECCIÓN HERO */}
      <section className="text-center space-y-6 pt-6 pb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-100 text-orange-800 text-xs font-semibold tracking-wide">
          <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></span>
          Plataforma Sísmica Oficial La Paz · WGS 84
        </div>

        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-zinc-900 tracking-tight leading-tight">
          Sistema de Información Sísmica <br />
          <span className="text-orange-500">SismoPaz</span>
        </h1>

        <p className="max-w-2xl mx-auto text-base sm:text-lg text-zinc-600 leading-relaxed">
          Plataforma geoespacial integral para el monitoreo sísmico, alertas ciudadanas tempranas, difusión preventiva y reporte de percepción en los 9 macrodistritos del Municipio de La Paz.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
          {user ? (
            <Link href="/dashboard">
              <Button variant="accent" className="text-base px-6 py-3 min-h-[48px]">
                Ir a Mi Panel de Control →
              </Button>
            </Link>
          ) : (
            <>
              <Link href="/login">
                <Button variant="primary" className="text-base px-6 py-3 min-h-[48px]">
                  Iniciar Sesión
                </Button>
              </Link>
              <Link href="/register">
                <Button variant="outline" className="text-base px-6 py-3 min-h-[48px]">
                  Registrarse como Ciudadano
                </Button>
              </Link>
            </>
          )}
          <Link href="/mapa">
            <Button variant="outline" className="text-base px-6 py-3 min-h-[48px] border-zinc-300">
              Ver Mapa en Vivo 🗺️
            </Button>
          </Link>
        </div>
      </section>

      {/* BANNER DE ALERTA RÁPIDA O ESTADO OPERATIVO */}
      <section className="bg-zinc-900 text-white rounded-2xl p-6 sm:p-8 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-emerald-400 text-lg">●</span>
            <span className="text-xs uppercase font-bold tracking-widest text-zinc-400">
              Red de Monitoreo Activa
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white">
            Monitoreo en tiempo continuo de los 9 Macrodistritos
          </h2>
          <p className="text-sm text-zinc-300 max-w-xl">
            Cotahuma, Max Paredes, Periférica, San Antonio, Sur, Mallasa, Centro, Hampaturi y Zongo.
          </p>
        </div>
        <Link href="/alertas">
          <Button variant="severe" className="whitespace-nowrap">
            Consultar Alertas y Zonas Seguras
          </Button>
        </Link>
      </section>

      {/* PILARES / CAPACIDADES */}
      <section className="space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-zinc-900">
            ¿Cómo Funciona SismoPaz?
          </h2>
          <p className="text-sm text-zinc-500 max-w-lg mx-auto">
            Integración de instrumentación geofísica, análisis sismológico y participación ciudadana abierta.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="hover:border-zinc-300 transition-all p-6">
            <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center text-2xl mb-4">
              🗺️
            </div>
            <h3 className="text-lg font-bold text-zinc-900 mb-2">
              Cartografía & Catálogo
            </h3>
            <p className="text-sm text-zinc-600 leading-relaxed">
              Visualización georreferenciada bajo datum WGS 84. Simbología proporcional por magnitud instrumental (Mw, Ml) y profundidad focal del hipocentro.
            </p>
          </Card>

          <Card className="hover:border-zinc-300 transition-all p-6">
            <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center text-2xl mb-4">
              🔔
            </div>
            <h3 className="text-lg font-bold text-zinc-900 mb-2">
              Alertas Zonales y Evacuación
            </h3>
            <p className="text-sm text-zinc-600 leading-relaxed">
              Difusión pública de alertas según nivel de gravedad (Informativa, Moderada, Severa) y localización de puntos seguros de evacuación oficial.
            </p>
          </Card>

          <Card className="hover:border-zinc-300 transition-all p-6">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center text-2xl mb-4">
              🤝
            </div>
            <h3 className="text-lg font-bold text-zinc-900 mb-2">
              Reportes Ciudadanos MMI
            </h3>
            <p className="text-sm text-zinc-600 leading-relaxed">
              La población puede reportar la intensidad percibida mediante la Escala de Mercalli Modificada (I al XII), con auditoría y validación sismológica.
            </p>
          </Card>
        </div>
      </section>

      {/* ROLES Y PERMISOS */}
      <section className="space-y-6 pt-4">
        <div className="text-center space-y-2">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-zinc-900">
            Perfiles de Acceso al Sistema
          </h2>
          <p className="text-sm text-zinc-500 max-w-lg mx-auto">
            Control de acceso basado en roles (RBAC) con trazabilidad y autenticación segura JWT.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white border border-zinc-200 rounded-xl p-6 space-y-4 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center mb-3">
                <span className="text-2xl">👤</span>
                <Badge variant="info">Ciudadano</Badge>
              </div>
              <h3 className="text-lg font-bold text-zinc-900">Población General</h3>
              <ul className="text-xs text-zinc-600 space-y-2 mt-3">
                <li>• Consulta del catálogo y mapa de sismos</li>
                <li>• Lectura de alertas y guías de contingencia</li>
                <li>• Suscripción personalizada a macrodistritos</li>
                <li>• Reporte de sismos sentidos con GPS y escala MMI</li>
              </ul>
            </div>
            <Link href="/register">
              <Button variant="outline" className="w-full text-xs">
                Registrarme
              </Button>
            </Link>
          </div>

          <div className="bg-white border-2 border-orange-400 rounded-xl p-6 space-y-4 shadow-sm flex flex-col justify-between relative">
            <div className="absolute -top-3 right-4 bg-orange-500 text-white text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full">
              Personal Técnico
            </div>
            <div>
              <div className="flex justify-between items-center mb-3">
                <span className="text-2xl">🔬</span>
                <Badge variant="warning">Sismólogo</Badge>
              </div>
              <h3 className="text-lg font-bold text-zinc-900">Cuerpo Sismológico</h3>
              <ul className="text-xs text-zinc-600 space-y-2 mt-3">
                <li>• Registro y edición técnica de eventos sísmicos</li>
                <li>• Emisión y cierre de alertas zonales de emergencia</li>
                <li>• Auditoría y validación de reportes ciudadanos</li>
                <li>• Acreditación requerida (ej. Observatorio San Calixto)</li>
              </ul>
            </div>
            <Link href="/login">
              <Button variant="accent" className="w-full text-xs">
                Ingreso Especialistas
              </Button>
            </Link>
          </div>

          <div className="bg-white border border-zinc-200 rounded-xl p-6 space-y-4 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center mb-3">
                <span className="text-2xl">⚙️</span>
                <Badge variant="severe">Administrador</Badge>
              </div>
              <h3 className="text-lg font-bold text-zinc-900">Gobernanza & TI</h3>
              <ul className="text-xs text-zinc-600 space-y-2 mt-3">
                <li>• Habilitación y suspensión preventiva de cuentas</li>
                <li>• Asignación de rol Sismólogo con matrícula técnica</li>
                <li>• Mantenimiento de puntos de evacuación y directorio</li>
                <li>• Auditoría global de operaciones del sistema</li>
              </ul>
            </div>
            <Link href="/login">
              <Button variant="primary" className="w-full text-xs">
                Acceso de Administración
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="pt-8 pb-4 border-t border-zinc-200 text-center text-xs text-zinc-500 space-y-2">
        <p className="font-semibold text-zinc-700">
          SismoPaz — Sistema de Información Sísmica La Paz · 2026
        </p>
        <p>
          Desarrollado para el Municipio de La Paz, Bolivia · Estándar Geodésico WGS 84
        </p>
      </footer>
    </div>
  );
}
