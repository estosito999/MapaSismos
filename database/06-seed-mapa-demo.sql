-- Datos demostrativos aportados por el Grupo 4. Son idempotentes y se
-- identifican con DEMO-SPRINT1-* para no confundirse con registros oficiales.
WITH eventos(fecha, magnitud, tipo, profundidad, latitud, longitud, ubicacion, codigo) AS (VALUES
 ('2024-10-18T14:32:18Z'::timestamptz,4.20,'Mw',18.40,-16.480000,-68.120000,'Centro / La Paz','DEMO-SPRINT1-001'),
 ('2024-09-09T02:15:43Z'::timestamptz,3.60,'Ml',45.00,-16.510000,-68.220000,'El Alto','DEMO-SPRINT1-002'),
 ('2024-08-21T19:05:12Z'::timestamptz,4.80,'Mw',83.20,-16.650000,-68.290000,'Viacha','DEMO-SPRINT1-003'),
 ('2024-07-15T08:46:30Z'::timestamptz,2.90,'Ml',12.80,-16.570000,-68.160000,'Achocalla','DEMO-SPRINT1-004'),
 ('2024-06-11T23:21:07Z'::timestamptz,3.70,'Ml',34.60,-16.590000,-67.950000,'Palca','DEMO-SPRINT1-005'),
 ('2024-05-04T16:10:55Z'::timestamptz,4.10,'Mw',72.00,-16.680000,-68.000000,'Mecapaca','DEMO-SPRINT1-006'),
 ('2024-04-18T06:27:31Z'::timestamptz,3.20,'Ml',27.30,-16.420000,-68.150000,'Periférica / La Paz','DEMO-SPRINT1-007'),
 ('2024-03-02T11:42:09Z'::timestamptz,4.50,'Mw',55.40,-16.470000,-68.190000,'El Alto','DEMO-SPRINT1-008'),
 ('2024-02-14T20:35:12Z'::timestamptz,2.70,'Ml',9.00,-16.600000,-68.240000,'Viacha','DEMO-SPRINT1-009'),
 ('2024-01-24T03:08:44Z'::timestamptz,3.90,'Mw',94.10,-16.610000,-68.060000,'Mecapaca','DEMO-SPRINT1-010'),
 ('2023-12-07T09:12:06Z'::timestamptz,3.10,'Ml',21.70,-16.550000,-67.980000,'Palca','DEMO-SPRINT1-011'),
 ('2023-11-16T13:55:29Z'::timestamptz,4.00,'Mw',64.20,-16.540000,-68.140000,'Achocalla','DEMO-SPRINT1-012'),
 ('2023-10-10T15:22:11Z'::timestamptz,3.40,'Ml',15.20,-16.500000,-68.135000,'Centro / La Paz','DEMO-SPRINT1-013'),
 ('2023-09-15T07:05:40Z'::timestamptz,4.00,'Mw',38.50,-16.510000,-68.150000,'Cotahuma / La Paz','DEMO-SPRINT1-014'),
 ('2023-08-20T21:48:03Z'::timestamptz,2.80,'Ml',8.40,-16.540000,-68.120000,'Sur / La Paz','DEMO-SPRINT1-015')
), nuevos AS (
 INSERT INTO sismos (id_tipo_magnitud,id_estado_sismo,id_usuario_registro,fecha_hora_utc,magnitud,profundidad_km,latitud,longitud,observacion_referencia)
 SELECT tm.id_tipo_magnitud, es.id_estado_sismo, u.id_usuario, e.fecha, e.magnitud, e.profundidad, e.latitud, e.longitud, e.ubicacion
 FROM eventos e
 JOIN tipos_magnitud tm ON tm.codigo=e.tipo
 JOIN estados_sismo es ON es.nombre='Publicado'
 JOIN usuarios u ON u.correo='sismologo@sismopaz.bo'
 WHERE NOT EXISTS (SELECT 1 FROM sismos_fuentes sf WHERE sf.identificador_externo=e.codigo)
 RETURNING id_sismo, fecha_hora_utc
)
INSERT INTO sismos_fuentes (id_sismo,id_fuente,identificador_externo,fecha_consulta,es_fuente_principal)
SELECT n.id_sismo, f.id_fuente, e.codigo, NOW(), TRUE
FROM nuevos n JOIN eventos e ON e.fecha=n.fecha_hora_utc
JOIN fuentes_sismicas f ON f.nombre='Observatorio San Calixto';

UPDATE sismos s SET
  id_municipio = (SELECT m.id_municipio FROM municipios m WHERE m.nombre=CASE
    WHEN s.observacion_referencia IN ('El Alto','Viacha','Achocalla','Palca','Mecapaca') THEN s.observacion_referencia ELSE 'La Paz' END LIMIT 1),
  id_macrodistrito = (SELECT md.id_macrodistrito FROM macrodistritos md
    JOIN municipios m ON m.id_municipio=md.id_municipio
    WHERE m.nombre='La Paz' AND md.nombre=split_part(s.observacion_referencia, ' / ', 1) LIMIT 1)
WHERE EXISTS (SELECT 1 FROM sismos_fuentes sf WHERE sf.id_sismo=s.id_sismo AND sf.identificador_externo LIKE 'DEMO-SPRINT1-%');
