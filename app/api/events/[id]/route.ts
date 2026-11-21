import { getEvent } from '../../../../lib/catalog';

export const dynamic = 'force-dynamic';

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const event = await getEvent(id);
    if (!event) return Response.json({ error: 'Evento no encontrado.' }, { status: 404 });
    return Response.json({ event });
  } catch (error) {
    console.error('No se pudo consultar el evento:', error);
    return Response.json({ error: 'El catálogo no está disponible. Compruebe la conexión a la base de datos.' }, { status: 503 });
  }
}
