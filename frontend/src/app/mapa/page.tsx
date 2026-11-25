'use client';

import dynamic from 'next/dynamic';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import type { PublicSismo } from '../../components/mapa/SeismicMap';
import { apiFetch } from '../../lib/api';

const SeismicMap = dynamic(() => import('../../components/mapa/SeismicMap'), { ssr: false, loading: () => <div className="h-[520px] animate-pulse bg-zinc-100" /> });
type Catalogo = { eventos: PublicSismo[]; mapaEventos: PublicSismo[]; paginacion: { pagina: number; limite: number; total: number; totalPaginas: number }; mapaTruncado: boolean };
type Territorios = { municipios: Array<{ idMunicipio: number; nombre: string }>; macrodistritos: Array<{ idMacrodistrito: number; idMunicipio: number; nombre: string }> };
const vacio: Catalogo = { eventos: [], mapaEventos: [], paginacion: { pagina: 1, limite: 10, total: 0, totalPaginas: 1 }, mapaTruncado: false };
const fechaBot = (fecha: string) => new Intl.DateTimeFormat('es-BO', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'America/La_Paz' }).format(new Date(fecha));
const etiquetaProfundidad = (p: number) => p <= 30 ? 'Superficial' : p <= 70 ? 'Intermedia' : 'Profunda';

export default function MapaPage() {
  const [catalogo, setCatalogo] = useState<Catalogo>(vacio);
  const [territorios, setTerritorios] = useState<Territorios>({ municipios: [], macrodistritos: [] });
  const [seleccion, setSeleccion] = useState<PublicSismo | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [filtros, setFiltros] = useState({ ubicacion: '', idMunicipio: '', idMacrodistrito: '', fechaDesde: '', fechaHasta: '', magnitudMin: '', magnitudMax: '' });

  async function cargar(pagina = 1, limpiar = false) {
    setCargando(true); setError('');
    const valores = limpiar ? { ubicacion: '', idMunicipio: '', idMacrodistrito: '', fechaDesde: '', fechaHasta: '', magnitudMin: '', magnitudMax: '' } : filtros;
    if (limpiar) setFiltros(valores);
    const params = new URLSearchParams({ pagina: String(pagina), limite: '10' });
    Object.entries(valores).forEach(([k, v]) => v && params.set(k, v));
    try { setCatalogo(await apiFetch(`/public/sismos?${params}`)); }
    catch (e) { setError(e instanceof Error ? e.message : 'No fue posible cargar el catálogo'); }
    finally { setCargando(false); }
  }

  useEffect(() => {
    cargar();
    apiFetch<Territorios>('/public/sismos/territorios').then(setTerritorios).catch(() => setTerritorios({ municipios: [], macrodistritos: [] }));
    // La carga inicial debe ejecutarse una sola vez.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const recientes = useMemo(() => catalogo.mapaEventos.filter((e) => Date.now() - new Date(e.occurredAt).getTime() <= 30 * 86400000).length, [catalogo]);
  const enviar = (e: FormEvent) => { e.preventDefault(); cargar(1); };
  const campo = (clave: keyof typeof filtros, valor: string) => setFiltros({ ...filtros, [clave]: valor });

  return <div className="space-y-6">
    <header><h1 className="text-2xl font-bold text-zinc-900">Mapa y catálogo de sismos</h1><p className="text-sm text-zinc-500">Eventos verificados y publicados · WGS 84 (EPSG:4326) · Hora local BOT (UTC−4)</p></header>
    <div className="grid gap-6 xl:grid-cols-[320px_1fr]">
      <aside className="space-y-5">
        <form onSubmit={enviar} className="space-y-3 rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
          <h2 className="font-bold">Filtros de búsqueda</h2>
          <label className="block text-sm font-semibold">Municipio<select value={filtros.idMunicipio} onChange={(e) => setFiltros({ ...filtros, idMunicipio: e.target.value, idMacrodistrito: '' })} className="mt-1 w-full rounded-lg border border-zinc-300 p-2.5 font-normal"><option value="">Todos</option>{territorios.municipios.map((x) => <option key={x.idMunicipio} value={x.idMunicipio}>{x.nombre}</option>)}</select></label>
          <label className="block text-sm font-semibold">Macrodistrito<select value={filtros.idMacrodistrito} onChange={(e) => campo('idMacrodistrito', e.target.value)} disabled={!filtros.idMunicipio} className="mt-1 w-full rounded-lg border border-zinc-300 p-2.5 font-normal disabled:bg-zinc-100"><option value="">Todos</option>{territorios.macrodistritos.filter((x) => String(x.idMunicipio) === filtros.idMunicipio).map((x) => <option key={x.idMacrodistrito} value={x.idMacrodistrito}>{x.nombre}</option>)}</select></label>
          <label className="block text-sm font-semibold">Referencia textual<input value={filtros.ubicacion} onChange={(e) => campo('ubicacion', e.target.value)} placeholder="Ej. noreste de La Paz" className="mt-1 w-full rounded-lg border border-zinc-300 p-2.5 font-normal" /></label>
          <div className="grid grid-cols-2 gap-2">
            <label className="text-sm font-semibold">Desde<input type="date" value={filtros.fechaDesde} onChange={(e) => campo('fechaDesde', e.target.value)} className="mt-1 w-full rounded-lg border border-zinc-300 p-2 font-normal" /></label>
            <label className="text-sm font-semibold">Hasta<input type="date" value={filtros.fechaHasta.slice(0, 10)} onChange={(e) => campo('fechaHasta', e.target.value ? `${e.target.value}T23:59:59.999Z` : '')} className="mt-1 w-full rounded-lg border border-zinc-300 p-2 font-normal" /></label>
            <label className="text-sm font-semibold">Mag. mín.<input type="number" step="0.1" min="-2" max="10" value={filtros.magnitudMin} onChange={(e) => campo('magnitudMin', e.target.value)} className="mt-1 w-full rounded-lg border border-zinc-300 p-2 font-normal" /></label>
            <label className="text-sm font-semibold">Mag. máx.<input type="number" step="0.1" min="-2" max="10" value={filtros.magnitudMax} onChange={(e) => campo('magnitudMax', e.target.value)} className="mt-1 w-full rounded-lg border border-zinc-300 p-2 font-normal" /></label>
          </div>
          <div className="flex gap-2"><button className="min-h-11 flex-1 rounded-lg bg-orange-600 px-3 font-semibold text-white">Filtrar</button><button type="button" onClick={() => cargar(1, true)} className="min-h-11 flex-1 rounded-lg border border-zinc-300 px-3 font-semibold">Limpiar</button></div>
        </form>
        <div className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm"><p className="text-3xl font-bold text-orange-600">{catalogo.paginacion.total}</p><p className="text-sm text-zinc-600">eventos publicados</p><p className="mt-2 text-sm"><strong>{recientes}</strong> en los últimos 30 días</p></div>
        <div className="rounded-lg bg-blue-50 p-4 text-xs text-blue-900">La distancia al perímetro usa un área urbana circular referencial de 10 km desde Plaza Murillo. Es una aproximación académica, no un límite oficial.</div>
      </aside>
      <section className="overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm">
        {error && <div className="bg-rose-50 p-4 text-sm text-rose-700">{error}</div>}
        <div className="relative">{cargando && <div className="absolute right-3 top-3 z-[1000] rounded bg-white px-3 py-2 text-sm shadow">Actualizando…</div>}<SeismicMap eventos={catalogo.mapaEventos} onSelect={setSeleccion} /></div>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t p-3 text-xs text-zinc-600">
          <div className="flex flex-wrap items-center gap-4">
            <span className="flex items-center gap-1.5"><span className="inline-block h-2.5 w-2.5 rounded-full bg-emerald-500"></span>&lt; 3 (Leve)</span>
            <span className="flex items-center gap-1.5"><span className="inline-block h-2.5 w-2.5 rounded-full bg-yellow-500"></span>3–3.9 (Menor)</span>
            <span className="flex items-center gap-1.5"><span className="inline-block h-2.5 w-2.5 rounded-full bg-orange-500"></span>4–4.9 (Moderado)</span>
            <span className="flex items-center gap-1.5"><span className="inline-block h-2.5 w-2.5 rounded-full bg-rose-600"></span>≥ 5 (Fuerte)</span>
          </div>
          <span className="text-[11px] text-zinc-400">Punto: Epicentro · Área punteada: Radio geográfico de percepción</span>
        </div>
      </section>
    </div>
    <section className="overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm">
      <div className="border-b p-4"><h2 className="font-bold">Catálogo cronológico</h2><p className="text-xs text-zinc-500">Selecciona un evento para consultar su ficha técnica.</p></div>
      <div className="divide-y">{catalogo.eventos.map((e) => <button key={e.id} onClick={() => setSeleccion(e)} className="grid w-full gap-2 p-4 text-left hover:bg-zinc-50 sm:grid-cols-[110px_1fr_200px] sm:items-center"><strong className="text-lg text-orange-700">M {e.magnitude.toFixed(1)} {e.magnitudeType}</strong><span><b>{e.location}</b><small className="block text-zinc-500">Profundidad {e.depthKm.toFixed(1)} km ({etiquetaProfundidad(e.depthKm)}) · {e.source}</small></span><time className="text-sm text-zinc-600">{fechaBot(e.occurredAt)}</time></button>)}{!cargando && !catalogo.eventos.length && <p className="p-8 text-center text-zinc-500">No hay eventos publicados con estos filtros.</p>}</div>
      <div className="flex items-center justify-between border-t p-4 text-sm"><button disabled={catalogo.paginacion.pagina <= 1} onClick={() => cargar(catalogo.paginacion.pagina - 1)} className="rounded border px-3 py-2 disabled:opacity-40">Anterior</button><span>Página {catalogo.paginacion.pagina} de {catalogo.paginacion.totalPaginas}</span><button disabled={catalogo.paginacion.pagina >= catalogo.paginacion.totalPaginas} onClick={() => cargar(catalogo.paginacion.pagina + 1)} className="rounded border px-3 py-2 disabled:opacity-40">Siguiente</button></div>
    </section>
    {seleccion && <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/50 p-4" onClick={() => setSeleccion(null)}><article role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()} className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl"><div className="flex justify-between"><h2 className="text-xl font-bold">Ficha técnica #{seleccion.id}</h2><button onClick={() => setSeleccion(null)} aria-label="Cerrar" className="text-2xl">×</button></div><dl className="mt-5 grid grid-cols-2 gap-4 text-sm"><div><dt className="text-zinc-500">Magnitud</dt><dd className="font-bold">{seleccion.magnitude} {seleccion.magnitudeType}</dd></div><div><dt className="text-zinc-500">Profundidad</dt><dd>{seleccion.depthKm} km <span className="text-xs font-normal text-zinc-500">({etiquetaProfundidad(seleccion.depthKm)})</span></dd></div><div className="col-span-2"><dt className="text-zinc-500">Fecha y hora BOT</dt><dd>{fechaBot(seleccion.occurredAt)}</dd></div><div className="col-span-2"><dt className="text-zinc-500">Ubicación</dt><dd>{seleccion.location}</dd><dd className="text-xs text-zinc-500">{seleccion.municipality?.name || 'Sin municipio'}{seleccion.macroDistrict ? ` · ${seleccion.macroDistrict.name}` : ''}</dd></div><div><dt className="text-zinc-500">Coordenadas</dt><dd>{seleccion.latitude}, {seleccion.longitude}</dd></div><div><dt className="text-zinc-500">Distancia a Plaza Murillo</dt><dd>{seleccion.epicentralDistanceKm} km</dd></div><div className="col-span-2"><dt className="text-zinc-500">Distancia al perímetro urbano referencial</dt><dd>{seleccion.urbanAreaDistanceKm === null ? 'No calculada' : `${seleccion.urbanAreaDistanceKm} km`}</dd><dd className="text-xs text-zinc-500">{seleccion.urbanAreaSource}</dd></div><div className="col-span-2"><dt className="text-zinc-500">Fuente</dt><dd>{seleccion.source}{seleccion.externalId ? ` · ${seleccion.externalId}` : ''}</dd></div></dl></article></div>}
  </div>;
}
