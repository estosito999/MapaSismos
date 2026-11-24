# Módulo Sismos (Sprint 1 & Sprint 7)

La localización territorial es opcional: un evento puede asociarse con municipio y
macrodistrito, pero los eventos fuera del catálogo geográfico continúan siendo válidos.
Cuando ambos se informan, el servicio comprueba su relación antes de guardar. El mapa
público filtra por estos identificadores y calcula distancia a un área urbana referencial
parametrizada sin depender de PostGIS.

Este módulo corresponde a los equipos de:
- **Sprint 1 (Grupo 4):** Catálogo de sismos, visor cartográfico, filtros de eventos.
- **Sprint 7 (Grupo 19):** Registro formal de eventos sísmicos, panel de monitoreo, revisión de duplicados.

## Tablas asociadas en PostgreSQL:
- `sismos`
- `sismos_fuentes`
- `fuentes_sismicas`
- `historial_estados_sismo`
- `historial_cambios_sismo`
- `posibles_duplicados_sismo`
- `tipos_magnitud`
- `estados_sismo`

## Estado de implementación

### Fase 1 — Infraestructura (completada)

- Entidades TypeORM creadas para las ocho tablas del módulo.
- `SismosModule` registrado en `AppModule`.
- Servicio y controlador conectados con PostgreSQL.
- Catálogos técnicos protegidos mediante JWT y rol `Sismólogo`.
- TypeORM mantiene `synchronize: false`; el esquema continúa administrado por los scripts SQL.

### Fase 2 — HU19 Registro instrumental (completada)

- DTO con validaciones de fecha UTC, magnitud, profundidad y coordenadas WGS 84.
- Verificación de tipo de magnitud y fuente activa.
- Registro atómico del evento, su fuente principal y el historial inicial.
- Estado inicial obligatorio `Pendiente` y usuario tomado del JWT.
- Formulario web disponible en `/monitoreo/nuevo`.

### Fase 3 — Detección previa de duplicados (completada)

- Comparación por proximidad temporal y distancia geográfica Haversine.
- Comparación de diferencias de magnitud y profundidad.
- Coincidencia fuerte por identificador externo dentro de la misma fuente.
- Bloqueo del registro con HTTP 409 si no existe confirmación explícita.
- Persistencia de la coincidencia como `Pendiente de revisión` cuando el Sismólogo continúa.
- Presentación de candidatos y diferencias técnicas en el formulario web.

### Fase 4 — HU20 Monitoreo técnico (completada)

- Listado cronológico paginado, desde el evento más reciente.
- Filtros por fechas UTC, magnitud, tipo, estado, fuente y ubicación.
- Visualización simultánea de fecha UTC y hora de Bolivia (BOT).
- Ficha técnica con coordenadas, procedencia, usuario registrador e historial de estados.
- Visualización de coincidencias de duplicidad relacionadas.
- Respuestas mapeadas para no exponer credenciales ni campos sensibles del usuario.
- Panel web real en `/monitoreo` y ficha en `/monitoreo/[id]`.

### Fase 5 — HU21 Revisión y actualización (completada)

- Edición de parámetros instrumentales y procedencia por el Sismólogo.
- Revalidación completa de magnitud, coordenadas, profundidad, tipo y fuente.
- Control de concurrencia mediante `fechaUltimaActualizacion`.
- Transacción única para actualizar el evento, su fuente y la auditoría.
- Registro de una fila por cada campo realmente modificado.
- Conservación del valor anterior, valor nuevo, usuario y fecha del cambio.
- Nueva verificación de duplicidad al modificar parámetros técnicos.
- Formulario en `/monitoreo/[id]/editar` e historial visible en la ficha.

### Fase 6 — Ciclo de estados (completada)

- Transiciones estrictas `Pendiente → Revisado → Publicado`.
- Prohibición de saltos, retrocesos y transiciones posteriores a `Publicado`.
- Control de concurrencia mediante la versión actual del evento.
- Registro de usuario, fecha y observación en `historial_estados_sismo`.
- Transición y auditoría ejecutadas en una sola transacción.
- Un evento publicado que recibe cambios técnicos vuelve automáticamente a `Revisado`.
- Controles de estado integrados en la ficha técnica.

### Fase 7 — HU22 Resolución de duplicidad (completada)

- Bandeja paginada y filtrable de coincidencias detectadas.
- Comparación lado a lado de fecha, magnitud, profundidad, coordenadas y procedencia.
- Resoluciones permitidas: distinto, duplicado o descartado.
- Justificación técnica obligatoria para resolver.
- Registro del Sismólogo responsable y fecha de resolución.
- Protección contra una segunda resolución del mismo caso.
- Conservación de ambos eventos sin eliminación o fusión automática.
- Interfaz disponible en `/monitoreo/duplicados`.

## Endpoints disponibles

Todos requieren el encabezado `Authorization: Bearer <token>` y el rol `Sismólogo`.

| Método | Ruta | Descripción |
|---|---|---|
| POST | `/api/sismos` | Registra un evento sísmico con estado inicial `Pendiente`. |
| POST | `/api/sismos/verificar-duplicados` | Busca posibles coincidencias antes del registro. |
| GET | `/api/sismos` | Lista eventos con filtros y paginación. |
| GET | `/api/sismos/:id` | Devuelve la ficha técnica completa de un evento. |
| PATCH | `/api/sismos/:id` | Actualiza parámetros y registra su auditoría. |
| GET | `/api/sismos/:id/historial` | Consulta el historial técnico de cambios. |
| POST | `/api/sismos/:id/verificar-duplicados` | Verifica una edición excluyendo al propio evento. |
| PATCH | `/api/sismos/:id/estado` | Ejecuta la siguiente transición autorizada. |
| GET | `/api/sismos/duplicados` | Lista coincidencias por estado y página. |
| GET | `/api/sismos/duplicados/:id` | Devuelve la comparación completa de un caso. |
| PATCH | `/api/sismos/duplicados/:id/resolver` | Registra una resolución técnica. |
| GET | `/api/sismos/catalogos/tipos-magnitud` | Lista los tipos de magnitud disponibles. |
| GET | `/api/sismos/catalogos/estados` | Lista los estados del ciclo de vida del sismo. |
| GET | `/api/sismos/catalogos/fuentes` | Lista únicamente las fuentes sísmicas activas. |

## Reglas del registro

- `fechaHoraUtc` debe ser ISO 8601 y terminar en `Z`.
- Magnitud aceptada: `-2` a `10`, con un máximo de dos decimales.
- Profundidad focal: valor mayor o igual que cero, expresado en km.
- Latitud: `-90` a `90`; longitud: `-180` a `180`.
- La fuente seleccionada debe existir y estar activa.
- El registro se revierte completamente si falla cualquiera de sus tres escrituras.

## Umbrales de duplicidad

Los valores predeterminados son ayudas operativas configurables, no una afirmación
científica de que dos registros representan definitivamente el mismo evento:

| Variable | Valor predeterminado |
|---|---:|
| `DUPLICATE_TIME_SECONDS` | 300 segundos |
| `DUPLICATE_DISTANCE_KM` | 50 km |
| `DUPLICATE_MAGNITUDE_DELTA` | 0.5 |
| `DUPLICATE_DEPTH_DELTA_KM` | 20 km |

Un candidato por parámetros debe cumplir simultáneamente los cuatro umbrales. La
repetición del identificador externo en la misma fuente se trata como señal fuerte
independientemente de esos umbrales. La decisión final siempre corresponde al Sismólogo.

## Próxima fase

Ejecutar la fase integral de pruebas, endurecimiento y documentación final.
