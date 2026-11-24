'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { getStoredUser } from '../../lib/api';

export const Sidebar: React.FC<{ isOpen: boolean; onClose: () => void }> = ({
  isOpen,
  onClose,
}) => {
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    setUser(getStoredUser());
  }, [pathname]);

  const isAdmin = user?.roles?.includes('Administrador');
  const isSismologo = user?.roles?.includes('Sismólogo') || isAdmin;

  const navItemClass = (path: string) => {
    const isActive = pathname === path;
    return `flex justify-between items-center px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
      isActive
        ? 'bg-zinc-900 text-white'
        : 'text-zinc-700 hover:bg-zinc-100 hover:text-orange-600'
    }`;
  };

  const chipClass = (path: string) => {
    const isActive = pathname === path;
    return `text-[10px] font-semibold px-1.5 py-0.5 rounded ${
      isActive ? 'bg-white/20 text-white' : 'bg-zinc-200 text-zinc-600'
    }`;
  };

  return (
    <>
      {/* Overlay para móviles */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
        />
      )}

      <aside
        className={`fixed lg:sticky top-16 left-0 z-40 w-64 h-[calc(100vh-64px)] bg-white border-r border-zinc-200 p-5 overflow-y-auto transition-transform duration-200 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="space-y-6">
          {/* SECCIÓN 0: NAVEGACIÓN GENERAL */}
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2">
              Principal
            </p>
            <ul className="space-y-1">
              <li>
                <Link href="/" onClick={onClose} className={navItemClass('/')}>
                  <span>Inicio (Portal)</span>
                </Link>
              </li>
              {user && (
                <li>
                  <Link href="/dashboard" onClick={onClose} className={navItemClass('/dashboard')}>
                    <span>Mi Panel</span>
                    <span className={chipClass('/dashboard')}>Core</span>
                  </Link>
                </li>
              )}
            </ul>
          </div>

          {/* SECCIÓN 1: ACCESO PÚBLICO */}
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2">
              Acceso Público
            </p>
            <ul className="space-y-1">
              <li>
                <Link href="/mapa" onClick={onClose} className={navItemClass('/mapa')}>
                  <span>Visor Cartográfico</span>
                  <span className={chipClass('/mapa')}>S1</span>
                </Link>
              </li>
              <li>
                <Link href="/alertas" onClick={onClose} className={navItemClass('/alertas')}>
                  <span>Alertas y Evacuación</span>
                  <span className={chipClass('/alertas')}>S2</span>
                </Link>
              </li>
              <li>
                <Link href="/prevencion" onClick={onClose} className={navItemClass('/prevencion')}>
                  <span>Guías Prevención</span>
                  <span className={chipClass('/prevencion')}>S3</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Sección de ciudadano registrado */}
          {user && (
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2">
                Ciudadano Registrado
              </p>
              <ul className="space-y-1">
                <li>
                  <Link href="/perfil" onClick={onClose} className={navItemClass('/perfil')}>
                    <span>Mi Perfil / Zonas</span>
                    <span className={chipClass('/perfil')}>S5</span>
                  </Link>
                </li>
                <li>
                  <Link href="/reportar" onClick={onClose} className={navItemClass('/reportar')}>
                    <span>Reportar Percepción</span>
                    <span className={chipClass('/reportar')}>S4</span>
                  </Link>
                </li>
              </ul>
            </div>
          )}

          {/* SECCIÓN 3: PANEL ADMINISTRATIVO / TÉCNICO */}
          {(isSismologo || isAdmin) && (
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2">
                Panel Técnico & Admin
              </p>
              <ul className="space-y-1">
                {isAdmin && (
                  <li>
                    <Link
                      href="/admin/usuarios"
                      onClick={onClose}
                      className={navItemClass('/admin/usuarios')}
                    >
                      <span>Gestión de Cuentas</span>
                      <span className={chipClass('/admin/usuarios')}>S5</span>
                    </Link>
                  </li>
                )}
                {isSismologo && (
                  <>
                    <li>
                      <Link href="/monitoreo" onClick={onClose} className={navItemClass('/monitoreo')}>
                        <span>Catálogo Sísmico</span>
                        <span className={chipClass('/monitoreo')}>S7</span>
                      </Link>
                    </li>
                    {user?.roles?.includes('Sismólogo') && (
                      <>
                      <li>
                        <Link
                          href="/monitoreo/nuevo"
                          onClick={onClose}
                          className={navItemClass('/monitoreo/nuevo')}
                        >
                          <span>Registrar Sismo</span>
                        </Link>
                      </li>
                      <li>
                        <Link
                          href="/monitoreo/duplicados"
                          onClick={onClose}
                          className={navItemClass('/monitoreo/duplicados')}
                        >
                          <span>Revisar Duplicados</span>
                        </Link>
                      </li>
                      </>
                    )}
                    <li>
                      <Link href="/auditoria" onClick={onClose} className={navItemClass('/auditoria')}>
                        <span>Auditoría Ciudadana</span>
                        <span className={chipClass('/auditoria')}>S4</span>
                      </Link>
                    </li>
                    <li>
                      <Link href="/estadisticas" onClick={onClose} className={navItemClass('/estadisticas')}>
                        <span>Reportes Estadísticos</span>
                        <span className={chipClass('/estadisticas')}>S6</span>
                      </Link>
                    </li>
                  </>
                )}
              </ul>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};
