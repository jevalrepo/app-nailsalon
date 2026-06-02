import React, { useRef } from 'react';
import { View, Text, ActivityIndicator, TouchableOpacity, Animated } from 'react-native';
import { useSyncContext } from '@/lib/sync/SyncProvider';
import { useTheme } from '@/hooks/useTheme';

export function SyncStatusBadge() {
  const { isConnected, isSyncing, pendingCount, triggerSync } = useSyncContext();
  const { colors, isDark } = useTheme();
  const shakeAnim = useRef(new Animated.Value(0)).current;

  if (isConnected === null) return null;

  let dotColor: string;
  let label: string;

  if (!isConnected && pendingCount === 0) {
    dotColor = '#FF453A';
    label = 'Sin conexión';
  } else if (!isConnected && pendingCount > 0) {
    dotColor = '#FF9F0A';
    label = `${pendingCount} pendiente${pendingCount > 1 ? 's' : ''}`;
  } else if (isSyncing && isConnected) {
    dotColor = '#FF9F0A';
    label = 'Sincronizando...';
  } else if (pendingCount > 0) {
    dotColor = '#FF9F0A';
    label = `${pendingCount} pendiente${pendingCount > 1 ? 's' : ''}`;
  } else {
    dotColor = '#30D158';
    label = 'Sincronizado';
  }

  const tappable = pendingCount > 0 && !isSyncing;

  function handlePress() {
    if (!isConnected) {
      // Shake para indicar que no hay red
      Animated.sequence([
        Animated.timing(shakeAnim, { toValue: 4, duration: 60, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -4, duration: 60, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 4, duration: 60, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
      ]).start();
      return;
    }
    if (tappable) triggerSync();
  }

  const badge = (
    <Animated.View style={{ transform: [{ translateX: shakeAnim }] }}>
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 100,
        backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
      }}>
        {isSyncing && isConnected ? (
          <ActivityIndicator size="small" color={dotColor} style={{ width: 8, height: 8, transform: [{ scale: 0.6 }] }} />
        ) : (
          <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: dotColor }} />
        )}
        <Text style={{ fontSize: 11, color: colors.textSecondary, fontWeight: '500' }}>
          {label}
        </Text>
      </View>
    </Animated.View>
  );

  return (
    <TouchableOpacity onPress={handlePress} activeOpacity={tappable ? 0.6 : 1}>
      {badge}
    </TouchableOpacity>
  );
}
