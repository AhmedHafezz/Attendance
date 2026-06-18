import React, { useCallback, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { colors } from '../theme/colors';
import { useAuth } from '../context/AuthContext';
import * as attendanceApi from '../api/attendance';
import { PunchType, type AttendanceHistoryItem } from '../types';
import { Card } from '../components/Card';
import { PrimaryButton } from '../components/PrimaryButton';
import { StatusPill } from '../components/StatusPill';
import { formatTime } from '../utils/format';
import type { TeamScreenNavigationProp } from '../navigation/types';

export default function TeamScreen() {
  const navigation = useNavigation<TeamScreenNavigationProp>();
  const { employee } = useAuth();
  const isAdmin = employee?.role === 'Admin';
  const [logs, setLogs] = useState<AttendanceHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadLogs = useCallback(async () => {
    if (!employee) return;
    setLoading(true);
    try {
      const result = isAdmin
        ? await attendanceApi.getCompanyAttendance()
        : await attendanceApi.getBranchAttendance(employee.branchId);
      setLogs(result);
    } catch {
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }, [employee, isAdmin]);

  useFocusEffect(
    useCallback(() => {
      loadLogs();
    }, [loadLogs]),
  );

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>{isAdmin ? 'All Branches — Today' : 'Team — Today'}</Text>
        {isAdmin && (
          <PrimaryButton
            label="Manage Employees"
            onPress={() => navigation.navigate('Employees')}
            variant="outline"
            style={styles.manageButton}
          />
        )}
      </View>
      <FlatList
        data={logs}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={loadLogs} tintColor={colors.primary} />}
        ListEmptyComponent={!loading ? <Text style={styles.empty}>No punches recorded today.</Text> : null}
        renderItem={({ item }) => (
          <Card style={styles.row}>
            <View style={styles.rowLeft}>
              <Text style={styles.name}>{item.employeeName}</Text>
              <Text style={styles.meta}>
                {item.employeeCode} · {item.branchName} · {formatTime(item.punchTime)}
              </Text>
              <Text style={styles.meta}>
                {item.source}
                {item.latitude != null && item.longitude != null
                  ? ` · ${item.latitude.toFixed(5)}, ${item.longitude.toFixed(5)}`
                  : ' · No GPS data'}
              </Text>
            </View>
            <StatusPill
              label={item.punchType === PunchType.CheckIn ? 'Check In' : 'Check Out'}
              tone={item.punchType === PunchType.CheckIn ? 'success' : 'neutral'}
            />
          </Card>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  headerRow: { padding: 20, paddingBottom: 8, gap: 12 },
  title: { color: colors.textPrimary, fontSize: 20, fontWeight: '700' },
  manageButton: { paddingHorizontal: 16, paddingVertical: 8, alignSelf: 'flex-start' },
  listContent: { paddingHorizontal: 20, paddingBottom: 40 },
  empty: { color: colors.textMuted, textAlign: 'center', marginTop: 40 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  rowLeft: { flex: 1, marginRight: 12 },
  name: { color: colors.textPrimary, fontWeight: '600', fontSize: 14 },
  meta: { color: colors.textSecondary, fontSize: 12, marginTop: 2 },
});
