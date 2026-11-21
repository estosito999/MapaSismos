CREATE EXTENSION IF NOT EXISTS postgis;

CREATE TABLE IF NOT EXISTS locations (
  id text PRIMARY KEY,
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('municipio', 'macrodistrito')),
  UNIQUE (name, type)
);

-- Solo cargar geometrías oficiales verificadas; el proyecto no inventa límites.
CREATE TABLE IF NOT EXISTS urban_reference_areas (
  id text PRIMARY KEY,
  name text NOT NULL,
  source text NOT NULL,
  area geography(MultiPolygon, 4326) NOT NULL,
  CHECK (ST_IsValid(area::geometry)),
  CHECK (NOT ST_IsEmpty(area::geometry))
);

CREATE TABLE IF NOT EXISTS seismic_events (
  id text PRIMARY KEY,
  occurred_at timestamptz NOT NULL,
  magnitude numeric(3,1) NOT NULL CHECK (magnitude BETWEEN 0 AND 10),
  magnitude_type text NOT NULL CHECK (magnitude_type IN ('Mw', 'Ml')),
  depth_km numeric(7,2) NOT NULL CHECK (depth_km >= 0),
  epicenter geography(Point, 4326) NOT NULL,
  location_id text REFERENCES locations(id),
  source text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS seismic_events_occurred_at_idx ON seismic_events (occurred_at DESC, id DESC);
CREATE INDEX IF NOT EXISTS seismic_events_location_idx ON seismic_events (location_id);
CREATE INDEX IF NOT EXISTS seismic_events_epicenter_gix ON seismic_events USING gist (epicenter);
