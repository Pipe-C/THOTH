import React from 'react';
import { View, ViewProps } from 'react-native';
import { styles } from '../styles/Card.styles';

export interface CardProps extends ViewProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'elevated' | 'paper';
}

export const Card: React.FC<CardProps> = ({
  children,
  style,
  className = '',
  variant = 'default',
  ...props
}) => {
  const cardStyle = [
    styles.card,
    variant === 'elevated' && styles.elevated,
    variant === 'paper' && styles.paper,
    style,
  ];

  return (
    <View
      style={cardStyle}
      className={`bg-white rounded-2xl border border-primary/10 p-5 ${className}`}
      {...props}
    >
      {children}
    </View>
  );
};

