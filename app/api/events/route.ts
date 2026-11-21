import { getEvents, InvalidFilter, parseFilters } from '../../../lib/catalog';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const filters = parseFilters(new URL(request.url).searchParams);
    return Response.json(await getEvents(filters));
  } catch (error) {
    if (error instanceof InvalidFilter) return Response.json({ error: error.message }, { status: 400 });
    console.error('No se pudo consultar el catálogo sísmico:', error);
    return Response.json({ error: 'El catálogo no está disponible. Compruebe la conexión a la base de datos.' }, { status: 503 });
  }
}
