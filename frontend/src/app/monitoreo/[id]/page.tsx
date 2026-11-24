'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ProtectedRoute } from '../../../components/auth/ProtectedRoute';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { apiFetch } from '../../../lib/api';

interface DetalleSismo {
  idSismo: number; fechaHoraUtc: string; magnitud: number; profundidadKm: number;
  latitud: number; longitud: number; ubicacionReferencia?: string;
  fechaRegistro: string; fechaUltimaActualizacion: string;
  tipoMagnitud: { codigo: string; nombre: string }; estado: { idEstadoSismo: number; nombre: string };
  registradoPor: { nombre: string; correo: string };
  fuentes: Array<{ idSismoFuente: number; nombre: string; institucion?: string; url?: string; esOficial: boolean; esFuentePrincipal: boolean; identificadorExterno?: string; fechaConsulta?: string }>;
  historialEstados: Array<{ idHistorialEstado: number; estado: string; fechaEstado: string; observacion?: string; usuario: string }>;
  historialCambios: Array<{ idCambio: number; campoModificado: string; valorAnterior?: string; valorNuevo?: string; fechaCambio: string; usuario: string }>;
  posiblesDuplicados: Array<{ idDuplicidad: number; idEventoRelacionado: number; estadoRevision: string; fechaDeteccion: string; observacion?: string }>;
}

const Detail = ({ label, value }: { label: string; value: React.ReactNode }) => <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3"><p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">{label}</p><div className="mt-1 text-sm font-medium text-zinc-900">{value}</div></div>;

export default function DetalleSismoPage() {
  const params = useParams<{ id: string }>();
  const [evento, setEvento] = useState<DetalleSismo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [estados, setEstados] = useState<Array<{ idEstadoSismo: number; nombre: string }>>([]);
  const [observacionEstado, setObservacionEstado] = useState('');
  const [changingState, setChangingState] = useState(false);

  useEffect(() => {
    let mounted = true;
    Promise.all([
      apiFetch<DetalleSismo>(`/sismos/${params.id}`),
      apiFetch<Array<{ idEstadoSismo: number; nombre: string }>>('/sismos/catalogos/estados'),
    ]).then(([data, estadosData]) => { if (mounted) { setEvento(data); setEstados(estadosData); } }).catch((err: Error) => { if (mounted) setError(err.message || 'No se pudo consultar el evento'); }).finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, [params.id]);

  const siguienteEstadoNombre = evento?.estado.nombre === 'Pendiente' ? 'Revisado' : evento?.estado.nombre === 'Revisado' ? 'Publicado' : null;
  const siguienteEstado = estados.find((estado) => estado.nombre === siguienteEstadoNombre);

  const changeState = async () => {
    if (!evento || !siguienteEstado) return;
    setChangingState(true); setError(null);
    try {
      const response = await apiFetch<{ evento: DetalleSismo }>(`/sismos/${evento.idSismo}/estado`, {
        method: 'PATCH',
        body: JSON.stringify({
          idEstadoSismo: siguienteEstado.idEstadoSismo,
          fechaUltimaActualizacion: evento.fechaUltimaActualizacion,
          observacion: observacionEstado.trim() || undefined,
        }),
      });
      setEvento(response.evento); setObservacionEstado('');
    } catch (err: any) { setError(err.message || 'No se pudo cambiar el estado'); }
    finally { setChangingState(false); }
  };

  return <ProtectedRoute requiredRoles={['Sismólogo']}><div className="space-y-6 max-w-5xl mx-auto">
    <div className="flex justify-between items-start gap-4"><div><p className="text-xs font-semibold uppercase tracking-wider text-orange-600">Ficha técnica</p><h1 className="text-2xl font-bold text-zinc-900">Evento #{params.id}</h1></div><div className="flex gap-2"><Link href={`/monitoreo/${params.id}/editar`}><Button variant="accent">Editar parámetros</Button></Link><Link href="/monitoreo"><Button variant="outline">← Volver</Button></Link></div></div>
    {loading && <Card><div className="py-12 text-center text-zinc-500">Cargando evento...</div></Card>}
    {error && <div className="p-4 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-sm">{error}</div>}
    {evento && <>
      <Card title="Parámetros instrumentales"><div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        <Detail label="Estado" value={<Badge variant={evento.estado.nombre === 'Publicado' ? 'success' : evento.estado.nombre === 'Revisado' ? 'info' : 'warning'}>{evento.estado.nombre}</Badge>} />
        <Detail label="Magnitud" value={`${evento.magnitud} ${evento.tipoMagnitud.codigo} — ${evento.tipoMagnitud.nombre}`} /><Detail label="Profundidad focal" value={`${evento.profundidadKm} km`} />
        <Detail label="Fecha y hora UTC" value={new Date(evento.fechaHoraUtc).toLocaleString('es-BO', { timeZone: 'UTC' })} /><Detail label="Hora Bolivia (BOT)" value={new Date(evento.fechaHoraUtc).toLocaleString('es-BO', { timeZone: 'America/La_Paz' })} /><Detail label="Coordenadas WGS 84" value={`${evento.latitud}, ${evento.longitud}`} />
      </div><div className="mt-3"><Detail label="Ubicación de referencia" value={evento.ubicacionReferencia || 'Sin referencia'} /></div></Card>
      <Card title="Control del ciclo de vida" subtitle="Las transiciones son secuenciales y quedan registradas en el historial.">
        {siguienteEstado ? <div className="space-y-3"><p className="text-sm text-zinc-600">Transición disponible: <strong>{evento.estado.nombre} → {siguienteEstado.nombre}</strong></p><textarea className="w-full min-h-[88px] px-4 py-3 bg-white border border-zinc-200 rounded-lg text-sm focus:outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/15" maxLength={500} placeholder="Observación técnica opcional" value={observacionEstado} onChange={(e) => setObservacionEstado(e.target.value)} /><div className="flex justify-end"><Button variant="accent" onClick={changeState} disabled={changingState}>{changingState ? 'Actualizando estado...' : siguienteEstado.nombre === 'Publicado' ? 'Publicar evento' : 'Marcar como revisado'}</Button></div></div> : <p className="text-sm text-zinc-600">El evento está publicado. No existen transiciones manuales posteriores.</p>}
      </Card>
      <Card title="Procedencia y trazabilidad de registro"><div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4"><Detail label="Registrado por" value={`${evento.registradoPor.nombre} (${evento.registradoPor.correo})`} /><Detail label="Fecha de registro" value={new Date(evento.fechaRegistro).toLocaleString('es-BO', { timeZone: 'America/La_Paz' })} /></div><div className="space-y-3">{evento.fuentes.map((fuente) => <div key={fuente.idSismoFuente} className="rounded-lg border border-zinc-200 p-4 text-sm"><div className="flex justify-between gap-3"><div><p className="font-semibold text-zinc-900">{fuente.nombre}{fuente.esFuentePrincipal ? ' · Principal' : ''}</p><p className="text-xs text-zinc-500">{fuente.institucion || 'Institución no especificada'}</p></div>{fuente.esOficial && <Badge variant="success">Oficial</Badge>}</div><p className="mt-2 text-zinc-600">Identificador externo: {fuente.identificadorExterno || 'No informado'}</p></div>)}</div></Card>
      <Card title="Historial de estados"><div className="space-y-3">{evento.historialEstados.map((historial) => <div key={historial.idHistorialEstado} className="border-l-2 border-orange-300 pl-4 py-1"><p className="font-semibold text-sm text-zinc-900">{historial.estado}</p><p className="text-xs text-zinc-500">{new Date(historial.fechaEstado).toLocaleString('es-BO', { timeZone: 'America/La_Paz' })} · {historial.usuario}</p>{historial.observacion && <p className="text-sm text-zinc-600 mt-1">{historial.observacion}</p>}</div>)}</div></Card>
      <Card title="Historial de cambios técnicos"><div className="space-y-3">{evento.historialCambios.length ? evento.historialCambios.map((cambio) => <div key={cambio.idCambio} className="rounded-lg border border-zinc-200 p-3"><div className="flex flex-col sm:flex-row sm:justify-between gap-1"><p className="font-semibold text-sm text-zinc-900">{cambio.campoModificado}</p><p className="text-xs text-zinc-500">{new Date(cambio.fechaCambio).toLocaleString('es-BO', { timeZone: 'America/La_Paz' })} · {cambio.usuario}</p></div><div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2 text-xs"><div className="bg-zinc-50 rounded p-2"><span className="text-zinc-400">Anterior:</span> {cambio.valorAnterior || 'Vacío'}</div><div className="bg-emerald-50 rounded p-2"><span className="text-emerald-700">Nuevo:</span> {cambio.valorNuevo || 'Vacío'}</div></div></div>) : <p className="text-sm text-zinc-500">El evento todavía no tiene modificaciones técnicas.</p>}</div></Card>
      {evento.posiblesDuplicados.length > 0 && <Card title="Coincidencias relacionadas" className="border-amber-300"><div className="space-y-2">{evento.posiblesDuplicados.map((duplicado) => <div key={duplicado.idDuplicidad} className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-sm">Evento relacionado <strong>#{duplicado.idEventoRelacionado}</strong> · {duplicado.estadoRevision}{duplicado.observacion && <p className="text-xs text-zinc-600 mt-1">{duplicado.observacion}</p>}</div>)}</div></Card>}
    </>}
  </div></ProtectedRoute>;
}
