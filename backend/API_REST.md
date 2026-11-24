# SismoPaz — Especificación Técnica de la API REST

Documento de referencia para el Backend de la plataforma **SismoPaz (Sistema de Información Sísmica La Paz)**.  
Desarrollado sobre **NestJS 10**, **TypeORM** y **PostgreSQL 18** con seguridad criptográfica **JWT (HMAC-SHA256)** y contraseñas **Bcrypt (coste 12)** en cumplimiento con los estándares **ISO/IEC 25010 (RNF03)** y **RF5.01**.

---

## 🌐 Información General

- **URL Base:** `http://localhost:3001/api`
- **Formato de Intercambio:** `application/json`
- **Codificación:** `UTF-8`
- **Datum Geodésico:** `WGS 84 (EPSG:4326)`
- **Polígono Geográfico:** Municipio de La Paz (9 Macrodistritos)

---

## 🔒 Mecanismo de Autenticación y Autorización (RBAC)

Las rutas protegidas requieren el encabezado HTTP estándar:
```http
Authorization: Bearer <token_jwt>
```

- **Expiración de Token:** 60 minutos (RNF03).
- **Lista de Revocación:** Cada token emitido se registra en la tabla `sesiones_usuario`. Al cerrar sesión (`/api/auth/logout`) o suspender una cuenta, la sesión queda revocada inmediatamente.
- **Roles del Sistema (Regla de Rol Único 1 a 1):**
  - `Ciudadano`: Usuario estándar registrado. Consulta catálogo, alertas, reporta sismos y gestiona suscripciones zonales.
  - `Sismólogo`: Personal técnico con matrícula oficial (ej. Observatorio San Calixto). Acceso a catálogo sísmico, emisión de alertas y validación de reportes.
  - `Administrador`: Gobernanza de cuentas, validación de matrículas, habilitación/suspensión y auditoría.

---

## 📋 Catálogo Completo de Endpoints

### 0. Metadatos del Sistema

#### `GET /api`
Devuelve el estado operativo de la API, versión y el índice de rutas disponibles.
- **Acceso:** Público (Sin token).
- **Respuesta (200 OK):**
```json
{
  "sistema": "SismoPaz — Sistema de Información Sísmica La Paz",
  "version": "1.0.0",
  "estado": "Operativo",
  "protocolo": "REST / JSON",
  "autenticacion": "JWT Bearer (HMAC-SHA256, expiración 60m)",
  "roles": ["Ciudadano", "Sismólogo", "Administrador"]
}
```

---

### 1. Módulo de Autenticación (`/api/auth`)

#### `POST /api/auth/register`
Registra un nuevo usuario en la plataforma con rol por defecto `Ciudadano`.
- **Acceso:** Público.
- **Cuerpo de la Petición:**
```json
{
  "nombre": "Carlos",
  "apellidos": "Mamani Quispe",
  "correo": "carlos.mamani@ejemplo.com",
  "password": "Password2026!",
  "telefono": "71987654"
}
```
- **Respuesta (201 Created):**
```json
{
  "mensaje": "Usuario registrado exitosamente",
  "token": "eyJhbGciOiJIUzI1NiIsIn...",
  "usuario": {
    "idUsuario": 4,
    "nombre": "Carlos",
    "apellidos": "Mamani Quispe",
    "correo": "carlos.mamani@ejemplo.com",
    "roles": ["Ciudadano"]
  }
}
```

#### `POST /api/auth/login`
Autentica credenciales y emite un token JWT.
- **Acceso:** Público.
- **Cuerpo de la Petición:**
```json
{
  "correo": "ciudadano@sismopaz.bo",
  "password": "Ciudadano2026!"
}
```
- **Respuesta (200 OK):**
```json
{
  "mensaje": "Inicio de sesión exitoso",
  "token": "eyJhbGciOiJIUzI1NiIsIn...",
  "usuario": {
    "idUsuario": 3,
    "nombre": "María René",
    "apellidos": "Flores Choque",
    "correo": "ciudadano@sismopaz.bo",
    "telefono": "72009988",
    "roles": ["Ciudadano"]
  }
}
```

#### `POST /api/auth/logout`
Revoca la sesión activa en el servidor y marca el token como revocado.
- **Acceso:** Autenticado (`Bearer Token`).
- **Respuesta (200 OK):**
```json
{
  "mensaje": "Sesión cerrada correctamente"
}
```

---

### 2. Módulo de Usuarios y Perfil (`/api/users`)

#### `GET /api/users/profile`
Obtiene los datos del usuario autenticado, rol único, credenciales técnicas y suscripciones zonales.
- **Acceso:** Autenticado (`Bearer Token`).
- **Respuesta (200 OK):**
```json
{
  "idUsuario": 3,
  "nombre": "María René",
  "apellidos": "Flores Choque",
  "correo": "ciudadano@sismopaz.bo",
  "telefono": "72009988",
  "estado": true,
  "roles": ["Ciudadano"],
  "perfilSismologo": null,
  "suscripciones": [
    {
      "idSuscripcion": 1,
      "idMacrodistrito": 1,
      "macrodistrito": "Cotahuma",
      "activa": true,
      "fechaSuscripcion": "2026-11-18T00:00:00.000Z"
    }
  ]
}
```

#### `PATCH /api/users/profile`
Actualiza datos de contacto personales.
- **Acceso:** Autenticado (`Bearer Token`).
- **Cuerpo de la Petición:**
```json
{
  "nombre": "María René",
  "apellidos": "Flores de Pérez",
  "telefono": "72998811"
}
```
- **Respuesta (200 OK):**
```json
{
  "mensaje": "Perfil actualizado exitosamente",
  "usuario": {
    "idUsuario": 3,
    "nombre": "María René",
    "apellidos": "Flores de Pérez",
    "correo": "ciudadano@sismopaz.bo",
    "telefono": "72998811"
  }
}
```

#### `PATCH /api/users/password`
Cambio seguro de contraseña validando la contraseña actual, nueva contraseña y confirmación.
- **Acceso:** Autenticado (`Bearer Token`).
- **Cuerpo de la Petición:**
```json
{
  "passwordActual": "Ciudadano2026!",
  "passwordNuevo": "NuevoPass2026!",
  "repetirPassword": "NuevoPass2026!"
}
```
- **Validaciones:**
  - `passwordNuevo` debe coincidir exactamente con `repetirPassword`.
  - Mínimo 8 caracteres, al menos 1 mayúscula, 1 minúscula, 1 número y 1 carácter especial (`@$!%*?&.`).
- **Respuesta (200 OK):**
```json
{
  "mensaje": "Contraseña actualizada correctamente"
}
```

#### `POST /api/users/solicitar-sismologo`
Permite a un usuario con rol `Ciudadano` postular formalmente al rol `Sismólogo` enviando su matrícula profesional.
- **Acceso:** Autenticado (`Bearer Token`).
- **Cuerpo de la Petición:**
```json
{
  "numeroAcreditacion": "SIS-LP-2026-089",
  "institucionAcreditadora": "Observatorio San Calixto"
}
```
- **Respuesta (201 Created):**
```json
{
  "mensaje": "Solicitud de acreditación enviada correctamente. El Administrador verificará su matrícula técnica.",
  "perfilSismologo": {
    "numeroAcreditacion": "SIS-LP-2026-089",
    "institucionAcreditadora": "Observatorio San Calixto",
    "estadoSolicitud": "PENDIENTE",
    "vigente": false
  }
}
```

---

### 3. Módulo Geográfico y Suscripciones (`/api/macrodistritos` y `/api/users/subscriptions`)

#### `GET /api/macrodistritos`
Listado de los 9 macrodistritos del Municipio de La Paz.
- **Acceso:** Público.
- **Respuesta (200 OK):**
```json
[
  { "idMacrodistrito": 1, "nombre": "Cotahuma", "idMunicipio": 1 },
  { "idMacrodistrito": 2, "nombre": "Max Paredes", "idMunicipio": 1 },
  { "idMacrodistrito": 3, "nombre": "Periférica", "idMunicipio": 1 },
  { "idMacrodistrito": 4, "nombre": "San Antonio", "idMunicipio": 1 },
  { "idMacrodistrito": 5, "nombre": "Sur", "idMunicipio": 1 },
  { "idMacrodistrito": 6, "nombre": "Mallasa", "idMunicipio": 1 },
  { "idMacrodistrito": 7, "nombre": "Centro", "idMunicipio": 1 },
  { "idMacrodistrito": 8, "nombre": "Hampaturi", "idMunicipio": 1 },
  { "idMacrodistrito": 9, "nombre": "Zongo", "idMunicipio": 1 }
]
```

#### `POST /api/users/subscriptions`
Suscribe al usuario a un macrodistrito para alertas zonales tempranas (RF2.03 / HU07).
- **Acceso:** Autenticado (`Bearer Token`).
- **Cuerpo de la Petición:**
```json
{
  "idMacrodistrito": 5
}
```
- **Respuesta (201 Created):**
```json
{
  "mensaje": "Suscripción zonal agregada exitosamente",
  "suscripcion": {
    "idSuscripcion": 3,
    "idUsuario": 3,
    "idMacrodistrito": 5,
    "activa": true
  }
}
```

#### `DELETE /api/users/subscriptions/:id`
Elimina una suscripción zonal previamente creada.
- **Acceso:** Autenticado (`Bearer Token`).
- **Respuesta (200 OK):**
```json
{
  "mensaje": "Suscripción zonal eliminada correctamente"
}
```

---

### 4. Módulo de Gobernanza y Administración (`/api/admin`)

*Todos los endpoints de este módulo requieren token JWT con rol `Administrador`.*

#### `GET /api/admin/users`
Listado general de usuarios registrados con soporte de búsqueda textual.
- **Parámetros Query:**
  - `search` (opcional): Filtro por nombre, apellido o correo electrónico.
  - `role` (opcional): Filtro por nombre de rol (`Ciudadano`, `Sismólogo`, `Administrador`).
- **Respuesta (200 OK):**
```json
[
  {
    "idUsuario": 2,
    "nombre": "Dr. Roberto",
    "apellidos": "Guzmán Quispe",
    "correo": "sismologo@sismopaz.bo",
    "telefono": "71556677",
    "estado": true,
    "ci": "1000002",
    "fechaCreacion": "2026-11-18",
    "roles": ["Sismólogo"],
    "perfilSismologo": {
      "numeroAcreditacion": "SIS-LP-2026-001",
      "institucionAcreditadora": "Observatorio San Calixto",
      "vigente": true,
      "estadoSolicitud": "APROBADA",
      "fechaVerificacion": "2026-11-18"
    }
  }
]
```

#### `GET /api/admin/roles`
Catálogo de roles del sistema.
- **Respuesta (200 OK):**
```json
[
  { "idRol": 1, "nombre": "Ciudadano", "descripcion": "Usuario registrado estándar" },
  { "idRol": 2, "nombre": "Sismólogo", "descripcion": "Personal técnico acreditado para operaciones sísmicas" },
  { "idRol": 3, "nombre": "Administrador", "descripcion": "Gestión de cuentas y configuración" }
]
```

#### `GET /api/admin/solicitudes-sismologo`
Bandeja de ciudadanos con solicitudes de acreditación en estado `PENDIENTE`.
- **Respuesta (200 OK):**
```json
[
  {
    "idUsuario": 3,
    "nombre": "María René",
    "apellidos": "Flores Choque",
    "correo": "ciudadano@sismopaz.bo",
    "telefono": "72009988",
    "roles": ["Ciudadano"],
    "numeroAcreditacion": "SIS-LP-2026-089",
    "institucionAcreditadora": "Observatorio San Calixto",
    "estadoSolicitud": "PENDIENTE"
  }
]
```

#### `POST /api/admin/solicitudes/:id/aprobar`
Valida la matrícula técnica, aprueba la solicitud y transfiere al usuario a rol exclusivo `Sismólogo` (eliminando `Ciudadano`).
- **Respuesta (201 Created):**
```json
{
  "mensaje": "Solicitud aprobada con éxito. El usuario María René Flores Choque ahora cuenta con rol Sismólogo.",
  "roles": ["Sismólogo"],
  "perfilSismologo": {
    "numeroAcreditacion": "SIS-LP-2026-089",
    "institucionAcreditadora": "Observatorio San Calixto",
    "estadoSolicitud": "APROBADA",
    "vigente": true
  }
}
```

#### `POST /api/admin/solicitudes/:id/rechazar`
Rechaza la solicitud de acreditación. El usuario permanece con rol `Ciudadano`.
- **Respuesta (201 Created):**
```json
{
  "mensaje": "La solicitud de acreditación del usuario María René ha sido rechazada. Mantiene su rol actual.",
  "estadoSolicitud": "RECHAZADA"
}
```

#### `PATCH /api/admin/users/:id/status`
Habilita o suspende una cuenta de usuario. Si se suspende, revoca todas sus sesiones activas de inmediato.
- **Cuerpo de la Petición:**
```json
{
  "estado": false
}
```
- **Respuesta (200 OK):**
```json
{
  "mensaje": "Cuenta de usuario suspendida y sesiones revocadas",
  "estado": false
}
```

#### `POST /api/admin/users/:id/assign-role`
Asignación o cambio directo de rol garantizando la regla de rol único (reemplaza cualquier rol previo).
- **Cuerpo de la Petición:**
```json
{
  "idRol": 2,
  "numeroAcreditacion": "SIS-LP-2026-102",
  "institucionAcreditadora": "Observatorio San Calixto"
}
```
- **Respuesta (201 Created):**
```json
{
  "mensaje": "Rol Sismólogo asignado exitosamente al usuario (rol único)",
  "roles": ["Sismólogo"]
}
```

---

### 5. Módulo de Registro Sísmico (`/api/sismos`)

*Todos los endpoints actuales de este módulo requieren token JWT con rol `Sismólogo`.*

#### `POST /api/sismos`
Registra un evento instrumental, asocia su fuente principal y crea el historial inicial
con estado `Pendiente`. Las tres operaciones se ejecutan en una única transacción.

- **Cuerpo de la petición:**
```json
{
  "fechaHoraUtc": "2026-11-22T18:00:00.000Z",
  "magnitud": 4.2,
  "idTipoMagnitud": 1,
  "profundidadKm": 35.5,
  "latitud": -16.495,
  "longitud": -68.1336,
  "observacionReferencia": "25 km al noreste de la ciudad de La Paz",
  "idFuente": 1,
  "identificadorExterno": "OSC-2026-001",
  "confirmarPosibleDuplicado": false
}
```

- **Respuesta (201 Created):** devuelve el evento con su tipo de magnitud, estado y fuente.
- **Validaciones:** fecha ISO 8601 UTC, magnitud entre -2 y 10, profundidad no negativa,
  latitud entre -90 y 90, longitud entre -180 y 180, catálogos existentes y fuente activa.
- Si existen candidatos y `confirmarPosibleDuplicado` no es `true`, responde `409 Conflict`.

#### `POST /api/sismos/verificar-duplicados`
Compara el evento propuesto con el catálogo sin crear registros. Devuelve diferencias
temporales, geográficas, de magnitud y profundidad, además de los motivos de coincidencia.

Los umbrales predeterminados son 300 segundos, 50 km, 0.5 de magnitud y 20 km de
profundidad. Se configuran mediante variables de entorno. El mismo identificador externo
en la misma fuente es una señal fuerte. El resultado es una advertencia técnica y no una
clasificación científica definitiva.

- **Respuesta sin coincidencias:**
```json
{
  "posibleDuplicado": false,
  "candidatos": [],
  "umbralesAplicados": {
    "tiempoSegundos": 300,
    "distanciaKm": 50,
    "magnitud": 0.5,
    "profundidadKm": 20
  }
}
```

#### Catálogos técnicos

```http
GET /api/sismos/catalogos/tipos-magnitud
GET /api/sismos/catalogos/estados
GET /api/sismos/catalogos/fuentes
```

El catálogo de fuentes devuelve únicamente fuentes activas.

#### `GET /api/sismos`
Lista eventos desde el más reciente con paginación y filtros combinables.

| Parámetro | Descripción |
|---|---|
| `pagina` | Página solicitada, desde 1. |
| `limite` | Registros por página, máximo 100. |
| `fechaDesde`, `fechaHasta` | Fechas ISO 8601 en UTC. |
| `magnitudMin`, `magnitudMax` | Intervalo de magnitud entre -2 y 10. |
| `idTipoMagnitud` | Tipo instrumental. |
| `idEstadoSismo` | Estado del evento. |
| `idFuente` | Fuente asociada. |
| `ubicacion` | Búsqueda parcial no sensible a mayúsculas. |

La respuesta contiene `items` y metadatos en `paginacion` (`total`,
`totalPaginas`, `tieneAnterior` y `tieneSiguiente`).

#### `GET /api/sismos/:id`
Devuelve la ficha técnica del evento, sus fuentes, registrador, historial de estados
y posibles duplicados relacionados. La respuesta omite contraseñas y demás campos
sensibles de las cuentas de usuario.

#### `PATCH /api/sismos/:id`
Actualiza parámetros técnicos y procedencia. Requiere `fechaUltimaActualizacion`
con la versión recibida en la ficha. Si otro usuario modificó el evento, responde
`409 Conflict` y exige recargar los datos.

Cada campo realmente modificado genera una entrada independiente con usuario,
fecha, valor anterior y valor nuevo. Si no existen diferencias, responde `400`.
La operación completa utiliza una transacción.

#### `GET /api/sismos/:id/historial`
Devuelve el historial técnico ordenado desde el cambio más reciente.

#### `POST /api/sismos/:id/verificar-duplicados`
Verifica los parámetros propuestos para una edición, excluyendo al propio evento
de los candidatos. Una actualización con coincidencias requiere confirmación explícita.

#### `PATCH /api/sismos/:id/estado`
Ejecuta la siguiente transición autorizada del ciclo de vida.

```json
{
  "idEstadoSismo": 2,
  "fechaUltimaActualizacion": "2026-11-22T19:00:00.000Z",
  "observacion": "Parámetros revisados contra la fuente instrumental"
}
```

Reglas:

```text
Pendiente → Revisado → Publicado
```

No se permiten saltos, retrocesos ni avances posteriores a `Publicado`. Cada transición
genera historial. Si un evento publicado se modifica técnicamente, retorna automáticamente
a `Revisado` y requiere una nueva publicación.

#### `GET /api/sismos/duplicados`
Lista casos de posible duplicidad con paginación. Acepta `estadoRevision`, `pagina`
y `limite`. Cada elemento incluye los parámetros técnicos y procedencia de ambos eventos.

Estados disponibles:

```text
Pendiente de revisión
Confirmado como distinto
Confirmado como duplicado
Descartado
```

#### `GET /api/sismos/duplicados/:id`
Devuelve la comparación completa, decisión, observaciones, usuario y fechas del caso.

#### `PATCH /api/sismos/duplicados/:id/resolver`
Registra la decisión del Sismólogo. Solo acepta casos pendientes y requiere una
justificación técnica no vacía.

```json
{
  "estadoRevision": "Confirmado como distinto",
  "observacion": "Las fuentes institucionales confirmaron eventos independientes."
}
```

La resolución no elimina, sobrescribe ni fusiona eventos sísmicos.

---

## 🛑 Códigos de Estado HTTP Utilizados

| Código | Descripción | Casos de Uso |
|---|---|---|
| `200 OK` | Operación exitosa | Consultas GET, actualizaciones PATCH |
| `201 Created` | Recurso creado exitosamente | Registro, login, suscripciones, solicitudes |
| `400 Bad Request` | Parámetros inválidos | Contraseñas no coinciden, campos faltantes |
| `401 Unauthorized` | Autenticación requerida | Token no enviado, expirado (>60m) o inválido |
| `403 Forbidden` | Acceso denegado por rol | Usuario sin permisos de Administrador |
| `404 Not Found` | Recurso inexistente | Usuario, rol o macrodistrito no encontrado |
| `409 Conflict` | Conflicto de unicidad | Correo electrónico ya registrado previamente |
# Catálogo cartográfico público (Sprint 1 + Sprint 7)

El mapa público consume exclusivamente la API NestJS y la tabla normalizada `sismos`.
No consulta PostgreSQL desde el frontend y nunca expone eventos `Pendiente` o `Revisado`.

- `GET /api/public/sismos`: catálogo y puntos del mapa. Acepta `pagina`, `limite`,
  `fechaDesde`, `fechaHasta`, `magnitudMin`, `magnitudMax` y `ubicacion`.
- `GET /api/public/sismos/ubicaciones`: ubicaciones disponibles entre eventos publicados.
- `GET /api/public/sismos/territorios`: municipios y macrodistritos para filtros por ID.
- `GET /api/public/sismos/:id`: ficha técnica de un evento publicado.

Las coordenadas usan WGS 84 (EPSG:4326). `epicentralDistanceKm` es una distancia
Haversine aproximada a Plaza Murillo; no representa distancia al límite urbano.
Los eventos importados como demostración se reconocen por `DEMO-SPRINT1-*`.
Los sismos admiten `idMunicipio` e `idMacrodistrito` opcionales en registro y edición.
Si se informa un macrodistrito, la API valida que pertenezca al municipio. La distancia
`urbanAreaDistanceKm` se calcula contra el radio parametrizado en
`areas_urbanas_referencia`; la semilla incluida es una aproximación circular de 10 km
identificada expresamente como no oficial.
