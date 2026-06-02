import {
  Modal as RNModal,
  View,
  Text,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  type ViewStyle,
} from 'react-native';
import { useTheme } from '@/hooks/useTheme';

interface ModalProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  /** Si true, tocar el backdrop NO cierra el modal */
  preventBackdropClose?: boolean;
  style?: ViewStyle;
}

export function Modal({
  visible,
  onClose,
  title,
  children,
  preventBackdropClose = false,
  style,
}: ModalProps) {
  const { colors, isDark } = useTheme();

  return (
    <RNModal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
      accessibilityViewIsModal
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        {/* Backdrop */}
        <Pressable
          style={{
            flex: 1,
            backgroundColor: isDark ? 'rgba(0,0,0,0.7)' : 'rgba(0,0,0,0.45)',
            justifyContent: 'center',
            alignItems: 'center',
            padding: 20,
          }}
          onPress={preventBackdropClose ? undefined : onClose}
          accessibilityRole="button"
          accessibilityLabel="Cerrar modal"
        >
          {/* Sheet — prevent tap propagation to backdrop */}
          <Pressable
            style={[
              {
                width: '100%',
                maxHeight: '88%',
                backgroundColor: colors.surfaceElevated,
                borderRadius: 24,
                padding: 24,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: isDark ? 0.5 : 0.12,
                shadowRadius: 24,
                elevation: 8,
              },
              style,
            ]}
          >
            {/* Header */}
            {title ? (
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 16,
                }}
              >
                <Text
                  style={{
                    fontSize: 18,
                    fontWeight: '600',
                    color: colors.text,
                    flex: 1,
                  }}
                >
                  {title}
                </Text>
                <Pressable
                  onPress={onClose}
                  hitSlop={10}
                  accessibilityRole="button"
                  accessibilityLabel="Cerrar"
                  style={{
                    width: 30,
                    height: 30,
                    borderRadius: 15,
                    backgroundColor: colors.surface,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Text style={{ fontSize: 16, color: colors.textSecondary }}>✕</Text>
                </Pressable>
              </View>
            ) : null}

            {children}
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </RNModal>
  );
}
