import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { WavePatternBackground } from './WavePatternBackground';
import { useTheme } from '../../context/SettingsContext';
import { fonts } from '../../theme/theme';

export interface TimelineAuditItemProps {
  variant?: 'active' | 'inactive';
  title: string;
  timestamp: string;
  description: string;
  recommendation?: string;
  badges?: string[];
  isLast?: boolean;
  onActionPress?: () => void;
}

/**
 * Screen 2 Timeline Event Card (Part 1.3 & Phase 2.4):
 * - Left vertical timeline axis with hollow/filled circle node and connecting vertical line.
 * - Active Timeline Card: Dark charcoal rounded-[24px] container with wave texture,
 *   title + right-aligned timestamp, description, bottom-left overlapping avatar/badge group
 *   (3 circular badges), and bottom-right white rounded-xl checkmark button.
 * - Inactive Timeline Items: Clean, borderless text blocks aligned with the vertical timeline axis on the left.
 */
export function TimelineAuditItem({
  variant = 'inactive',
  title,
  timestamp,
  description,
  recommendation,
  badges = ['AI', 'FR', 'EV'],
  isLast = false,
  onActionPress,
}: TimelineAuditItemProps) {
  const palette = useTheme();
  const isActive = variant === 'active';
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const avatarBadges = badges.slice(0, 3);
  while (avatarBadges.length < 3) {
    avatarBadges.push(['AI', 'JD', 'EX'][avatarBadges.length]);
  }

  return (
    <View style={styles.row}>
      {/* Left Vertical Timeline Axis */}
      <View style={styles.axisColumn}>
        <View
          style={[
            styles.nodeOuter,
            isActive
              ? {
                  borderColor: palette.charcoal,
                  backgroundColor: palette.background,
                }
              : {
                  borderColor: palette.textMuted,
                  backgroundColor: palette.background,
                },
          ]}
        >
          {isActive ? <View style={[styles.nodeInner, { backgroundColor: palette.charcoal }]} /> : null}
        </View>
        {!isLast ? (
          <View
            style={[
              styles.verticalLine,
              {
                backgroundColor: isActive ? palette.charcoal : palette.border,
              },
            ]}
          />
        ) : null}
      </View>

      {/* Right Content */}
      <View style={styles.contentColumn}>
        {isActive ? (
          <Animated.View style={animStyle}>
            <Pressable
              onPress={onActionPress}
              onPressIn={() => scale.set(withSpring(0.98, { damping: 50, stiffness: 600 }))}
              onPressOut={() => scale.set(withSpring(1, { damping: 50, stiffness: 600 }))}
              style={[
                styles.activeCard,
                {
                  backgroundColor: palette.charcoal,
                  shadowColor: palette.shadow,
                },
              ]}
            >
              <WavePatternBackground variant="card" />

              {/* Title + Right-Aligned Timestamp */}
              <View style={styles.headerRow}>
                <Text
                  numberOfLines={2}
                  style={{
                    flex: 1,
                    fontFamily: fonts.heading,
                    fontSize: 16.5,
                    lineHeight: 22,
                    color: palette.onCharcoal,
                    marginRight: 10,
                  }}
                >
                  {title}
                </Text>
                <Text
                  style={{
                    fontFamily: fonts.medium,
                    fontSize: 12,
                    color: palette.onCharcoalMuted,
                  }}
                >
                  {timestamp}
                </Text>
              </View>

              {/* Description */}
              <Text
                style={{
                  fontFamily: fonts.body,
                  fontSize: 13.5,
                  lineHeight: 19.5,
                  color: palette.onCharcoalMuted,
                  marginTop: 8,
                }}
              >
                {description}
              </Text>

              {recommendation ? (
                <Text
                  style={{
                    fontFamily: fonts.medium,
                    fontSize: 12.5,
                    lineHeight: 18,
                    color: '#E4E7F2',
                    marginTop: 8,
                  }}
                >
                  {recommendation}
                </Text>
              ) : null}

              {/* Bottom Row: Overlapping 3-Avatar Group + White rounded-xl Checkmark Button */}
              <View style={styles.bottomRow}>
                <View style={styles.avatarStack}>
                  {avatarBadges.map((label, idx) => (
                    <View
                      key={`${label}-${idx}`}
                      style={[
                        styles.stackCircle,
                        {
                          marginLeft: idx === 0 ? 0 : -10,
                          backgroundColor: idx === 0 ? '#F1F4FB' : idx === 1 ? '#DDE4F7' : '#C9D4F2',
                          borderColor: palette.charcoal,
                        },
                      ]}
                    >
                      <Text
                        style={{
                          fontFamily: fonts.heading,
                          fontSize: 10,
                          color: '#1E1E20',
                        }}
                      >
                        {label.slice(0, 2).toUpperCase()}
                      </Text>
                    </View>
                  ))}
                </View>

                <Pressable onPress={onActionPress} style={styles.checkButton}>
                  <Icon name="check" size={18} color="#1E1E20" />
                </Pressable>
              </View>
            </Pressable>
          </Animated.View>
        ) : (
          <Pressable onPress={onActionPress} style={styles.inactiveBlock}>
            <View style={styles.headerRow}>
              <Text
                numberOfLines={1}
                style={{
                  flex: 1,
                  fontFamily: fonts.heading,
                  fontSize: 16,
                  lineHeight: 21,
                  color: palette.text,
                  marginRight: 10,
                }}
              >
                {title}
              </Text>
              <Text
                style={{
                  fontFamily: fonts.medium,
                  fontSize: 12,
                  color: palette.textMuted,
                }}
              >
                {timestamp}
              </Text>
            </View>
            <Text
              numberOfLines={3}
              style={{
                fontFamily: fonts.body,
                fontSize: 13.5,
                lineHeight: 19,
                color: palette.textMuted,
                marginTop: 6,
              }}
            >
              {description}
            </Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  axisColumn: {
    width: 28,
    alignItems: 'center',
    marginRight: 12,
  },
  nodeOuter: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  nodeInner: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  verticalLine: {
    flex: 1,
    width: 1.5,
    marginVertical: 4,
  },
  contentColumn: {
    flex: 1,
    paddingBottom: 24,
  },
  activeCard: {
    borderRadius: 24,
    padding: 20,
    overflow: 'hidden',
    shadowOpacity: 0.16,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 5,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
  },
  bottomRow: {
    marginTop: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  avatarStack: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stackCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkButton: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  inactiveBlock: {
    paddingTop: 1,
    paddingRight: 4,
  },
});
