-- Integración Sprint 1 (Mapa) con Sprint 7 (Gestión de eventos).
-- No requiere PostGIS: las coordenadas oficiales continúan en WGS 84.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='sismos'
      AND column_name='fecha_hora_utc' AND data_type='timestamp without time zone'
  ) THEN
    ALTER TABLE sismos ALTER COLUMN fecha_hora_utc TYPE TIMESTAMPTZ
      USING fecha_hora_utc AT TIME ZONE 'UTC';
  END IF;
END $$;

ALTER TABLE sismos ADD COLUMN IF NOT EXISTS id_municipio INT REFERENCES municipios(id_municipio);
ALTER TABLE sismos ADD COLUMN IF NOT EXISTS id_macrodistrito INT REFERENCES macrodistritos(id_macrodistrito);

INSERT INTO municipios (nombre, departamento, codigo_ine)
SELECT v.nombre, 'La Paz', v.codigo_ine
FROM (VALUES ('El Alto','020105'),('Viacha','020801'),('Achocalla','020104'),('Palca','020102'),('Mecapaca','020103')) v(nombre,codigo_ine)
WHERE NOT EXISTS (SELECT 1 FROM municipios m WHERE m.nombre=v.nombre AND m.departamento='La Paz');

CREATE TABLE IF NOT EXISTS areas_urbanas_referencia (
  id_area SERIAL PRIMARY KEY,
  nombre VARCHAR(150) NOT NULL UNIQUE,
  latitud_centro DECIMAL(9,6) NOT NULL,
  longitud_centro DECIMAL(9,6) NOT NULL,
  radio_km DECIMAL(7,2) NOT NULL CHECK (radio_km > 0),
  fuente VARCHAR(255) NOT NULL,
  es_oficial BOOLEAN NOT NULL DEFAULT FALSE,
  activa BOOLEAN NOT NULL DEFAULT TRUE
);

INSERT INTO areas_urbanas_referencia
  (nombre, latitud_centro, longitud_centro, radio_km, fuente, es_oficial)
VALUES
  ('Área urbana referencial de La Paz', -16.495600, -68.133600, 10.00,
   'Aproximación académica: radio de 10 km desde Plaza Murillo; sustituir por límite oficial verificado.', FALSE)
ON CONFLICT (nombre) DO UPDATE SET
  latitud_centro=EXCLUDED.latitud_centro, longitud_centro=EXCLUDED.longitud_centro,
  radio_km=EXCLUDED.radio_km, fuente=EXCLUDED.fuente;

CREATE INDEX IF NOT EXISTS idx_sismos_fecha_hora_utc ON sismos (fecha_hora_utc DESC);
CREATE INDEX IF NOT EXISTS idx_sismos_magnitud ON sismos (magnitud);
CREATE INDEX IF NOT EXISTS idx_sismos_estado_fecha ON sismos (id_estado_sismo, fecha_hora_utc DESC);
CREATE INDEX IF NOT EXISTS idx_sismos_coordenadas ON sismos (latitud, longitud);
CREATE INDEX IF NOT EXISTS idx_sismos_municipio ON sismos (id_municipio);
CREATE INDEX IF NOT EXISTS idx_sismos_macrodistrito ON sismos (id_macrodistrito);
CREATE INDEX IF NOT EXISTS idx_sismos_ubicacion_lower ON sismos (LOWER(observacion_referencia));
