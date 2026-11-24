-- ============================================================
-- DATOS SEMILLA — Catálogos iniciales del sistema
-- ============================================================

-- Roles del sistema (Sprint 5)
INSERT INTO roles (nombre, descripcion) VALUES
('Ciudadano', 'Usuario registrado estándar con acceso a funcionalidades básicas'),
('Sismólogo', 'Personal técnico acreditado para operaciones sísmicas'),
('Administrador', 'Gestión de cuentas, contenido y configuración del sistema')
ON CONFLICT (nombre) DO NOTHING;

-- Tipos de magnitud (Sprint 1/7)
INSERT INTO tipos_magnitud (codigo, nombre, descripcion) VALUES
('Mw', 'Magnitud de Momento', 'Escala instrumental de magnitud de momento sísmico'),
('Ml', 'Magnitud Local', 'Escala de magnitud local derivada de Richter')
ON CONFLICT (codigo) DO NOTHING;

-- Estados de sismo (Sprint 7)
INSERT INTO estados_sismo (nombre, descripcion) VALUES
('Pendiente', 'Evento registrado pendiente de revisión técnica'),
('Revisado', 'Evento revisado y validado por un sismólogo'),
('Publicado', 'Evento verificado y visible públicamente en el catálogo')
ON CONFLICT (nombre) DO NOTHING;

-- Fases de prevención (Sprint 3)
INSERT INTO fases_prevencion (nombre, orden) VALUES
('Antes', 1), ('Durante', 2), ('Después', 3);

-- Niveles de alerta (Sprint 2)
INSERT INTO niveles_alerta (nombre, descripcion) VALUES
('Informativa', 'Aviso general sin riesgo inmediato'),
('Moderada', 'Situación de precaución con efectos perceptibles'),
('Severa', 'Emergencia sísmica con evacuación recomendada')
ON CONFLICT (nombre) DO NOTHING;

-- Estados de alerta (Sprint 2)
INSERT INTO estados_alerta (nombre, descripcion) VALUES
('Activa', 'Alerta vigente y visible públicamente'),
('Cerrada', 'Alerta finalizada — registro histórico inmutable')
ON CONFLICT (nombre) DO NOTHING;

-- Estados de punto de evacuación (Sprint 2)
INSERT INTO estados_punto_evac (nombre, descripcion) VALUES
('Disponible', 'Punto de evacuación operativo y accesible'),
('En Mantenimiento', 'Temporalmente fuera de servicio'),
('Desactivado', 'Punto cerrado permanentemente')
ON CONFLICT (nombre) DO NOTHING;

-- Escala de Intensidad Mercalli Modificada (Sprint 4)
INSERT INTO intensidades_mmi (grado, numero_romano, nombre, descripcion) VALUES
(1,  'I',    'No sentido',  'No sentido excepto por pocas personas en condiciones especiales'),
(2,  'II',   'Débil',       'Sentido solo por pocas personas en reposo en pisos altos'),
(3,  'III',  'Débil',       'Sentido notablemente en interiores, vibración similar a camión'),
(4,  'IV',   'Ligero',      'Sentido por muchos en interiores, pocos en exteriores'),
(5,  'V',    'Moderado',    'Sentido por casi todos, algunos objetos caen'),
(6,  'VI',   'Fuerte',      'Sentido por todos, objetos pesados se mueven, daño leve'),
(7,  'VII',  'Muy Fuerte',  'Daño moderado en estructuras, difícil mantenerse en pie'),
(8,  'VIII', 'Severo',      'Daño considerable en estructuras ordinarias'),
(9,  'IX',   'Violento',    'Daño severo, pánico generalizado'),
(10, 'X',    'Extremo',     'Destrucción de la mayoría de estructuras'),
(11, 'XI',   'Extremo',     'Pocas estructuras quedan en pie'),
(12, 'XII',  'Extremo',     'Destrucción total')
ON CONFLICT (grado) DO NOTHING;

-- Estados de reporte ciudadano (Sprint 4)
INSERT INTO estados_reporte_ciudadano (nombre, descripcion) VALUES
('Pendiente', 'Reporte enviado, en espera de revisión por sismólogo'),
('Validado', 'Reporte verificado y asociado a un evento sísmico'),
('Rechazado', 'Reporte descartado por inconsistencia o irrelevancia')
ON CONFLICT (nombre) DO NOTHING;

-- Municipio de La Paz
INSERT INTO municipios (nombre, departamento, codigo_ine) VALUES
('La Paz', 'La Paz', '020101');

-- Los 9 Macrodistritos oficiales del Municipio de La Paz
INSERT INTO macrodistritos (id_municipio, nombre) VALUES
(1, 'Cotahuma'),
(1, 'Max Paredes'),
(1, 'Periférica'),
(1, 'San Antonio'),
(1, 'Sur'),
(1, 'Mallasa'),
(1, 'Centro'),
(1, 'Hampaturi'),
(1, 'Zongo');

-- Entidades de emergencia y teléfonos (Sprint 2)
INSERT INTO entidades_emergencia (nombre, area_soporte, descripcion) VALUES
('Bomberos',      'Rescate y emergencias',    'Cuerpo de Bomberos de La Paz'),
('SAR Bolivia',   'Búsqueda y rescate',       'Search and Rescue Bolivia'),
('Defensa Civil', 'Gestión de desastres',      'Viceministerio de Defensa Civil'),
('SEDES La Paz',  'Salud',                     'Servicio Departamental de Salud');

INSERT INTO telefonos_emergencia (id_entidad, numero, descripcion, principal) VALUES
(1, '119', 'Línea de emergencia bomberos', TRUE),
(2, '110', 'Línea SAR Bolivia',            TRUE),
(3, '120', 'Línea Defensa Civil',          TRUE),
(4, '123', 'Emergencias de salud',         TRUE);

-- Fuentes sísmicas de referencia (Sprint 7)
INSERT INTO fuentes_sismicas (nombre, tipo, institucion, url, es_oficial) VALUES
('Observatorio San Calixto', 'Red Sismológica',  'OSC',  'https://www.osc.org.bo', TRUE),
('USGS Earthquake Hazards',  'Red Internacional', 'USGS', 'https://earthquake.usgs.gov', TRUE);

-- ============================================================
-- USUARIOS PRECONFIGURADOS DE PRUEBA (SPRINT 5)
-- ============================================================
-- 1. Administrador: admin@sismopaz.bo       / Admin2026!       / CI 1000001
-- 2. Sismólogo:     sismologo@sismopaz.bo   / Sismologo2026!   / CI 1000002 (Acreditado en OSC)
-- 3. Ciudadano:     ciudadano@sismopaz.bo   / Ciudadano2026!   / CI 1000003 (Suscrito a Macrodistritos)

INSERT INTO usuarios (nombre, apellidos, correo, ci, password_hash, telefono, estado, fecha_creacion) VALUES
('Administrador', 'SismoPaz', 'admin@sismopaz.bo', '1000001', '$2b$12$Usa5JONU2YAOFD.uAhWwNu8MkPVezVlN7u4C1xrPNyj9dP8FfiM3C', '22113344', true, CURRENT_DATE),
('Dr. Roberto', 'Guzmán Quispe', 'sismologo@sismopaz.bo', '1000002', '$2b$12$auDoJPKCDbNMYpT2HPgx7OB5SxNuizrGROej1Fvw7/4Fijnq7EdPu', '71556677', true, CURRENT_DATE),
('María René', 'Flores Choque', 'ciudadano@sismopaz.bo', '1000003', '$2b$12$k4w34sXexE7Le5Wm.c0qWOw9FLhb.1wR6gVEyqRB3rs8LLkmwxOli', '72009988', true, CURRENT_DATE)
ON CONFLICT (correo) DO UPDATE SET
    password_hash = EXCLUDED.password_hash,
    ci = EXCLUDED.ci;

-- Asignar roles (Sprint 5)
INSERT INTO usuarios_roles (id_usuario, id_rol)
SELECT u.id_usuario, r.id_rol FROM usuarios u, roles r
WHERE u.correo = 'admin@sismopaz.bo' AND r.nombre = 'Administrador'
ON CONFLICT DO NOTHING;

INSERT INTO usuarios_roles (id_usuario, id_rol)
SELECT u.id_usuario, r.id_rol FROM usuarios u, roles r
WHERE u.correo = 'sismologo@sismopaz.bo' AND r.nombre = 'Sismólogo'
ON CONFLICT DO NOTHING;

INSERT INTO usuarios_roles (id_usuario, id_rol)
SELECT u.id_usuario, r.id_rol FROM usuarios u, roles r
WHERE u.correo = 'ciudadano@sismopaz.bo' AND r.nombre = 'Ciudadano'
ON CONFLICT DO NOTHING;

-- Perfil sismológico oficial para el Sismólogo (RF5.03)
INSERT INTO perfiles_sismologo (id_usuario, numero_acreditacion, institucion_acreditadora, fecha_verificacion, vigente, estado_solicitud)
SELECT u.id_usuario, 'SIS-LP-2026-001', 'Observatorio San Calixto', CURRENT_DATE, true, 'APROBADA'
FROM usuarios u WHERE u.correo = 'sismologo@sismopaz.bo'
ON CONFLICT (id_usuario) DO NOTHING;

-- Suscripciones zonales para el Ciudadano (Cotahuma y Sur) (RF5.02 / RF2.03)
INSERT INTO suscripciones_alerta (id_usuario, id_macrodistrito, activa)
SELECT u.id_usuario, m.id_macrodistrito, true
FROM usuarios u, macrodistritos m
WHERE u.correo = 'ciudadano@sismopaz.bo' AND m.nombre IN ('Cotahuma', 'Sur')
ON CONFLICT DO NOTHING;

