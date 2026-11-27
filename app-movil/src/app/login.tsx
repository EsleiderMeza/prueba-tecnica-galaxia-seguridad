import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';
import { useAuth } from '../context/auth';
import { ApiError, API_URL, errorMessage } from '../api/client';
import { Button, Field, FormError, styles } from '../components/ui';
import { Logo } from '../components/Logo';
import { colors, spacing } from '../theme';

export default function LoginScreen() {
  const { login, aviso } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string | undefined>>({});

  const submit = async () => {
    const fe: Record<string, string | undefined> = {};
    if (!email.trim()) fe.email = 'Ingresa tu correo.';
    else if (!/^\S+@\S+\.\S+$/.test(email.trim())) fe.email = 'Correo no válido.';
    if (!password) fe.password = 'Ingresa tu contraseña.';
    setFieldErrors(fe);
    setError(null);
    if (fe.email || fe.password) return;

    setLoading(true);
    try {
      await login(email.trim().toLowerCase(), password);
      // El Stack.Protected redirige automáticamente al panel.
    } catch (e) {
      if (e instanceof ApiError && e.status === 422) {
        setFieldErrors({ email: e.field('email'), password: e.field('password') });
        setError(e.field('email') || e.field('password') ? null : e.message);
      } else {
        setError(errorMessage(e));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.black }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: spacing.xl }} keyboardShouldPersistTaps="handled">
        <View style={{ alignItems: 'center', marginBottom: spacing.xl }}>
          <Logo size={84} />
          <Text style={{ color: '#fff', fontSize: 22, fontWeight: '800', marginTop: spacing.md }}>Soporte Técnico</Text>
          <Text style={{ color: '#BDBDBD', marginTop: 4 }}>Soporte técnico e inventario tecnológico</Text>
        </View>

        <View style={[styles.card, { padding: spacing.xl, borderTopWidth: 4, borderTopColor: colors.red }]}>
          <Text style={[styles.title, { marginBottom: spacing.lg }]}>Iniciar sesión</Text>
          <FormError message={error ?? aviso} />
          <Field
            label="Correo electrónico"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            placeholder="usuario@galaxia.com"
            error={fieldErrors.email}
          />
          <Field
            label="Contraseña"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete="password"
            placeholder="••••••••"
            error={fieldErrors.password}
            onSubmitEditing={submit}
          />
          <Button title="Ingresar" onPress={submit} loading={loading} />
        </View>
        <Text style={{ color: '#8A8A8A', fontSize: 11, textAlign: 'center', marginTop: spacing.md }}>Servidor: {API_URL}</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
