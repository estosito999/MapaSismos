'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { Input } from '../../../components/ui/Input';
import { ProtectedRoute } from '../../../components/auth/ProtectedRoute';
import { apiFetch, getStoredUser } from '../../../lib/api';

export default function AdminUsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<any[]>([]);
  const [solicitudes, setSolicitudes] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Modal para asignar rol directamente
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedRoleId, setSelectedRoleId] = useState<number>(2); // 2: Sismólogo
  const [acreditacion, setAcreditacion] = useState('');
  const [institucion, setInstitucion] = useState('Observatorio San Calixto');

  // Formulario de creación de cuentas por el administrador
  const [creando, setCreando] = useState(false);
  const [nuevo, setNuevo] = useState({
    nombre: '',
    apellidos: '',
    correo: '',
    ci: '',
    telefono: '',
    rol: 'Ciudadano',
    numeroAcreditacion: '',
    institucionAcreditadora: 'Observatorio San Calixto',
  });
  const setNuevoCampo = (campo: string, valor: string) =>
    setNuevo((n) => ({ ...n, [campo]: valor }));

  const loadData = async () => {
    try {
      const currentUser = getStoredUser();
      if (!currentUser || !currentUser.roles?.includes('Administrador')) {
        router.push('/');
        return;
      }

      const [usersData, rolesData, solicitudesData] = await Promise.all([
        apiFetch(`/admin/users${search ? `?search=${encodeURIComponent(search)}` : ''}`),
        apiFetch('/admin/roles'),
        apiFetch('/admin/solicitudes-sismologo'),
      ]);

      setUsers(usersData);
      setRoles(rolesData);
      setSolicitudes(solicitudesData);
    } catch (err: any) {
      setMsg({ text: err.message || 'Error cargando usuarios', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [search]);

  const handleCrearCuenta = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    try {
      const res = await apiFetch('/admin/users', {
        method: 'POST',
        body: JSON.stringify({
          ...nuevo,
          numeroAcreditacion: nuevo.rol === 'Sismólogo' ? nuevo.numeroAcreditacion : undefined,
          institucionAcreditadora:
            nuevo.rol === 'Sismólogo' ? nuevo.institucionAcreditadora : undefined,
        }),
      });
      setMsg({ text: res.mensaje, type: 'success' });
      setNuevo({
        nombre: '',
        apellidos: '',
        correo: '',
        ci: '',
        telefono: '',
        rol: 'Ciudadano',
        numeroAcreditacion: '',
        institucionAcreditadora: 'Observatorio San Calixto',
      });
      setCreando(false);
      loadData();
    } catch (err: any) {
      setMsg({ text: err.message, type: 'error' });
    }
  };

  const handleToggleStatus = async (user: any) => {
    setMsg(null);
    const newStatus = !user.estado;
    try {
      await apiFetch(`/admin/users/${user.idUsuario}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ estado: newStatus }),
      });
      setMsg({
        text: `Usuario ${user.nombre} ${newStatus ? 'activado' : 'suspendido (sesiones revocadas)'}`,
        type: 'success',
      });
      loadData();
    } catch (err: any) {
      setMsg({ text: err.message, type: 'error' });
    }
  };

  const handleAprobarSolicitud = async (idUsuario: number) => {
    setMsg(null);
    try {
      const res = await apiFetch(`/admin/solicitudes/${idUsuario}/aprobar`, {
        method: 'POST',
      });
      setMsg({ text: res.mensaje, type: 'success' });
      loadData();
    } catch (err: any) {
      setMsg({ text: err.message, type: 'error' });
    }
  };

  const handleRechazarSolicitud = async (idUsuario: number) => {
    setMsg(null);
    try {
      const res = await apiFetch(`/admin/solicitudes/${idUsuario}/rechazar`, {
        method: 'POST',
      });
      setMsg({ text: res.mensaje, type: 'success' });
      loadData();
    } catch (err: any) {
      setMsg({ text: err.message, type: 'error' });
    }
  };

  const handleAssignRoleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    setMsg(null);

    try {
      await apiFetch(`/admin/users/${selectedUser.idUsuario}/assign-role`, {
        method: 'POST',
        body: JSON.stringify({
          idRol: selectedRoleId,
          numeroAcreditacion: selectedRoleId === 2 ? acreditacion : undefined,
          institucionAcreditadora: selectedRoleId === 2 ? institucion : undefined,
        }),
      });

      setMsg({
        text: `Rol asignado correctamente a ${selectedUser.nombre} (rol exclusivo actualizado)`,
        type: 'success',
      });
      setModalOpen(false);
      setSelectedUser(null);
      setAcreditacion('');
      loadData();
    } catch (err: any) {
      setMsg({ text: err.message, type: 'error' });
    }
  };

  return (
    <ProtectedRoute requiredRoles={['Administrador']}>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900">Gobernanza de Cuentas y Seguridad</h1>
            <p className="text-sm text-zinc-500">
              Habilitación, suspensión de cuentas, validación de matrículas y rol único por usuario.
            </p>
          </div>
          <Button variant="accent" onClick={() => setCreando(!creando)}>
            {creando ? 'Ocultar formulario' : 'Crear cuenta'}
          </Button>
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

        {/* CREACIÓN DE CUENTAS POR EL ADMINISTRADOR */}
        {creando && (
          <Card
            title="Crear nueva cuenta"
            subtitle="La contraseña inicial será la CI; el usuario deberá cambiarla en su primer ingreso."
          >
            <form onSubmit={handleCrearCuenta} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  label="Nombres *"
                  value={nuevo.nombre}
                  onChange={(e) => setNuevoCampo('nombre', e.target.value)}
                  required
                />
                <Input
                  label="Apellidos *"
                  value={nuevo.apellidos}
                  onChange={(e) => setNuevoCampo('apellidos', e.target.value)}
                  required
                />
                <Input
                  label="Correo Electrónico *"
                  type="email"
                  value={nuevo.correo}
                  onChange={(e) => setNuevoCampo('correo', e.target.value)}
                  required
                />
                <Input
                  label="CI *"
                  value={nuevo.ci}
                  onChange={(e) => setNuevoCampo('ci', e.target.value)}
                  required
                />
                <Input
                  label="Teléfono"
                  value={nuevo.telefono}
                  onChange={(e) => setNuevoCampo('telefono', e.target.value)}
                />
                <div>
                  <label className="block text-sm font-semibold mb-1.5 text-zinc-900">
                    Rol *
                  </label>
                  <select
                    className="w-full min-h-[44px] px-4 py-2 bg-white border border-zinc-200 rounded-lg text-sm text-zinc-800 focus:outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/15"
                    value={nuevo.rol}
                    onChange={(e) => setNuevoCampo('rol', e.target.value)}
                  >
                    <option value="Administrador">Administrador</option>
                    <option value="Ciudadano">Ciudadano</option>
                    <option value="Sismólogo">Sismólogo</option>
                  </select>
                </div>
              </div>

              {nuevo.rol === 'Sismólogo' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <Input
                    label="Matrícula Oficial *"
                    placeholder="Ej. SIS-LP-2026-089"
                    value={nuevo.numeroAcreditacion}
                    onChange={(e) => setNuevoCampo('numeroAcreditacion', e.target.value)}
                    required
                  />
                  <Input
                    label="Institución Acreditadora *"
                    value={nuevo.institucionAcreditadora}
                    onChange={(e) => setNuevoCampo('institucionAcreditadora', e.target.value)}
                    required
                  />
                </div>
              )}

              <div className="flex gap-2 pt-1">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => setCreando(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit" variant="accent" className="flex-1">
                  Crear cuenta
                </Button>
              </div>
            </form>
          </Card>
        )}

        {/* BANDEJA DE SOLICITUDES SISMOLÓGICAS PENDIENTES */}
        <Card
          title={`Solicitudes de Acreditación Sismológica (${solicitudes.length} pendientes)`}
          subtitle="Ciudadanos que enviaron su matrícula profesional solicitando pase a rol Sismólogo"
        >
          {solicitudes.length === 0 ? (
            <p className="text-sm text-zinc-500 italic py-2">
              No hay solicitudes de acreditación pendientes de validación en este momento.
            </p>
          ) : (
            <div className="divide-y divide-zinc-200 border border-amber-200 bg-amber-50/40 rounded-lg overflow-hidden">
              {solicitudes.map((s) => (
                <div
                  key={s.idUsuario}
                  className="p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:bg-amber-50"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <strong className="text-zinc-900 font-bold text-sm">
                        {s.nombre} {s.apellidos}
                      </strong>
                      <span className="text-xs text-zinc-400">ID #{s.idUsuario}</span>
                      <Badge variant="warning">Postulación Pendiente</Badge>
                    </div>
                    <p className="text-xs text-zinc-600">
                      <strong>Correo:</strong> {s.correo} · <strong>Tel:</strong> {s.telefono || 'Sin teléfono'}
                    </p>
                    <div className="text-xs text-amber-900 bg-white/80 p-2 rounded border border-amber-200 mt-1 inline-block">
                      <strong>N° Matrícula / Acreditación:</strong>{' '}
                      <span className="font-mono font-bold text-zinc-900">{s.numeroAcreditacion}</span>{' '}
                      | <strong>Entidad:</strong> {s.institucionAcreditadora}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="accent"
                      className="text-xs py-1.5 px-3 min-h-[36px]"
                      onClick={() => handleAprobarSolicitud(s.idUsuario)}
                    >
                      ✓ Validar y Cambiar a Sismólogo
                    </Button>
                    <Button
                      variant="outline"
                      className="text-xs py-1.5 px-3 min-h-[36px] text-rose-600 border-rose-300 hover:bg-rose-50"
                      onClick={() => handleRechazarSolicitud(s.idUsuario)}
                    >
                      ✕ Rechazar
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* BARRA DE BÚSQUEDA */}
        <Card>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              className="flex-1 min-h-[44px] px-4 py-2 bg-white border border-zinc-200 rounded-lg text-sm text-zinc-800 placeholder-zinc-400 focus:outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/15"
              placeholder="Buscar por nombre, apellido o correo electrónico..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <Button variant="accent" onClick={loadData}>
              Buscar
            </Button>
          </div>
        </Card>

        {/* TABLA DE USUARIOS */}
        <Card className="p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-zinc-50 border-b border-zinc-200 text-zinc-500 font-semibold text-xs uppercase tracking-wider">
                  <th className="p-4">Usuario</th>
                  <th className="p-4">Contacto</th>
                  <th className="p-4">Rol Asignado (Único)</th>
                  <th className="p-4">Estado</th>
                  <th className="p-4 text-right">Acciones de Gobernanza</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-zinc-500">
                      Cargando usuarios...
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-zinc-500">
                      No se encontraron usuarios registrados
                    </td>
                  </tr>
                ) : (
                  users.map((u) => {
                    const rolUnico = u.roles?.[0] || 'Ciudadano';
                    return (
                      <tr key={u.idUsuario} className="hover:bg-zinc-50 transition-colors">
                        <td className="p-4">
                          <strong className="block text-zinc-900 font-bold">
                            {u.nombre} {u.apellidos}
                          </strong>
                          <span className="text-xs text-zinc-400">ID #{u.idUsuario}</span>
                          {u.perfilSismologo?.vigente && (
                            <div className="mt-1 text-[11px] text-amber-800 bg-amber-50 px-2 py-0.5 rounded inline-block border border-amber-200">
                              Matrícula Oficial: {u.perfilSismologo.numeroAcreditacion}
                            </div>
                          )}
                          {u.perfilSismologo?.estadoSolicitud === 'PENDIENTE' && (
                            <div className="mt-1 text-[11px] text-amber-900 bg-amber-100 px-2 py-0.5 rounded inline-block font-semibold">
                              ⏳ Postulación en revisión
                            </div>
                          )}
                        </td>
                        <td className="p-4 text-zinc-600">
                          <div>{u.correo}</div>
                          <div className="text-xs text-zinc-400">{u.telefono || 'Sin teléfono'}</div>
                        </td>
                        <td className="p-4">
                          <Badge
                            variant={
                              rolUnico === 'Administrador'
                                ? 'severe'
                                : rolUnico === 'Sismólogo'
                                ? 'warning'
                                : 'info'
                            }
                          >
                            {rolUnico}
                          </Badge>
                        </td>
                        <td className="p-4">
                          <span
                            className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${
                              u.estado
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-rose-100 text-rose-700'
                            }`}
                          >
                            {u.estado ? 'Habilitada' : 'Suspendida'}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {/* BOTÓN CAMBIAR ROL DIRECTO */}
                            <Button
                              variant="outline"
                              className="text-xs py-1.5 px-3 min-h-[36px]"
                              onClick={() => {
                                setSelectedUser(u);
                                const currentRolName = u.roles?.[0];
                                const rolObj = roles.find((r) => r.nombre === currentRolName);
                                setSelectedRoleId(rolObj ? rolObj.idRol : 2);
                                // Si ya tiene matrícula aceptada o registrada previamente, precargarla
                                setAcreditacion(u.perfilSismologo?.numeroAcreditacion || '');
                                setInstitucion(
                                  u.perfilSismologo?.institucionAcreditadora || 'Observatorio San Calixto',
                                );
                                setModalOpen(true);
                              }}
                            >
                              Cambiar Rol
                            </Button>

                            {/* BOTÓN SUSPENDER / ACTIVAR (RF5.03) */}
                            <button
                              onClick={() => handleToggleStatus(u)}
                              className={`text-xs font-semibold px-3 py-1.5 rounded min-h-[36px] transition-colors ${
                                u.estado
                                  ? 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
                                  : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
                              }`}
                            >
                              {u.estado ? 'Suspender' : 'Habilitar'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* MODAL: CAMBIAR ROL / MATRÍCULA SISMOLÓGICA */}
        {modalOpen && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 space-y-4">
              <h2 className="text-lg font-bold text-zinc-900">
                Cambiar Rol a: {selectedUser?.nombre} {selectedUser?.apellidos}
              </h2>
              <p className="text-xs text-zinc-500">
                Regla de Unicidad (1 a 1): Al asignar un nuevo rol, el rol anterior del usuario será reemplazado de inmediato.
              </p>

              <form onSubmit={handleAssignRoleSubmit} className="space-y-3">
                <div>
                  <label className="block text-sm font-semibold mb-1 text-zinc-900">
                    Nuevo Rol Exclusivo
                  </label>
                  <select
                    className="w-full min-h-[44px] px-4 py-2 bg-white border border-zinc-200 rounded-lg text-sm text-zinc-800 focus:outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/15"
                    value={selectedRoleId}
                    onChange={(e) => setSelectedRoleId(parseInt(e.target.value, 10))}
                  >
                    {roles.map((r) => (
                      <option key={r.idRol} value={r.idRol}>
                        {r.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                {selectedRoleId === 2 && (
                  <div className="space-y-3 p-3 bg-zinc-50 border border-zinc-200 rounded-lg">
                    {selectedUser?.perfilSismologo?.numeroAcreditacion && (
                      <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded text-xs text-emerald-800">
                        <strong>✓ Matrícula detectada:</strong>{' '}
                        {selectedUser.perfilSismologo.numeroAcreditacion} (
                        {selectedUser.perfilSismologo.estadoSolicitud === 'APROBADA'
                          ? 'Aceptada previamente'
                          : selectedUser.perfilSismologo.estadoSolicitud === 'PENDIENTE'
                          ? 'Postulada por el usuario'
                          : 'Registrada'}
                        ). Se ha precargado automáticamente.
                      </div>
                    )}
                    <Input
                      label="N° Acreditación / Matrícula Profesional *"
                      placeholder="Ej. SIS-LP-2026-089"
                      value={acreditacion}
                      onChange={(e) => setAcreditacion(e.target.value)}
                      required
                    />
                    <Input
                      label="Institución Acreditadora *"
                      placeholder="Ej. Observatorio San Calixto"
                      value={institucion}
                      onChange={(e) => setInstitucion(e.target.value)}
                      required
                    />
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      setModalOpen(false);
                      setSelectedUser(null);
                    }}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" variant="accent" className="flex-1">
                    Confirmar Rol Único
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
