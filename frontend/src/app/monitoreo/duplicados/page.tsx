'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ProtectedRoute } from '../../../components/auth/ProtectedRoute';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { apiFetch } from '../../../lib/api';

interface EventoComparado {
  idSismo: number; fechaHoraUtc: string; magnitud: number; tipoMagnitud: string;
  profundidadKm: number; latitud: number; longitud: number; ubicacionReferencia?: string;
  estado: string; fuente?: string; identificadorExterno?: string;
}
interface CasoDuplicado {
  idDuplicidad: number; estadoRevision: string; observacion?: string;
  fechaDeteccion: string; fechaResolucion?: string;
  usuarioRevision?: { nombre: string };
  eventoCandidato: EventoComparado; eventoCoincidente: EventoComparado;
}
interface Resultado { items: CasoDuplicado[]; paginacion: { pagina: number; total: number; totalPaginas: number; tieneAnterior: boolean; tieneSiguiente: boolean } }
interface Decision { estadoRevision: string; observacion: string }

const estadosResolucion = ['Confirmado como distinto', 'Confirmado como duplicado', 'Descartado'];
const badgeVariant = (estado: string): 'warning' | 'success' | 'info' | 'severe' => estado === 'Pendiente de revisión' ? 'warning' : estado === 'Confirmado como duplicado' ? 'severe' : estado === 'Confirmado como distinto' ? 'success' : 'info';

const EventCard = ({ evento, titulo }: { evento: EventoComparado; titulo: string }) => <div className="rounded-lg border border-zinc-200 bg-white p-4"><p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">{titulo}</p><div className="flex justify-between items-start mt-1 gap-3"><div><Link href={`/monitoreo/${evento.idSismo}`} className="font-bold text-zinc-900 hover:text-orange-600">Evento #{evento.idSismo}</Link><p className="text-xs text-zinc-500">{new Date(evento.fechaHoraUtc).toLocaleString('es-BO', { timeZone: 'UTC' })} UTC</p></div><Badge variant="warning">{evento.magnitud} {evento.tipoMagnitud}</Badge></div><dl className="mt-3 grid grid-cols-2 gap-2 text-xs"><div><dt className="text-zinc-400">Profundidad</dt><dd className="font-medium">{evento.profundidadKm} km</dd></div><div><dt className="text-zinc-400">Coordenadas</dt><dd className="font-medium">{evento.latitud}, {evento.longitud}</dd></div><div><dt className="text-zinc-400">Fuente</dt><dd className="font-medium">{evento.fuente || 'Sin fuente'}</dd></div><div><dt className="text-zinc-400">ID externo</dt><dd className="font-medium">{evento.identificadorExterno || 'No informado'}</dd></div></dl><p className="mt-3 text-xs text-zinc-600">{evento.ubicacionReferencia || 'Sin ubicación de referencia'}</p></div>;

export default function DuplicadosPage() {
  const [filtro, setFiltro] = useState('Pendiente de revisión');
  const [pagina, setPagina] = useState(1);
  const [reload, setReload] = useState(0);
  const [resultado, setResultado] = useState<Resultado | null>(null);
  const [decisiones, setDecisiones] = useState<Record<number, Decision>>({});
  const [loading, setLoading] = useState(true);
  const [resolviendo, setResolviendo] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const params = new URLSearchParams({ pagina: String(pagina), limite: '10' });
    if (filtro) params.set('estadoRevision', filtro);
    setLoading(true); setError(null);
    apiFetch<Resultado>(`/sismos/duplicados?${params.toString()}`).then((data) => { if (mounted) setResultado(data); }).catch((err: Error) => { if (mounted) setError(err.message); }).finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, [filtro, pagina, reload]);

  const setDecision = (id: number, field: keyof Decision, value: string) => setDecisiones((current) => ({ ...current, [id]: { estadoRevision: current[id]?.estadoRevision || '', observacion: current[id]?.observacion || '', [field]: value } }));
  const resolve = async (id: number) => {
    const decision = decisiones[id];
    if (!decision?.estadoRevision || !decision.observacion.trim()) { setError('Seleccione una resolución y escriba una observación técnica'); return; }
    setResolviendo(id); setError(null);
    try {
      await apiFetch(`/sismos/duplicados/${id}/resolver`, { method: 'PATCH', body: JSON.stringify(decision) });
      setDecisiones((current) => { const copy = { ...current }; delete copy[id]; return copy; });
      setReload((value) => value + 1);
    } catch (err: any) { setError(err.message || 'No se pudo resolver la coincidencia'); }
    finally { setResolviendo(null); }
  };

  return <ProtectedRoute requiredRoles={['Sismólogo']}><div className="space-y-6 max-w-6xl mx-auto">
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"><div><p className="text-xs text-zinc-500">Control de integridad</p><h1 className="text-2xl font-bold text-zinc-900 mt-1">Revisión de posibles duplicados</h1><p className="text-sm text-zinc-500">Compare los eventos y documente una decisión técnica sin eliminar datos.</p></div><Link href="/monitoreo"><Button variant="outline">← Volver al catálogo</Button></Link></div>
    <Card><div className="flex flex-col sm:flex-row sm:items-center gap-3"><label className="text-sm font-semibold" htmlFor="filtro-duplicados">Estado de revisión</label><select id="filtro-duplicados" className="min-h-[44px] px-3 border border-zinc-200 rounded-lg text-sm" value={filtro} onChange={(e) => { setFiltro(e.target.value); setPagina(1); }}><option value="">Todos</option><option value="Pendiente de revisión">Pendiente de revisión</option>{estadosResolucion.map((estado) => <option key={estado}>{estado}</option>)}</select><span className="text-sm text-zinc-500 sm:ml-auto">{resultado?.paginacion.total ?? 0} caso(s)</span></div></Card>
    {error && <div className="p-4 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-sm">{error}</div>}
    {loading ? <Card><div className="py-12 text-center text-zinc-500">Consultando coincidencias...</div></Card> : resultado?.items.length ? <div className="space-y-5">{resultado.items.map((caso) => <Card key={caso.idDuplicidad} className={caso.estadoRevision === 'Pendiente de revisión' ? 'border-amber-300' : ''}><div className="flex flex-col sm:flex-row sm:justify-between gap-2 mb-4"><div><p className="font-bold text-zinc-900">Coincidencia #{caso.idDuplicidad}</p><p className="text-xs text-zinc-500">Detectada {new Date(caso.fechaDeteccion).toLocaleString('es-BO', { timeZone: 'America/La_Paz' })}</p></div><Badge variant={badgeVariant(caso.estadoRevision)}>{caso.estadoRevision}</Badge></div><div className="grid grid-cols-1 lg:grid-cols-2 gap-4"><EventCard evento={caso.eventoCandidato} titulo="Evento registrado" /><EventCard evento={caso.eventoCoincidente} titulo="Evento coincidente" /></div>{caso.observacion && <p className="mt-4 rounded bg-zinc-50 p-3 text-xs text-zinc-600">{caso.observacion}</p>}{caso.estadoRevision === 'Pendiente de revisión' ? <div className="mt-4 border-t border-zinc-200 pt-4 space-y-3"><select className="w-full min-h-[44px] px-3 border border-zinc-200 rounded-lg text-sm" value={decisiones[caso.idDuplicidad]?.estadoRevision || ''} onChange={(e) => setDecision(caso.idDuplicidad, 'estadoRevision', e.target.value)}><option value="">Seleccione una resolución</option>{estadosResolucion.map((estado) => <option key={estado}>{estado}</option>)}</select><textarea className="w-full min-h-[88px] px-4 py-3 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/15" maxLength={300} placeholder="Justificación técnica obligatoria" value={decisiones[caso.idDuplicidad]?.observacion || ''} onChange={(e) => setDecision(caso.idDuplicidad, 'observacion', e.target.value)} /><div className="flex justify-end"><Button variant="accent" disabled={resolviendo === caso.idDuplicidad} onClick={() => resolve(caso.idDuplicidad)}>{resolviendo === caso.idDuplicidad ? 'Guardando decisión...' : 'Resolver coincidencia'}</Button></div></div> : <p className="mt-4 text-xs text-zinc-500">Resuelto por {caso.usuarioRevision?.nombre || 'Sismólogo'} el {caso.fechaResolucion ? new Date(caso.fechaResolucion).toLocaleString('es-BO', { timeZone: 'America/La_Paz' }) : '—'}.</p>}</Card>)}</div> : <Card><div className="py-12 text-center"><p className="font-semibold text-zinc-700">No hay coincidencias en este estado</p><p className="text-sm text-zinc-500 mt-1">Las nuevas advertencias aparecerán aquí para revisión.</p></div></Card>}
    {resultado && resultado.paginacion.totalPaginas > 1 && <div className="flex justify-between items-center"><Button variant="outline" disabled={!resultado.paginacion.tieneAnterior} onClick={() => setPagina((v) => v - 1)}>← Anterior</Button><span className="text-sm text-zinc-500">Página {resultado.paginacion.pagina} de {resultado.paginacion.totalPaginas}</span><Button variant="outline" disabled={!resultado.paginacion.tieneSiguiente} onClick={() => setPagina((v) => v + 1)}>Siguiente →</Button></div>}
  </div></ProtectedRoute>;
}
