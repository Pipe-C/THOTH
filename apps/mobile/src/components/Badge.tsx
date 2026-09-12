import React from 'react';
import { View, Text, ViewStyle } from 'react-native';
import { styles } from '../styles/Badge.styles';

export type BadgeVariant = 'institutional' | 'web' | 'accent' | 'neutral' | 'outline';

export interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  icon?: React.ReactNode;
  style?: ViewStyle;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  label,
  variant = 'institutional',
  icon,
  style,
  className = '',
}) => {
  const getContainerStyle = () => {
    switch (variant) {
      case 'institutional':
        return styles.institutionalContainer;
      case 'web':
        return styles.webContainer;
      case 'accent':
        return styles.accentContainer;
      case 'outline':
        return styles.outlineContainer;
      case 'neutral':
      default:
        return styles.neutralContainer;
    }
  };

  const getTextStyle = () => {
    switch (variant) {
      case 'institutional':
        return styles.institutionalText;
      case 'web':
        return styles.webText;
      case 'accent':
        return styles.accentText;
      case 'outline':
        return styles.outlineText;
      case 'neutral':
      default:
        return styles.neutralText;
    }
  };

  return (
    <View
      style={[styles.badgeBase, getContainerStyle(), style]}
      className={`flex-row items-center px-2.5 py-1 rounded-full self-start ${className}`}
    >
      {icon ? <View style={styles.icon}>{icon}</View> : null}
      <Text style={[styles.textBase, getTextStyle()]} className="font-lexend-medium text-xs">
        {label}
      </Text>
    </View>
  );
};

