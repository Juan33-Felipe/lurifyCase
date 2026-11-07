import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useSettings, useTheme } from '../../context/SettingsContext';
import { fonts } from '../../theme/theme';

export interface DateStripDay {
  key: string;
  date: Date;
  dayNumber: string;
  weekday: string;
}

interface DateStripSelectorProps {
  selectedDateKey: string;
  onSelectDate: (key: string, date: Date) => void;
  anchorDate?: Date;
}

const EN_WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const ES_WEEKDAYS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

export function toDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * Screen 2 Horizontal 7-Day Date Strip Selector (Part 1.4 & Phase 2.5):
 * - 7-day horizontal row showing day number and 3-letter weekday.
 * - The active day is wrapped in a vertical dark charcoal pill (rounded-full)
 *   with white text, a bottom dot indicator, and a soft drop shadow.
 */
export function DateStripSelector({
  selectedDateKey,
  onSelectDate,
  anchorDate,
}: DateStripSelectorProps) {
  const palette = useTheme();
  const { language } = useSettings();

  const days = useMemo<DateStripDay[]>(() => {
    const base = anchorDate ? new Date(anchorDate) : new Date();
    const labels = language === 'es' ? ES_WEEKDAYS : EN_WEEKDAYS;
    // Center today at index 3 of the 7-day strip (-3 .. +3)
    return Array.from({ length: 7 }, (_, i) => {
      const offset = i - 3;
      const d = new Date(base);
      d.setDate(base.getDate() + offset);
      return {
        key: toDateKey(d),
        date: d,
        dayNumber: String(d.getDate()).padStart(2, '0'),
        weekday: labels[d.getDay()],
      };
    });
  }, [anchorDate, language]);

  return (
    <View style={styles.row}>
      {days.map((item) => (
        <DayPill
          key={item.key}
          item={item}
          active={item.key === selectedDateKey}
          onPress={() => onSelectDate(item.key, item.date)}
          charcoal={palette.charcoal}
          textColor={palette.text}
          mutedColor={palette.textMuted}
          shadowColor={palette.shadow}
        />
      ))}
    </View>
  );
}

function DayPill({
  item,
  active,
  onPress,
  charcoal,
  textColor,
  mutedColor,
  shadowColor,
}: {
  item: DateStripDay;
  active: boolean;
  onPress: () => void;
  charcoal: string;
  textColor: string;
  mutedColor: string;
  shadowColor: string;
}) {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={[styles.itemWrapper, animStyle]}>
      <Pressable
        onPress={onPress}
        onPressIn={() => scale.set(withSpring(0.92, { damping: 50, stiffness: 600 }))}
        onPressOut={() => scale.set(withSpring(1, { damping: 50, stiffness: 600 }))}
        style={[
          styles.pill,
          active
            ? {
                backgroundColor: charcoal,
                shadowColor,
                shadowOpacity: 0.2,
                shadowRadius: 12,
                shadowOffset: { width: 0, height: 6 },
                elevation: 5,
              }
            : {
                backgroundColor: 'transparent',
              },
        ]}
      >
        <Text
          style={{
            fontFamily: active ? fonts.heading : fonts.semibold,
            fontSize: 16,
            color: active ? '#FFFFFF' : textColor,
          }}
        >
          {item.dayNumber}
        </Text>
        <Text
          style={{
            fontFamily: fonts.medium,
            fontSize: 11.5,
            color: active ? '#A1A1AA' : mutedColor,
            marginTop: 4,
          }}
        >
          {item.weekday}
        </Text>
        <View
          style={[
            styles.dot,
            {
              backgroundColor: active ? '#FFFFFF' : 'transparent',
            },
          ]}
        />
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  itemWrapper: {
    flex: 1,
    alignItems: 'center',
  },
  pill: {
    width: 44,
    paddingVertical: 12,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginTop: 6,
  },
});
