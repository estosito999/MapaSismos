# Módulo Alertas y Evacuación (Sprint 2 - Grupo 2)

## Tablas asociadas en PostgreSQL:
- `alertas`
- `alertas_macrodistritos`
- `notificaciones`
- `puntos_evac`
- `estados_punto_evac`
- `niveles_alerta`
- `estados_alerta`
- `entidades_emergencia`
- `telefonos_emergencia`

## Instrucciones para el equipo:
1. Crear entidades TypeORM en `entities/`.
2. Endpoints públicos: Ver alertas activas, directorio de emergencias y mapa de puntos de evacuación.
3. Endpoints de sismólogo: Crear y cerrar alertas (`@Roles(RoleName.SISMOLOGO)`).
4. Endpoints de admin: Registrar y editar puntos de evacuación (`@Roles(RoleName.ADMINISTRADOR)`).
