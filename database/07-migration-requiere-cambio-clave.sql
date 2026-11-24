-- ============================================================
-- SISMOPAZ — MIGRACIÓN: control de clave inicial en usuarios
-- Ejecutar una sola vez sobre una base de datos ya existente
-- ============================================================
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS requiere_cambio_clave BOOLEAN NOT NULL DEFAULT FALSE;
