import React, { useCallback, useEffect, useState } from 'react';
import { Alert, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { colors } from '../theme/colors';
import { useAuth } from '../context/AuthContext';
import { useGeoLocation } from '../utils/useGeoLocation';
import * as attendanceApi from '../api/attendance';
import { ApiError } from '../api/client';
import { PunchType, type AttendanceSummaryItem } from '../types';
import { Card } from '../components/Card';
import { PrimaryButton } from '../components/PrimaryButton';
import { StatusPill } from '../components/StatusPill';
import { Tile } from '../components/Tile';
import { formatDuration, formatTime, isSameLocalDay } from '../utils/format';
import type { HomeScreenNavigationProp } from '../navigation/types';

export default function HomeScreen() {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const { employee } = useAuth();
  const geo = useGeoLocation();
  const [summary, setSummary] = useState<AttendanceSummaryItem[]>([]);
  const [loadingSummary, setLoadingSummary] = useState(true);
  const [punching, setPunching] = useState(false);

  const loadSummary = useCallback(async () => {
    setLoadingSummary(true);
    try {
      const now = new Date();
      const result = await attendanceApi.getSummary(now.getFullYear(), now.getMonth() + 1);
      setSummary(result);
    } catch {
      // surfaced as empty state below; non-fatal for the dashboard
    } finally {
      setLoadingSummary(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadSummary();
    }, [loadSummary]),
  );

  useEffect(() => {
    geo.acquireLocation();
  }, []);

  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  const todayEntry = summary.find((s) => isSameLocalDay(new Date(s.date), today));
  const yesterdayEntry = summary.find((s) => isSameLocalDay(new Date(s.date), yesterday));

  const nextPunchType = !todayEntry?.checkIn
    ? PunchType.CheckIn
    : !todayEntry?.checkOut
      ? PunchType.CheckOut
      : PunchType.CheckIn;

  const punchLabel = nextPunchType === PunchType.CheckIn ? 'Check In' : 'Check Out';

  const handlePunch = async () => {
    setPunching(true);
    try {
      let location = geo.status === 'locked' ? geo : await geo.acquireLocation();

      if (location?.mocked) {
        Alert.alert(
          'Suspicious Location',
          'Mock location detected on this device. Punch will be flagged for review.',
        );
      }

      const result = await attendanceApi.punch({
        punchType: nextPunchType,
        latitude: location?.latitude,
        longitude: location?.longitude,
      });

      Alert.alert(result.isValid ? 'Success' : 'Recorded', result.message ?? 'Punch recorded.');
      await loadSummary();
    } catch (err) {
      Alert.alert('Punch Failed', err instanceof ApiError ? err.message : 'Please try again.');
    } finally {
      setPunching(false);
    }
  };

  const gpsTone = geo.status === 'locked' ? (geo.mocked ? 'warning' : 'success')
    : geo.status === 'denied' || geo.status === 'error' ? 'danger' : 'neutral';

  const gpsLabel =
    geo.status === 'locked'
      ? geo.mocked ? 'Mock Location Detected' : 'GPS Locked'
      : geo.status === 'locating' || geo.status === 'requesting'
        ? 'Locating…'
        : geo.status === 'denied'
          ? 'Permission Denied'
          : geo.status === 'error'
            ? 'Location Error'
            : 'Idle';

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={loadingSummary} onRefresh={loadSummary} tintColor={colors.primary} />}
    >
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {employee?.fullName?.split(' ').map((p) => p[0]).slice(0, 2).join('') ?? '?'}
          </Text>
        </View>
        <View style={styles.headerInfo}>
          <Text style={styles.name}>{employee?.fullName}</Text>
          <Text style={styles.code}>{employee?.employeeCode} · {employee?.role}</Text>
        </View>
      </View>

      <Card style={styles.card}>
        <View style={styles.rowBetween}>
          <Text style={styles.cardTitle}>Location Status</Text>
          <StatusPill label={gpsLabel} tone={gpsTone} />
        </View>
        {geo.status === 'locked' && (
          <Text style={styles.coords}>
            {geo.latitude?.toFixed(5)}, {geo.longitude?.toFixed(5)} (±{Math.round(geo.accuracy ?? 0)}m)
          </Text>
        )}
        {(geo.status === 'denied' || geo.status === 'error') && (
          <PrimaryButton label="Retry Location" onPress={() => geo.acquireLocation()} variant="outline" style={styles.retryButton} />
        )}
      </Card>

      <Card style={styles.card}>
        <Text style={styles.cardTitle}>Today</Text>
        <View style={styles.punchRow}>
          <View>
            <Text style={styles.punchTimeLabel}>Check In</Text>
            <Text style={styles.punchTimeValue}>{formatTime(todayEntry?.checkIn)}</Text>
          </View>
          <View>
            <Text style={styles.punchTimeLabel}>Check Out</Text>
            <Text style={styles.punchTimeValue}>{formatTime(todayEntry?.checkOut)}</Text>
          </View>
        </View>
        <PrimaryButton label={punchLabel} onPress={handlePunch} loading={punching} style={styles.punchButton} />
      </Card>

      <Card style={styles.card}>
        <Text style={styles.cardTitle}>Yesterday</Text>
        <View style={styles.punchRow}>
          <View>
            <Text style={styles.punchTimeLabel}>Check In</Text>
            <Text style={styles.punchTimeValue}>{formatTime(yesterdayEntry?.checkIn)}</Text>
          </View>
          <View>
            <Text style={styles.punchTimeLabel}>Check Out</Text>
            <Text style={styles.punchTimeValue}>{formatTime(yesterdayEntry?.checkOut)}</Text>
          </View>
          <View>
            <Text style={styles.punchTimeLabel}>Duration</Text>
            <Text style={styles.punchTimeValue}>{formatDuration(yesterdayEntry?.duration)}</Text>
          </View>
        </View>
      </Card>

      <View style={styles.tileGrid}>
        <Tile label="My Attendance" icon="🗓️" onPress={() => navigation.navigate('Attendance')} />
        <Tile label="Mark Punch" icon="📍" onPress={() => navigation.navigate('Punch')} />
        <Tile label="View Profile" icon="👤" onPress={() => navigation.navigate('Profile')} />
        <Tile label="Visitor Management" icon="🧑‍🤝‍🧑" onPress={() => navigation.navigate('Visitors')} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 20, paddingBottom: 40 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  avatarText: { color: colors.primary, fontWeight: '800', fontSize: 18 },
  headerInfo: { flex: 1 },
  name: { color: colors.textPrimary, fontSize: 18, fontWeight: '700' },
  code: { color: colors.textSecondary, fontSize: 13, marginTop: 2 },
  card: { marginBottom: 16 },
  cardTitle: { color: colors.textPrimary, fontWeight: '700', fontSize: 14, marginBottom: 10 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  coords: { color: colors.textSecondary, fontSize: 12, marginTop: 8 },
  retryButton: { marginTop: 12 },
  punchRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  punchTimeLabel: { color: colors.textMuted, fontSize: 12 },
  punchTimeValue: { color: colors.textPrimary, fontSize: 16, fontWeight: '700', marginTop: 4 },
  punchButton: {},
  tileGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
});
