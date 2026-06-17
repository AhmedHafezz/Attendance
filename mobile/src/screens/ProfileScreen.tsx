import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/colors';
import { useAuth } from '../context/AuthContext';
import { Card } from '../components/Card';
import { PrimaryButton } from '../components/PrimaryButton';

export default function ProfileScreen() {
  const { employee, logout } = useAuth();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          setLoggingOut(true);
          await logout();
          setLoggingOut(false);
        },
      },
    ]);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {employee?.fullName?.split(' ').map((p) => p[0]).slice(0, 2).join('') ?? '?'}
          </Text>
        </View>
        <Text style={styles.name}>{employee?.fullName}</Text>
        <Text style={styles.role}>{employee?.role}</Text>
      </View>

      <Card style={styles.card}>
        <InfoRow label="Employee Code" value={employee?.employeeCode} />
        <InfoRow label="Email" value={employee?.email} />
        <InfoRow label="Company ID" value={String(employee?.companyId ?? '')} />
        <InfoRow label="Branch ID" value={String(employee?.branchId ?? '')} />
      </Card>

      <Card style={styles.card}>
        <Text style={styles.cardTitle}>About</Text>
        <InfoRow label="App Version" value="1.0.0" />
        <InfoRow label="Powered By" value="MATRIX System" />
      </Card>

      <PrimaryButton label="Sign Out" onPress={handleLogout} loading={loggingOut} variant="danger" />
    </ScrollView>
  );
}

function InfoRow({ label, value }: { label: string; value?: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value || '—'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 20, paddingBottom: 40 },
  header: { alignItems: 'center', marginBottom: 24 },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  avatarText: { color: colors.primary, fontWeight: '800', fontSize: 22 },
  name: { color: colors.textPrimary, fontSize: 18, fontWeight: '700' },
  role: { color: colors.textSecondary, fontSize: 13, marginTop: 2 },
  card: { marginBottom: 16 },
  cardTitle: { color: colors.textPrimary, fontWeight: '700', fontSize: 14, marginBottom: 10 },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  infoLabel: { color: colors.textMuted, fontSize: 13 },
  infoValue: { color: colors.textPrimary, fontSize: 13, fontWeight: '600' },
});
