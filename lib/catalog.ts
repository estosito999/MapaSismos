import { getPool } from './db';

export class InvalidFilter extends Error {}

type Filters = {
  page: number;
  pageSize: number;
  location?: string;
  startDate?: string;
  endDate?: string;
  minMagnitude?: number;
  maxMagnitude?: number;
};

function parseInteger(value: string | null, fallback: number, max: number, label: string): number {
  if (value === null || value === '') return fallback;
  if (!/^\d+$/.test(value)) throw new InvalidFilter(`${label} debe ser un número entero válido.`);
  const number = Number(value);
  if (!Number.isSafeInteger(number) || number < 1 || number > max) throw new InvalidFilter(`${label} está fuera del rango permitido.`);
  return number;
}

function parseMagnitude(value: string | null, label: string): number | undefined {
  if (value === null || value === '') return undefined;
  if (!/^(?:\d+)(?:\.\d+)?$/.test(value)) throw new InvalidFilter(`${label} debe ser un número válido.`);
  const number = Number(value);
  if (!Number.isFinite(number) || number < 0 || number > 10) throw new InvalidFilter(`${label} debe estar entre 0 y 10.`);
  return number;
}

function parseDate(value: string | null, label: string): string | undefined {
  if (value === null || value === '') return undefined;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new InvalidFilter(`${label} debe tener formato AAAA-MM-DD.`);
  const date = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value || value.startsWith('0000')) {
    throw new InvalidFilter(`${label} no es una fecha válida.`);
  }
  return value;
}

export function parseFilters(params: URLSearchParams): Filters {
  const filters: Filters = {
    page: parseInteger(params.get('page'), 1, 1000000, 'La página'),
    pageSize: parseInteger(params.get('pageSize'), 10, 100, 'El tamaño de página'),
    location: params.get('location')?.trim() || undefined,
    startDate: parseDate(params.get('startDate'), 'La fecha inicial'),
    endDate: parseDate(params.get('endDate'), 'La fecha final'),
    minMagnitude: parseMagnitude(params.get('minMagnitude'), 'La magnitud mínima'),
    maxMagnitude: parseMagnitude(params.get('maxMagnitude'), 'La magnitud máxima'),
  };
  if (filters.startDate && filters.endDate && filters.startDate > filters.endDate) throw new InvalidFilter('La fecha inicial no puede ser posterior a la final.');
  if (filters.minMagnitude !== undefined && filters.maxMagnitude !== undefined && filters.minMagnitude > filters.maxMagnitude) throw new InvalidFilter('La magnitud mínima no puede superar la máxima.');
  return filters;
}

const selectEvent = `
  SELECT e.id, e.occurred_at, e.magnitude, e.magnitude_type, e.depth_km,
    ST_Y(e.epicenter::geometry) AS latitude, ST_X(e.epicenter::geometry) AS longitude,
    l.id AS location_id, l.name AS location_name, l.type AS location_type, e.source,
    ST_Distance(e.epicenter, ST_SetSRID(ST_MakePoint(-68.1336, -16.4956), 4326)::geography) / 1000 AS distance_km,
    ST_Distance(e.epicenter, urban.area) / 1000 AS urban_area_distance_km,
    urban.name AS urban_area_name
  FROM seismic_events e LEFT JOIN locations l ON l.id = e.location_id
  LEFT JOIN urban_reference_areas urban ON urban.id = 'la-paz'`;

type EventRow = {
  id: string; occurred_at: Date; magnitude: string; magnitude_type: string; depth_km: string;
  latitude: number; longitude: number; location_id: string | null; location_name: string | null;
  location_type: string | null; source: string; distance_km: number;
  urban_area_distance_km: number | null; urban_area_name: string | null;
};

function eventFromRow(row: EventRow) {
  return {
    id: row.id,
    occurredAt: new Date(row.occurred_at).toISOString(),
    magnitude: Number(row.magnitude),
    magnitudeType: row.magnitude_type,
    depthKm: Number(row.depth_km),
    latitude: Number(row.latitude),
    longitude: Number(row.longitude),
    location: row.location_id ? { id: row.location_id, name: row.location_name, type: row.location_type } : null,
    epicentralDistanceKm: Math.round(Number(row.distance_km) * 10) / 10,
    urbanAreaDistanceKm: row.urban_area_distance_km === null ? null : Math.round(Number(row.urban_area_distance_km) * 10) / 10,
    urbanAreaName: row.urban_area_name,
    source: row.source,
  };
}

export async function getEvents(filters: Filters) {
  const values: (string | number)[] = [];
  const conditions: string[] = [];
  function add(condition: (position: number) => string, value: string | number) {
    values.push(value);
    conditions.push(condition(values.length));
  }
  if (filters.location) add((i) => `e.location_id = $${i}`, filters.location);
  // A calendar date is interpreted in Bolivia, then compared as a UTC instant.
  if (filters.startDate) add((i) => `e.occurred_at >= ($${i}::date::timestamp AT TIME ZONE 'America/La_Paz')`, filters.startDate);
  if (filters.endDate) add((i) => `e.occurred_at < (($${i}::date + 1)::timestamp AT TIME ZONE 'America/La_Paz')`, filters.endDate);
  if (filters.minMagnitude !== undefined) add((i) => `e.magnitude >= $${i}`, filters.minMagnitude);
  if (filters.maxMagnitude !== undefined) add((i) => `e.magnitude <= $${i}`, filters.maxMagnitude);
  const where = conditions.length ? ` WHERE ${conditions.join(' AND ')}` : '';
  const order = ' ORDER BY e.occurred_at DESC, e.id DESC';
  const pool = getPool();
  const [count, events, mapEvents, recent] = await Promise.all([
    pool.query(`SELECT count(*)::int AS total FROM seismic_events e${where}`, values),
    pool.query(`${selectEvent}${where}${order} LIMIT $${values.length + 1} OFFSET $${values.length + 2}`, [...values, filters.pageSize, (filters.page - 1) * filters.pageSize]),
    pool.query(`${selectEvent}${where}${order} LIMIT 5000`, values),
    pool.query(`SELECT count(*) FILTER (WHERE occurred_at >= now() - interval '24 hours' AND occurred_at <= now())::int AS last_24,
      count(*) FILTER (WHERE occurred_at >= now() - interval '48 hours' AND occurred_at <= now())::int AS last_48 FROM seismic_events`),
  ]);
  const total = Number(count.rows[0].total);
  return {
    events: events.rows.map(eventFromRow),
    mapEvents: mapEvents.rows.map(eventFromRow),
    pagination: { page: filters.page, pageSize: filters.pageSize, total, totalPages: Math.ceil(total / filters.pageSize) },
    recentWindow: { hours: 48, count: Number(recent.rows[0].last_48), count24Hours: Number(recent.rows[0].last_24) },
    mapTruncated: total > 5000,
  };
}

export async function getEvent(id: string) {
  const result = await getPool().query(`${selectEvent} WHERE e.id = $1`, [id]);
  return result.rows[0] ? eventFromRow(result.rows[0]) : null;
}

export async function getLocations() {
  const result = await getPool().query('SELECT id, name, type FROM locations ORDER BY name ASC');
  return result.rows;
}
