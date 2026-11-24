'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { ProtectedRoute } from '../../components/auth/ProtectedRoute';
import { apiFetch, getStoredToken, getStoredUser, setStoredUser } from '../../lib/api';

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [macrodistritos, setMacrodistritos] = useState<any[]>([]);
  const [selectedMacro, setSelectedMacro] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [editando, setEditando] = useState(false);

  // Form states
  const [nombre, setNombre] = useState('');
  const [apellidos, setApellidos] = useState('');
  const [correo, setCorreo] = useState('');
  const [ci, setCi] = useState('');
  const [telefono, setTelefono] = useState('');

  // Password state
  const [passActual, setPassActual] = useState('');
  const [passNuevo, setPassNuevo] = useState('');
  const [passRepetir, setPassRepetir] = useState('');

  // Sismólogo request state
  const [acreditacionNum, setAcreditacionNum] = useState('');
  const [acreditacionInst, setAcreditacionInst] = useState('Observatorio San Calixto');
  const [solicitando, setSolicitando] = useState(false);

  const loadData = async () => {
    try {
      const token = getStoredToken();
      if (!token) {
        router.push('/login');
        return;
      }

      const [pData, mData] = await Promise.all([
        apiFetch('/users/profile'),
        apiFetch('/macrodistritos'),
      ]);

      setProfile(pData);
      setNombre(pData.nombre);
      setApellidos(pData.apellidos);
      setCorreo(pData.correo);
      setCi(pData.ci || '');
      setTelefono(pData.telefono || '');
      setMacrodistritos(mData);
    } catch (err: any) {
      setMsg({ text: err.message || 'Error cargando perfil', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    try {
      await apiFetch('/users/profile', {
        method: 'PATCH',
        body: JSON.stringify({ nombre, apellidos, correo, ci: ci || null, telefono }),
      });
      setMsg({ text: 'Perfil actualizado exitosamente', type: 'success' });
      setStoredUser({ ...getStoredUser(), nombre, apellidos, correo, telefono });
      setEditando(false);
      loadData();
    } catch (err: any) {
      setMsg({ text: err.message, type: 'error' });
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);

    if (passNuevo !== passRepetir) {
      setMsg({ text: 'La nueva contraseña y la confirmación no coinciden', type: 'error' });
      return;
    }

    try {
      await apiFetch('/users/password', {
        method: 'PATCH',
        body: JSON.stringify({
          passwordActual: passActual,
          passwordNuevo: passNuevo,
          repetirPassword: passRepetir,
        }),
      });
      setMsg({ text: 'Contraseña cambiada exitosamente', type: 'success' });
      setPassActual('');
      setPassNuevo('');
      setPassRepetir('');
    } catch (err: any) {
      setMsg({ text: err.message, type: 'error' });
    }
  };

  const handleSolicitarSismologo = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    setSolicitando(true);
    try {
      const res = await apiFetch('/users/solicitar-sismologo', {
        method: 'POST',
        body: JSON.stringify({
          numeroAcreditacion: acreditacionNum,
          institucionAcreditadora: acreditacionInst,
        }),
      });
      setMsg({ text: res.mensaje, type: 'success' });
      setAcreditacionNum('');
      loadData();
    } catch (err: any) {
      setMsg({ text: err.message, type: 'error' });
    } finally {
      setSolicitando(false);
    }
  };

  const handleAddSubscription = async () => {
    if (!selectedMacro) return;
    setMsg(null);
    try {
      await apiFetch('/users/subscriptions', {
        method: 'POST',
        body: JSON.stringify({ idMacrodistrito: parseInt(selectedMacro, 10) }),
      });
      setSelectedMacro('');
      loadData();
      setMsg({ text: 'Suscripción zonal agregada', type: 'success' });
    } catch (err: any) {
      setMsg({ text: err.message, type: 'error' });
    }
  };

  const handleRemoveSubscription = async (id: number) => {
    setMsg(null);
    try {
      await apiFetch(`/users/subscriptions/${id}`, { method: 'DELETE' });
      loadData();
      setMsg({ text: 'Suscripción eliminada', type: 'success' });
    } catch (err: any) {
      setMsg({ text: err.message, type: 'error' });
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-zinc-500">Cargando datos del perfil...</div>;
  }

  const isSismologo = profile?.roles?.includes('Sismólogo');
  const isAdmin = profile?.roles?.includes('Administrador');
  const isCiudadano = !isSismologo && !isAdmin;
  const solicitudPendiente = profile?.perfilSismologo?.estadoSolicitud === 'PENDIENTE';

  return (
    <ProtectedRoute>
      <div className="space-y-6 max-w-4xl mx-auto">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Mi Perfil y Preferencias</h1>
          <p className="text-sm text-zinc-500">
            Gestión de datos personales, credenciales y suscripciones a macrodistritos.
          </p>
        </div>

        {msg && (
          <div
            className={`p-3 rounded-lg text-sm ${
              msg.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : 'bg-rose-50 text-rose-700 border border-rose-200'
            }`}
          >
            {msg.text}
          </div>
        )}

        {/* TARJETA DE ESTADO Y ROL ÚNICO */}
        <Card>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-lg font-bold text-zinc-900">
                {profile?.nombre} {profile?.apellidos}
              </h2>
              <p className="text-sm text-zinc-500">{profile?.correo}</p>
              <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-xs text-zinc-500">
                <span>
                  <strong className="text-zinc-700">CI:</strong> {profile?.ci || 'No registrada'}
                </span>
                <span>
                  <strong className="text-zinc-700">Fecha de creación:</strong>{' '}
                  {profile?.fechaCreacion || '—'}
                </span>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 items-center">
              <Badge
                variant={
                  isAdmin ? 'severe' : isSismologo ? 'warning' : 'info'
                }
              >
                {profile?.roles?.[0] || 'Ciudadano'}
              </Badge>
              <span
                className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
                  profile?.estado ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-700'
                }`}
              >
                {profile?.estado ? 'Cuenta Activa' : 'Cuenta Suspendida'}
              </span>
            </div>
          </div>

          {/* CREDENCIAL OFICIAL SISMÓLOGO VIGENTE */}
          {isSismologo && profile?.perfilSismologo && (
            <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900 space-y-1">
              <div className="flex items-center justify-between">
                <strong className="text-sm font-bold text-amber-950">
                  Matrícula Sismológica Oficial Acreditada
                </strong>
                <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                  VIGENTE
                </span>
              </div>
              <p>
                <strong>N° de Matrícula:</strong> {profile.perfilSismologo.numeroAcreditacion}
              </p>
              <p>
                <strong>Institución:</strong> {profile.perfilSismologo.institucionAcreditadora}
              </p>
              {profile.perfilSismologo.fechaVerificacion && (
                <p>
                  <strong>Fecha de Verificación:</strong> {profile.perfilSismologo.fechaVerificacion}
                </p>
              )}
            </div>
          )}
        </Card>

        {/* SECCIÓN SOLICITUD A SISMÓLOGO (SOLO CIUDADANOS) */}
        {isCiudadano && (
          <Card
            title="Acreditación Profesional Sismológica"
            subtitle="Si eres profesional técnico de la red geofísica, solicita el cambio de tu cuenta a rol Sismólogo."
          >
            {solicitudPendiente ? (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg space-y-2">
                <div className="flex items-center gap-2 text-amber-900 font-bold text-sm">
                  <span>⏳</span> Solicitud en Proceso de Verificación
                </div>
                <p className="text-xs text-amber-800">
                  Has enviado tu postulación con la matrícula{' '}
                  <strong className="font-mono text-zinc-900">
                    {profile.perfilSismologo.numeroAcreditacion}
                  </strong>{' '}
                  ({profile.perfilSismologo.institucionAcreditadora}).
                </p>
                <p className="text-xs text-amber-700">
                  El Administrador del sistema verificará la autenticidad con la entidad oficial. Cuando sea aprobada, tu rol cambiará automáticamente a <strong>Sismólogo</strong>.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSolicitarSismologo} className="space-y-3">
                {profile?.perfilSismologo?.estadoSolicitud === 'RECHAZADA' && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700">
                    Tu postulación anterior fue rechazada por inconsistencia en la matrícula. Puedes corregirla y volver a enviar.
                  </div>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input
                    label="N° Acreditación / Matrícula Profesional *"
                    placeholder="Ej. SIS-LP-2026-089"
                    value={acreditacionNum}
                    onChange={(e) => setAcreditacionNum(e.target.value)}
                    required
                  />
                  <Input
                    label="Institución Acreditadora *"
                    placeholder="Ej. Observatorio San Calixto"
                    value={acreditacionInst}
                    onChange={(e) => setAcreditacionInst(e.target.value)}
                    required
                  />
                </div>
                <div className="pt-1">
                  <Button
                    type="submit"
                    variant="accent"
                    className="text-xs"
                    disabled={solicitando || !acreditacionNum}
                  >
                    {solicitando ? 'Enviando postulación...' : 'Enviar Solicitud a Validación'}
                  </Button>
                </div>
              </form>
            )}
          </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* EDITAR DATOS PERSONALES */}
          <Card
            title="Datos Personales"
            subtitle={editando ? 'Edita tus datos y guarda los cambios' : 'Tus datos personales registrados'}
          >
            <form onSubmit={handleUpdateProfile} className="space-y-2">
              <Input
                label="Nombres"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                disabled={!editando}
                required
              />
              <Input
                label="Apellidos"
                value={apellidos}
                onChange={(e) => setApellidos(e.target.value)}
                disabled={!editando}
                required
              />
              <Input
                label="Correo Electrónico"
                type="email"
                value={correo}
                onChange={(e) => setCorreo(e.target.value)}
                disabled={!editando}
                required
              />
              <Input
                label="CI"
                value={ci}
                onChange={(e) => setCi(e.target.value)}
                disabled={!editando}
              />
              <Input
                label="Teléfono"
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
                disabled={!editando}
              />
              <div className="pt-2">
                {editando ? (
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1"
                      onClick={() => {
                        setNombre(profile?.nombre || '');
                        setApellidos(profile?.apellidos || '');
                        setCorreo(profile?.correo || '');
                        setCi(profile?.ci || '');
                        setTelefono(profile?.telefono || '');
                        setEditando(false);
                      }}
                    >
                      Cancelar
                    </Button>
                    <Button type="submit" variant="accent" className="flex-1">
                      Guardar Cambios
                    </Button>
                  </div>
                ) : (
                  <Button
                    type="button"
                    variant="accent"
                    className="w-full"
                    onClick={() => setEditando(true)}
                  >
                    Actualizar datos
                  </Button>
                )}
              </div>
            </form>
          </Card>

          {/* CAMBIO DE CONTRASEÑA */}
          <Card title="Seguridad de Acceso" subtitle="Actualiza tu contraseña (RNF03)">
            <form onSubmit={handleChangePassword} className="space-y-2">
              <Input
                label="Contraseña Actual"
                type="password"
                placeholder="••••••••"
                value={passActual}
                onChange={(e) => setPassActual(e.target.value)}
                required
              />
              <Input
                label="Nueva Contraseña"
                type="password"
                placeholder="Mínimo 8 car., 1 mayús., 1 núm., 1 símb."
                value={passNuevo}
                onChange={(e) => setPassNuevo(e.target.value)}
                required
              />
              <Input
                label="Repetir Nueva Contraseña"
                type="password"
                placeholder="Vuelve a escribir la nueva contraseña"
                value={passRepetir}
                onChange={(e) => setPassRepetir(e.target.value)}
                required
              />
              <div className="pt-2">
                <Button type="submit" variant="primary" className="w-full">
                  Actualizar Contraseña
                </Button>
              </div>
            </form>
          </Card>
        </div>

        {/* GESTIÓN DE SUSCRIPCIONES A MACRODISTRITOS (RF5.02 / RF2.03) */}
        <Card
          title="Suscripciones Zonales de Alerta"
          subtitle="Selecciona los macrodistritos del Municipio de La Paz de los cuales deseas recibir alertas"
        >
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <select
              className="flex-1 min-h-[44px] px-4 py-2 bg-white border border-zinc-200 rounded-lg text-zinc-800 text-sm focus:outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/15"
              value={selectedMacro}
              onChange={(e) => setSelectedMacro(e.target.value)}
            >
              <option value="">Selecciona un macrodistrito para suscribirte...</option>
              {macrodistritos.map((m) => (
                <option key={m.idMacrodistrito} value={m.idMacrodistrito}>
                  {m.nombre}
                </option>
              ))}
            </select>
            <Button
              type="button"
              variant="accent"
              onClick={handleAddSubscription}
              disabled={!selectedMacro}
            >
              Agregar Zona
            </Button>
          </div>

          {profile?.suscripciones && profile.suscripciones.length > 0 ? (
            <div className="divide-y divide-zinc-200 border border-zinc-200 rounded-lg overflow-hidden">
              {profile.suscripciones.map((s: any) => (
                <div
                  key={s.idSuscripcion}
                  className="p-3.5 flex justify-between items-center hover:bg-zinc-50"
                >
                  <div>
                    <strong className="text-sm text-zinc-900 block">
                      Macrodistrito {s.macrodistrito || `ID #${s.idMacrodistrito}`}
                    </strong>
                    <span className="text-xs text-zinc-500">
                      Suscrito el {new Date(s.fechaSuscripcion).toLocaleDateString()}
                    </span>
                  </div>
                  <button
                    onClick={() => handleRemoveSubscription(s.idSuscripcion)}
                    className="text-xs font-semibold text-rose-600 hover:text-rose-800 px-3 py-1.5 rounded hover:bg-rose-50"
                  >
                    Eliminar
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-zinc-500 italic py-2">
              No tienes macrodistritos suscritos actualmente. Selecciona uno arriba para recibir notificaciones zonales.
            </p>
          )}
        </Card>
      </div>
    </ProtectedRoute>
  );
}
