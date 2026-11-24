'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import { ProtectedRoute } from '../../../components/auth/ProtectedRoute';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { Input } from '../../../components/ui/Input';
import { apiFetch } from '../../../lib/api';

interface TipoMagnitud {
  idTipoMagnitud: number;
  codigo: string;
  nombre: string;
}

interface FuenteSismica {
  idFuente: number;
  nombre: string;
  institucion?: string;
  esOficial: boolean;
}
interface Municipio { idMunicipio: number; nombre: string }
interface Macrodistrito { idMacrodistrito: number; idMunicipio: number; nombre: string }

interface CandidatoDuplicado {
  idSismo: number;
  fechaHoraUtc: string;
  magnitud: number;
  tipoMagnitud: string;
  profundidadKm: number;
  ubicacionReferencia?: string;
  fuente?: string;
  identificadorExterno?: string;
  diferenciaTiempoSegundos: number;
  distanciaKm: number;
  diferenciaMagnitud: number;
  diferenciaProfundidadKm: number;
  motivos: string[];
}

interface FormState {
  fechaHoraLocal: string;
  magnitud: string;
  idTipoMagnitud: string;
  profundidadKm: string;
  latitud: string;
  longitud: string;
  observacionReferencia: string;
  idFuente: string;
  identificadorExterno: string;
  idMunicipio: string;
  idMacrodistrito: string;
}

const initialForm: FormState = {
  fechaHoraLocal: '',
  magnitud: '',
  idTipoMagnitud: '',
  profundidadKm: '',
  latitud: '',
  longitud: '',
  observacionReferencia: '',
  idFuente: '',
  identificadorExterno: '',
  idMunicipio: '',
  idMacrodistrito: '',
};

const selectClass =
  'w-full min-h-[44px] px-4 py-2 bg-white border border-zinc-200 rounded-lg text-zinc-800 focus:outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/15 transition-all text-sm';

export default function NuevoSismoPage() {
  const [form, setForm] = useState<FormState>(initialForm);
  const [tipos, setTipos] = useState<TipoMagnitud[]>([]);
  const [fuentes, setFuentes] = useState<FuenteSismica[]>([]);
  const [municipios, setMunicipios] = useState<Municipio[]>([]);
  const [macrodistritos, setMacrodistritos] = useState<Macrodistrito[]>([]);
  const [loadingCatalogos, setLoadingCatalogos] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{ idSismo: number; estado: string } | null>(null);
  const [candidatos, setCandidatos] = useState<CandidatoDuplicado[]>([]);

  useEffect(() => {
    let mounted = true;

    Promise.all([
      apiFetch<TipoMagnitud[]>('/sismos/catalogos/tipos-magnitud'),
      apiFetch<FuenteSismica[]>('/sismos/catalogos/fuentes'),
      apiFetch<Municipio[]>('/sismos/catalogos/municipios'),
      apiFetch<Macrodistrito[]>('/sismos/catalogos/macrodistritos'),
    ])
      .then(([tiposData, fuentesData, municipiosData, macrodistritosData]) => {
        if (!mounted) return;
        setTipos(tiposData);
        setFuentes(fuentesData);
        setMunicipios(municipiosData);
        setMacrodistritos(macrodistritosData);
      })
      .catch((err: Error) => {
        if (mounted) setError(err.message || 'No se pudieron cargar los catálogos técnicos');
      })
      .finally(() => {
        if (mounted) setLoadingCatalogos(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const fechaUtc = useMemo(() => {
    if (!form.fechaHoraLocal) return '';
    const fecha = new Date(form.fechaHoraLocal);
    return Number.isNaN(fecha.getTime()) ? '' : fecha.toISOString();
  }, [form.fechaHoraLocal]);

  const updateField = (field: keyof FormState, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
    setCandidatos([]);
  };

  const buildPayload = (confirmarPosibleDuplicado = false) => {
    if (!fechaUtc) {
      throw new Error('La fecha y hora del evento no es válida');
    }

    return {
      fechaHoraUtc: fechaUtc,
      magnitud: Number(form.magnitud),
      idTipoMagnitud: Number(form.idTipoMagnitud),
      profundidadKm: Number(form.profundidadKm),
      latitud: Number(form.latitud),
      longitud: Number(form.longitud),
      observacionReferencia: form.observacionReferencia.trim(),
      idFuente: Number(form.idFuente),
      identificadorExterno: form.identificadorExterno.trim() || undefined,
      idMunicipio: form.idMunicipio ? Number(form.idMunicipio) : undefined,
      idMacrodistrito: form.idMacrodistrito ? Number(form.idMacrodistrito) : undefined,
      confirmarPosibleDuplicado,
    };
  };

  const registerEvent = async (confirmarPosibleDuplicado: boolean) => {
    setSaving(true);
    try {
      const data = await apiFetch<{
        evento: { idSismo: number; estado: { nombre: string } };
      }>('/sismos', {
        method: 'POST',
        body: JSON.stringify(buildPayload(confirmarPosibleDuplicado)),
      });

      setSuccess({
        idSismo: data.evento.idSismo,
        estado: data.evento.estado.nombre,
      });
      setForm(initialForm);
      setCandidatos([]);
    } catch (err: any) {
      setError(err.message || 'No se pudo registrar el evento sísmico');
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    setCandidatos([]);
    setSaving(true);

    try {
      const resultado = await apiFetch<{
        posibleDuplicado: boolean;
        candidatos: CandidatoDuplicado[];
      }>('/sismos/verificar-duplicados', {
        method: 'POST',
        body: JSON.stringify(buildPayload()),
      });

      if (resultado.posibleDuplicado) {
        setCandidatos(resultado.candidatos);
        return;
      }
    } catch (err: any) {
      setError(err.message || 'No se pudo verificar la duplicidad del evento');
      return;
    } finally {
      setSaving(false);
    }

    await registerEvent(false);
  };

  const handleConfirmDuplicate = async () => {
    setError(null);
    await registerEvent(true);
  };

  return (
    <ProtectedRoute requiredRoles={['Sismólogo']}>
      <div className="space-y-6 max-w-5xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-orange-600 mb-1">Registro instrumental</p>
            <h1 className="text-2xl font-bold text-zinc-900">Registrar nuevo evento sísmico</h1>
            <p className="text-sm text-zinc-500 mt-1">
              Parámetros técnicos en WGS 84. La fecha se almacenará en UTC.
            </p>
          </div>
          <Link href="/monitoreo">
            <Button variant="outline">← Volver al monitoreo</Button>
          </Link>
        </div>

        {error && (
          <div className="p-4 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-sm">
            {error}
          </div>
        )}

        {success && (
          <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm">
            Evento <strong>#{success.idSismo}</strong> registrado correctamente con estado{' '}
            <strong>{success.estado}</strong>.
          </div>
        )}

        {candidatos.length > 0 && (
          <Card
            title="Posible evento duplicado"
            subtitle="Revise las coincidencias antes de decidir. El sistema no fusionará ni eliminará eventos automáticamente."
            className="border-amber-300 bg-amber-50/40"
          >
            <div className="space-y-3">
              {candidatos.map((candidato) => (
                <div key={candidato.idSismo} className="rounded-lg border border-amber-200 bg-white p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div>
                      <p className="font-semibold text-zinc-900">
                        Evento #{candidato.idSismo} · {candidato.magnitud} {candidato.tipoMagnitud}
                      </p>
                      <p className="text-xs text-zinc-600 mt-1">
                        {new Date(candidato.fechaHoraUtc).toLocaleString('es-BO', { timeZone: 'America/La_Paz' })} BOT
                        {' · '}{candidato.profundidadKm} km
                        {candidato.fuente ? ` · ${candidato.fuente}` : ''}
                      </p>
                      {candidato.ubicacionReferencia && (
                        <p className="text-xs text-zinc-500 mt-1">{candidato.ubicacionReferencia}</p>
                      )}
                    </div>
                    <div className="text-xs text-zinc-600 sm:text-right">
                      <p>Δ tiempo: {candidato.diferenciaTiempoSegundos} s</p>
                      <p>Distancia: {candidato.distanciaKm} km</p>
                      <p>Δ magnitud: {candidato.diferenciaMagnitud}</p>
                      <p>Δ profundidad: {candidato.diferenciaProfundidadKm} km</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {candidato.motivos.map((motivo) => (
                      <span key={motivo} className="rounded-full bg-amber-100 px-2 py-1 text-[11px] font-medium text-amber-800">
                        {motivo}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-5 flex flex-col-reverse sm:flex-row justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => setCandidatos([])} disabled={saving}>
                Cancelar y corregir
              </Button>
              <Button type="button" variant="accent" onClick={handleConfirmDuplicate} disabled={saving}>
                {saving ? 'Registrando...' : 'Continuar y registrar de todas formas'}
              </Button>
            </div>
          </Card>
        )}

        <form onSubmit={handleSubmit}>
          <div className="space-y-6">
            <Card
              title="Origen y magnitud"
              subtitle="Ingrese la hora observada en Bolivia; el sistema muestra y envía su equivalente UTC."
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-x-5">
                <div>
                  <Input
                    label="Fecha y hora del evento (BOT)"
                    type="datetime-local"
                    step="1"
                    value={form.fechaHoraLocal}
                    onChange={(e) => updateField('fechaHoraLocal', e.target.value)}
                    required
                  />
                  <p className="text-xs text-zinc-500 -mt-3 mb-4">
                    UTC: <span className="font-mono">{fechaUtc || 'Pendiente de ingresar'}</span>
                  </p>
                </div>
                <Input
                  label="Magnitud"
                  type="number"
                  min="-2"
                  max="10"
                  step="0.01"
                  placeholder="Ej. 4.20"
                  value={form.magnitud}
                  onChange={(e) => updateField('magnitud', e.target.value)}
                  required
                />
                <div className="mb-4">
                  <label htmlFor="idTipoMagnitud" className="block text-sm font-semibold mb-1.5 text-zinc-900">
                    Tipo de magnitud
                  </label>
                  <select
                    id="idTipoMagnitud"
                    className={selectClass}
                    value={form.idTipoMagnitud}
                    onChange={(e) => updateField('idTipoMagnitud', e.target.value)}
                    disabled={loadingCatalogos}
                    required
                  >
                    <option value="">Seleccione un tipo</option>
                    {tipos.map((tipo) => (
                      <option key={tipo.idTipoMagnitud} value={tipo.idTipoMagnitud}>
                        {tipo.codigo} — {tipo.nombre}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </Card>

            <Card
              title="Localización del epicentro"
              subtitle="Coordenadas geográficas WGS 84 (EPSG:4326) y profundidad focal en kilómetros."
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-x-5">
                <Input
                  label="Latitud"
                  type="number"
                  min="-90"
                  max="90"
                  step="0.000001"
                  placeholder="Ej. -16.495000"
                  value={form.latitud}
                  onChange={(e) => updateField('latitud', e.target.value)}
                  required
                />
                <Input
                  label="Longitud"
                  type="number"
                  min="-180"
                  max="180"
                  step="0.000001"
                  placeholder="Ej. -68.133600"
                  value={form.longitud}
                  onChange={(e) => updateField('longitud', e.target.value)}
                  required
                />
                <Input
                  label="Profundidad focal (km)"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="Ej. 35.00"
                  value={form.profundidadKm}
                  onChange={(e) => updateField('profundidadKm', e.target.value)}
                  required
                />
              </div>
              <Input
                label="Ubicación de referencia"
                maxLength={255}
                placeholder="Ej. 25 km al noreste de la ciudad de La Paz"
                value={form.observacionReferencia}
                onChange={(e) => updateField('observacionReferencia', e.target.value)}
                required
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div><label className="block text-sm font-semibold mb-1.5">Municipio (opcional)</label><select className={selectClass} value={form.idMunicipio} onChange={(e) => setForm((x) => ({ ...x, idMunicipio: e.target.value, idMacrodistrito: '' }))}><option value="">Fuera de catálogo / sin asignar</option>{municipios.map((x) => <option key={x.idMunicipio} value={x.idMunicipio}>{x.nombre}</option>)}</select></div>
                <div><label className="block text-sm font-semibold mb-1.5">Macrodistrito (opcional)</label><select className={selectClass} value={form.idMacrodistrito} onChange={(e) => updateField('idMacrodistrito', e.target.value)} disabled={!form.idMunicipio}><option value="">Sin asignar</option>{macrodistritos.filter((x) => String(x.idMunicipio) === form.idMunicipio).map((x) => <option key={x.idMacrodistrito} value={x.idMacrodistrito}>{x.nombre}</option>)}</select></div>
              </div>
            </Card>

            <Card
              title="Procedencia"
              subtitle="Identifique la institución o red que proporcionó los datos instrumentales."
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-5">
                <div className="mb-4">
                  <label htmlFor="idFuente" className="block text-sm font-semibold mb-1.5 text-zinc-900">
                    Fuente sísmica
                  </label>
                  <select
                    id="idFuente"
                    className={selectClass}
                    value={form.idFuente}
                    onChange={(e) => updateField('idFuente', e.target.value)}
                    disabled={loadingCatalogos}
                    required
                  >
                    <option value="">Seleccione una fuente activa</option>
                    {fuentes.map((fuente) => (
                      <option key={fuente.idFuente} value={fuente.idFuente}>
                        {fuente.nombre}{fuente.institucion ? ` (${fuente.institucion})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
                <Input
                  label="Identificador externo (opcional)"
                  maxLength={255}
                  placeholder="Ej. us7000abcd"
                  value={form.identificadorExterno}
                  onChange={(e) => updateField('identificadorExterno', e.target.value)}
                />
              </div>
            </Card>

            <div className="flex flex-col-reverse sm:flex-row justify-end gap-3">
              <Link href="/monitoreo">
                <Button type="button" variant="outline" className="w-full sm:w-auto">
                  Cancelar
                </Button>
              </Link>
              <Button
                type="submit"
                variant="accent"
                disabled={saving || loadingCatalogos}
                className="w-full sm:w-auto"
              >
                {saving ? 'Verificando evento...' : 'Verificar y registrar evento'}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </ProtectedRoute>
  );
}
