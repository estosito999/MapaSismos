# Módulo Reportes Ciudadanos (Sprint 4 - Grupo 18 Parte A)

## Tablas asociadas en PostgreSQL:
- `reportes_ciudadanos`
- `intensidades_mmi`
- `estados_reporte_ciudadano`

## Instrucciones para el equipo:
1. Ciudadano autenticado: Enviar percepción sísmica (MMI) con coordenadas GPS y precisión en metros.
2. Sismólogo: Validar, auditar o rechazar reportes (`@Roles(RoleName.SISMOLOGO)`).
