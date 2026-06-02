import {
  Modal,
  View,
  Text,
  Pressable,
  Animated,
  PanResponder,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  type ViewStyle,
} from 'react-native';
import { useEffect, useRef } from 'react';
import { useTheme } from '@/hooks/useTheme';

const SCREEN_HEIGHT = Dimensions.get('window').height;
const CLOSE_THRESHOLD = 80;

interface BottomSheetProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  /** Altura máxima como fracción de pantalla (0–1), default 0.75 */
  maxHeightRatio?: number;
  style?: ViewStyle;
}

export function BottomSheet({
  visible,
  onClose,
  title,
  children,
  maxHeightRatio = 0.75,
  style,
}: BottomSheetProps) {
  const { colors, isDark } = useTheme();
  const translateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          damping: 22,
          stiffness: 200,
          useNativeDriver: true,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: 220,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: SCREEN_HEIGHT,
          duration: 260,
          useNativeDriver: true,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 0,
          duration: 220,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => g.dy > 5,
      onPanResponderMove: (_, g) => {
        if (g.dy > 0) translateY.setValue(g.dy);
      },
      onPanResponderRelease: (_, g) => {
        if (g.dy > CLOSE_THRESHOLD) {
          onClose();
        } else {
          Animated.spring(translateY, {
            toValue: 0,
            damping: 22,
            stiffness: 200,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onClose}
      accessibilityViewIsModal
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        {/* Backdrop */}
        <Animated.View
          style={{
            ...StyleSheet.absoluteFillObject,
            backgroundColor: isDark ? 'rgba(0,0,0,0.7)' : 'rgba(0,0,0,0.45)',
            opacity: backdropOpacity,
          }}
          pointerEvents={visible ? 'box-none' : 'none'}
        >
          <Pressable style={{ flex: 1 }} onPress={onClose} />
        </Animated.View>

        {/* Sheet */}
        <Animated.View
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            maxHeight: SCREEN_HEIGHT * maxHeightRatio,
            backgroundColor: colors.surfaceElevated,
            borderTopLeftRadius: 28,
            borderTopRightRadius: 28,
            overflow: 'hidden',
            transform: [{ translateY }],
            shadowColor: '#000',
            shadowOffset: { width: 0, height: -4 },
            shadowOpacity: isDark ? 0.4 : 0.1,
            shadowRadius: 16,
            elevation: 12,
            ...style,
          }}
        >
          {/* Drag handle */}
          <View {...panResponder.panHandlers} style={{ paddingTop: 12, paddingBottom: 4, alignItems: 'center' }}>
            <View
              style={{
                width: 36,
                height: 4,
                borderRadius: 2,
                backgroundColor: colors.border,
              }}
            />
          </View>

          {/* Title */}
          {title ? (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingHorizontal: 20,
                paddingTop: 8,
                paddingBottom: 12,
              }}
            >
              <Text style={{ fontSize: 17, fontWeight: '600', color: colors.text }}>
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

          <View style={{ paddingHorizontal: 20, paddingBottom: 32 }}>
            {children}
          </View>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// StyleSheet needed for absoluteFillObject
import { StyleSheet } from 'react-native';
