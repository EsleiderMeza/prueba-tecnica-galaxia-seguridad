import { useEffect, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Text } from 'react-native';
import type { ScrollViewInstance } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { CatalogoApi, EquiposApi, SolicitudesApi } from '../../api/endpoints';
import { ApiError, errorMessage } from '../../api/client';
import type { Categoria, Equipo, SolicitudInput } from '../../api/types';
import { Button, Field, FormError, Loading, Select, styles } from '../../components/ui';
import { PRIORIDADES } from '../../utils/format';

export default function NuevaSolicitud() {
  const params = useLocalSearchParams<{ equipo_id?: string }>();
  const [form, setForm] = useState<SolicitudInput>({
    equipo_id: params.equipo_id ? Number(params.equipo_id) : null,
    categoria_id: null,
    titulo: '',
    descripcion: '',
    prioridad: 'media',
  });
  const [equipos, setEquipos] = useState<Equipo[]>([]);
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
        // Se piden hasta 100 equipos para el selector (suficiente para la demo).
        const [eqs, cats] = await Promise.all([
          EquiposApi.list({ page: 1, per_page: 100 }),
          CatalogoApi.categorias('solicitud'),
        ]);
        setEquipos(eqs.data);
        setCategorias(cats);
      } catch (e) {
        setError(errorMessage(e));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const set = <K extends keyof SolicitudInput>(k: K, v: SolicitudInput[K]) => setForm((f) => ({ ...f, [k]: v }));
  const err = (k: string) => errors[k]?.[0];

  const enviar = async () => {
    const local: Record<string, string[]> = {};
    if (!form.equipo_id) local.equipo_id = ['Selecciona el equipo afectado.'];
    if (!form.categoria_id) local.categoria_id = ['Selecciona el tipo de problema.'];
    if (form.titulo.trim().length < 5) local.titulo = ['Describe el problema en al menos 5 caracteres.'];
    if (form.descripcion.trim().length < 10) local.descripcion = ['Agrega más detalle (mínimo 10 caracteres).'];
    setErrors(local);
    setError(null);
    if (Object.keys(local).length) {
      setError('Revisa los campos marcados en rojo.');
      toTop();
      return;
    }

    setSaving(true);
    try {
      const s = await SolicitudesApi.create({ ...form, titulo: form.titulo.trim(), descripcion: form.descripcion.trim() });
      router.replace(`/solicitud/${s.id}`);
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
      <ScrollView ref={scrollRef} style={styles.screen} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={[styles.muted, { marginBottom: 12 }]}>Reporta una falla o requerimiento. El área de tecnología asignará un técnico.</Text>
        <FormError message={error} />
        <Select
          label="Equipo afectado *"
          value={form.equipo_id}
          options={equipos.map((e) => ({ value: e.id, label: `${e.codigo_inventario} · ${e.nombre}` }))}
          onChange={(v) => set('equipo_id', v)}
          error={err('equipo_id')}
        />
        <Select
          label="Tipo de problema *"
          value={form.categoria_id}
          options={categorias.map((c) => ({ value: c.id, label: c.nombre }))}
          onChange={(v) => set('categoria_id', v)}
          error={err('categoria_id')}
        />
        <Select label="Prioridad *" value={form.prioridad} options={PRIORIDADES} onChange={(v) => set('prioridad', v)} error={err('prioridad')} />
        <Field label="Asunto *" value={form.titulo} onChangeText={(v) => set('titulo', v)} placeholder="El equipo no enciende" maxLength={150} error={err('titulo')} />
        <Field
          label="Descripción *"
          value={form.descripcion}
          onChangeText={(v) => set('descripcion', v)}
          placeholder="¿Qué pasó? ¿Desde cuándo? ¿Aparece algún mensaje de error?"
          multiline
          error={err('descripcion')}
        />
        <Button title="Enviar solicitud" icon="send" onPress={enviar} loading={saving} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
