import React from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, ViewStyle } from 'react-native';
import { colors } from '../theme/colors';

interface Props {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'primary' | 'danger' | 'outline';
  style?: ViewStyle;
}

export function PrimaryButton({ label, onPress, loading, disabled, variant = 'primary', style }: Props) {
  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      style={[styles.base, variantStyles[variant], isDisabled && styles.disabled, style]}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'outline' ? colors.primary : '#fff'} />
      ) : (
        <Text style={[styles.label, variant === 'outline' && styles.labelOutline]}>{label}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabled: {
    opacity: 0.5,
  },
  label: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  labelOutline: {
    color: colors.primary,
  },
});

const variantStyles: Record<string, ViewStyle> = {
  primary: { backgroundColor: colors.primary },
  danger: { backgroundColor: colors.danger },
  outline: { backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.primary },
};
