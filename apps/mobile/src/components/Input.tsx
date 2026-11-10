import React, { useState } from 'react';
import {
  View,
  TextInput,
  Text,
  TextInputProps,
  ViewStyle,
} from 'react-native';
import { colors } from '../theme/tokens';
import { styles } from '../styles/Input.styles';

export interface InputProps extends TextInputProps {
  label?: string;
  helperText?: string;
  errorText?: string;
  containerStyle?: ViewStyle;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input: React.FC<InputProps> = ({
  label,
  helperText,
  errorText,
  containerStyle,
  leftIcon,
  rightIcon,
  style,
  onFocus,
  onBlur,
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);

  const handleFocus = (e: any) => {
    setIsFocused(true);
    onFocus?.(e);
  };

  const handleBlur = (e: any) => {
    setIsFocused(false);
    onBlur?.(e);
  };

  const isError = Boolean(errorText);

  return (
    <View style={[styles.container, containerStyle]}>
      {label ? (
        <Text style={styles.label}>
          {label}
        </Text>
      ) : null}
      <View
        collapsable={false}
        style={[
          styles.inputContainer,
          isFocused && styles.inputFocused,
          isError && styles.inputError,
        ]}
      >
        {leftIcon ? <View style={styles.iconLeft}>{leftIcon}</View> : null}
        <TextInput
          accessibilityLabel={props.accessibilityLabel ?? label}
          placeholderTextColor={colors.textSecondary}
          selectionColor={colors.primary}
          style={[styles.input, style]}
          onFocus={handleFocus}
          onBlur={handleBlur}
          {...props}
        />
        {rightIcon ? <View style={styles.iconRight}>{rightIcon}</View> : null}
      </View>
      {errorText ? (
        <Text style={styles.errorText}>
          {errorText}
        </Text>
      ) : helperText ? (
        <Text style={styles.helperText}>
          {helperText}
        </Text>
      ) : null}
    </View>
  );
};
