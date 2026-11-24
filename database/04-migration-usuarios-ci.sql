-- ============================================================
-- SISMOPAZ — MIGRACIÓN: CI y fecha de creación en usuarios
-- Ejecutar una sola vez sobre una base de datos ya existente
-- ============================================================
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS ci VARCHAR(20) UNIQUE;
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS fecha_creacion DATE NOT NULL DEFAULT CURRENT_DATE;

UPDATE usuarios SET ci = '1000001' WHERE correo = 'admin@sismopaz.bo';
UPDATE usuarios SET ci = '1000002' WHERE correo = 'sismologo@sismopaz.bo';
UPDATE usuarios SET ci = '1000003' WHERE correo = 'ciudadano@sismopaz.bo';
