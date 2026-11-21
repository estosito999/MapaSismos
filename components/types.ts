export type Location = { id: string; name: string; type: string };

export function formatLocation(location: Location | null) {
  return location ? `${location.type === 'macrodistrito' ? 'Macrodistrito' : 'Municipio'} de ${location.name}` : 'Ubicación no delimitada';
}

export type SeismicEvent = {
  id: string;
  occurredAt: string;
  magnitude: number;
  magnitudeType: string;
  depthKm: number;
  latitude: number;
  longitude: number;
  location: Location | null;
  epicentralDistanceKm: number | null;
  urbanAreaDistanceKm: number | null;
  urbanAreaName: string | null;
  source: string;
};

export type CatalogResponse = {
  events: SeismicEvent[];
  mapEvents: SeismicEvent[];
  pagination: { page: number; pageSize: number; total: number; totalPages: number };
  recentWindow: { hours: number; count: number; count24Hours: number };
  mapTruncated: boolean;
};

export function formatDate(value: string, timeZone: string) {
  return new Intl.DateTimeFormat('es-BO', {
    timeZone, day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
  }).format(new Date(value));
}

export function depthLabel(depth: number) {
  return depth <= 30 ? 'Superficial' : depth <= 70 ? 'Intermedia' : 'Profunda';
}

export function depthColor(depth: number) {
  return depth <= 30 ? '#f97316' : depth <= 70 ? '#0284c7' : '#7c3aed';
}
