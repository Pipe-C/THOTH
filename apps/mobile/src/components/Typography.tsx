import React from 'react';
import { Text, TextProps } from 'react-native';
import { styles } from '../styles/Typography.styles';

interface CustomTextProps extends TextProps {
  children: React.ReactNode;
  className?: string;
}

export const Display: React.FC<CustomTextProps> = ({ children, style, className = '', ...props }) => (
  <Text
    style={[styles.display, style]}
    className={`font-lexend-bold text-3xl font-bold tracking-tight text-primary ${className}`}
    {...props}
  >
    {children}
  </Text>
);

export const Subtitle: React.FC<CustomTextProps> = ({ children, style, className = '', ...props }) => (
  <Text
    style={[styles.subtitle, style]}
    className={`font-lexend-semibold text-xl font-semibold text-textPrimary ${className}`}
    {...props}
  >
    {children}
  </Text>
);

export const CardHeader: React.FC<CustomTextProps> = ({ children, style, className = '', ...props }) => (
  <Text
    style={[styles.cardHeader, style]}
    className={`font-lexend-semibold text-base font-semibold text-textPrimary ${className}`}
    {...props}
  >
    {children}
  </Text>
);

export const Body: React.FC<CustomTextProps> = ({ children, style, className = '', ...props }) => (
  <Text
    style={[styles.body, style]}
    className={`font-lexend-regular text-sm font-normal leading-relaxed text-textPrimary ${className}`}
    {...props}
  >
    {children}
  </Text>
);

export const MicroCopy: React.FC<CustomTextProps> = ({ children, style, className = '', ...props }) => (
  <Text
    style={[styles.microCopy, style]}
    className={`font-lexend-medium text-xs font-medium text-textSecondary ${className}`}
    {...props}
  >
    {children}
  </Text>
);

