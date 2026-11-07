import React from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { WavePatternBackground } from './WavePatternBackground';
import { useSettings, useTheme } from '../../context/SettingsContext';
import { fonts } from '../../theme/theme';

interface HeroHeaderProps {
  greeting: string;
  headline: string;
  userName?: string;
  searchQuery: string;
  onSearchChange: (text: string) => void;
  searchPlaceholder: string;
  onFilterPress?: () => void;
  activeFilterLabel?: string;
  onAvatarPress?: () => void;
}

/**
 * Screen 1 Hero Header Card (Part 1.3 & Phase 2.1):
 * - Dark charcoal block (#242426) with rounded bottom corners (rounded-b-[32px])
 * - Subtle abstract SVG wave line overlay
 * - User greeting, bold 26px headline, and circular profile avatar on the right
 * - Overlapping floating white search bar straddling the bottom edge with a right dark rounded-xl filter button
 */
export function HeroHeader({
  greeting,
  headline,
  userName,
  searchQuery,
  onSearchChange,
  searchPlaceholder,
  onFilterPress,
  activeFilterLabel,
  onAvatarPress,
}: HeroHeaderProps) {
  const insets = useSafeAreaInsets();
  const palette = useTheme();
  const { theme } = useSettings();
  const filterScale = useSharedValue(1);
  const filterAnim = useAnimatedStyle(() => ({ transform: [{ scale: filterScale.value }] }));

  const initials = (userName || 'LC')
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <View style={styles.wrapper}>
      {/* Dark Charcoal Hero Block with rounded-b-[32px] */}
      <View
        className="rounded-b-[32px] overflow-hidden"
        style={[
          styles.heroBlock,
          {
            backgroundColor: palette.charcoal,
            paddingTop: insets.top + 18,
          },
        ]}
      >
        <WavePatternBackground variant="hero" />

        {/* Greeting + Avatar Row */}
        <View style={styles.topRow}>
          <View style={styles.titleColumn}>
            <Text
              style={{
                fontFamily: fonts.medium,
                fontSize: 13.5,
                color: palette.onCharcoalMuted,
                marginBottom: 6,
              }}
            >
              {greeting}
            </Text>
            <Text
              style={{
                fontFamily: fonts.hero,
                fontSize: 26,
                lineHeight: 33,
                letterSpacing: -0.5,
                color: palette.onCharcoal,
              }}
            >
              {headline}
            </Text>
          </View>

          <Pressable onPress={onAvatarPress} style={styles.avatarOuter}>
            <View style={styles.avatarRing}>
              <View style={styles.avatarCircle}>
                <Text
                  style={{
                    fontFamily: fonts.heading,
                    fontSize: 15,
                    color: '#1E1E20',
                  }}
                >
                  {initials}
                </Text>
              </View>
            </View>
          </Pressable>
        </View>
      </View>

      {/* Overlapping Floating Search Container straddling bottom edge */}
      <View style={styles.searchOuter}>
        <View
          style={[
            styles.searchContainer,
            {
              backgroundColor: theme === 'dark' ? '#242428' : '#FFFFFF',
              shadowColor: palette.shadow,
              borderColor: theme === 'dark' ? '#32343D' : '#ECEEF5',
            },
          ]}
        >
          <Icon name="search" size={21} color={palette.textMuted} style={{ marginLeft: 6, marginRight: 10 }} />
          <TextInput
            value={searchQuery}
            onChangeText={onSearchChange}
            placeholder={searchPlaceholder}
            placeholderTextColor={palette.textMuted}
            style={{
              flex: 1,
              fontFamily: fonts.body,
              fontSize: 14,
              color: palette.text,
              paddingVertical: 10,
            }}
          />
          {searchQuery.length > 0 ? (
            <Pressable onPress={() => onSearchChange('')} hitSlop={8} style={{ paddingHorizontal: 6 }}>
              <Icon name="close" size={18} color={palette.textMuted} />
            </Pressable>
          ) : null}

          <Animated.View style={filterAnim}>
            <Pressable
              onPress={onFilterPress}
              onPressIn={() => filterScale.set(withSpring(0.93, { damping: 50, stiffness: 600 }))}
              onPressOut={() => filterScale.set(withSpring(1, { damping: 50, stiffness: 600 }))}
              style={[
                styles.filterButton,
                {
                  backgroundColor: palette.charcoalDeep,
                },
              ]}
            >
              <Icon name="tune" size={18} color="#FFFFFF" />
              {activeFilterLabel ? (
                <Text
                  style={{
                    fontFamily: fonts.medium,
                    fontSize: 11,
                    color: '#FFFFFF',
                    marginLeft: 5,
                  }}
                >
                  {activeFilterLabel}
                </Text>
              ) : null}
            </Pressable>
          </Animated.View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 8,
  },
  heroBlock: {
    paddingHorizontal: 24,
    paddingBottom: 52,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 16,
  },
  titleColumn: {
    flex: 1,
  },
  avatarOuter: {
    marginTop: 2,
  },
  avatarRing: {
    width: 50,
    height: 50,
    borderRadius: 25,
    padding: 2,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.28)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#F1F4FB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchOuter: {
    paddingHorizontal: 24,
    marginTop: -28,
  },
  searchContainer: {
    height: 56,
    borderRadius: 18,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    shadowOpacity: 0.08,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  filterButton: {
    minWidth: 40,
    height: 40,
    paddingHorizontal: 11,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
