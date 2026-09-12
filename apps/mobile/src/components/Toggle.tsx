import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  ViewStyle,
} from 'react-native';
import { colors } from '../theme/tokens';
import { styles } from '../styles/Toggle.styles';

export interface ToggleProps {
  value: boolean;
  onValueChange: (newValue: boolean) => void;
  label?: string;
  description?: string;
  disabled?: boolean;
  containerStyle?: ViewStyle;
  className?: string;
}

export const Toggle: React.FC<ToggleProps> = ({
  value,
  onValueChange,
  label,
  description,
  disabled = false,
  containerStyle,
  className = '',
}) => {
  const animatedValue = useRef(new Animated.Value(value ? 1 : 0)).current;

  useEffect(() => {
    Animated.spring(animatedValue, {
      toValue: value ? 1 : 0,
      useNativeDriver: false,
      bounciness: 4,
      speed: 12,
    }).start();
  }, [value, animatedValue]);

  const toggleInterpolation = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [2, 22],
  });

  const backgroundColorInterpolation = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [colors.toggleOff, colors.accent],
  });

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      disabled={disabled}
      onPress={() => onValueChange(!value)}
      style={[styles.container, containerStyle]}
      className={`flex-row items-center justify-between py-2 ${disabled ? 'opacity-50' : ''} ${className}`}
    >
      <View style={styles.textContainer} className="flex-1 mr-4">
        {label ? (
          <Text style={styles.label} className="font-lexend-semibold text-sm text-textPrimary">
            {label}
          </Text>
        ) : null}
        {description ? (
          <Text style={styles.description} className="font-lexend-regular text-xs text-textSecondary mt-0.5">
            {description}
          </Text>
        ) : null}
      </View>
      <Animated.View
        style={[
          styles.track,
          {
            backgroundColor: backgroundColorInterpolation,
          },
        ]}
      >
        <Animated.View
          style={[
            styles.thumb,
            {
              transform: [{ translateX: toggleInterpolation }],
            },
          ]}
        />
      </Animated.View>
    </TouchableOpacity>
  );
};

