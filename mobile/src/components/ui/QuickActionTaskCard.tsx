import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useTheme } from '../../context/SettingsContext';
import { fonts } from '../../theme/theme';

export interface QuickActionTaskCardProps {
  title: string;
  subtitle?: string;
  checked?: boolean;
  statusColor?: string;
  onToggle?: () => void;
  onPress?: () => void;
}

/**
 * Compact Task List Card ("Tasks" -> "Pending Actions", Part 1.3 & Phase 2.3):
 * - Full-width horizontal white card (rounded-2xl) with soft ambient shadow
 * - Left custom rounded-lg checkbox (solid charcoal when checked)
 * - 2-line clean legal description
 * - Right status dot indicator
 */
export function QuickActionTaskCard({
  title,
  subtitle,
  checked = false,
  statusColor,
  onToggle,
  onPress,
}: QuickActionTaskCardProps) {
  const palette = useTheme();
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const dotColor = statusColor ?? (checked ? palette.charcoal : palette.border);

  return (
    <Animated.View style={animStyle}>
      <Pressable
        onPress={onPress ?? onToggle}
        onPressIn={() => scale.set(withSpring(0.985, { damping: 50, stiffness: 600 }))}
        onPressOut={() => scale.set(withSpring(1, { damping: 50, stiffness: 600 }))}
        style={[
          styles.card,
          {
            backgroundColor: palette.surface,
            borderColor: palette.border,
            shadowColor: palette.shadow,
          },
        ]}
      >
        {/* Left custom rounded-lg checkbox */}
        <Pressable
          onPress={onToggle ?? onPress}
          hitSlop={8}
          style={[
            styles.checkbox,
            checked
              ? {
                  backgroundColor: palette.charcoal,
                  borderColor: palette.charcoal,
                }
              : {
                  backgroundColor: 'transparent',
                  borderColor: palette.textMuted,
                },
          ]}
        >
          {checked ? <Icon name="check" size={15} color="#FFFFFF" /> : null}
        </Pressable>

        {/* 2-line description */}
        <View style={styles.textColumn}>
          <Text
            numberOfLines={2}
            style={{
              fontFamily: checked ? fonts.medium : fonts.semibold,
              fontSize: 13.5,
              lineHeight: 19,
              color: palette.text,
            }}
          >
            {title}
          </Text>
          {subtitle ? (
            <Text
              numberOfLines={1}
              style={{
                fontFamily: fonts.body,
                fontSize: 12,
                color: palette.textMuted,
                marginTop: 2,
              }}
            >
              {subtitle}
            </Text>
          ) : null}
        </View>

        {/* Right status dot indicator */}
        <View
          style={[
            styles.statusDot,
            {
              backgroundColor: dotColor,
            },
          ]}
        />
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 18,
    paddingHorizontal: 18,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderWidth: 1,
    shadowOpacity: 0.04,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 7,
    borderWidth: 1.6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textColumn: {
    flex: 1,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
