import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { colors } from '../theme/colors';
import * as employeesApi from '../api/employees';
import * as branchesApi from '../api/branches';
import { ApiError } from '../api/client';
import { EmployeeRoleValue, EMPLOYEE_ROLE_LABEL, type BranchItem } from '../types';
import { Card } from '../components/Card';
import { PrimaryButton } from '../components/PrimaryButton';
import type { EmployeeFormScreenNavigationProp, EmployeeFormScreenRouteProp } from '../navigation/types';

const ROLE_OPTIONS = [EmployeeRoleValue.Employee, EmployeeRoleValue.Manager, EmployeeRoleValue.Admin];

export default function EmployeeFormScreen() {
  const navigation = useNavigation<EmployeeFormScreenNavigationProp>();
  const route = useRoute<EmployeeFormScreenRouteProp>();
  const employee = route.params?.employee;
  const isEdit = !!employee;

  const [branches, setBranches] = useState<BranchItem[]>([]);
  const [employeeCode, setEmployeeCode] = useState(employee?.employeeCode ?? '');
  const [firstName, setFirstName] = useState(employee?.firstName ?? '');
  const [lastName, setLastName] = useState(employee?.lastName ?? '');
  const [email, setEmail] = useState(employee?.email ?? '');
  const [phone, setPhone] = useState(employee?.phone ?? '');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<EmployeeRoleValue>(employee?.role ?? EmployeeRoleValue.Employee);
  const [branchId, setBranchId] = useState<number | undefined>(employee?.branchId);
  const [isActive, setIsActive] = useState(employee?.isActive ?? true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    branchesApi.getBranches()
      .then((result) => {
        setBranches(result);
        if (!branchId && result.length > 0) setBranchId(result[0].id);
      })
      .catch(() => setBranches([]));
  }, []);

  const handleSubmit = async () => {
    if (!firstName.trim() || !lastName.trim() || !branchId) {
      Alert.alert('Missing Info', 'First name, last name and branch are required.');
      return;
    }
    if (!isEdit && (!employeeCode.trim() || !email.trim() || password.length < 6)) {
      Alert.alert('Missing Info', 'Employee code, email and a password (6+ chars) are required.');
      return;
    }

    setSubmitting(true);
    try {
      if (isEdit) {
        await employeesApi.updateEmployee(employee.id, {
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          phone: phone.trim() || undefined,
          branchId,
          role,
          isActive,
        });
      } else {
        await employeesApi.createEmployee({
          branchId,
          employeeCode: employeeCode.trim(),
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email: email.trim(),
          password,
          phone: phone.trim() || undefined,
          role,
        });
      }
      Alert.alert('Saved', `Employee ${isEdit ? 'updated' : 'created'} successfully.`, [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (err) {
      Alert.alert('Save Failed', err instanceof ApiError ? err.message : 'Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = () => {
    if (!employee) return;
    Alert.alert('Deactivate Employee', `Deactivate ${employee.fullName}? They will no longer be able to sign in.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Deactivate',
        style: 'destructive',
        onPress: async () => {
          try {
            await employeesApi.deactivateEmployee(employee.id);
            navigation.goBack();
          } catch (err) {
            Alert.alert('Failed', err instanceof ApiError ? err.message : 'Please try again.');
          }
        },
      },
    ]);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Card style={styles.card}>
        <Text style={styles.cardTitle}>Employee Code</Text>
        <TextInput
          style={[styles.input, isEdit && styles.inputDisabled]}
          placeholder="e.g. EMP-010"
          placeholderTextColor={colors.textMuted}
          value={employeeCode}
          onChangeText={setEmployeeCode}
          editable={!isEdit}
          autoCapitalize="characters"
        />
      </Card>

      <Card style={styles.card}>
        <Text style={styles.cardTitle}>Name</Text>
        <TextInput
          style={styles.input}
          placeholder="First name"
          placeholderTextColor={colors.textMuted}
          value={firstName}
          onChangeText={setFirstName}
        />
        <TextInput
          style={[styles.input, styles.inputSpaced]}
          placeholder="Last name"
          placeholderTextColor={colors.textMuted}
          value={lastName}
          onChangeText={setLastName}
        />
      </Card>

      <Card style={styles.card}>
        <Text style={styles.cardTitle}>Contact</Text>
        <TextInput
          style={[styles.input, isEdit && styles.inputDisabled]}
          placeholder="Email"
          placeholderTextColor={colors.textMuted}
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
          editable={!isEdit}
        />
        <TextInput
          style={[styles.input, styles.inputSpaced]}
          placeholder="Phone (optional)"
          placeholderTextColor={colors.textMuted}
          keyboardType="phone-pad"
          value={phone ?? ''}
          onChangeText={setPhone}
        />
        {!isEdit && (
          <TextInput
            style={[styles.input, styles.inputSpaced]}
            placeholder="Password (min 6 characters)"
            placeholderTextColor={colors.textMuted}
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />
        )}
      </Card>

      <Card style={styles.card}>
        <Text style={styles.cardTitle}>Role</Text>
        <View style={styles.segmented}>
          {ROLE_OPTIONS.map((option) => (
            <TouchableOpacity
              key={option}
              style={[styles.segment, role === option && styles.segmentActive]}
              onPress={() => setRole(option)}
            >
              <Text style={[styles.segmentLabel, role === option && styles.segmentLabelActive]}>
                {EMPLOYEE_ROLE_LABEL[option]}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </Card>

      <Card style={styles.card}>
        <Text style={styles.cardTitle}>Branch</Text>
        <View style={styles.chipWrap}>
          {branches.map((b) => (
            <TouchableOpacity
              key={b.id}
              style={[styles.chip, branchId === b.id && styles.chipActive]}
              onPress={() => setBranchId(b.id)}
            >
              <Text style={[styles.chipLabel, branchId === b.id && styles.chipLabelActive]}>{b.name}</Text>
            </TouchableOpacity>
          ))}
          {branches.length === 0 && <Text style={styles.meta}>No branches available.</Text>}
        </View>
      </Card>

      {isEdit && (
        <Card style={styles.card}>
          <View style={styles.rowBetween}>
            <Text style={styles.cardTitle}>Active</Text>
            <Switch
              value={isActive}
              onValueChange={setIsActive}
              trackColor={{ false: colors.surfaceAlt, true: colors.primaryMuted }}
              thumbColor={isActive ? colors.primary : colors.textMuted}
            />
          </View>
        </Card>
      )}

      <PrimaryButton
        label={isEdit ? 'Save Changes' : 'Create Employee'}
        onPress={handleSubmit}
        loading={submitting}
        style={styles.submitButton}
      />

      {isEdit && (
        <PrimaryButton label="Deactivate Employee" onPress={handleDelete} variant="danger" style={styles.deleteButton} />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 20, paddingBottom: 40 },
  card: { marginBottom: 16 },
  cardTitle: { color: colors.textPrimary, fontWeight: '700', fontSize: 14, marginBottom: 10 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  meta: { color: colors.textSecondary, fontSize: 12 },
  input: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.textPrimary,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  inputSpaced: { marginTop: 12 },
  inputDisabled: { opacity: 0.5 },
  segmented: { flexDirection: 'row', backgroundColor: colors.surfaceAlt, borderRadius: 10, padding: 4 },
  segment: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 8 },
  segmentActive: { backgroundColor: colors.primary },
  segmentLabel: { color: colors.textSecondary, fontWeight: '600', fontSize: 13 },
  segmentLabelActive: { color: '#fff' },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipLabel: { color: colors.textSecondary, fontWeight: '600', fontSize: 13 },
  chipLabelActive: { color: '#fff' },
  submitButton: { marginTop: 4 },
  deleteButton: { marginTop: 12 },
});
