import {
  View,
  Text,
  TextInput,
  Pressable,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';
import { useState } from 'react';
import { useTheme } from '@/hooks/useTheme';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  helper?: string;
  containerStyle?: ViewStyle;
  isPassword?: boolean;
}

export function Input({
  label,
  error,
  helper,
  containerStyle,
  isPassword = false,
  editable = true,
  ...rest
}: InputProps) {
  const { colors, accent } = useTheme();
  const [focused, setFocused] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const borderColor = error
    ? colors.destructive
    : focused
    ? accent
    : colors.border;

  return (
    <View style={containerStyle}>
      {label ? (
        <Text
          style={{
            fontSize: 12,
            fontWeight: '500',
            color: error ? colors.destructive : colors.textSecondary,
            marginBottom: 6,
            marginLeft: 2,
          }}
        >
          {label}
        </Text>
      ) : null}

      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: colors.surface,
          borderRadius: 16,
          borderWidth: 1,
          borderColor,
          paddingHorizontal: 16,
          minHeight: 52,
        }}
      >
        <TextInput
          style={{
            flex: 1,
            fontSize: 16,
            color: editable ? colors.text : colors.textTertiary,
            paddingVertical: 14,
          }}
          placeholderTextColor={colors.placeholder}
          secureTextEntry={isPassword && !showPass}
          editable={editable}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          {...rest}
        />

        {isPassword ? (
          <Pressable onPress={() => setShowPass(v => !v)} hitSlop={8}>
            <Text style={{ fontSize: 13, color: colors.textTertiary }}>
              {showPass ? 'Ocultar' : 'Ver'}
            </Text>
          </Pressable>
        ) : null}
      </View>

      {error ? (
        <Text
          style={{
            fontSize: 12,
            color: colors.destructive,
            marginTop: 4,
            marginLeft: 2,
          }}
          accessibilityRole="alert"
        >
          {error}
        </Text>
      ) : helper ? (
        <Text
          style={{
            fontSize: 12,
            color: colors.textTertiary,
            marginTop: 4,
            marginLeft: 2,
          }}
        >
          {helper}
        </Text>
      ) : null}
    </View>
  );
}
