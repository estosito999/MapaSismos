# SismoPaz — Sistema de Información Sísmica La Paz

Plataforma web geoespacial para la consulta de sismos, visualización cartográfica, gestión de emergencias y gobernanza de cuentas en el Municipio de La Paz, Bolivia.

---

## 🚀 Scripts de Ejecución Rápida (.bat)

Para facilitar la operación y evitar comandos manuales, se han creado los siguientes scripts por lotes:

| Script (.bat) | Ubicación | Función |
|---|---|---|
| **`iniciar-todo.bat`** | Raíz `sismopaz/` | **Consola Unificada (Todo en Uno):** Corre todo en **una sola ventana**. Fase 1: Verifica/Crea BD en PostgreSQL. Fase 2: Levanta Backend (:3001). Fase 3: Levanta Frontend (:3000) y abre el navegador automáticamente. Al presionar 'Q' o cerrar la ventana, detiene todos los procesos y libera los puertos. |
| **`validar-requisitos.bat`** | Raíz `sismopaz/` | **Diagnóstico completo:** Revisa versiones de Node.js, npm, servicio de PostgreSQL, conexión, las 32 tablas de `sismopaz_db`, compilación del backend, dependencias del frontend, estado de los puertos 3000 y 3001, y genera un reporte en pantalla y en `reporte-validacion.txt`. |
| **`detener-todo.bat`** | Raíz `sismopaz/` | **Liberador de puertos:** Localiza y finaliza inmediatamente cualquier proceso escuchando en los puertos 3000 y 3001. |
| **`iniciar-db.bat`** | `database/` | Valida la conexión a PostgreSQL; si la BD no existe la crea con su esquema de 32 tablas y datos semilla. Si ya existe, confirma su estado. |
| **`resetear-db.bat`** | `database/` | **Limpieza y reseteo de BD:** Ofrece 3 opciones: (1) Vaciar tablas (TRUNCATE), (2) Vaciar + recargar datos semilla (03-seed-data.sql), o (3) Destruir y recrear toda la BD desde cero con 32 tablas. |
| **`iniciar-backend.bat`** | `backend/` | Revisa dependencias, compila TypeScript si falta y arranca el backend NestJS en el puerto 3001. |
| **`iniciar-frontend.bat`** | `frontend/` | Revisa dependencias y arranca el frontend Next.js en el puerto 3000. |

---

## 🏗️ Arquitectura Desacoplada (Client-Server REST)

- **Frontend:** Next.js 15 (App Router) + React 19 + Tailwind CSS (Puerto `3000`)
- **Backend:** NestJS 10 + TypeORM + Passport JWT + bcrypt (Puerto `3001` - Documentación en [`backend/API_REST.md`](backend/API_REST.md))
- **Base de Datos:** PostgreSQL 18 (32 tablas relacionales, Puerto `5432`, BD: `sismopaz_db`)

### Módulos incorporados en esta actualización

Esta versión integra dos módulos que trabajan sobre la misma entidad normalizada `sismos`:

- **Grupo 19 — Gestión de eventos sísmicos:** registro instrumental, detección y revisión
  de posibles duplicados, catálogo técnico, ficha detallada, edición auditada y transición
  controlada de estados `Pendiente → Revisado → Publicado`.
- **Grupo 4 — Mapa de sismos y eventos geográficos:** mapa Leaflet/OpenStreetMap,
  catálogo público paginado, filtros por municipio, macrodistrito, fecha y magnitud,
  ficha cartográfica y cálculo de distancias geodésicas.

La integración utiliza exclusivamente la API NestJS; el frontend no accede directamente
a PostgreSQL. El mapa solo expone eventos en estado `Publicado`. La asociación con municipio
y macrodistrito es opcional, por lo que también se admiten epicentros fuera de La Paz.

Archivos y rutas relevantes para los demás grupos:

- Backend: `backend/src/modules/sismos/`
- Frontend técnico: `/monitoreo`, `/monitoreo/nuevo`, `/monitoreo/duplicados`
- Frontend público: `/mapa`
- API pública: `/api/public/sismos` y `/api/public/sismos/territorios`
- Migración idempotente: `database/05-migration-mapa-sismos.sql`
- Semilla cartográfica demo: `database/06-seed-mapa-demo.sql`

Los scripts `iniciar-db.ps1`, `iniciar-todo.ps1` y `resetear-db.ps1` aplican automáticamente
la migración y la semilla. La distancia al perímetro urbano usa un área referencial circular
configurable sin PostGIS y está identificada expresamente como aproximación no oficial.

---

## 📁 Estructura del Repositorio

```
sismopaz/
├── backend/                       # API REST (NestJS)
│   ├── src/
│   │   ├── config/                # Conexión TypeORM y JWT
│   │   ├── common/                # Guards (JWT, RBAC), Decorators, Constantes
│   │   ├── modules/
│   │   │   ├── auth/              # [Sprint 5] Login, Registro, Logout con JWT
│   │   │   ├── users/             # [Sprint 5] Perfil de usuario y contraseñas
│   │   │   ├── admin/             # [Sprint 5] Gobernanza, suspensión y roles
│   │   │   ├── subscriptions/     # [Sprint 5/2] Suscripciones a macrodistritos
│   │   │   ├── sismos/            # [Sprint 1 & 7] Catálogo y registro sísmico (README incluido)
│   │   │   ├── alertas/           # [Sprint 2] Alertas y puntos de evacuación (README incluido)
│   │   │   ├── prevencion/        # [Sprint 3] Guías antes, durante y después (README incluido)
│   │   │   ├── reportes/          # [Sprint 4] Reportes ciudadanos MMI (README incluido)
│   │   │   └── estadisticas/      # [Sprint 6] Informes y gráficos (README incluido)
│   │   ├── app.module.ts
│   │   └── main.ts
│   └── package.json
│
├── frontend/                      # Web App (Next.js App Router)
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.tsx         # Layout general con Header y Sidebar
│   │   │   ├── page.tsx           # Visor cartográfico y UI Kit consolidado
│   │   │   ├── login/             # Inicio de sesión
│   │   │   ├── register/          # Registro ciudadano
│   │   │   ├── perfil/            # Gestión de perfil y suscripciones
│   │   │   └── admin/usuarios/    # Panel administrativo de usuarios y roles
│   │   ├── components/
│   │   │   ├── ui/                # UI Kit: Button, Input, Badge, Card
│   │   │   └── layout/            # Header, Sidebar
│   │   └── lib/api.ts             # Cliente HTTP desacoplado
│   └── tailwind.config.ts         # Tokens de diseño (Zinc + Naranja)
│
└── database/                      # Scripts SQL ejecutados en PostgreSQL 18
    ├── 01-create-database.sql     # Creación de sismopaz_db
    ├── 02-schema.sql              # DDL completo de 32 tablas
    └── 03-seed-data.sql           # Roles, macrodistritos paceños, catálogos
```

---

## 🚀 Puesta en Marcha

### Requisitos Previos
- **Node.js** v18+ y npm ([descargar aquí](https://nodejs.org/))
- **PostgreSQL** 16, 17 o 18 en ejecución (usuario: `postgres`, contraseña: `123456`)

### Opción A: Inicio Rápido (Recomendado)
1. Clona el repositorio:
   ```bash
   git clone https://github.com/tu-usuario/sismopaz.git
   cd sismopaz
   ```
2. Ejecuta **`validar-requisitos.bat`** → Verifica tu entorno e **instala automáticamente** todo lo que falta (dependencias npm, archivo `.env`, compilación TypeScript).
3. Ejecuta **`iniciar-todo.bat`** → Levanta BD + Backend + Frontend en una sola terminal y abre el navegador.

> **Nota:** Al clonar el repositorio, las carpetas `node_modules/`, `dist/` y `.next/` no están incluidas (están en `.gitignore`). Los scripts las generan automáticamente en el primer uso.

### Opción B: Inicio Manual
#### 1. Base de Datos (PostgreSQL)
- **Host:** `localhost:5432`
- **Base de datos:** `sismopaz_db`
- **Usuario:** `postgres`
- **Contraseña:** `123456`
- Ejecuta `database/iniciar-db.bat` para crear la BD si no existe.

#### 2. Backend (NestJS)
```bash
cd backend
copy .env.example .env   # Solo la primera vez
npm install
npx tsc -p tsconfig.build.json
node dist/main.js
```
El servidor arrancará en: **http://localhost:3001**

#### 3. Frontend (Next.js)
```bash
cd frontend
npm install
npm run dev
```
La aplicación web estará disponible en: **http://localhost:3000**

---

## 👥 Cuentas de Acceso Preconfiguradas

| Rol | Correo | Contraseña | Capacidades |
|---|---|---|---|
| **Administrador** | `admin@sismopaz.bo` | `Admin2026!` | Habilitar/suspender cuentas, asignar rol Sismólogo con matrícula técnica |
| **Sismólogo** | `sismologo@sismopaz.bo` | `Sismologo2026!` | Personal técnico acreditado (Observatorio San Calixto - SIS-LP-2026-001) |
| **Ciudadano** | `ciudadano@sismopaz.bo` | `Ciudadano2026!` | Perfil, suscripción a macrodistritos (Cotahuma, Sur) |

---

## 🎨 Normas de Diseño UI Kit (SismoPaz)
- **Tema de color:** Zinc 900 (Primario), Naranja 500 (Acento), Zinc 100 (Fondo).
- **Restricción Crítica:** El color rojo (`bg-rose-600`) está estrictamente restringido a alertas sísmicas severas, epicentros y acciones destructivas irreversibles.
- **Área táctil:** Botones e inputs con `min-h-[44px]` (RNF02).
- **Inputs:** Focus ring naranja (`focus:ring-orange-500/15`).
