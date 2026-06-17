import React, { useCallback, useState } from 'react';
import { Alert, FlatList, Modal, RefreshControl, StyleSheet, Text, TextInput, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { colors } from '../theme/colors';
import { useAuth } from '../context/AuthContext';
import * as visitorsApi from '../api/visitors';
import { ApiError } from '../api/client';
import type { VisitorItem } from '../types';
import { Card } from '../components/Card';
import { PrimaryButton } from '../components/PrimaryButton';
import { StatusPill } from '../components/StatusPill';
import { formatTime } from '../utils/format';

export default function VisitorsScreen() {
  const { employee } = useAuth();
  const [visitors, setVisitors] = useState<VisitorItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [visitorName, setVisitorName] = useState('');
  const [visitorPhone, setVisitorPhone] = useState('');
  const [purpose, setPurpose] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadVisitors = useCallback(async () => {
    setLoading(true);
    try {
      const result = await visitorsApi.getVisitors({ branchId: employee?.branchId });
      setVisitors(result);
    } catch {
      setVisitors([]);
    } finally {
      setLoading(false);
    }
  }, [employee?.branchId]);

  useFocusEffect(
    useCallback(() => {
      loadVisitors();
    }, [loadVisitors]),
  );

  const resetForm = () => {
    setVisitorName('');
    setVisitorPhone('');
    setPurpose('');
  };

  const handleCheckIn = async () => {
    if (!visitorName.trim() || !employee) {
      Alert.alert('Missing Info', 'Visitor name is required.');
      return;
    }
    setSubmitting(true);
    try {
      await visitorsApi.checkInVisitor({
        branchId: employee.branchId,
        visitorName: visitorName.trim(),
        visitorPhone: visitorPhone.trim() || undefined,
        purpose: purpose.trim() || undefined,
        hostEmployeeId: employee.id,
      });
      setModalVisible(false);
      resetForm();
      await loadVisitors();
    } catch (err) {
      Alert.alert('Check-In Failed', err instanceof ApiError ? err.message : 'Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCheckOut = async (visitor: VisitorItem) => {
    try {
      await visitorsApi.checkOutVisitor(visitor.id);
      await loadVisitors();
    } catch (err) {
      Alert.alert('Check-Out Failed', err instanceof ApiError ? err.message : 'Please try again.');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Visitors</Text>
        <PrimaryButton label="+ New" onPress={() => setModalVisible(true)} style={styles.newButton} />
      </View>

      <FlatList
        data={visitors}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={loadVisitors} tintColor={colors.primary} />}
        ListEmptyComponent={!loading ? <Text style={styles.empty}>No visitors recorded today.</Text> : null}
        renderItem={({ item }) => (
          <Card style={styles.row}>
            <View style={styles.rowLeft}>
              <Text style={styles.name}>{item.visitorName}</Text>
              <Text style={styles.meta}>
                In {formatTime(item.checkInTime)}
                {item.checkOutTime ? ` · Out ${formatTime(item.checkOutTime)}` : ''}
              </Text>
              {item.purpose && <Text style={styles.meta}>{item.purpose}</Text>}
            </View>
            {item.isCheckedOut ? (
              <StatusPill label="Checked Out" tone="neutral" />
            ) : (
              <PrimaryButton label="Check Out" onPress={() => handleCheckOut(item)} variant="outline" style={styles.checkoutButton} />
            )}
          </Card>
        )}
      />

      <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <Card style={styles.modalCard}>
            <Text style={styles.modalTitle}>New Visitor</Text>
            <TextInput
              style={styles.input}
              placeholder="Visitor name"
              placeholderTextColor={colors.textMuted}
              value={visitorName}
              onChangeText={setVisitorName}
            />
            <TextInput
              style={styles.input}
              placeholder="Phone (optional)"
              placeholderTextColor={colors.textMuted}
              keyboardType="phone-pad"
              value={visitorPhone}
              onChangeText={setVisitorPhone}
            />
            <TextInput
              style={styles.input}
              placeholder="Purpose (optional)"
              placeholderTextColor={colors.textMuted}
              value={purpose}
              onChangeText={setPurpose}
            />
            <View style={styles.modalActions}>
              <PrimaryButton
                label="Cancel"
                variant="outline"
                onPress={() => {
                  setModalVisible(false);
                  resetForm();
                }}
                style={styles.modalButton}
              />
              <PrimaryButton label="Check In" onPress={handleCheckIn} loading={submitting} style={styles.modalButton} />
            </View>
          </Card>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 8,
  },
  title: { color: colors.textPrimary, fontSize: 20, fontWeight: '700' },
  newButton: { paddingHorizontal: 16, paddingVertical: 8 },
  listContent: { paddingHorizontal: 20, paddingBottom: 40 },
  empty: { color: colors.textMuted, textAlign: 'center', marginTop: 40 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  rowLeft: { flex: 1 },
  name: { color: colors.textPrimary, fontWeight: '600', fontSize: 14 },
  meta: { color: colors.textSecondary, fontSize: 12, marginTop: 2 },
  checkoutButton: { paddingHorizontal: 14, paddingVertical: 8 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  modalCard: {},
  modalTitle: { color: colors.textPrimary, fontWeight: '700', fontSize: 16, marginBottom: 16 },
  input: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.textPrimary,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 12,
  },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 8 },
  modalButton: { flex: 1 },
});
