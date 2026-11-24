'use client';

import { CircleMarker, MapContainer, Popup, TileLayer, useMap } from 'react-leaflet';
import type { LatLngBoundsExpression } from 'leaflet';

export type PublicSismo = { id: number; occurredAt: string; magnitude: number; magnitudeType: string; depthKm: number; latitude: number; longitude: number; location: string; municipality: { id: number; name: string } | null; macroDistrict: { id: number; name: string } | null; source: string; externalId: string | null; epicentralDistanceKm: number; urbanAreaDistanceKm: number | null; urbanAreaName: string | null; urbanAreaSource: string | null; urbanAreaOfficial: boolean };

function Bounds({ eventos }: { eventos: PublicSismo[] }) {
  const map = useMap();
  if (eventos.length) map.fitBounds(eventos.map((e) => [e.latitude, e.longitude]) as LatLngBoundsExpression, { padding: [24, 24], maxZoom: 10 });
  return null;
}

const color = (m: number) => m >= 5 ? '#e11d48' : m >= 4 ? '#f97316' : m >= 3 ? '#eab308' : '#10b981';
const depthLabel = (d: number) => d <= 30 ? 'Superficial' : d <= 70 ? 'Intermedia' : 'Profunda';

export default function SeismicMap({ eventos, onSelect }: { eventos: PublicSismo[]; onSelect: (e: PublicSismo) => void }) {
  return <MapContainer center={[-16.4957, -68.1336]} zoom={7} className="h-[520px] w-full" scrollWheelZoom>
    <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
    <Bounds eventos={eventos} />
    {eventos.map((e) => <CircleMarker key={e.id} center={[e.latitude, e.longitude]} radius={Math.max(7, e.magnitude * 2.5)} pathOptions={{ color: '#fff', weight: 2, fillColor: color(e.magnitude), fillOpacity: .85 }} eventHandlers={{ click: () => onSelect(e) }}><Popup><strong>{e.location}</strong><br />M {e.magnitude.toFixed(1)} {e.magnitudeType} · {e.depthKm.toFixed(1)} km ({depthLabel(e.depthKm)})<br /><button className="mt-2 font-semibold text-orange-700" onClick={() => onSelect(e)}>Ver ficha técnica</button></Popup></CircleMarker>)}
  </MapContainer>;
}
