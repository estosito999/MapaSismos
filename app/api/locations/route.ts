import { getLocations } from '../../../lib/catalog';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    return Response.json({ locations: await getLocations() });
  } catch (error) {
    console.error('No se pudieron consultar las ubicaciones:', error);
    return Response.json({ error: 'Las ubicaciones no están disponibles. Compruebe la conexión a la base de datos.' }, { status: 503 });
  }
}
