'use client';

import { useEffect } from 'react';
import { CircleMarker, MapContainer, Popup, TileLayer, useMap } from 'react-leaflet';
import type { SeismicEvent } from './types';
import { depthColor, depthLabel, formatDate, formatLocation } from './types';

function Recenter({ event }: { event?: SeismicEvent }) {
  const map = useMap();
  useEffect(() => {
    if (event) map.setView([event.latitude, event.longitude], event.magnitude >= 5 ? 8 : 10);
  }, [event, map]);
  return null;
}

export default function SeismicMap({ events, onSelect, focus }: {
  events: SeismicEvent[];
  onSelect?: (event: SeismicEvent) => void;
  focus?: SeismicEvent;
}) {
  return <MapContainer center={focus ? [focus.latitude, focus.longitude] : [-16.5, -68.15]} zoom={focus ? 10 : 7} scrollWheelZoom className="leaflet-map" aria-label="Mapa de epicentros sísmicos">
    <TileLayer attribution={'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'} url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
    <Recenter event={focus} />
    {events.map(event => <CircleMarker key={event.id} center={[event.latitude, event.longitude]} radius={Math.max(3, Math.min(24, event.magnitude * 3))} pathOptions={{ color: depthColor(event.depthKm), fillColor: depthColor(event.depthKm), fillOpacity: 0.68, weight: 2 }}>
      <Popup>
        <div className="map-popup"><strong>Magnitud {event.magnitude.toFixed(1)} {event.magnitudeType}</strong><span>{formatLocation(event.location)}</span><span>{formatDate(event.occurredAt, 'America/La_Paz')} BOT</span><span>{event.depthKm.toFixed(1)} km · {depthLabel(event.depthKm)}</span>{onSelect && <button type="button" onClick={() => onSelect(event)}>Ver ficha técnica</button>}</div>
      </Popup>
    </CircleMarker>)}
  </MapContainer>;
}
