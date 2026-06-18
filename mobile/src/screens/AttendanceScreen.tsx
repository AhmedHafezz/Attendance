import React, { useCallback, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { colors } from '../theme/colors';
import * as attendanceApi from '../api/attendance';
import { PunchType, type AttendanceHistoryItem } from '../types';
import { Card } from '../components/Card';
import { StatusPill } from '../components/StatusPill';
import { formatDateLabel, formatTime } from '../utils/format';

export default function AttendanceScreen() {
  const [history, setHistory] = useState<AttendanceHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadHistory = useCallback(async () => {
    setLoading(true);
    try {
      const to = new Date();
      const from = new Date();
      from.setDate(to.getDate() - 30);
      const result = await attendanceApi.getHistory(from.toISOString(), to.toISOString());
      setHistory(result);
    } catch {
      setHistory([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadHistory();
    }, [loadHistory]),
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>My Attendance</Text>
      <FlatList
        data={history}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={loadHistory} tintColor={colors.primary} />}
        ListEmptyComponent={
          !loading ? <Text style={styles.empty}>No attendance records in the last 30 days.</Text> : null
        }
        renderItem={({ item }) => (
          <Card style={styles.row}>
            <View style={styles.rowLeft}>
              <Text style={styles.date}>{formatDateLabel(item.punchTime)}</Text>
              <Text style={styles.time}>{formatTime(item.punchTime)}</Text>
              <Text style={styles.source}>{item.source}{item.notes ? ` · ${item.notes}` : ''}</Text>
            </View>
            <View style={styles.rowRight}>
              <StatusPill
                label={item.punchType === PunchType.CheckIn ? 'Check In' : 'Check Out'}
                tone={item.punchType === PunchType.CheckIn ? 'success' : 'neutral'}
              />
            </View>
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
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  rowLeft: { flex: 1 },
  date: { color: colors.textPrimary, fontWeight: '600', fontSize: 14 },
  time: { color: colors.textSecondary, fontSize: 13, marginTop: 2 },
  source: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
  rowRight: { alignItems: 'flex-end', gap: 6 },
});
