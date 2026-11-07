import React, { useEffect } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
} from 'react-native';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSettings, useTheme } from '../../context/SettingsContext';
import { fonts, radius } from '../../theme/theme';
import { TranslationKey } from '../../i18n/translations';

export { WavePatternBackground } from './WavePatternBackground';
export { HeroHeader } from './HeroHeader';
export { CaseCarouselCard } from './CaseCarouselCard';
export { QuickActionTaskCard } from './QuickActionTaskCard';
export { TimelineAuditItem } from './TimelineAuditItem';
export { DateStripSelector, toDateKey } from './DateStripSelector';
export { BottomTabBar, Tab } from './BottomTabBar';

type IconName = React.ComponentProps<typeof Icon>['name'];

/* ------------------------------------------------------------------ Header */

export function ScreenHeader({
  title,
  subtitle,
  right,
}: {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
}) {
  const palette = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={{
        paddingTop: insets.top + 14,
        paddingHorizontal: 24,
        paddingBottom: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      <View style={{ flex: 1, paddingRight: 12 }}>
        {subtitle ? (
          <Text
            style={{
              fontFamily: fonts.medium,
              fontSize: 13,
              color: palette.textMuted,
              marginBottom: 4,
            }}
            numberOfLines={1}
          >
            {subtitle}
          </Text>
        ) : null}
        <Text
          style={{
            fontFamily: fonts.hero,
            fontSize: 26,
            lineHeight: 32,
            letterSpacing: -0.4,
            color: palette.text,
          }}
          numberOfLines={1}
        >
          {title}
        </Text>
      </View>
      {right}
    </View>
  );
}

/* --------------------------------------------------------------- Primitives */

export function Chip({
  label,
  active,
  onPress,
}: {
  label: string;
  active?: boolean;
  onPress?: () => void;
}) {
  const palette = useTheme();
  return (
    <Pressable onPress={onPress}>
      <View
        style={{
          paddingHorizontal: 16,
          paddingVertical: 9,
          borderRadius: radius.pill,
          backgroundColor: active ? palette.charcoal : palette.secondaryCard,
          borderWidth: 1,
          borderColor: active ? palette.charcoal : palette.border,
        }}
      >
        <Text
          style={{
            fontFamily: active ? fonts.semibold : fonts.medium,
            fontSize: 13,
            color: active ? '#FFFFFF' : palette.text,
          }}
        >
          {label}
        </Text>
      </View>
    </Pressable>
  );
}

export function GlassButton({
  label,
  icon,
  onPress,
  variant = 'primary',
  loading,
  disabled,
  style,
}: {
  label: string;
  icon?: IconName;
  onPress?: () => void;
  variant?: 'primary' | 'glass' | 'danger';
  loading?: boolean;
  disabled?: boolean;
  style?: any;
}) {
  const palette = useTheme();
  const scale = useSharedValue(1);
  const anim = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const bg =
    variant === 'primary'
      ? palette.charcoal
      : variant === 'danger'
        ? palette.dangerSoft
        : palette.secondaryCard;

  const fg =
    variant === 'primary'
      ? '#FFFFFF'
      : variant === 'danger'
        ? palette.danger
        : palette.text;

  return (
    <Animated.View style={[{ opacity: disabled ? 0.55 : 1 }, anim, style]}>
      <Pressable
        disabled={disabled || loading}
        onPress={onPress}
        onPressIn={() => scale.set(withSpring(0.96, { damping: 50, stiffness: 600 }))}
        onPressOut={() => scale.set(withSpring(1, { damping: 50, stiffness: 600 }))}
        style={[
          styles.button,
          {
            backgroundColor: bg,
            borderColor: variant === 'primary' ? palette.charcoal : palette.border,
          },
        ]}
      >
        {loading ? (
          <ActivityIndicator color={fg} />
        ) : icon ? (
          <Icon name={icon} size={19} color={fg} />
        ) : null}
        <Text style={{ fontFamily: fonts.heading, fontSize: 14.5, color: fg }}>{label}</Text>
      </Pressable>
    </Animated.View>
  );
}

export function GlassInput(props: TextInputProps & { icon?: IconName }) {
  const palette = useTheme();
  const { icon, style, ...rest } = props;
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: palette.secondaryCard,
        borderRadius: radius.md,
        borderWidth: 1,
        borderColor: palette.border,
        paddingHorizontal: 14,
      }}
    >
      {icon ? (
        <Icon name={icon} size={20} color={palette.textMuted} style={{ marginRight: 10 }} />
      ) : null}
      <TextInput
        placeholderTextColor={palette.textMuted}
        style={[
          {
            flex: 1,
            minHeight: 50,
            fontFamily: fonts.body,
            fontSize: 14,
            color: palette.text,
          },
          style,
        ]}
        {...rest}
      />
    </View>
  );
}

export function Reveal({
  index = 0,
  children,
  style,
}: {
  index?: number;
  children: React.ReactNode;
  style?: any;
}) {
  return (
    <Animated.View
      entering={FadeInDown.delay(index * 20).springify().damping(40).stiffness(450)}
      style={style}
    >
      {children}
    </Animated.View>
  );
}

/* ------------------------------------------------------------------ States */

export function LoadingState({ message }: { message?: string }) {
  const palette = useTheme();
  const { t } = useSettings();
  const pulse = useSharedValue(0.5);
  useEffect(() => {
    pulse.value = withRepeat(withTiming(1, { duration: 900 }), -1, true);
  }, [pulse]);
  const anim = useAnimatedStyle(() => ({ opacity: pulse.value }));

  return (
    <View
      style={[
        styles.stateCard,
        {
          backgroundColor: palette.surface,
          borderColor: palette.border,
          shadowColor: palette.shadow,
        },
      ]}
    >
      <ActivityIndicator size="large" color={palette.charcoal} />
      <Animated.Text
        style={[{ fontFamily: fonts.medium, color: palette.textMuted, fontSize: 13.5 }, anim]}
      >
        {message ?? t('common.loading')}
      </Animated.Text>
    </View>
  );
}

export function EmptyState({
  icon,
  title,
  body,
  actionLabel,
  onAction,
}: {
  icon: IconName;
  title: string;
  body: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  const palette = useTheme();
  return (
    <View
      style={[
        styles.stateCard,
        {
          backgroundColor: palette.surface,
          borderColor: palette.border,
          shadowColor: palette.shadow,
        },
      ]}
    >
      <View
        style={{
          width: 56,
          height: 56,
          borderRadius: 28,
          backgroundColor: palette.secondaryCard,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 6,
        }}
      >
        <Icon name={icon} size={26} color={palette.text} />
      </View>
      <Text
        style={{
          fontFamily: fonts.heading,
          fontSize: 17,
          color: palette.text,
          textAlign: 'center',
        }}
      >
        {title}
      </Text>
      <Text
        style={{
          fontFamily: fonts.body,
          fontSize: 13.5,
          lineHeight: 19.5,
          color: palette.textMuted,
          textAlign: 'center',
        }}
      >
        {body}
      </Text>
      {actionLabel && onAction ? (
        <GlassButton
          label={actionLabel}
          onPress={onAction}
          style={{ marginTop: 10, alignSelf: 'stretch' }}
        />
      ) : null}
    </View>
  );
}

export function ErrorState({
  message,
  onRetry,
}: {
  message?: string;
  onRetry?: () => void;
}) {
  const { t } = useSettings();
  return (
    <EmptyState
      icon="cloud-off"
      title={t('common.error')}
      body={message ?? t('common.networkError')}
      actionLabel={onRetry ? t('common.retry') : undefined}
      onAction={onRetry}
    />
  );
}

export const labelKeys = {
  severity: (s: string) => `audit.severity.${s}` as TranslationKey,
  nodeType: (s: string) => `map.type.${s}` as TranslationKey,
  filter: (s: string) => `map.filter.${s}` as TranslationKey,
  relation: (s: string) => `map.relation.${s}` as TranslationKey,
};

const styles = StyleSheet.create({
  button: {
    height: 50,
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 18,
  },
  stateCard: {
    borderRadius: 24,
    padding: 28,
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    shadowOpacity: 0.04,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
});
