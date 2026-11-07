import React from 'react';
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { WavePatternBackground } from './WavePatternBackground';
import { useTheme } from '../../context/SettingsContext';
import { fonts } from '../../theme/theme';

type IconName = React.ComponentProps<typeof Icon>['name'];

export interface CaseCarouselCardProps {
  variant?: 'primary' | 'secondary';
  title: string;
  summary: string;
  reference?: string;
  icon?: IconName;
  isTranslated?: boolean;
  onPress?: () => void;
  onArrowPress?: () => void;
}

/**
 * Horizontal Carousel Card ("Project" -> "Active Cases", Part 1.3 & Phase 2.2):
 * - Tall vertical card (~58% of screen width, height 215px, rounded-[28px])
 * - Primary variant: Dark charcoal (#242426) with subtle SVG wave lines, top-left white circular icon,
 *   bold white title, 3-line muted silver description, bottom-right white circular arrow button ('>').
 * - Secondary variant: Soft ice-blue / pale lavender (#F1F4FB), dark icon on white circle, dark typography,
 *   and bottom-right subtle arrow button.
 */
export function CaseCarouselCard({
  variant = 'secondary',
  title,
  summary,
  reference,
  icon = 'gavel',
  isTranslated,
  onPress,
  onArrowPress,
}: CaseCarouselCardProps) {
  const palette = useTheme();
  const { width } = useWindowDimensions();
  const cardWidth = Math.min(Math.max(width * 0.56, 200), 245);

  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const isPrimary = variant === 'primary';
  const bg = isPrimary ? palette.charcoal : palette.secondaryCard;
  const titleColor = isPrimary ? palette.onCharcoal : palette.onSecondaryCard;
  const subColor = isPrimary ? palette.onCharcoalMuted : palette.onSecondaryCardMuted;

  return (
    <Animated.View style={[{ width: cardWidth }, animStyle]}>
      <Pressable
        onPress={onPress}
        onPressIn={() => scale.set(withSpring(0.97, { damping: 50, stiffness: 600 }))}
        onPressOut={() => scale.set(withSpring(1, { damping: 50, stiffness: 600 }))}
        style={[
          styles.card,
          {
            backgroundColor: bg,
            shadowColor: palette.shadow,
            shadowOpacity: isPrimary ? 0.18 : 0.05,
          },
        ]}
      >
        {isPrimary ? <WavePatternBackground variant="card" /> : null}

        {/* Top Row: Circular white icon container + optional docket reference & translation indicator */}
        <View style={styles.topRow}>
          <View style={styles.iconCircle}>
            <Icon name={icon} size={20} color="#1E1E20" />
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
            {isTranslated ? (
              <Icon name="translate" size={13} color={subColor} style={{ opacity: 0.8 }} />
            ) : null}
            {reference ? (
              <Text
                numberOfLines={1}
                style={{
                  fontFamily: fonts.medium,
                  fontSize: 11,
                  color: subColor,
                  maxWidth: 88,
                }}
              >
                {reference}
              </Text>
            ) : null}
          </View>
        </View>

        {/* Middle: Bold Title + 3-line Subtitle */}
        <View style={styles.textBlock}>
          <Text
            numberOfLines={2}
            style={{
              fontFamily: fonts.heading,
              fontSize: 17,
              lineHeight: 22,
              color: titleColor,
              marginBottom: 6,
            }}
          >
            {title}
          </Text>
          <Text
            numberOfLines={3}
            style={{
              fontFamily: fonts.body,
              fontSize: 12.5,
              lineHeight: 17.5,
              color: subColor,
            }}
          >
            {summary}
          </Text>
        </View>

        {/* Bottom-Right Circular Arrow Button ('>') */}
        <View style={styles.bottomRow}>
          <Pressable
            onPress={onArrowPress ?? onPress}
            hitSlop={8}
            style={[
              styles.arrowCircle,
              {
                backgroundColor: isPrimary ? '#FFFFFF' : 'rgba(255,255,255,0.88)',
              },
            ]}
          >
            <Icon name="chevron-right" size={20} color="#1E1E20" />
          </Pressable>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    height: 216,
    borderRadius: 28,
    padding: 20,
    justifyContent: 'space-between',
    overflow: 'hidden',
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  textBlock: {
    marginTop: 10,
    flex: 1,
    justifyContent: 'center',
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  arrowCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
