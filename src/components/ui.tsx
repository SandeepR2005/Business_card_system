import React from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import { EVA } from '../utils/theme';

const { width } = Dimensions.get('window');

export interface IconProps {
  name: string;
  size?: number;
  color?: string;
}

// Simplified icon component for React Native
export const Icon: React.FC<IconProps> = ({ name, size = 20, color = EVA.ink }) => {
  const iconMap: { [key: string]: string } = {
    home: '🏠',
    users: '👥',
    scan: '📸',
    chart: '📊',
    target: '🎯',
    user: '👤',
    phone: '☎️',
    mail: '✉️',
    close: '✕',
    check: '✓',
    chevR: '›',
    chevL: '‹',
    eye: '👁',
    settings: '⚙️',
    building: '🏢',
    calendar: '📅',
    clock: '🕐',
    bell: '🔔',
    edit: '✎',
    note: '📝',
    search: '🔍',
    filter: '⊙',
    plus: '+',
    download: '⬇',
    tag: '🏷',
    flash: '⚡',
    image: '🖼',
    warn: '⚠',
    refresh: '🔄',
    whats: '💬',
    // Missing icons added:
    camera: '📷',
    'arrow-left': '←',
    'check-circle': '✅',
    'alert-circle': '⚠️',
    map: '📍',
    call: '📞',
    email: '📧',
    status: '🔖',
  };

  return (
    <Text style={{ fontSize: size, color, lineHeight: size }}>
      {iconMap[name] || '•'}
    </Text>
  );
};

export interface ButtonProps {
  onPress: () => void;
  title: string;
  kind?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  style?: any;
  full?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  onPress,
  title,
  kind = 'primary',
  size = 'md',
  disabled = false,
  style,
  full = false,
}) => {
  const baseStyle = {
    borderRadius: 12,
    fontWeight: '600',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  };

  const kinds = {
    primary: {
      backgroundColor: EVA.green,
      color: '#fff',
    },
    secondary: {
      backgroundColor: EVA.surface,
      borderWidth: 1,
      borderColor: EVA.hairline,
      color: EVA.ink,
    },
    ghost: {
      backgroundColor: 'transparent',
      color: EVA.green,
    },
  };

  const sizes = {
    sm: { paddingVertical: 8, paddingHorizontal: 12, fontSize: 12 },
    md: { paddingVertical: 12, paddingHorizontal: 16, fontSize: 14 },
    lg: { paddingVertical: 16, paddingHorizontal: 20, fontSize: 16 },
  };

  const isDisabled = disabled;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.75}
      style={[
        {
          ...baseStyle,
          ...kinds[kind],
          ...sizes[size],
          opacity: isDisabled ? 0.5 : 1,
          width: full ? '100%' : 'auto',
        },
        style,
      ]}
    >
      <Text style={{ color: kinds[kind].color, fontWeight: '600', fontSize: sizes[size].fontSize }}>
        {title}
      </Text>
    </TouchableOpacity>
  );
};

export const AppBar: React.FC<{
  title: string;
  left?: React.ReactNode;
  right?: React.ReactNode;
  dark?: boolean;
  sub?: string;
}> = ({ title, left, right, dark = false, sub }) => {
  return (
    <View
      style={{
        backgroundColor: dark ? EVA.greenInk : EVA.surface,
        borderBottomWidth: 1,
        borderBottomColor: dark ? 'rgba(255,255,255,0.08)' : EVA.hairline,
        paddingTop: 12,
        paddingBottom: 14,
        paddingHorizontal: 20,
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        minHeight: 56,
      }}
    >
      <View style={{ width: 28 }}>{left}</View>
      <View style={{ flex: 1 }}>
        <Text
          style={{
            fontSize: 17,
            fontWeight: '600',
            color: dark ? '#fff' : EVA.ink,
            letterSpacing: -0.2,
          }}
        >
          {title}
        </Text>
        {sub && (
          <Text
            style={{
              fontSize: 12,
              color: dark ? 'rgba(255,255,255,0.55)' : EVA.muted,
              marginTop: 2,
            }}
          >
            {sub}
          </Text>
        )}
      </View>
      <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        {right}
      </View>
    </View>
  );
};

export const Card: React.FC<{
  children: React.ReactNode;
  onPress?: () => void;
  style?: any;
}> = ({ children, onPress, style }) => {
  return (
    <View
      style={{
        backgroundColor: EVA.surface,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: EVA.hairline,
        padding: 16,
        marginBottom: 12,
        ...style,
      }}
    >
      {children}
    </View>
  );
};

export const Chip: React.FC<{ label: string; onPress?: () => void }> = ({ label, onPress }) => {
  return (
    <View
      style={{
        backgroundColor: EVA.greenSoft,
        borderRadius: 8,
        paddingVertical: 6,
        paddingHorizontal: 12,
        marginRight: 8,
        marginBottom: 8,
      }}
    >
      <Text style={{ color: EVA.greenDeep, fontSize: 12, fontWeight: '500' }}>{label}</Text>
    </View>
  );
};
