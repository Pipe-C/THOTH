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
  containerClassName?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input: React.FC<InputProps> = ({
  label,
  helperText,
  errorText,
  containerStyle,
  containerClassName = '',
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
    <View style={[styles.container, containerStyle]} className={`w-full ${containerClassName}`}>
      {label ? (
        <Text style={styles.label} className="font-lexend-medium text-xs text-textSecondary mb-1.5">
          {label}
        </Text>
      ) : null}
      <View
        style={[
          styles.inputContainer,
          isFocused && styles.inputFocused,
          isError && styles.inputError,
        ]}
        className={`flex-row items-center bg-white rounded-xl border border-primary/10 px-4 py-3 ${
          isFocused ? 'border-primary' : ''
        } ${isError ? 'border-red-500' : ''}`}
      >
        {leftIcon ? <View style={styles.iconContainer}>{leftIcon}</View> : null}
        <TextInput
          placeholderTextColor={colors.textSecondary}
          style={[styles.input, style]}
          className="flex-1 font-lexend-regular text-sm text-textPrimary py-0"
          onFocus={handleFocus}
          onBlur={handleBlur}
          {...props}
        />
        {rightIcon ? <View style={styles.iconContainer}>{rightIcon}</View> : null}
      </View>
      {errorText ? (
        <Text style={styles.errorText} className="font-lexend-regular text-xs text-red-600 mt-1">
          {errorText}
        </Text>
      ) : helperText ? (
        <Text style={styles.helperText} className="font-lexend-regular text-xs text-textSecondary mt-1">
          {helperText}
        </Text>
      ) : null}
    </View>
  );
};

