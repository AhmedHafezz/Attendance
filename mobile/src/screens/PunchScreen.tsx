import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../theme/colors';
import { useGeoLocation } from '../utils/useGeoLocation';
import * as attendanceApi from '../api/attendance';
import { ApiError } from '../api/client';
import { PunchType } from '../types';
import { Card } from '../components/Card';
import { PrimaryButton } from '../components/PrimaryButton';
import { StatusPill } from '../components/StatusPill';
import type { PunchScreenNavigationProp } from '../navigation/types';

export default function PunchScreen() {
  const navigation = useNavigation<PunchScreenNavigationProp>();
  const geo = useGeoLocation();
  const [punchType, setPunchType] = useState<PunchType>(PunchType.CheckIn);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    geo.acquireLocation();
  }, []);

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

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const result = await attendanceApi.punch({
        punchType,
        latitude: geo.latitude,
        longitude: geo.longitude,
        notes: notes.trim() || undefined,
      });
      Alert.alert('Success', result.message ?? 'Punch recorded.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (err) {
      Alert.alert('Punch Failed', err instanceof ApiError ? err.message : 'Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Card style={styles.card}>
        <View style={styles.rowBetween}>
          <Text style={styles.cardTitle}>Location</Text>
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
        <Text style={styles.cardTitle}>Punch Type</Text>
        <View style={styles.segmented}>
          <TouchableOpacity
            style={[styles.segment, punchType === PunchType.CheckIn && styles.segmentActive]}
            onPress={() => setPunchType(PunchType.CheckIn)}
          >
            <Text style={[styles.segmentLabel, punchType === PunchType.CheckIn && styles.segmentLabelActive]}>
              Check In
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.segment, punchType === PunchType.CheckOut && styles.segmentActive]}
            onPress={() => setPunchType(PunchType.CheckOut)}
          >
            <Text style={[styles.segmentLabel, punchType === PunchType.CheckOut && styles.segmentLabelActive]}>
              Check Out
            </Text>
          </TouchableOpacity>
        </View>
      </Card>

      <Card style={styles.card}>
        <Text style={styles.cardTitle}>Notes (optional)</Text>
        <TextInput
          style={styles.notesInput}
          placeholder="e.g. Working from client site"
          placeholderTextColor={colors.textMuted}
          multiline
          numberOfLines={3}
          value={notes}
          onChangeText={setNotes}
        />
      </Card>

      <PrimaryButton
        label={punchType === PunchType.CheckIn ? 'Submit Check In' : 'Submit Check Out'}
        onPress={handleSubmit}
        loading={submitting}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 20, paddingBottom: 40 },
  card: { marginBottom: 16 },
  cardTitle: { color: colors.textPrimary, fontWeight: '700', fontSize: 14, marginBottom: 10 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  coords: { color: colors.textSecondary, fontSize: 12, marginTop: 8 },
  retryButton: { marginTop: 12 },
  segmented: { flexDirection: 'row', backgroundColor: colors.surfaceAlt, borderRadius: 10, padding: 4 },
  segment: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 8 },
  segmentActive: { backgroundColor: colors.primary },
  segmentLabel: { color: colors.textSecondary, fontWeight: '600' },
  segmentLabelActive: { color: '#fff' },
  notesInput: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.textPrimary,
    padding: 12,
    minHeight: 80,
    textAlignVertical: 'top',
  },
});
