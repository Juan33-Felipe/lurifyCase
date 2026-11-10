import React from 'react';
import {
  Pressable,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';
import { Symbol } from './Symbol';
import { Text } from './Text';
import { radii } from './tokens';
import { usePalette } from './usePalette';
import { usePressFeedback } from './usePressFeedback';
import { useAudioPlayback } from '../../hooks/useAudioPlayback';

export interface AudioPlayerCardProps {
  uri?: string | null;
  durationSec?: number;
  title?: string;
  subtitle?: string;
  onReRecord?: () => void;
  showReRecord?: boolean;
  compact?: boolean;
  style?: StyleProp<ViewStyle>;
}

function formatTimer(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

const EQUALIZER_WEIGHTS = [0.4, 0.75, 1.0, 0.6, 0.9, 0.5, 0.85, 0.45, 0.7, 0.95, 0.55, 0.8];

export function AudioPlayerCard({
  uri,
  durationSec,
  title,
  subtitle,
  onReRecord,
  showReRecord = false,
  compact = false,
  style,
}: AudioPlayerCardProps) {
  const palette = usePalette();
  const press = usePressFeedback(0.96);
  const isDark = palette.mode === 'dark';

  const { isPlaying, currentTime, duration, togglePlay, seekTo } = useAudioPlayback(
    uri,
    durationSec
  );

  const effectiveDuration = duration > 0 ? duration : (durationSec ?? 0);
  const progressRatio =
    effectiveDuration > 0 ? Math.min(1, Math.max(0, currentTime / effectiveDuration)) : 0;

  return (
    <View
      style={[
        styles.card,
        compact ? styles.cardCompact : styles.cardStandard,
        {
          backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
          borderColor: palette.separator,
        },
        style,
      ]}
    >
      {/* Header Info */}
      {(title || subtitle || showReRecord) && (
        <View style={styles.headerRow}>
          <View style={styles.titleCol}>
            {title && (
              <View style={styles.titleBadgeRow}>
                <Symbol name="waveform" size={13} color={palette.label} />
                <Text variant="caption" weight="600" color={palette.label}>
                  {title}
                </Text>
              </View>
            )}
            {subtitle && (
              <Text variant="caption" color={palette.secondaryLabel} numberOfLines={1}>
                {subtitle}
              </Text>
            )}
          </View>

          {showReRecord && onReRecord && (
            <Pressable
              onPress={onReRecord}
              hitSlop={8}
              style={[
                styles.reRecordBtn,
                {
                  backgroundColor: isDark
                    ? 'rgba(255, 255, 255, 0.08)'
                    : 'rgba(0, 0, 0, 0.05)',
                },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Grabar de nuevo"
            >
              <Symbol name="refresh" size={12} color={palette.secondaryLabel} />
              <Text variant="caption" weight="500" color={palette.secondaryLabel}>
                Re-grabar
              </Text>
            </Pressable>
          )}
        </View>
      )}

      {/* Main Playback Row */}
      <View style={styles.controlsRow}>
        {/* Play / Pause circular button */}
        <Pressable
          onPress={togglePlay}
          {...press.handlers}
          accessibilityRole="button"
          accessibilityLabel={isPlaying ? 'Pausar audio' : 'Reproducir audio'}
          style={[
            styles.playButton,
            {
              backgroundColor: isPlaying
                ? palette.label
                : isDark
                  ? '#FFFFFF'
                  : '#1C1C1E',
            },
          ]}
        >
          <Symbol
            name={isPlaying ? 'pause' : 'play'}
            size={18}
            color={isPlaying ? (isDark ? '#000000' : '#FFFFFF') : (isDark ? '#000000' : '#FFFFFF')}
          />
        </Pressable>

        {/* Scrubber & Waveform Column */}
        <View style={styles.scrubberCol}>
          {/* Animated Equalizer Waveform bars while playing */}
          <View style={styles.waveRow}>
            {EQUALIZER_WEIGHTS.map((weight, i) => {
              const activeFactor = isPlaying
                ? Math.max(0.2, (Math.sin((currentTime * 4) + i) + 1) / 2 * weight)
                : weight * 0.35;
              const barHeight = Math.round(5 + activeFactor * 14);
              const isPast = (i / EQUALIZER_WEIGHTS.length) <= progressRatio;

              return (
                <View
                  key={i}
                  style={[
                    styles.equalizerBar,
                    {
                      height: barHeight,
                      backgroundColor: isPast
                        ? palette.label
                        : palette.secondaryLabel,
                      opacity: isPast ? 0.9 : 0.35,
                    },
                  ]}
                />
              );
            })}
          </View>

          {/* Interactive Progress Bar */}
          <Pressable
            style={styles.progressBarTrack}
            onPress={(e) => {
              if (effectiveDuration <= 0) return;
              const { locationX } = e.nativeEvent;
              // Approx width calculation
              const targetSec = Math.round((locationX / 180) * effectiveDuration);
              seekTo(targetSec);
            }}
          >
            <View
              style={[
                styles.progressBarBg,
                { backgroundColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)' },
              ]}
            >
              <View
                style={[
                  styles.progressBarFill,
                  {
                    width: `${Math.round(progressRatio * 100)}%`,
                    backgroundColor: palette.label,
                  },
                ]}
              />
            </View>
          </Pressable>

          {/* Time display */}
          <View style={styles.timeRow}>
            <Text variant="caption" weight="600" color={palette.label}>
              {formatTimer(currentTime)}
            </Text>
            <Text variant="caption" color={palette.secondaryLabel}>
              / {formatTimer(effectiveDuration)}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radii.group,
    borderWidth: 1,
    overflow: 'hidden',
  },
  cardStandard: {
    padding: 12,
    gap: 8,
  },
  cardCompact: {
    padding: 8,
    gap: 6,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
  },
  titleCol: {
    flex: 1,
    gap: 2,
  },
  titleBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  reRecordBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  playButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  scrubberCol: {
    flex: 1,
    gap: 4,
  },
  waveRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    height: 18,
  },
  equalizerBar: {
    width: 3,
    borderRadius: 1.5,
  },
  progressBarTrack: {
    paddingVertical: 3,
  },
  progressBarBg: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
    width: '100%',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
});
