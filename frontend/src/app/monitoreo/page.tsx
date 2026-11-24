'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useState } from 'react';
import { ProtectedRoute } from '../../components/auth/ProtectedRoute';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { apiFetch } from '../../lib/api';

interface Catalogo {
  idTipoMagnitud?: number;
  idEstadoSismo?: number;
  idFuente?: number;
  codigo?: string;
  nombre: string;
}

interface EventoSismico {
  idSismo: number;
  fechaHoraUtc: string;
  magnitud: number;
  profundidadKm: number;
  ubicacionReferencia?: string;
  tipoMagnitud: { codigo: string; nombre: string };
  estado: { nombre: string };
  fuentePrincipal?: { nombre: string; identificadorExterno?: string };
}

interface ResultadoListado {
  items: EventoSismico[];
  paginacion: {
    pagina: number;
    limite: number;
    total: number;
    totalPaginas: number;
    tieneAnterior: boolean;
    tieneSiguiente: boolean;
  };
}

const initialFilters = {
  fechaDesde: '', fechaHasta: '', magnitudMin: '', magnitudMax: '',
  idTipoMagnitud: '', idEstadoSismo: '', idFuente: '', ubicacion: '',
};

const selectClass = 'w-full min-h-[44px] px-3 py-2 bg-white border border-zinc-200 rounded-lg text-zinc-800 focus:outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/15 text-sm';

const badgeVariant = (estado: string): 'success' | 'warning' | 'info' => {
  if (estado === 'Publicado') return 'success';
  if (estado === 'Revisado') return 'info';
  return 'warning';
};

export default function MonitoreoPage() {
  const [filters, setFilters] = useState(initialFilters);
  const [appliedFilters, setAppliedFilters] = useState(initialFilters);
  const [pagina, setPagina] = useState(1);
  const [resultado, setResultado] = useState<ResultadoListado | null>(null);
  const [tipos, setTipos] = useState<Catalogo[]>([]);
  const [estados, setEstados] = useState<Catalogo[]>([]);
  const [fuentes, setFuentes] = useState<Catalogo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    Promise.all([
      apiFetch<Catalogo[]>('/sismos/catalogos/tipos-magnitud'),
      apiFetch<Catalogo[]>('/sismos/catalogos/estados'),
      apiFetch<Catalogo[]>('/sismos/catalogos/fuentes'),
    ]).then(([a, b, c]) => {
      if (mounted) { setTipos(a); setEstados(b); setFuentes(c); }
    }).catch((err: Error) => { if (mounted) setError(err.message); });
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    let mounted = true;
    const params = new URLSearchParams({ pagina: String(pagina), limite: '10' });
    Object.entries(appliedFilters).forEach(([key, value]) => {
      if (!value) return;
      if (key === 'fechaDesde') params.set(key, `${value}T00:00:00.000Z`);
      else if (key === 'fechaHasta') params.set(key, `${value}T23:59:59.999Z`);
      else params.set(key, value);
    });
    setLoading(true); setError(null);
    apiFetch<ResultadoListado>(`/sismos?${params.toString()}`)
      .then((data) => { if (mounted) setResultado(data); })
      .catch((err: Error) => { if (mounted) setError(err.message || 'No se pudo consultar el catálogo'); })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, [appliedFilters, pagina]);

  const updateFilter = (field: keyof typeof initialFilters, value: string) => setFilters((current) => ({ ...current, [field]: value }));
  const applyFilters = (event: FormEvent) => { event.preventDefault(); setPagina(1); setAppliedFilters(filters); };
  const clearFilters = () => { setFilters(initialFilters); setAppliedFilters(initialFilters); setPagina(1); };

  return (
    <ProtectedRoute requiredRoles={['Sismólogo']}>
      <div className="space-y-6 max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div>
            <p className="text-xs text-zinc-500 mb-1">Monitoreo técnico</p>
            <h1 className="text-2xl font-bold text-zinc-900">Catálogo sísmico oficial</h1>
            <p className="text-sm text-zinc-500">Eventos ordenados desde el más reciente, con fecha UTC y hora de Bolivia.</p>
          </div>
          <div className="flex flex-wrap gap-2"><Link href="/monitoreo/nuevo"><Button variant="accent">+ Registrar evento</Button></Link><Link href="/monitoreo/duplicados"><Button variant="outline">Revisar duplicados</Button></Link><Link href="/dashboard"><Button variant="outline">← Panel</Button></Link></div>
        </div>

        <Card title="Filtros técnicos">
          <form onSubmit={applyFilters}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-4">
              <Input label="Fecha desde (UTC)" type="date" value={filters.fechaDesde} onChange={(e) => updateFilter('fechaDesde', e.target.value)} />
              <Input label="Fecha hasta (UTC)" type="date" value={filters.fechaHasta} onChange={(e) => updateFilter('fechaHasta', e.target.value)} />
              <Input label="Magnitud mínima" type="number" min="-2" max="10" step="0.01" value={filters.magnitudMin} onChange={(e) => updateFilter('magnitudMin', e.target.value)} />
              <Input label="Magnitud máxima" type="number" min="-2" max="10" step="0.01" value={filters.magnitudMax} onChange={(e) => updateFilter('magnitudMax', e.target.value)} />
              <div className="mb-4"><label className="block text-sm font-semibold mb-1.5 text-zinc-900" htmlFor="tipo">Tipo</label><select id="tipo" className={selectClass} value={filters.idTipoMagnitud} onChange={(e) => updateFilter('idTipoMagnitud', e.target.value)}><option value="">Todos</option>{tipos.map((x) => <option key={x.idTipoMagnitud} value={x.idTipoMagnitud}>{x.codigo} — {x.nombre}</option>)}</select></div>
              <div className="mb-4"><label className="block text-sm font-semibold mb-1.5 text-zinc-900" htmlFor="estado">Estado</label><select id="estado" className={selectClass} value={filters.idEstadoSismo} onChange={(e) => updateFilter('idEstadoSismo', e.target.value)}><option value="">Todos</option>{estados.map((x) => <option key={x.idEstadoSismo} value={x.idEstadoSismo}>{x.nombre}</option>)}</select></div>
              <div className="mb-4"><label className="block text-sm font-semibold mb-1.5 text-zinc-900" htmlFor="fuente">Fuente</label><select id="fuente" className={selectClass} value={filters.idFuente} onChange={(e) => updateFilter('idFuente', e.target.value)}><option value="">Todas</option>{fuentes.map((x) => <option key={x.idFuente} value={x.idFuente}>{x.nombre}</option>)}</select></div>
              <Input label="Ubicación" placeholder="Buscar referencia..." maxLength={100} value={filters.ubicacion} onChange={(e) => updateFilter('ubicacion', e.target.value)} />
            </div>
            <div className="flex justify-end gap-3"><Button type="button" variant="outline" onClick={clearFilters}>Limpiar</Button><Button type="submit">Aplicar filtros</Button></div>
          </form>
        </Card>

        {error && <div className="p-4 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-sm">{error}</div>}
        <Card title={`Eventos registrados${resultado ? ` (${resultado.paginacion.total})` : ''}`}>
          {loading ? <div className="py-12 text-center text-sm text-zinc-500">Consultando catálogo...</div> : resultado?.items.length ? (
            <div className="overflow-x-auto"><table className="w-full text-left text-sm border-collapse">
              <thead><tr className="bg-zinc-50 border-b border-zinc-200 text-xs font-semibold text-zinc-500 uppercase tracking-wider"><th className="p-3">Evento</th><th className="p-3">Fecha UTC / BOT</th><th className="p-3">Magnitud</th><th className="p-3">Profundidad</th><th className="p-3">Ubicación</th><th className="p-3">Fuente</th><th className="p-3">Estado</th><th className="p-3 text-right">Acción</th></tr></thead>
              <tbody className="divide-y divide-zinc-200">{resultado.items.map((evento) => <tr key={evento.idSismo} className="hover:bg-zinc-50">
                <td className="p-3 font-semibold text-zinc-900">#{evento.idSismo}</td>
                <td className="p-3 text-xs text-zinc-600 whitespace-nowrap"><div>{new Date(evento.fechaHoraUtc).toLocaleString('es-BO', { timeZone: 'UTC' })} UTC</div><div className="text-zinc-400">{new Date(evento.fechaHoraUtc).toLocaleString('es-BO', { timeZone: 'America/La_Paz' })} BOT</div></td>
                <td className="p-3"><Badge variant="warning">{evento.magnitud} {evento.tipoMagnitud.codigo}</Badge></td><td className="p-3 text-zinc-600 whitespace-nowrap">{evento.profundidadKm} km</td><td className="p-3 text-zinc-600 min-w-[180px]">{evento.ubicacionReferencia || 'Sin referencia'}</td><td className="p-3 text-xs text-zinc-600">{evento.fuentePrincipal?.nombre || 'Sin fuente principal'}</td><td className="p-3"><Badge variant={badgeVariant(evento.estado.nombre)}>{evento.estado.nombre}</Badge></td><td className="p-3 text-right"><Link href={`/monitoreo/${evento.idSismo}`}><Button variant="outline" className="text-xs min-h-[36px] px-3 py-1">Ver detalle</Button></Link></td>
              </tr>)}</tbody>
            </table></div>
          ) : <div className="py-12 text-center"><p className="font-semibold text-zinc-700">No se encontraron eventos</p><p className="text-sm text-zinc-500 mt-1">Ajuste los filtros o registre el primer evento sísmico.</p></div>}
          {resultado && resultado.paginacion.totalPaginas > 1 && <div className="flex items-center justify-between mt-5 pt-4 border-t border-zinc-200"><Button variant="outline" disabled={!resultado.paginacion.tieneAnterior} onClick={() => setPagina((v) => v - 1)}>← Anterior</Button><span className="text-sm text-zinc-600">Página {resultado.paginacion.pagina} de {resultado.paginacion.totalPaginas}</span><Button variant="outline" disabled={!resultado.paginacion.tieneSiguiente} onClick={() => setPagina((v) => v + 1)}>Siguiente →</Button></div>}
        </Card>
      </div>
    </ProtectedRoute>
  );
}
