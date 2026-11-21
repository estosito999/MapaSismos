# Datos y límites del catálogo

La base de desarrollo usa PostgreSQL con PostGIS. `docker compose up -d --wait` crea el esquema y carga `seed.sql` únicamente cuando el volumen de datos es nuevo. La contraseña de `docker-compose.yml` es solo para desarrollo local. Los doce eventos de ejemplo son **ficticios**, llevan `source = 'demo'` y no deben confundirse con reportes sismológicos. No existe una fuente oficial conectada ni una actualización automática en esta versión.

Los epicentros se almacenan como `geography(Point, 4326)` (WGS 84): se suministra primero longitud y después latitud en grados decimales. La hora se almacena como instante `timestamptz`; la API devuelve UTC y los filtros de fecha incluyen el día completo en la zona `America/La_Paz`. `locations` contiene etiquetas registradas de municipios o macrodistritos; no hay polígonos administrativos cargados y no se calcula automáticamente a qué ubicación pertenece un epicentro. Los datos de ejemplo son ilustrativos y sus etiquetas no certifican una delimitación oficial.

## Incorporar un evento verificado

Después de comprobar procedencia, unidades, zona horaria y ubicación, un operador puede insertar registros utilizando una conexión autorizada. El identificador debe ser estable y único; `source` debe identificar el organismo y la fuente. Ejemplo de plantilla (reemplace todos los valores):

```sql
INSERT INTO seismic_events
  (id, occurred_at, magnitude, magnitude_type, depth_km, epicenter, location_id, source)
VALUES
  ('ID-DE-LA-FUENTE', '2025-01-01T12:30:00Z', 3.5, 'Mw', 20.0,
   ST_SetSRID(ST_MakePoint(-68.13, -16.50), 4326)::geography,
   'la-paz', 'FUENTE-VERIFICADA');
```

El ejemplo de sentencia es una plantilla, no un reporte sísmico. Para agregar ubicaciones verificadas, añada filas a `locations` usando el tipo `municipio` o `macrodistrito`. Si la ubicación no se conoce, use `NULL` en `location_id`. Antes de usar datos operativos, elimine los ejemplos con `DELETE FROM seismic_events WHERE source = 'demo';`. Las operaciones sobre el volumen existente no se vuelven a ejecutar al reiniciar el contenedor.

## Referencia urbana

La API entrega `epicentralDistanceKm`, distancia geodésica al punto de referencia Plaza Murillo (latitud −16.4956, longitud −68.1336), que no representa el borde urbano. Además entrega `urbanAreaDistanceKm`: distancia geodésica mínima al **área** urbana, cero para un epicentro dentro de ella. Será `null` hasta que se cargue un polígono oficial validado. `urbanAreaName` identifica el área usada. No se incluye ningún polígono de ejemplo para evitar presentar un límite inventado como oficial.

Para habilitar el cálculo, obtenga y verifique una geometría oficial del área urbana de La Paz, reproyéctela a WGS 84 (EPSG:4326), revise su validez, fecha y licencia, y cárguela como `MultiPolygon` con `id = 'la-paz'`. La siguiente plantilla espera un GeoJSON de geometría ya verificado y no un FeatureCollection:

```sql
INSERT INTO urban_reference_areas (id, name, source, area)
VALUES ('la-paz', 'Área urbana de La Paz', 'ORGANISMO Y VERSIÓN',
  ST_Multi(ST_SetSRID(ST_GeomFromGeoJSON('<GEOMETRÍA GEOJSON VERIFICADA>'), 4326))::geography)
ON CONFLICT (id) DO UPDATE
SET name = EXCLUDED.name, source = EXCLUDED.source, area = EXCLUDED.area;
```

La conversión anterior **no reproyecta** datos de otro sistema: debe realizarse antes de cargar. La API limita el mapa a los 5000 resultados más recientes de los filtros y señala la truncación; la lista sigue paginada en el servidor. La integración con datos oficiales, delimitación administrativa automática y gestión de geometrías son trabajos pendientes para una operación real.
