-- ============================================================
-- SISMOPAZ — ESQUEMA DE BASE DE DATOS COMPLETO
-- PostgreSQL 18 | Proyecto Universidad La Paz
-- ============================================================

-- ============================================================
-- GRUPO A: TABLAS DE CATÁLOGO (SIN FK)
-- ============================================================

CREATE TABLE IF NOT EXISTS roles (
    id_rol           SERIAL PRIMARY KEY,
    nombre           VARCHAR(100) NOT NULL UNIQUE,
    descripcion      VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS tipos_magnitud (
    id_tipo_magnitud SERIAL PRIMARY KEY,
    codigo           VARCHAR(100) NOT NULL UNIQUE,
    nombre           VARCHAR(100) NOT NULL,
    descripcion      VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS estados_sismo (
    id_estado_sismo  SERIAL PRIMARY KEY,
    nombre           VARCHAR(100) NOT NULL UNIQUE,
    descripcion      VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS municipios (
    id_municipio     SERIAL PRIMARY KEY,
    nombre           VARCHAR(100) NOT NULL,
    departamento     VARCHAR(100) NOT NULL,
    codigo_ine       VARCHAR(100)
);

CREATE TABLE IF NOT EXISTS estados_punto_evac (
    id_estado_punto  SERIAL PRIMARY KEY,
    nombre           VARCHAR(100) NOT NULL UNIQUE,
    descripcion      VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS fases_prevencion (
    id_fase          SERIAL PRIMARY KEY,
    nombre           VARCHAR(100) NOT NULL,
    orden            INT NOT NULL
);

CREATE TABLE IF NOT EXISTS niveles_alerta (
    id_nivel_alerta  SERIAL PRIMARY KEY,
    nombre           VARCHAR(100) NOT NULL UNIQUE,
    descripcion      VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS estados_alerta (
    id_estado_alerta SERIAL PRIMARY KEY,
    nombre           VARCHAR(100) NOT NULL UNIQUE,
    descripcion      VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS intensidades_mmi (
    id_intensidad    SERIAL PRIMARY KEY,
    grado            INT NOT NULL UNIQUE,
    numero_romano    VARCHAR(10) NOT NULL UNIQUE,
    nombre           VARCHAR(100),
    descripcion      TEXT
);

CREATE TABLE IF NOT EXISTS estados_reporte_ciudadano (
    id_estado_reporte SERIAL PRIMARY KEY,
    nombre            VARCHAR(100) NOT NULL UNIQUE,
    descripcion       VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS entidades_emergencia (
    id_entidad       SERIAL PRIMARY KEY,
    nombre           VARCHAR(100) NOT NULL,
    area_soporte     VARCHAR(255),
    descripcion      VARCHAR(255),
    activa           BOOLEAN NOT NULL DEFAULT TRUE
);

-- ============================================================
-- GRUPO B: TABLAS CON DEPENDENCIAS (ORDEN DE FK)
-- ============================================================

-- B1: Usuarios (Sprint 5 - Core)
CREATE TABLE IF NOT EXISTS usuarios (
    id_usuario          SERIAL PRIMARY KEY,
    nombre              VARCHAR(100) NOT NULL,
    apellidos           VARCHAR(100) NOT NULL,
    correo              VARCHAR(100) NOT NULL UNIQUE,
    ci                  VARCHAR(20) UNIQUE,
    password_hash       VARCHAR(255) NOT NULL,
    telefono            VARCHAR(20),
    estado              BOOLEAN NOT NULL DEFAULT TRUE,
    requiere_cambio_clave BOOLEAN NOT NULL DEFAULT FALSE,
    fecha_creacion      DATE NOT NULL DEFAULT CURRENT_DATE,
    fecha_actualizacion TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS usuarios_roles (
    id_usuario       INT NOT NULL REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
    id_rol           INT NOT NULL REFERENCES roles(id_rol) ON DELETE CASCADE,
    fecha_asignacion TIMESTAMP NOT NULL DEFAULT NOW(),
    PRIMARY KEY (id_usuario, id_rol)
);

CREATE TABLE IF NOT EXISTS perfiles_sismologo (
    id_usuario                INT PRIMARY KEY REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
    numero_acreditacion       VARCHAR(100) NOT NULL,
    institucion_acreditadora  VARCHAR(100),
    fecha_verificacion        DATE,
    vigente                   BOOLEAN NOT NULL DEFAULT TRUE,
    estado_solicitud          VARCHAR(50) NOT NULL DEFAULT 'APROBADA'
);

CREATE TABLE IF NOT EXISTS sesiones_usuario (
    id_sesion        SERIAL PRIMARY KEY,
    id_usuario       INT NOT NULL REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
    token            VARCHAR(500) NOT NULL,
    fecha_inicio     TIMESTAMP NOT NULL DEFAULT NOW(),
    fecha_expiracion TIMESTAMP NOT NULL,
    revocada         BOOLEAN NOT NULL DEFAULT FALSE
);

-- B2: Geografía
CREATE TABLE IF NOT EXISTS macrodistritos (
    id_macrodistrito SERIAL PRIMARY KEY,
    id_municipio     INT NOT NULL REFERENCES municipios(id_municipio),
    nombre           VARCHAR(100) NOT NULL,
    descripcion      VARCHAR(255)
);

-- B3: Fuentes Sísmicas (Sprint 7)
CREATE TABLE IF NOT EXISTS fuentes_sismicas (
    id_fuente        SERIAL PRIMARY KEY,
    nombre           VARCHAR(100) NOT NULL,
    tipo             VARCHAR(50),
    institucion      VARCHAR(100),
    url              VARCHAR(255),
    es_oficial       BOOLEAN NOT NULL DEFAULT FALSE,
    activa           BOOLEAN NOT NULL DEFAULT TRUE
);

-- B4: Sismos (Sprint 1 / Sprint 7)
CREATE TABLE IF NOT EXISTS sismos (
    id_sismo                SERIAL PRIMARY KEY,
    id_municipio            INT REFERENCES municipios(id_municipio),
    id_macrodistrito        INT REFERENCES macrodistritos(id_macrodistrito),
    id_tipo_magnitud        INT NOT NULL REFERENCES tipos_magnitud(id_tipo_magnitud),
    id_estado_sismo         INT NOT NULL REFERENCES estados_sismo(id_estado_sismo),
    id_usuario_registro     INT NOT NULL REFERENCES usuarios(id_usuario),
    fecha_hora_utc          TIMESTAMPTZ NOT NULL,
    magnitud                DECIMAL(4,2) NOT NULL,
    profundidad_km          DECIMAL(7,2) NOT NULL,
    latitud                 DECIMAL(9,6) NOT NULL,
    longitud                DECIMAL(9,6) NOT NULL,
    observacion_referencia  VARCHAR(255),
    fecha_registro          TIMESTAMP NOT NULL DEFAULT NOW(),
    fecha_ultima_actualizacion TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS areas_urbanas_referencia (
    id_area                 SERIAL PRIMARY KEY,
    nombre                  VARCHAR(150) NOT NULL UNIQUE,
    latitud_centro          DECIMAL(9,6) NOT NULL,
    longitud_centro         DECIMAL(9,6) NOT NULL,
    radio_km                DECIMAL(7,2) NOT NULL CHECK (radio_km > 0),
    fuente                  VARCHAR(255) NOT NULL,
    es_oficial              BOOLEAN NOT NULL DEFAULT FALSE,
    activa                  BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS sismos_fuentes (
    id_sismo_fuente         SERIAL PRIMARY KEY,
    id_sismo                INT NOT NULL REFERENCES sismos(id_sismo) ON DELETE CASCADE,
    id_fuente               INT NOT NULL REFERENCES fuentes_sismicas(id_fuente),
    identificador_externo   VARCHAR(255),
    fecha_consulta          TIMESTAMP,
    es_fuente_principal     BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS historial_estados_sismo (
    id_historial_estado   SERIAL PRIMARY KEY,
    id_sismo              INT NOT NULL REFERENCES sismos(id_sismo) ON DELETE CASCADE,
    id_estado_sismo       INT NOT NULL REFERENCES estados_sismo(id_estado_sismo),
    id_usuario            INT NOT NULL REFERENCES usuarios(id_usuario),
    fecha_estado          TIMESTAMP NOT NULL DEFAULT NOW(),
    observacion           VARCHAR(500)
);

CREATE TABLE IF NOT EXISTS historial_cambios_sismo (
    id_cambio             SERIAL PRIMARY KEY,
    id_sismo              INT NOT NULL REFERENCES sismos(id_sismo) ON DELETE CASCADE,
    id_usuario            INT NOT NULL REFERENCES usuarios(id_usuario),
    campo_modificado      VARCHAR(100) NOT NULL,
    valor_anterior        VARCHAR(255),
    valor_nuevo           VARCHAR(255),
    fecha_cambio          TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS posibles_duplicados_sismo (
    id_duplicidad         SERIAL PRIMARY KEY,
    id_sismo_candidato    INT NOT NULL REFERENCES sismos(id_sismo),
    id_sismo_coincidente  INT NOT NULL REFERENCES sismos(id_sismo),
    estado_revision       VARCHAR(100) NOT NULL,
    observacion           VARCHAR(500),
    id_usuario_revision   INT REFERENCES usuarios(id_usuario),
    fecha_deteccion       TIMESTAMP NOT NULL DEFAULT NOW(),
    fecha_resolucion      TIMESTAMP
);

-- B5: Alertas (Sprint 2)
CREATE TABLE IF NOT EXISTS alertas (
    id_alerta             SERIAL PRIMARY KEY,
    id_sismo              INT REFERENCES sismos(id_sismo),
    id_nivel_alerta       INT NOT NULL REFERENCES niveles_alerta(id_nivel_alerta),
    id_estado_alerta      INT NOT NULL REFERENCES estados_alerta(id_estado_alerta),
    id_usuario_emisor     INT NOT NULL REFERENCES usuarios(id_usuario),
    mensaje               TEXT NOT NULL,
    cobertura_global      BOOLEAN NOT NULL DEFAULT FALSE,
    fecha_emision         TIMESTAMP NOT NULL DEFAULT NOW(),
    fecha_actualizacion   TIMESTAMP,
    fecha_cierre          TIMESTAMP
);

CREATE TABLE IF NOT EXISTS alertas_macrodistritos (
    id_alerta             INT NOT NULL REFERENCES alertas(id_alerta) ON DELETE CASCADE,
    id_macrodistrito      INT NOT NULL REFERENCES macrodistritos(id_macrodistrito),
    PRIMARY KEY (id_alerta, id_macrodistrito)
);

-- B6: Suscripciones y Notificaciones (Sprint 2 / Sprint 5)
CREATE TABLE IF NOT EXISTS suscripciones_alerta (
    id_suscripcion        SERIAL PRIMARY KEY,
    id_usuario            INT NOT NULL REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
    id_macrodistrito      INT NOT NULL REFERENCES macrodistritos(id_macrodistrito),
    activa                BOOLEAN NOT NULL DEFAULT TRUE,
    fecha_suscripcion     TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE(id_usuario, id_macrodistrito)
);

CREATE TABLE IF NOT EXISTS notificaciones (
    id_notificacion       SERIAL PRIMARY KEY,
    id_usuario            INT NOT NULL REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
    id_alerta             INT REFERENCES alertas(id_alerta),
    mensaje               VARCHAR(500) NOT NULL,
    fecha_envio           TIMESTAMP NOT NULL DEFAULT NOW(),
    leida                 BOOLEAN NOT NULL DEFAULT FALSE,
    fecha_lectura         TIMESTAMP
);

-- B7: Puntos de Evacuación (Sprint 2)
CREATE TABLE IF NOT EXISTS puntos_evac (
    id_punto_evac         SERIAL PRIMARY KEY,
    id_macrodistrito      INT NOT NULL REFERENCES macrodistritos(id_macrodistrito),
    id_estado_punto       INT NOT NULL REFERENCES estados_punto_evac(id_estado_punto),
    id_usuario_registro   INT NOT NULL REFERENCES usuarios(id_usuario),
    nombre                VARCHAR(100) NOT NULL,
    direccion             VARCHAR(255),
    latitud               DECIMAL(9,6) NOT NULL,
    longitud              DECIMAL(9,6) NOT NULL,
    capacidad_estimada    INT,
    activo                BOOLEAN NOT NULL DEFAULT TRUE,
    fecha_registro        TIMESTAMP NOT NULL DEFAULT NOW(),
    fecha_actualizacion   TIMESTAMP
);

-- B8: Prevención (Sprint 3)
CREATE TABLE IF NOT EXISTS guias_prevencion (
    id_guia               SERIAL PRIMARY KEY,
    id_fase               INT NOT NULL REFERENCES fases_prevencion(id_fase),
    id_usuario_autor      INT NOT NULL REFERENCES usuarios(id_usuario),
    titulo                VARCHAR(200) NOT NULL,
    contenido             TEXT NOT NULL,
    activa                BOOLEAN NOT NULL DEFAULT TRUE,
    fecha_creacion        TIMESTAMP NOT NULL DEFAULT NOW(),
    fecha_actualizacion   TIMESTAMP
);

-- B9: Reportes Ciudadanos (Sprint 4)
CREATE TABLE IF NOT EXISTS reportes_ciudadanos (
    id_reporte            SERIAL PRIMARY KEY,
    id_usuario            INT NOT NULL REFERENCES usuarios(id_usuario),
    id_sismo              INT REFERENCES sismos(id_sismo),
    id_macrodistrito      INT NOT NULL REFERENCES macrodistritos(id_macrodistrito),
    id_intensidad         INT NOT NULL REFERENCES intensidades_mmi(id_intensidad),
    id_estado_reporte     INT NOT NULL REFERENCES estados_reporte_ciudadano(id_estado_reporte),
    latitud               DECIMAL(9,6) NOT NULL,
    longitud              DECIMAL(9,6) NOT NULL,
    precision_gps_m       DECIMAL(8,2),
    comentario            VARCHAR(1000),
    fecha_reporte         TIMESTAMP NOT NULL DEFAULT NOW(),
    id_sismologo_revision INT REFERENCES usuarios(id_usuario),
    fecha_revision        TIMESTAMP,
    observacion_revision  VARCHAR(500)
);

-- B10: Teléfonos de Emergencia (Sprint 2)
CREATE TABLE IF NOT EXISTS telefonos_emergencia (
    id_telefono           SERIAL PRIMARY KEY,
    id_entidad            INT NOT NULL REFERENCES entidades_emergencia(id_entidad) ON DELETE CASCADE,
    numero                VARCHAR(100) NOT NULL,
    descripcion           VARCHAR(255),
    principal             BOOLEAN NOT NULL DEFAULT FALSE
);

-- B11: Auditoría Global
CREATE TABLE IF NOT EXISTS auditoria_sistema (
    id_auditoria          SERIAL PRIMARY KEY,
    id_usuario            INT REFERENCES usuarios(id_usuario),
    modulo                VARCHAR(100) NOT NULL,
    accion                VARCHAR(255) NOT NULL,
    entidad_afectada      VARCHAR(100),
    id_registro_afectado  INT,
    fecha_hora            TIMESTAMP NOT NULL DEFAULT NOW(),
    direccion_ip          VARCHAR(100)
);
