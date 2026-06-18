import React, { useCallback, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { colors } from '../theme/colors';
import { useAuth } from '../context/AuthContext';
import * as attendanceApi from '../api/attendance';
import { PunchType, type AttendanceHistoryItem } from '../types';
import { Card } from '../components/Card';
import { StatusPill } from '../components/StatusPill';
import { formatTime } from '../utils/format';

export default function TeamScreen() {
  const { employee } = useAuth();
  const [logs, setLogs] = useState<AttendanceHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadLogs = useCallback(async () => {
    if (!employee?.branchId) return;
    setLoading(true);
    try {
      const result = await attendanceApi.getBranchAttendance(employee.branchId);
      setLogs(result);
    } catch {
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }, [employee?.branchId]);

  useFocusEffect(
    useCallback(() => {
      loadLogs();
    }, [loadLogs]),
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Team — Today</Text>
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
              <Text style={styles.meta}>{item.employeeCode} · {formatTime(item.punchTime)}</Text>
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
  title: { color: colors.textPrimary, fontSize: 20, fontWeight: '700', padding: 20, paddingBottom: 8 },
  listContent: { paddingHorizontal: 20, paddingBottom: 40 },
  empty: { color: colors.textMuted, textAlign: 'center', marginTop: 40 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  rowLeft: { flex: 1, marginRight: 12 },
  name: { color: colors.textPrimary, fontWeight: '600', fontSize: 14 },
  meta: { color: colors.textSecondary, fontSize: 12, marginTop: 2 },
});
