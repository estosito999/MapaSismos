-- Datos ficticios para demostración. No representan mediciones ni alertas reales.
INSERT INTO locations (id, name, type) VALUES
  ('la-paz', 'La Paz', 'municipio'),
  ('el-alto', 'El Alto', 'municipio'),
  ('viacha', 'Viacha', 'municipio'),
  ('achocalla', 'Achocalla', 'municipio'),
  ('palca', 'Palca', 'municipio'),
  ('mecapaca', 'Mecapaca', 'municipio')
ON CONFLICT (id) DO NOTHING;

INSERT INTO seismic_events (id, occurred_at, magnitude, magnitude_type, depth_km, epicenter, location_id, source) VALUES
  ('demo-001', '2024-10-18T14:32:18Z', 4.2, 'Mw', 18.4, ST_SetSRID(ST_MakePoint(-68.12, -16.48), 4326)::geography, 'la-paz', 'demo'),
  ('demo-002', '2024-09-09T02:15:43Z', 3.6, 'Ml', 45.0, ST_SetSRID(ST_MakePoint(-68.22, -16.51), 4326)::geography, 'el-alto', 'demo'),
  ('demo-003', '2024-08-21T19:05:12Z', 4.8, 'Mw', 83.2, ST_SetSRID(ST_MakePoint(-68.29, -16.65), 4326)::geography, 'viacha', 'demo'),
  ('demo-004', '2024-07-15T08:46:30Z', 2.9, 'Ml', 12.8, ST_SetSRID(ST_MakePoint(-68.16, -16.57), 4326)::geography, 'achocalla', 'demo'),
  ('demo-005', '2024-06-11T23:21:07Z', 3.7, 'Ml', 34.6, ST_SetSRID(ST_MakePoint(-67.95, -16.59), 4326)::geography, 'palca', 'demo'),
  ('demo-006', '2024-05-04T16:10:55Z', 4.1, 'Mw', 72.0, ST_SetSRID(ST_MakePoint(-68.00, -16.68), 4326)::geography, 'mecapaca', 'demo'),
  ('demo-007', '2024-04-18T06:27:31Z', 3.2, 'Ml', 27.3, ST_SetSRID(ST_MakePoint(-68.15, -16.42), 4326)::geography, 'la-paz', 'demo'),
  ('demo-008', '2024-03-02T11:42:09Z', 4.5, 'Mw', 55.4, ST_SetSRID(ST_MakePoint(-68.19, -16.47), 4326)::geography, 'el-alto', 'demo'),
  ('demo-009', '2024-02-14T20:35:12Z', 2.7, 'Ml', 9.0, ST_SetSRID(ST_MakePoint(-68.24, -16.60), 4326)::geography, 'viacha', 'demo'),
  ('demo-010', '2024-01-24T03:08:44Z', 3.9, 'Mw', 94.1, ST_SetSRID(ST_MakePoint(-68.06, -16.61), 4326)::geography, 'mecapaca', 'demo'),
  ('demo-011', '2023-12-07T09:12:06Z', 3.1, 'Ml', 21.7, ST_SetSRID(ST_MakePoint(-67.98, -16.55), 4326)::geography, 'palca', 'demo'),
  ('demo-012', '2023-11-16T13:55:29Z', 4.0, 'Mw', 64.2, ST_SetSRID(ST_MakePoint(-68.14, -16.54), 4326)::geography, 'achocalla', 'demo')
ON CONFLICT (id) DO NOTHING;
