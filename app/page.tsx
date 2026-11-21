'use client';

import dynamic from 'next/dynamic';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Activity, CalendarDays, ChevronLeft, ChevronRight, CircleHelp, Clock3, Crosshair, Database, ExternalLink, Filter, Layers3, Map, MapPin, Menu, RotateCcw, Search, X } from 'lucide-react';
import type { CatalogResponse, Location, SeismicEvent } from '../components/types';
import { depthLabel, formatDate, formatLocation } from '../components/types';

const SeismicMap = dynamic(() => import('../components/SeismicMap'), { ssr: false, loading: () => <div className="map-loading">Cargando mapa…</div> });

type Filters = { location: string; startDate: string; endDate: string; minMagnitude: string; maxMagnitude: string };
const emptyFilters: Filters = { location: '', startDate: '', endDate: '', minMagnitude: '', maxMagnitude: '' };

function Detail({ event, close }: { event: SeismicEvent; close: () => void }) {
  const dialogRef = useRef<HTMLElement>(null);
  useEffect(() => {
    const previousFocus = document.activeElement as HTMLElement | null;
    dialogRef.current?.querySelector<HTMLButtonElement>('button')?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
      if (e.key === 'Tab' && dialogRef.current) {
        const items = Array.from(dialogRef.current.querySelectorAll<HTMLElement>('button:not([disabled]), a[href], [tabindex="0"]'));
        if (!items.length) return;
        const first = items[0], last = items[items.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => { window.removeEventListener('keydown', onKey); previousFocus?.focus(); };
  }, [close]);
  const fields = [
    ['Magnitud', `${event.magnitude.toFixed(1)} ${event.magnitudeType}`],
    ['Profundidad', `${event.depthKm.toFixed(1)} km · ${depthLabel(event.depthKm)}`],
    ['Fecha y hora local', `${formatDate(event.occurredAt, 'America/La_Paz')} BOT`],
    ['Fecha y hora universal', `${formatDate(event.occurredAt, 'UTC')} UTC`],
    ['Latitud', `${event.latitude.toFixed(5)}°`],
    ['Longitud', `${event.longitude.toFixed(5)}°`],
    ['Ubicación', formatLocation(event.location)],
    ['Distancia al área urbana', event.urbanAreaDistanceKm == null ? 'No disponible: sin perímetro urbano configurado' : `${event.urbanAreaDistanceKm.toFixed(1)} km${event.urbanAreaName ? ` · ${event.urbanAreaName}` : ''}`],
    ['Distancia a Plaza Murillo (referencia urbana)', event.epicentralDistanceKm == null ? 'No disponible' : `${event.epicentralDistanceKm.toFixed(1)} km`],
  ];
  return <div className="modal-backdrop" onMouseDown={close}><section ref={dialogRef} className="modal" role="dialog" aria-modal="true" aria-labelledby="detail-title" onMouseDown={e => e.stopPropagation()}>
    <div className="modal-heading"><div><span className="eyebrow">DETALLE DEL EVENTO</span><h2 id="detail-title">Ficha técnica</h2><p>Información sismológica registrada para este evento.</p></div><button className="icon-button" aria-label="Cerrar ficha" onClick={close}><X size={21} /></button></div>
    {event.source === 'demo' && <div className="notice demo-notice">Este evento corresponde a datos de demostración.</div>}
    <div className="detail-grid">{fields.map(([label, value]) => <div className="detail-field" key={label}><span>{label}</span><strong>{value}</strong></div>)}</div>
    <div className="detail-map"><SeismicMap events={[event]} focus={event} /></div>
    <p className="detail-note">Coordenadas en grados decimales · WGS 84 (EPSG:4326)</p>
  </section></div>;
}

export default function Home() {
  const [filters, setFilters] = useState<Filters>(emptyFilters);
  const [page, setPage] = useState(1);
  const [locations, setLocations] = useState<Location[]>([]);
  const [data, setData] = useState<CatalogResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [locationsError, setLocationsError] = useState('');
  const [detail, setDetail] = useState<SeismicEvent | null>(null);
  const [detailError, setDetailError] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => { fetch('/api/locations').then(r => { if (!r.ok) throw new Error(); return r.json(); }).then(body => setLocations(body.locations)).catch(() => setLocationsError('No se pudieron cargar las ubicaciones. Comprueba la conexión con el servicio.')); }, []);
  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setLoading(true); setError('');
      try {
        const query = new URLSearchParams({ page: String(page), pageSize: '10' });
        Object.entries(filters).forEach(([key, value]) => { if (value !== '') query.set(key, value); });
        const response = await fetch(`/api/events?${query}`, { signal: controller.signal });
        const body = await response.json();
        if (!response.ok) throw new Error(body.error || 'No se pudo consultar el catálogo.');
        setData(body);
      } catch (err) { if (!controller.signal.aborted) { setData(null); setError(err instanceof Error ? err.message : 'No se pudo consultar el catálogo.'); } }
      finally { if (!controller.signal.aborted) setLoading(false); }
    }, 300);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [filters, page]);
  const updateFilter = (key: keyof Filters, value: string) => { setPage(1); setFilters(current => ({ ...current, [key]: value })); };
  const openDetail = async (event: SeismicEvent) => {
    setDetailError('');
    try {
      const response = await fetch(`/api/events/${encodeURIComponent(event.id)}`);
      if (!response.ok) throw new Error('No se pudo cargar la ficha técnica.');
      const body = await response.json(); setDetail(body.event);
    } catch (err) { setDetailError(err instanceof Error ? err.message : 'No se pudo cargar la ficha técnica.'); }
  };
  const closeDetail = useCallback(() => setDetail(null), []);
  const total = data?.pagination.total ?? 0;

  return <div className="app-shell">
    <header className="topbar"><div className="brand"><div className="brand-icon"><Activity size={22} /></div><div><strong>SISMOS <span>LA PAZ</span></strong><small>SISTEMA DE INFORMACIÓN SÍSMICA</small></div></div><div className="topbar-right"><span className="header-region"><MapPin size={16} /> La Paz, Bolivia</span><button className="mobile-menu icon-button" aria-label="Abrir navegación" aria-expanded={sidebarOpen} onClick={() => setSidebarOpen(!sidebarOpen)}><Menu size={22} /></button></div></header>
    <div className="app-body"><aside className={`sidebar ${sidebarOpen ? 'sidebar-open' : ''}`}><div className="sidebar-label">MONITOREO</div><a className="nav-item active" href="#inicio" onClick={() => setSidebarOpen(false)}><Map size={19} /> Mapa de sismos</a><a className="nav-item" href="#catalogo" onClick={() => setSidebarOpen(false)}><Database size={19} /> Catálogo de eventos</a><div className="sidebar-bottom"><div className="sidebar-help"><CircleHelp size={19} /><div><strong>Sobre este visor</strong><p>Consulta y explora los eventos sísmicos registrados en la región.</p></div></div><p>Datos geográficos · WGS 84</p></div></aside>
      <main id="inicio" className="main"><div className="main-inner"><div className="page-heading"><div><div className="breadcrumb">MONITOREO <span>/</span> MAPA DE SISMOS</div><h1>Mapa de sismos</h1><p>Explora la actividad sísmica registrada en la región de La Paz.</p></div><div className="region-chip"><MapPin size={16} /> Región de La Paz</div></div>

        <section className="filter-panel panel" aria-labelledby="filter-title"><div className="section-top"><div className="section-title"><div className="section-icon"><Filter size={18} /></div><div><h2 id="filter-title">Filtros de búsqueda</h2><p>Refina los eventos que deseas consultar.</p></div></div><button className="reset-button" onClick={() => { setFilters(emptyFilters); setPage(1); }}><RotateCcw size={16} /> Restablecer filtros</button></div>
          <div className="filters"><label>Ubicación<select value={filters.location} onChange={e => updateFilter('location', e.target.value)}><option value="">Todas las ubicaciones</option>{locations.map(location => <option value={location.id} key={location.id}>{formatLocation(location)}</option>)}</select></label><label>Desde<input type="date" value={filters.startDate} onChange={e => updateFilter('startDate', e.target.value)} /></label><label>Hasta<input type="date" value={filters.endDate} onChange={e => updateFilter('endDate', e.target.value)} /></label><label>Magnitud mínima<input type="number" placeholder="Mín." step="0.1" value={filters.minMagnitude} onChange={e => updateFilter('minMagnitude', e.target.value)} /></label><label>Magnitud máxima<input type="number" placeholder="Máx." step="0.1" value={filters.maxMagnitude} onChange={e => updateFilter('maxMagnitude', e.target.value)} /></label></div><p className="filter-hint"><CalendarDays size={14} /> Las fechas corresponden a la hora local de Bolivia (BOT).</p>
        </section>

        {error && <div className="notice error-notice" role="alert">{error}</div>}{locationsError && <div className="notice error-notice" role="alert">{locationsError}</div>}{detailError && <div className="notice error-notice" role="alert">{detailError}</div>}
        {data && data.recentWindow.count24Hours === 0 && <div className="notice"><Clock3 size={18} /> No se registraron eventos en las últimas {data.recentWindow.count === 0 ? data.recentWindow.hours : 24} horas.</div>}
        {data?.mapEvents.some(event => event.source === 'demo') && <div className="notice demo-notice"><CircleHelp size={18} /> Los eventos de demostración se identifican como tales y no representan un registro oficial.</div>}

        <div className="content-grid"><section className="panel map-panel" aria-labelledby="map-title"><div className="panel-heading"><div className="section-title"><div className="section-icon"><Layers3 size={18} /></div><div><h2 id="map-title">Mapa de eventos</h2><p>Epicentros georreferenciados</p></div></div><span className="map-badge"><Crosshair size={14} /> WGS 84</span></div><div className="map-wrap"><SeismicMap events={data?.mapEvents ?? []} onSelect={openDetail} />{loading && <div className="map-overlay">Actualizando mapa…</div>}</div><div className="map-footer"><div><strong>Profundidad focal</strong><div className="legend"><span><i className="dot shallow" /> 0–30 km</span><span><i className="dot intermediate" /> 31–70 km</span><span><i className="dot deep" /> &gt;70 km</span></div></div><p>El tamaño del círculo representa la magnitud.</p></div>{data?.mapTruncated && <p className="map-limit">Se muestra una selección de eventos en el mapa. Ajusta los filtros para acotar la consulta.</p>}</section>

          <section id="catalogo" className="panel catalog-panel" aria-labelledby="catalog-title"><div className="panel-heading"><div className="section-title"><div className="section-icon"><Activity size={18} /></div><div><h2 id="catalog-title">Eventos sísmicos</h2><p>Del más reciente al más antiguo</p></div></div><span className="count-badge">{loading ? '…' : data ? `${total} ${total === 1 ? 'evento' : 'eventos'}` : 'No disponible'}</span></div><div className="catalog-body" aria-live="polite">{loading ? <div className="empty-state"><div className="empty-icon"><Activity size={23} /></div><strong>Consultando eventos</strong><p>Estamos actualizando los resultados.</p></div> : !data ? <div className="empty-state"><div className="empty-icon"><CircleHelp size={23} /></div><strong>Catálogo no disponible</strong><p>No fue posible consultar los eventos.</p></div> : data.events.length === 0 ? <div className="empty-state"><div className="empty-icon"><Search size={23} /></div><strong>No se encontraron eventos</strong><p>Prueba ajustar los filtros para ampliar tu búsqueda.</p></div> : data.events.map(event => <article className="event-card" key={event.id}><button className="event-main" onClick={() => openDetail(event)}><span className="magnitude"><small>MAG</small><strong>{event.magnitude.toFixed(1)}</strong><small>{event.magnitudeType}</small></span><span className="event-info"><strong>{formatLocation(event.location)}</strong><span><Clock3 size={14} /> {formatDate(event.occurredAt, 'America/La_Paz')} BOT</span><span><Clock3 size={14} /> {formatDate(event.occurredAt, 'UTC')} UTC</span><span><Crosshair size={14} /> {event.depthKm.toFixed(1)} km de profundidad</span>{event.source === 'demo' && <em>Demostración</em>}</span><ExternalLink size={16} className="event-link" /></button></article>)}</div><div className="pagination"><span>{data && total > 0 ? `${(data.pagination.page - 1) * data.pagination.pageSize + 1}–${Math.min(data.pagination.page * data.pagination.pageSize, total)} de ${total}` : data ? '0 resultados' : 'Resultados no disponibles'}</span><div><button aria-label="Página anterior" disabled={loading || page <= 1} onClick={() => setPage(p => p - 1)}><ChevronLeft size={17} /></button><span>Página {data?.pagination.page ?? 1} de {Math.max(1, data?.pagination.totalPages ?? 1)}</span><button aria-label="Página siguiente" disabled={loading || !data || page >= data.pagination.totalPages} onClick={() => setPage(p => p + 1)}><ChevronRight size={17} /></button></div></div></section></div>
        <footer className="footer"><span>SISMOS LA PAZ · Sistema de información sísmica</span><span>Coordenadas WGS 84 · Visualización Web Mercator</span></footer>
      </div></main></div>{detail && <Detail event={detail} close={closeDetail} />}
  </div>;
}
