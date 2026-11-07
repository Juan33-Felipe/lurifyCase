import React from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useTheme } from '../../context/SettingsContext';

export type Tab = 'cases' | 'caseMap' | 'audit' | 'settings';

type IconName = React.ComponentProps<typeof Icon>['name'];

interface BottomTabBarProps {
  active: Tab;
  onChange: (tab: Tab) => void;
  onFabPress: () => void;
}

const LEFT_TABS: { tab: Tab; icon: IconName }[] = [
  { tab: 'cases', icon: 'home-filled' },
  { tab: 'caseMap', icon: 'description' },
];

const RIGHT_TABS: { tab: Tab; icon: IconName }[] = [
  { tab: 'audit', icon: 'notifications-none' },
  { tab: 'settings', icon: 'person-outline' },
];

/**
 * 5-Slot Bottom Navigation Bar (Part 1.4 & Phase 2.6):
 * - Fixed bottom white bar with rounded top corners (rounded-t-[28px])
 * - 4 icon tabs (Home, Documents/Dockets, Alerts/Audit, Profile) with a small bottom dot for the active tab
 * - Prominent center Floating Action Button (FAB) featuring a dark charcoal circle ('+' icon)
 *   framed by a thick translucent outer ring.
 */
export function BottomTabBar({ active, onChange, onFabPress }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const palette = useTheme();
  const fabScale = useSharedValue(1);
  const fabAnim = useAnimatedStyle(() => ({
    transform: [{ scale: fabScale.value }],
  }));

  const bottomPad = Platform.OS === 'ios' ? Math.max(insets.bottom, 14) : Math.max(insets.bottom, 12);

  return (
    <View
      pointerEvents="box-none"
      style={[
        styles.bar,
        {
          backgroundColor: palette.surface,
          borderColor: palette.border,
          shadowColor: palette.shadow,
          paddingBottom: bottomPad,
        },
      ]}
    >
      <View style={styles.row}>
        {LEFT_TABS.map((item) => (
          <TabSlot
            key={item.tab}
            icon={item.icon}
            active={active === item.tab}
            activeColor={palette.text}
            inactiveColor={palette.textMuted}
            onPress={() => onChange(item.tab)}
          />
        ))}

        {/* Center Slot: Elevated '+' FAB framed by thick translucent outer ring */}
        <View style={styles.fabSlot}>
          <Animated.View style={fabAnim}>
            <Pressable
              onPress={onFabPress}
              onPressIn={() => fabScale.set(withSpring(0.91, { damping: 50, stiffness: 600 }))}
              onPressOut={() => fabScale.set(withSpring(1, { damping: 50, stiffness: 600 }))}
              style={[
                styles.fabOuterRing,
                {
                  backgroundColor: palette.mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(30,30,32,0.08)',
                  borderColor: palette.background,
                },
              ]}
            >
              <View
                style={[
                  styles.fabInnerCircle,
                  {
                    backgroundColor: palette.charcoal,
                    shadowColor: palette.shadow,
                  },
                ]}
              >
                <Icon name="add" size={28} color="#FFFFFF" />
              </View>
            </Pressable>
          </Animated.View>
        </View>

        {RIGHT_TABS.map((item) => (
          <TabSlot
            key={item.tab}
            icon={item.icon}
            active={active === item.tab}
            activeColor={palette.text}
            inactiveColor={palette.textMuted}
            onPress={() => onChange(item.tab)}
          />
        ))}
      </View>
    </View>
  );
}

function TabSlot({
  icon,
  active,
  activeColor,
  inactiveColor,
  onPress,
}: {
  icon: IconName;
  active: boolean;
  activeColor: string;
  inactiveColor: string;
  onPress: () => void;
}) {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={[styles.tabSlot, animStyle]}>
      <Pressable
        onPress={onPress}
        onPressIn={() => scale.set(withSpring(0.9, { damping: 50, stiffness: 600 }))}
        onPressOut={() => scale.set(withSpring(1, { damping: 50, stiffness: 600 }))}
        style={styles.tabPressable}
      >
        <Icon name={icon} size={24} color={active ? activeColor : inactiveColor} />
        <View
          style={[
            styles.activeDot,
            {
              backgroundColor: active ? activeColor : 'transparent',
            },
          ]}
        />
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  bar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderTopWidth: 1,
    paddingTop: 10,
    paddingHorizontal: 14,
    shadowOpacity: 0.08,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: -6 },
    elevation: 14,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    height: 54,
  },
  tabSlot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabPressable: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 14,
  },
  activeDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    marginTop: 5,
  },
  fabSlot: {
    width: 78,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fabOuterRing: {
    width: 68,
    height: 68,
    borderRadius: 34,
    marginTop: -34,
    borderWidth: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fabInnerCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOpacity: 0.25,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
});
