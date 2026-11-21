# SismoPaz — Sprint 1

Aplicación de consulta del catálogo sísmico de La Paz con Next.js App Router, PostgreSQL y PostGIS. La interfaz permite explorar eventos por fecha, ubicación y magnitud, visualizar epicentros y consultar una ficha técnica.

## Requisitos

- Node.js 20.9 o superior y npm.
- Docker Desktop con el motor iniciado y Docker Compose.
- Conexión a Internet para descargar dependencias, imagen de base de datos y teselas de OpenStreetMap.

## Ejecutar en desarrollo

Desde esta carpeta, en PowerShell:

```powershell
Copy-Item .env.example .env.local
npm install
docker compose up -d --wait
npm run dev
```

Abra la dirección local mostrada por Next.js, normalmente http://localhost:3000. Para detener la aplicación use `Ctrl+C` y para detener la base de datos `docker compose stop`. El volumen persiste entre reinicios. El esquema y la carga de ejemplo solo se aplican al crear el volumen por primera vez.

## Datos y alcance

**Los registros incluidos son ficticios y están identificados como demostración.** No se ha conectado una fuente oficial ni existe actualización automática. Las ubicaciones son etiquetas registradas, no una clasificación espacial automática. La distancia al área urbana solo está disponible si se carga una geometría oficial validada; por separado se muestra la distancia a Plaza Murillo. Consulte [datos y límites](db/README.md) para cargar registros y geometrías, y antes de cualquier uso operativo.

El catálogo usa coordenadas WGS 84 (EPSG:4326); el mapa base utiliza Web Mercator (EPSG:3857). Las fechas de filtro representan días completos de Bolivia; las horas de los eventos se muestran en UTC y BOT. La lista está paginada en PostgreSQL, y el mapa muestra hasta 5.000 resultados con aviso cuando se supera ese límite.

## Comprobación

```powershell
npm run typecheck
npm run build
```

Las pruebas de integración requieren la base de datos y el servidor local activos; véase `tests/integration/api.test.mjs`.

El diseño toma como referencia el manual proporcionado. Los requisitos y atributos de calidad orientan el trabajo con ISO/IEC/IEEE 29148:2018 e ISO/IEC 25010:2023; esta implementación no representa una certificación de conformidad.
