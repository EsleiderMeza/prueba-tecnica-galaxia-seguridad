import { useEffect, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import type { ScrollViewInstance } from 'react-native';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { CatalogoApi, EquiposApi } from '../../api/endpoints';
import { ApiError, errorMessage } from '../../api/client';
import type { Categoria, EquipoInput } from '../../api/types';
import { Button, Field, FormError, Loading, Select, styles } from '../../components/ui';
import { ESTADOS_EQUIPO } from '../../utils/format';

const VACIO: EquipoInput = {
  codigo_inventario: '',
  nombre: '',
  categoria_id: null,
  marca: '',
  modelo: '',
  serial: '',
  ubicacion: '',
  responsable: '',
  estado: 'operativo',
  fecha_adquisicion: null,
  observaciones: '',
};

/** Registro (sin id) y edición (con ?id=) de equipos. */
export default function EquipoForm() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const editId = id ? Number(id) : null;
  const [form, setForm] = useState<EquipoInput>(VACIO);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const scrollRef = useRef<ScrollViewInstance>(null);
  const toTop = () => scrollRef.current?.scrollTo({ y: 0, animated: true });

  useEffect(() => {
    (async () => {
      try {
        const [cats, eq] = await Promise.all([
          CatalogoApi.categorias('equipo'),
          editId ? EquiposApi.get(editId) : Promise.resolve(null),
        ]);
        setCategorias(cats);
        if (eq) {
          setForm({
            codigo_inventario: eq.codigo_inventario,
            nombre: eq.nombre,
            categoria_id: eq.categoria?.id ?? null,
            marca: eq.marca ?? '',
            modelo: eq.modelo ?? '',
            serial: eq.serial ?? '',
            ubicacion: eq.ubicacion ?? '',
            responsable: eq.responsable ?? '',
            estado: eq.estado,
            fecha_adquisicion: eq.fecha_adquisicion,
            observaciones: eq.observaciones ?? '',
          });
        }
      } catch (e) {
        setError(errorMessage(e));
      } finally {
        setLoading(false);
      }
    })();
  }, [editId]);

  const set = <K extends keyof EquipoInput>(k: K, v: EquipoInput[K]) => setForm((f) => ({ ...f, [k]: v }));
  const err = (k: string) => errors[k]?.[0];

  const guardar = async () => {
    // Validación local mínima; la validación completa la hace Laravel (422).
    const local: Record<string, string[]> = {};
    if (!form.codigo_inventario.trim()) local.codigo_inventario = ['El código de inventario es obligatorio.'];
    if (!form.nombre.trim()) local.nombre = ['El nombre es obligatorio.'];
    if (!form.categoria_id) local.categoria_id = ['Selecciona una categoría.'];
    if (form.fecha_adquisicion && !/^\d{4}-\d{2}-\d{2}$/.test(form.fecha_adquisicion))
      local.fecha_adquisicion = ['Usa el formato AAAA-MM-DD.'];
    setErrors(local);
    setError(null);
    if (Object.keys(local).length) {
      setError('Revisa los campos marcados en rojo.');
      toTop();
      return;
    }

    setSaving(true);
    try {
      const payload = { ...form, fecha_adquisicion: form.fecha_adquisicion || null };
      const saved = editId ? await EquiposApi.update(editId, payload) : await EquiposApi.create(payload);
      if (editId) router.back();
      else router.replace(`/equipo/${saved.id}`);
    } catch (e) {
      if (e instanceof ApiError && e.status === 422) setErrors(e.errors);
      setError(errorMessage(e));
      toTop();
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Loading />;

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Stack.Screen options={{ title: editId ? 'Editar equipo' : 'Registrar equipo' }} />
      <ScrollView ref={scrollRef} style={styles.screen} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <FormError message={error} />
        <Field label="Código de inventario *" value={form.codigo_inventario} onChangeText={(v) => set('codigo_inventario', v)} autoCapitalize="characters" placeholder="GS-PC-001" error={err('codigo_inventario')} />
        <Field label="Nombre *" value={form.nombre} onChangeText={(v) => set('nombre', v)} placeholder="Portátil contabilidad" error={err('nombre')} />
        <Select
          label="Categoría *"
          value={form.categoria_id}
          options={categorias.map((c) => ({ value: c.id, label: c.nombre }))}
          onChange={(v) => set('categoria_id', v)}
          error={err('categoria_id')}
        />
        <Field label="Marca" value={form.marca} onChangeText={(v) => set('marca', v)} error={err('marca')} />
        <Field label="Modelo" value={form.modelo} onChangeText={(v) => set('modelo', v)} error={err('modelo')} />
        <Field label="Serial" value={form.serial} onChangeText={(v) => set('serial', v)} autoCapitalize="characters" error={err('serial')} />
        <Field label="Ubicación" value={form.ubicacion} onChangeText={(v) => set('ubicacion', v)} placeholder="Sede principal - Piso 2" error={err('ubicacion')} />
        <Field label="Responsable" value={form.responsable} onChangeText={(v) => set('responsable', v)} error={err('responsable')} />
        <Select label="Estado *" value={form.estado} options={ESTADOS_EQUIPO} onChange={(v) => set('estado', v)} error={err('estado')} />
        <Field
          label="Fecha de adquisición (AAAA-MM-DD)"
          value={form.fecha_adquisicion ?? ''}
          onChangeText={(v) => set('fecha_adquisicion', v || null)}
          placeholder="2025-03-15"
          keyboardType="numbers-and-punctuation"
          error={err('fecha_adquisicion')}
        />
        <Field label="Observaciones" value={form.observaciones} onChangeText={(v) => set('observaciones', v)} multiline error={err('observaciones')} />
        <Button title={editId ? 'Guardar cambios' : 'Registrar equipo'} onPress={guardar} loading={saving} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
