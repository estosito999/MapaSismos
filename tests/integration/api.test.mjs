// Ejecutar con el servidor iniciado: node --test tests/integration/api.test.mjs
// Requiere db/seed.sql. Para probar con la base desconectada: TEST_DATABASE_UNAVAILABLE=1.
import test from 'node:test';
import assert from 'node:assert/strict';

const base = process.env.TEST_BASE_URL || 'http://localhost:3000';
const seeded = process.env.TEST_DATABASE_UNAVAILABLE !== '1';

async function get(path) {
  const response = await fetch(new URL(path, base));
  const body = await response.json();
  return { response, body };
}

test('rechaza parámetros inválidos antes de consultar la base de datos', async () => {
  const invalidQueries = [
    'page=0', 'page=1.5', 'pageSize=0', 'pageSize=101',
    'startDate=2024-02-30', 'startDate=2024-10-19&endDate=2024-10-18',
    'minMagnitude=-1', 'maxMagnitude=11', 'minMagnitude=5&maxMagnitude=4',
    'minMagnitude=abc',
  ];
  for (const query of invalidQueries) {
    const { response } = await get(`/api/events?${query}`);
    assert.equal(response.status, 400, query);
  }
});

test('informa la indisponibilidad de la base de datos', { skip: seeded }, async () => {
  for (const path of ['/api/events', '/api/events/demo-001', '/api/locations']) {
    const { response } = await get(path);
    assert.equal(response.status, 503, path);
  }
});

test('paginar ordena el catálogo y conserva el conjunto filtrado del mapa', { skip: !seeded }, async () => {
  const first = await get('/api/events?page=1&pageSize=1');
  const second = await get('/api/events?page=2&pageSize=1');
  assert.equal(first.response.status, 200);
  assert.equal(second.response.status, 200);
  assert.equal(first.body.events.length, 1);
  assert.equal(second.body.events.length, 1);
  assert.notEqual(first.body.events[0].id, second.body.events[0].id);
  assert.ok(Date.parse(first.body.events[0].occurredAt) >= Date.parse(second.body.events[0].occurredAt));
  assert.ok(first.body.pagination.total >= 12);
  assert.ok(first.body.mapEvents.some(event => event.id === second.body.events[0].id));
  assert.equal(first.body.recentWindow.hours, 48);
});

test('enumera municipios disponibles para los filtros', { skip: !seeded }, async () => {
  const { response, body } = await get('/api/locations');
  assert.equal(response.status, 200);
  assert.ok(body.locations.some(location => location.id === 'el-alto' && location.type === 'municipio'));
});

test('combina municipio, fecha local boliviana y magnitudes en mapa y lista', { skip: !seeded }, async () => {
  // demo-002 ocurrió el 9 de septiembre UTC, pero el 8 de septiembre en Bolivia.
  const { response, body } = await get('/api/events?location=el-alto&startDate=2024-09-08&endDate=2024-09-08&minMagnitude=3.6&maxMagnitude=3.6');
  assert.equal(response.status, 200);
  assert.ok(body.events.some(event => event.id === 'demo-002'));
  assert.ok(body.mapEvents.some(event => event.id === 'demo-002'));
  for (const event of body.mapEvents) {
    assert.equal(event.location.id, 'el-alto');
    assert.equal(event.magnitude, 3.6);
    const localDate = new Date(Date.parse(event.occurredAt) - 4 * 60 * 60 * 1000).toISOString().slice(0, 10);
    assert.equal(localDate, '2024-09-08');
  }
});

test('devuelve detalle geográfico y 404 para identificador inexistente', { skip: !seeded }, async () => {
  const { response, body } = await get('/api/events/demo-001');
  assert.equal(response.status, 200);
  assert.equal(body.event.magnitudeType, 'Mw');
  assert.equal(body.event.latitude, -16.48);
  assert.equal(body.event.longitude, -68.12);
  assert.equal(body.event.depthKm, 18.4);
  assert.ok(Number.isFinite(body.event.epicentralDistanceKm));
  assert.ok(body.event.epicentralDistanceKm >= 0);
  assert.equal((await get('/api/events/evento-inexistente')).response.status, 404);
});

test('catálogo vacío conserva estructura informativa', { skip: !seeded }, async () => {
  const { response, body } = await get('/api/events?startDate=1900-01-01&endDate=1900-01-01');
  assert.equal(response.status, 200);
  assert.deepEqual(body.events, []);
  assert.deepEqual(body.mapEvents, []);
  assert.equal(body.pagination.total, 0);
  assert.equal(body.recentWindow.hours, 48);
});
