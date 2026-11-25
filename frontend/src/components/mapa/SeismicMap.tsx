'use client';

import { useEffect } from 'react';
import { Circle, CircleMarker, MapContainer, Popup, TileLayer, Tooltip, useMap } from 'react-leaflet';
import type { LatLngBoundsExpression } from 'leaflet';

export type PublicSismo = {
  id: number;
  occurredAt: string;
  magnitude: number;
  magnitudeType: string;
  depthKm: number;
  latitude: number;
  longitude: number;
  location: string;
  municipality: { id: number; name: string } | null;
  macroDistrict: { id: number; name: string } | null;
  source: string;
  externalId: string | null;
  epicentralDistanceKm: number;
  urbanAreaDistanceKm: number | null;
  urbanAreaName: string | null;
  urbanAreaSource: string | null;
  urbanAreaOfficial: boolean;
};

function Bounds({ eventos }: { eventos: PublicSismo[] }) {
  const map = useMap();
  useEffect(() => {
    if (eventos.length) {
      map.fitBounds(eventos.map((e) => [e.latitude, e.longitude]) as LatLngBoundsExpression, {
        padding: [32, 32],
        maxZoom: 10,
      });
    }
  }, [eventos, map]);
  return null;
}

const color = (m: number) => (m >= 5 ? '#e11d48' : m >= 4 ? '#f97316' : m >= 3 ? '#eab308' : '#10b981');
const depthLabel = (d: number) => (d <= 30 ? 'Superficial' : d <= 70 ? 'Intermedia' : 'Profunda');

/**
 * Calcula el radio geográfico estimado de percepción en metros según la magnitud.
 * Mantiene la escala física en el mapa (en km) para no encogerse a una sola casa al hacer zoom.
 */
export const perceptionRadiusMeters = (magnitude: number) => {
  return Math.max(1500, Math.round(Math.pow(1.8, magnitude) * 450));
};

export default function SeismicMap({
  eventos,
  onSelect,
}: {
  eventos: PublicSismo[];
  onSelect: (e: PublicSismo) => void;
}) {
  return (
    <MapContainer
      center={[-16.4957, -68.1336]}
      zoom={7}
      minZoom={6}
      maxZoom={15}
      className="h-[520px] w-full"
      scrollWheelZoom
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        maxZoom={15}
      />
      <Bounds eventos={eventos} />

      {eventos.map((e) => {
        const radiusM = perceptionRadiusMeters(e.magnitude);
        const radiusKm = (radiusM / 1000).toFixed(1);
        const markerColor = color(e.magnitude);

        return (
          <span key={e.id}>
            {/* 1. Área de influencia/percepción sísmica (Radio en metros reales: NO se encoge a una casa al hacer zoom) */}
            <Circle
              center={[e.latitude, e.longitude]}
              radius={radiusM}
              pathOptions={{
                color: markerColor,
                fillColor: markerColor,
                fillOpacity: 0.15,
                weight: 1.5,
                dashArray: '5, 5',
              }}
              eventHandlers={{ click: () => onSelect(e) }}
            />

            {/* 2. Núcleo instrumental del epicentro */}
            <CircleMarker
              center={[e.latitude, e.longitude]}
              radius={7}
              pathOptions={{
                color: '#ffffff',
                weight: 2,
                fillColor: markerColor,
                fillOpacity: 0.95,
              }}
              eventHandlers={{ click: () => onSelect(e) }}
            >
              <Tooltip direction="top" offset={[0, -6]} opacity={0.95}>
                <span className="font-semibold text-xs">
                  M {e.magnitude.toFixed(1)} {e.magnitudeType} · {e.location}
                </span>
              </Tooltip>

              <Popup>
                <div className="text-xs space-y-1">
                  <strong className="text-sm text-zinc-900 block">{e.location}</strong>
                  <p className="text-zinc-600">
                    Magnitud: <strong className="text-zinc-900">{e.magnitude.toFixed(1)} {e.magnitudeType}</strong>
                  </p>
                  <p className="text-zinc-600">
                    Profundidad: <strong>{e.depthKm.toFixed(1)} km</strong> ({depthLabel(e.depthKm)})
                  </p>
                  <p className="text-zinc-500 text-[11px]">
                    Área estimada de percepción: <strong>~{radiusKm} km</strong> de radio
                  </p>
                  <button
                    type="button"
                    className="mt-2 w-full rounded bg-orange-600 px-2 py-1.5 font-semibold text-white hover:bg-orange-700"
                    onClick={() => onSelect(e)}
                  >
                    Ver ficha técnica
                  </button>
                </div>
              </Popup>
            </CircleMarker>
          </span>
        );
      })}
    </MapContainer>
  );
}
