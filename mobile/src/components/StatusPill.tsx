import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/colors';

type Tone = 'success' | 'danger' | 'warning' | 'neutral';

export function StatusPill({ label, tone = 'neutral' }: { label: string; tone?: Tone }) {
  return (
    <View style={[styles.pill, toneStyles[tone].pill]}>
      <Text style={[styles.text, toneStyles[tone].text]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 12,
    fontWeight: '700',
  },
});

const toneStyles: Record<Tone, { pill: object; text: object }> = {
  success: { pill: { backgroundColor: '#103D2E' }, text: { color: colors.success } },
  danger: { pill: { backgroundColor: '#3D1620' }, text: { color: colors.danger } },
  warning: { pill: { backgroundColor: '#3D2C10' }, text: { color: colors.warning } },
  neutral: { pill: { backgroundColor: colors.surfaceAlt }, text: { color: colors.textSecondary } },
};
