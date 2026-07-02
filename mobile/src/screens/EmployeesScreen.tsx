import React, { useCallback, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { colors } from '../theme/colors';
import * as employeesApi from '../api/employees';
import { EMPLOYEE_ROLE_LABEL, EmployeeRoleValue, type EmployeeListItem } from '../types';
import { Card } from '../components/Card';
import { PrimaryButton } from '../components/PrimaryButton';
import { StatusPill } from '../components/StatusPill';
import type { EmployeesScreenNavigationProp } from '../navigation/types';

export default function EmployeesScreen() {
  const navigation = useNavigation<EmployeesScreenNavigationProp>();
  const [employees, setEmployees] = useState<EmployeeListItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadEmployees = useCallback(async () => {
    setLoading(true);
    try {
      const result = await employeesApi.getEmployees();
      setEmployees(result);
    } catch {
      setEmployees([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadEmployees();
    }, [loadEmployees]),
  );

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Employees</Text>
        <PrimaryButton label="+ New" onPress={() => navigation.navigate('EmployeeForm')} style={styles.newButton} />
      </View>
      <FlatList
        data={employees}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={loadEmployees} tintColor={colors.primary} />}
        ListEmptyComponent={!loading ? <Text style={styles.empty}>No employees yet.</Text> : null}
        renderItem={({ item }) => (
          <Card
            style={styles.row}
            onPress={() => navigation.navigate('EmployeeForm', { employee: item })}
          >
            <View style={styles.rowLeft}>
              <Text style={styles.name}>{item.fullName}</Text>
              <Text style={styles.meta}>{item.employeeCode} · {item.branchName}</Text>
              <Text style={styles.meta}>{item.email}</Text>
            </View>
            <View style={styles.badges}>
              <StatusPill
                label={EMPLOYEE_ROLE_LABEL[item.role]}
                tone={item.role === EmployeeRoleValue.Admin ? 'warning' : 'neutral'}
              />
              {!item.isActive && <StatusPill label="Inactive" tone="danger" />}
            </View>
          </Card>
        )}
      />
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
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  rowLeft: { flex: 1, marginRight: 12 },
  name: { color: colors.textPrimary, fontWeight: '600', fontSize: 14 },
  meta: { color: colors.textSecondary, fontSize: 12, marginTop: 2 },
  badges: { gap: 6, alignItems: 'flex-end' },
});
