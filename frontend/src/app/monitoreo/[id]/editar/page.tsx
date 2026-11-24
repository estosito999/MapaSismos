'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import { ProtectedRoute } from '../../../../components/auth/ProtectedRoute';
import { Button } from '../../../../components/ui/Button';
import { Card } from '../../../../components/ui/Card';
import { Input } from '../../../../components/ui/Input';
import { apiFetch } from '../../../../lib/api';

interface Catalogo { idTipoMagnitud?: number; idFuente?: number; codigo?: string; nombre: string; institucion?: string }
interface Municipio { idMunicipio: number; nombre: string }
interface Macrodistrito { idMacrodistrito: number; idMunicipio: number; nombre: string }
interface Candidato { idSismo: number; fechaHoraUtc: string; magnitud: number; tipoMagnitud: string; profundidadKm: number; distanciaKm: number; diferenciaTiempoSegundos: number; motivos: string[] }
interface Evento { idSismo: number; fechaHoraUtc: string; magnitud: number; profundidadKm: number; latitud: number; longitud: number; ubicacionReferencia: string; fechaUltimaActualizacion: string; tipoMagnitud: { idTipoMagnitud: number }; fuentes: Array<{ idFuente: number; esFuentePrincipal: boolean; identificadorExterno?: string }>; municipio?: { idMunicipio: number }; macrodistrito?: { idMacrodistrito: number } }
interface FormState { fechaHoraBot: string; magnitud: string; idTipoMagnitud: string; profundidadKm: string; latitud: string; longitud: string; observacionReferencia: string; idFuente: string; identificadorExterno: string; idMunicipio: string; idMacrodistrito: string }

const selectClass = 'w-full min-h-[44px] px-4 py-2 bg-white border border-zinc-200 rounded-lg text-zinc-800 focus:outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/15 text-sm';
const utcToBotInput = (value: string) => new Date(new Date(value).getTime() - 4 * 60 * 60 * 1000).toISOString().slice(0, 19);

export default function EditarSismoPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [form, setForm] = useState<FormState | null>(null);
  const [version, setVersion] = useState('');
  const [tipos, setTipos] = useState<Catalogo[]>([]);
  const [fuentes, setFuentes] = useState<Catalogo[]>([]);
  const [municipios, setMunicipios] = useState<Municipio[]>([]);
  const [macrodistritos, setMacrodistritos] = useState<Macrodistrito[]>([]);
  const [candidatos, setCandidatos] = useState<Candidato[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    Promise.all([
      apiFetch<Evento>(`/sismos/${params.id}`),
      apiFetch<Catalogo[]>('/sismos/catalogos/tipos-magnitud'),
      apiFetch<Catalogo[]>('/sismos/catalogos/fuentes'),
      apiFetch<Municipio[]>('/sismos/catalogos/municipios'),
      apiFetch<Macrodistrito[]>('/sismos/catalogos/macrodistritos'),
    ]).then(([evento, tiposData, fuentesData, municipiosData, macrodistritosData]) => {
      if (!mounted) return;
      const principal = evento.fuentes.find((fuente) => fuente.esFuentePrincipal);
      setVersion(evento.fechaUltimaActualizacion);
      setTipos(tiposData); setFuentes(fuentesData); setMunicipios(municipiosData); setMacrodistritos(macrodistritosData);
      setForm({
        fechaHoraBot: utcToBotInput(evento.fechaHoraUtc), magnitud: String(evento.magnitud),
        idTipoMagnitud: String(evento.tipoMagnitud.idTipoMagnitud), profundidadKm: String(evento.profundidadKm),
        latitud: String(evento.latitud), longitud: String(evento.longitud),
        observacionReferencia: evento.ubicacionReferencia || '', idFuente: String(principal?.idFuente || ''),
        identificadorExterno: principal?.identificadorExterno || '',
        idMunicipio: String(evento.municipio?.idMunicipio || ''), idMacrodistrito: String(evento.macrodistrito?.idMacrodistrito || ''),
      });
    }).catch((err: Error) => { if (mounted) setError(err.message); }).finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, [params.id]);

  const fechaUtc = useMemo(() => {
    if (!form?.fechaHoraBot) return '';
    const value = new Date(`${form.fechaHoraBot}-04:00`);
    return Number.isNaN(value.getTime()) ? '' : value.toISOString();
  }, [form?.fechaHoraBot]);

  const updateField = (field: keyof FormState, value: string) => { setForm((current) => current ? { ...current, [field]: value } : current); setCandidatos([]); };
  const createPayload = () => {
    if (!form || !fechaUtc) throw new Error('La fecha y hora no es válida');
    return { fechaHoraUtc: fechaUtc, magnitud: Number(form.magnitud), idTipoMagnitud: Number(form.idTipoMagnitud), profundidadKm: Number(form.profundidadKm), latitud: Number(form.latitud), longitud: Number(form.longitud), observacionReferencia: form.observacionReferencia.trim(), idFuente: Number(form.idFuente), identificadorExterno: form.identificadorExterno.trim() || undefined, idMunicipio: form.idMunicipio ? Number(form.idMunicipio) : null, idMacrodistrito: form.idMacrodistrito ? Number(form.idMacrodistrito) : null };
  };

  const save = async (confirmarPosibleDuplicado: boolean) => {
    setSaving(true); setError(null);
    try {
      await apiFetch(`/sismos/${params.id}`, { method: 'PATCH', body: JSON.stringify({ ...createPayload(), fechaUltimaActualizacion: version, confirmarPosibleDuplicado }) });
      router.push(`/monitoreo/${params.id}`);
    } catch (err: any) { setError(err.message || 'No se pudo actualizar el evento'); }
    finally { setSaving(false); }
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault(); setSaving(true); setError(null); setCandidatos([]);
    try {
      const result = await apiFetch<{ posibleDuplicado: boolean; candidatos: Candidato[] }>(`/sismos/${params.id}/verificar-duplicados`, { method: 'POST', body: JSON.stringify(createPayload()) });
      if (result.posibleDuplicado) { setCandidatos(result.candidatos); return; }
    } catch (err: any) { setError(err.message || 'No se pudo verificar la actualización'); return; }
    finally { setSaving(false); }
    await save(false);
  };

  return <ProtectedRoute requiredRoles={['Sismólogo']}><div className="space-y-6 max-w-5xl mx-auto">
    <div className="flex justify-between items-start gap-4"><div><p className="text-xs font-semibold uppercase tracking-wider text-orange-600">Revisión técnica</p><h1 className="text-2xl font-bold text-zinc-900">Editar evento #{params.id}</h1><p className="text-sm text-zinc-500 mt-1">Cada valor modificado quedará registrado en el historial.</p></div><Link href={`/monitoreo/${params.id}`}><Button variant="outline">← Cancelar</Button></Link></div>
    {loading && <Card><div className="py-12 text-center text-zinc-500">Cargando parámetros...</div></Card>}
    {error && <div className="p-4 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-sm">{error}</div>}
    {candidatos.length > 0 && <Card title="La actualización coincide con otros eventos" subtitle="Revise las coincidencias. Puede corregir los parámetros o continuar bajo decisión explícita." className="border-amber-300 bg-amber-50/40"><div className="space-y-2">{candidatos.map((x) => <div key={x.idSismo} className="rounded-lg bg-white border border-amber-200 p-3 text-sm"><p className="font-semibold">Evento #{x.idSismo} · {x.magnitud} {x.tipoMagnitud} · {x.profundidadKm} km</p><p className="text-xs text-zinc-600 mt-1">Δ tiempo {x.diferenciaTiempoSegundos} s · distancia {x.distanciaKm} km</p><p className="text-xs text-amber-800 mt-1">{x.motivos.join(' · ')}</p></div>)}</div><div className="flex justify-end gap-3 mt-4"><Button variant="outline" onClick={() => setCandidatos([])} disabled={saving}>Corregir</Button><Button variant="accent" onClick={() => save(true)} disabled={saving}>{saving ? 'Guardando...' : 'Continuar y guardar'}</Button></div></Card>}
    {form && <form onSubmit={handleSubmit} className="space-y-6">
      <Card title="Parámetros instrumentales"><div className="grid grid-cols-1 md:grid-cols-3 gap-x-5"><div><Input label="Fecha y hora (BOT)" type="datetime-local" step="1" value={form.fechaHoraBot} onChange={(e) => updateField('fechaHoraBot', e.target.value)} required /><p className="text-xs text-zinc-500 -mt-3 mb-4">UTC: <span className="font-mono">{fechaUtc}</span></p></div><Input label="Magnitud" type="number" min="-2" max="10" step="0.01" value={form.magnitud} onChange={(e) => updateField('magnitud', e.target.value)} required /><div className="mb-4"><label className="block text-sm font-semibold mb-1.5" htmlFor="tipo">Tipo de magnitud</label><select id="tipo" className={selectClass} value={form.idTipoMagnitud} onChange={(e) => updateField('idTipoMagnitud', e.target.value)} required>{tipos.map((x) => <option key={x.idTipoMagnitud} value={x.idTipoMagnitud}>{x.codigo} — {x.nombre}</option>)}</select></div></div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-x-5"><Input label="Latitud" type="number" min="-90" max="90" step="0.000001" value={form.latitud} onChange={(e) => updateField('latitud', e.target.value)} required /><Input label="Longitud" type="number" min="-180" max="180" step="0.000001" value={form.longitud} onChange={(e) => updateField('longitud', e.target.value)} required /><Input label="Profundidad (km)" type="number" min="0" step="0.01" value={form.profundidadKm} onChange={(e) => updateField('profundidadKm', e.target.value)} required /></div><Input label="Ubicación de referencia" maxLength={255} value={form.observacionReferencia} onChange={(e) => updateField('observacionReferencia', e.target.value)} required /><div className="grid grid-cols-1 md:grid-cols-2 gap-5"><div><label className="block text-sm font-semibold mb-1.5">Municipio (opcional)</label><select className={selectClass} value={form.idMunicipio} onChange={(e) => setForm((x) => x ? { ...x, idMunicipio: e.target.value, idMacrodistrito: '' } : x)}><option value="">Fuera de catálogo / sin asignar</option>{municipios.map((x) => <option key={x.idMunicipio} value={x.idMunicipio}>{x.nombre}</option>)}</select></div><div><label className="block text-sm font-semibold mb-1.5">Macrodistrito (opcional)</label><select className={selectClass} value={form.idMacrodistrito} onChange={(e) => updateField('idMacrodistrito', e.target.value)} disabled={!form.idMunicipio}><option value="">Sin asignar</option>{macrodistritos.filter((x) => String(x.idMunicipio) === form.idMunicipio).map((x) => <option key={x.idMacrodistrito} value={x.idMacrodistrito}>{x.nombre}</option>)}</select></div></div></Card>
      <Card title="Procedencia"><div className="grid grid-cols-1 md:grid-cols-2 gap-x-5"><div className="mb-4"><label className="block text-sm font-semibold mb-1.5" htmlFor="fuente">Fuente principal</label><select id="fuente" className={selectClass} value={form.idFuente} onChange={(e) => updateField('idFuente', e.target.value)} required>{fuentes.map((x) => <option key={x.idFuente} value={x.idFuente}>{x.nombre}{x.institucion ? ` (${x.institucion})` : ''}</option>)}</select></div><Input label="Identificador externo" maxLength={255} value={form.identificadorExterno} onChange={(e) => updateField('identificadorExterno', e.target.value)} /></div></Card>
      <div className="flex justify-end gap-3"><Link href={`/monitoreo/${params.id}`}><Button type="button" variant="outline">Cancelar</Button></Link><Button type="submit" variant="accent" disabled={saving}>{saving ? 'Verificando...' : 'Validar y guardar cambios'}</Button></div>
    </form>}
  </div></ProtectedRoute>;
}
