import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { colors } from '../theme/colors';
import { useAuth } from '../context/AuthContext';
import { ApiError } from '../api/client';
import { PrimaryButton } from '../components/PrimaryButton';
import { Card } from '../components/Card';

export default function LoginScreen() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    setError(null);
    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }
    setSubmitting(true);
    try {
      await login(email.trim(), password);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Unable to sign in. Check your connection.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar style="light" />
      <View style={styles.brand}>
        <Text style={styles.brandTitle}>MATRIX</Text>
        <Text style={styles.brandSubtitle}>Attendance</Text>
      </View>

      <Card>
        <Text style={styles.label}>Email</Text>
        <TextInput
          style={styles.input}
          autoCapitalize="none"
          keyboardType="email-address"
          placeholder="you@company.com"
          placeholderTextColor={colors.textMuted}
          value={email}
          onChangeText={setEmail}
        />

        <Text style={styles.label}>Password</Text>
        <TextInput
          style={styles.input}
          secureTextEntry
          placeholder="••••••••"
          placeholderTextColor={colors.textMuted}
          value={password}
          onChangeText={setPassword}
        />

        {error && <Text style={styles.error}>{error}</Text>}

        <PrimaryButton label="Sign In" onPress={handleLogin} loading={submitting} style={styles.button} />
      </Card>

      <Text style={styles.footer}>Powered by MATRIX system</Text>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  brand: {
    alignItems: 'center',
    marginBottom: 48,
  },
  brandTitle: {
    color: colors.primary,
    fontSize: 36,
    fontWeight: '800',
    letterSpacing: 4,
  },
  brandSubtitle: {
    color: colors.textSecondary,
    fontSize: 16,
    marginTop: 4,
  },
  label: {
    color: colors.textSecondary,
    fontSize: 13,
    marginBottom: 6,
    marginTop: 12,
  },
  input: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  error: {
    color: colors.danger,
    marginTop: 12,
    fontSize: 13,
  },
  button: {
    marginTop: 24,
  },
  footer: {
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 32,
    fontSize: 12,
  },
});
