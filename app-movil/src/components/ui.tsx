import { useState, type ReactNode } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { colors, radius, spacing } from '../theme';

export function Card({ children, style, onPress }: { children: ReactNode; style?: ViewStyle; onPress?: () => void }) {
  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [styles.card, style, pressed && { opacity: 0.7 }]}
        accessibilityRole="button"
      >
        {children}
      </Pressable>
    );
  }
  return <View style={[styles.card, style]}>{children}</View>;
}

export function Button({
  title,
  onPress,
  loading,
  disabled,
  variant = 'primary',
  icon,
}: {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'danger';
  icon?: keyof typeof Ionicons.glyphMap;
}) {
  const bg = variant === 'primary' ? colors.primary : variant === 'danger' ? colors.danger : colors.card;
  const fg = variant === 'secondary' ? colors.primary : '#fff';
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: bg, borderColor: variant === 'secondary' ? colors.primary : bg },
        (disabled || loading) && { opacity: 0.5 },
        pressed && { opacity: 0.8 },
      ]}
    >
      {loading ? (
        <ActivityIndicator color={fg} />
      ) : (
        <View style={styles.row}>
          {icon && <Ionicons name={icon} size={18} color={fg} style={{ marginRight: 6 }} />}
          <Text style={[styles.buttonText, { color: fg }]}>{title}</Text>
        </View>
      )}
    </Pressable>
  );
}

export function Field({
  label,
  error,
  ...props
}: TextInputProps & { label: string; error?: string }) {
  return (
    <View style={{ marginBottom: spacing.md }}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        placeholderTextColor={colors.muted}
        {...props}
        style={[styles.input, props.multiline && { minHeight: 90, textAlignVertical: 'top' }, error && { borderColor: colors.danger }]}
      />
      {error ? <Text style={styles.fieldError}>{error}</Text> : null}
    </View>
  );
}

export interface Option<V> {
  value: V;
  label: string;
}

/** Selector simple en un modal (sin dependencias nativas extra). */
export function Select<V extends string | number>({
  label,
  value,
  options,
  onChange,
  placeholder = 'Seleccionar…',
  error,
}: {
  label: string;
  value: V | null;
  options: Option<V>[];
  onChange: (v: V) => void;
  placeholder?: string;
  error?: string;
}) {
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.value === value);
  return (
    <View style={{ marginBottom: spacing.md }}>
      <Text style={styles.label}>{label}</Text>
      <Pressable
        onPress={() => setOpen(true)}
        style={[styles.input, styles.row, { justifyContent: 'space-between' }, error && { borderColor: colors.danger }]}
        accessibilityRole="button"
        accessibilityLabel={label}
      >
        <Text style={{ color: selected ? colors.text : colors.muted, flex: 1 }} numberOfLines={1}>
          {selected ? selected.label : placeholder}
        </Text>
        <Ionicons name="chevron-down" size={18} color={colors.muted} />
      </Pressable>
      {error ? <Text style={styles.fieldError}>{error}</Text> : null}
      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <View style={styles.sheet}>
            <Text style={[styles.title, { marginBottom: spacing.sm }]}>{label}</Text>
            <FlatList
              data={options}
              keyExtractor={(o) => String(o.value)}
              ListEmptyComponent={<Text style={styles.muted}>No hay opciones disponibles.</Text>}
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => {
                    onChange(item.value);
                    setOpen(false);
                  }}
                  style={({ pressed }) => [styles.option, pressed && { backgroundColor: colors.bg }]}
                >
                  <Text style={{ color: colors.text, flex: 1 }}>{item.label}</Text>
                  {item.value === value && <Ionicons name="checkmark" size={18} color={colors.primary} />}
                </Pressable>
              )}
            />
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

/** Fila horizontal de filtros tipo "chip". */
export function Chips<V extends string | number>({
  options,
  value,
  onChange,
}: {
  options: (Option<V> & { color?: string })[];
  value: V | null;
  onChange: (v: V | null) => void;
}) {
  return (
    <FlatList
      horizontal
      showsHorizontalScrollIndicator={false}
      data={[{ value: null as V | null, label: 'Todos' }, ...options]}
      keyExtractor={(o) => String(o.value)}
      contentContainerStyle={{ paddingHorizontal: spacing.lg, gap: spacing.sm }}
      style={{ flexGrow: 0, flexShrink: 0, minHeight: 36, marginBottom: spacing.sm }}
      renderItem={({ item }) => {
        const active = item.value === value;
        return (
          <Pressable
            onPress={() => onChange(item.value)}
            style={[styles.chip, active && { backgroundColor: colors.primary, borderColor: colors.primary }]}
          >
            <Text style={{ color: active ? '#fff' : colors.text, fontSize: 13 }}>{item.label}</Text>
          </Pressable>
        );
      }}
    />
  );
}

export function Badge({ label, color }: { label: string; color: string }) {
  return (
    <View style={[styles.badge, { backgroundColor: color + '22', borderColor: color }]}>
      <Text style={{ color, fontSize: 12, fontWeight: '600' }}>{label}</Text>
    </View>
  );
}

export function Loading() {
  return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  );
}

export function ErrorView({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <View style={styles.center}>
      <Ionicons name="cloud-offline-outline" size={40} color={colors.muted} />
      <Text style={[styles.muted, { textAlign: 'center', marginVertical: spacing.md }]}>{message}</Text>
      {onRetry && <Button title="Reintentar" onPress={onRetry} variant="secondary" />}
    </View>
  );
}

export function Empty({ text }: { text: string }) {
  return (
    <View style={[styles.center, { paddingVertical: 48 }]}>
      <Ionicons name="file-tray-outline" size={36} color={colors.muted} />
      <Text style={[styles.muted, { marginTop: spacing.sm, textAlign: 'center' }]}>{text}</Text>
    </View>
  );
}

export function SectionTitle({ children }: { children: ReactNode }) {
  return <Text style={styles.section}>{children}</Text>;
}

export function InfoRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      {typeof value === 'string' || typeof value === 'number' || value == null ? (
        <Text style={styles.infoValue}>{value ?? '—'}</Text>
      ) : (
        <View style={{ flex: 1, alignItems: 'flex-end' }}>{value}</View>
      )}
    </View>
  );
}

export function FormError({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <View style={styles.formError}>
      <Ionicons name="alert-circle" size={18} color={colors.danger} />
      <Text style={{ color: colors.danger, marginLeft: 6, flex: 1 }}>{message}</Text>
    </View>
  );
}

export const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radius,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  row: { flexDirection: 'row', alignItems: 'center' },
  button: {
    minHeight: 48,
    borderRadius: radius,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    borderWidth: 1,
    marginVertical: spacing.xs,
  },
  buttonText: { fontSize: 16, fontWeight: '600' },
  label: { fontSize: 13, fontWeight: '600', color: colors.text, marginBottom: 6 },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.text,
    minHeight: 48,
  },
  fieldError: { color: colors.danger, fontSize: 12, marginTop: 4 },
  title: { fontSize: 17, fontWeight: '700', color: colors.text },
  muted: { color: colors.muted, fontSize: 14 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  backdrop: { flex: 1, backgroundColor: '#0008', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: '#fff',
    maxHeight: '70%',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: spacing.lg,
    paddingBottom: spacing.xl,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: '#fff',
  },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    borderWidth: 1,
  },
  section: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    gap: spacing.md,
  },
  infoLabel: { color: colors.muted, fontSize: 14 },
  infoValue: { color: colors.text, fontSize: 14, fontWeight: '500', flex: 1, textAlign: 'right' },
  formError: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.dangerBg,
    borderRadius: radius,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg, paddingBottom: 40 },
  search: { marginHorizontal: spacing.lg, marginTop: spacing.md, marginBottom: spacing.sm },
  fab: {
    position: 'absolute',
    right: spacing.xl,
    bottom: spacing.xl,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.red,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
});

export function Fab({ onPress, label }: { onPress: () => void; label: string }) {
  return (
    <Pressable onPress={onPress} style={styles.fab} accessibilityRole="button" accessibilityLabel={label}>
      <Ionicons name="add" size={28} color="#fff" />
    </Pressable>
  );
}
