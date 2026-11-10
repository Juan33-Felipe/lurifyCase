import React, { useEffect, useRef, useState } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import {
  GlassButton,
  GlassIconButton,
  GroupedSection,
  SegmentedControl,
  Symbol,
  Text,
  TextFieldRow,
  radii,
  usePalette,
} from './apple';
import { useCases } from '../context/CasesContext';
import { useSettings } from '../context/SettingsContext';
import { caseService } from '../services/caseService';
import { geminiService, GeminiVoiceExtractionResult } from '../services/geminiService';
import { RecordedAudioResult, useVoiceRecorder } from '../hooks/useVoiceRecorder';
import { CanvasSnapshot } from '../types/api.types';
import { TranslationKey } from '../i18n/translations';

type Mode = 'form' | 'voice';

function formatTimer(totalSeconds: number): string {
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export function NewCaseSheet({
  visible,
  onClose,
  onCreated,
}: {
  visible: boolean;
  onClose: () => void;
  onCreated: (createdMode?: Mode) => void;
}) {
  const palette = usePalette();
  const { t, language } = useSettings();
  const { createCase, applyCanvas } = useCases();
  const recorder = useVoiceRecorder();

  const [mode, setMode] = useState<Mode>('voice');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [reference, setReference] = useState('');
  const [dictation, setDictation] = useState('');
  const [aiPreview, setAiPreview] = useState<GeminiVoiceExtractionResult | null>(null);
  const [transcribing, setTranscribing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [voiceStatus, setVoiceStatus] = useState<string | null>(null);
  const dictationRef = useRef<TextInput | null>(null);

  const close = () => {
    Keyboard.dismiss();
    recorder.resetRecording();
    setTitle('');
    setDescription('');
    setReference('');
    setDictation('');
    setAiPreview(null);
    setTranscribing(false);
    setError(null);
    setVoiceStatus(null);
    onClose();
  };

  const handleToggleRecord = async () => {
    Keyboard.dismiss();
    setError(null);

    if (recorder.isRecording) {
      const audio = await recorder.stopRecording();
      if (audio) {
        await processRecordedAudioPreview(audio);
      }
    } else {
      setAiPreview(null);
      const started = await recorder.startRecording();
      if (!started) {
        setError(t('voice.permissionDenied'));
      }
    }
  };

  const processRecordedAudioPreview = async (audio: RecordedAudioResult) => {
    setTranscribing(true);
    try {
      const extracted = await geminiService.transcribeVoiceCase(
        audio.base64,
        audio.mimeType,
        language
      );
      if (extracted) {
        setAiPreview(extracted);
        if (extracted.transcript) {
          setDictation((prev) =>
            prev.trim().length > 0
              ? `${prev.trim()}\n${extracted.transcript.trim()}`
              : extracted.transcript.trim()
          );
        }
      }
    } catch {
      // Keep audioResult ready for backend voice ingestion even if preview fails
    } finally {
      setTranscribing(false);
    }
  };

  const submit = async () => {
    if (!title.trim()) {
      setError(t('cases.new.titleRequired'));
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await createCase({
        title: title.trim(),
        description: description.trim() || undefined,
        clientReference: reference.trim() || undefined,
      });
      close();
      onCreated('form');
    } catch (err: any) {
      const status = err?.response?.status;
      const msg = err?.response?.data?.message || err?.response?.data?.detail;
      if (status === 401) {
        setError(t('common.sessionExpired'));
      } else if (msg) {
        setError(msg);
      } else {
        setError(t('common.networkError'));
      }
    } finally {
      setBusy(false);
    }
  };

  const submitVoice = async () => {
    Keyboard.dismiss();
    setError(null);
    setBusy(true);

    try {
      let currentAudio = recorder.audioResult;

      // If the user is actively recording and taps "Detener y Generar" / "Crear", stop first
      if (recorder.isRecording) {
        setVoiceStatus(t('voice.transcribing'));
        currentAudio = await recorder.stopRecording();
      }

      let currentText = dictation.trim();
      let currentPreview = aiPreview;

      // If we have audio but no text yet, try Gemini extraction so we have a rich title & transcript
      if (currentAudio && !currentText && !currentPreview) {
        setVoiceStatus(t('voice.transcribing'));
        currentPreview = await geminiService.transcribeVoiceCase(
          currentAudio.base64,
          currentAudio.mimeType,
          language
        );
        if (currentPreview?.transcript) {
          currentText = currentPreview.transcript.trim();
          setDictation(currentText);
        }
      }

      if (!currentAudio && !currentText) {
        setError(t('voice.emptyDictation'));
        setBusy(false);
        setVoiceStatus(null);
        return;
      }

      setVoiceStatus(t('voice.creating'));

      const lines = currentText.split(/[.\n]/).filter(Boolean);
      const fallbackTitle = `${t('voice.untitledCase')} • ${new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      })}`;
      const autoTitle = (
        currentPreview?.title?.trim() ||
        lines[0]?.trim() ||
        fallbackTitle
      ).substring(0, 200);

      const created = await createCase({
        title: autoTitle,
        description: currentText || currentPreview?.title || t('voice.untitledCase'),
      });

      setVoiceStatus(t('voice.analyzing'));

      let narrativeResult = null;
      if (currentAudio?.base64) {
        try {
          narrativeResult = await caseService.postNarrativeVoice(
            created.id,
            currentAudio.base64,
            language
          );
        } catch {
          if (currentText) {
            try {
              narrativeResult = await caseService.postNarrativeText(
                created.id,
                currentText,
                language
              );
            } catch {
              // Handled by Gemini fallback below
            }
          }
        }
      } else if (currentText) {
        try {
          narrativeResult = await caseService.postNarrativeText(created.id, currentText, language);
        } catch {
          // Handled by Gemini fallback below
        }
      }

      const nr = narrativeResult as any;
      const extractedNodes =
        nr?.snapshot?.canvas?.nodes ||
        nr?.canvas?.nodes ||
        nr?.canvas?.canvas?.nodes;

      if (extractedNodes && Array.isArray(extractedNodes) && extractedNodes.length > 0) {
        const targetSnapshot: CanvasSnapshot = nr?.snapshot || {
          caseId: created.id,
          version: nr?.version || 2,
          updatedAt: new Date().toISOString(),
          canvas: nr?.canvas?.nodes
            ? nr.canvas
            : nr?.canvas?.canvas || { nodes: extractedNodes, edges: [] },
        };
        applyCanvas(targetSnapshot);
      } else {
        const fallbackCanvas = await geminiService.generateCanvasFromNarrative(
          created.id,
          currentText || autoTitle,
          language
        );
        applyCanvas(fallbackCanvas);
      }

      close();
      onCreated('voice');
    } catch (err: any) {
      setVoiceStatus(null);
      const msg = err?.response?.data?.message || err?.response?.data?.detail;
      setError(msg || t('voice.processingError'));
    } finally {
      setBusy(false);
      setVoiceStatus(null);
    }
  };

  const canSubmitVoice =
    !busy &&
    !transcribing &&
    (recorder.isRecording || Boolean(recorder.audioResult) || dictation.trim().length > 0);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={close}
      statusBarTranslucent
    >
      <KeyboardAvoidingView
        style={{ flex: 1, justifyContent: 'flex-end' }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Pressable
          style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0, 0, 0, 0.45)' }]}
          onPress={close}
        />

        <View
          style={[
            styles.sheet,
            {
              backgroundColor: palette.surface,
              borderColor: palette.separator,
              shadowColor: palette.mode === 'dark' ? '#000000' : palette.glass.shadow,
            },
          ]}
        >
          {/* Manija táctil superior de iOS */}
          <View style={styles.handleRow}>
            <View style={[styles.handle, { backgroundColor: palette.separator }]} />
          </View>

          {/* Fila del encabezado con selector de modo y botón de cerrar */}
          <View style={styles.headerRow}>
            <View style={styles.headerTitleGroup}>
              <Text variant="title2" weight="700">
                {mode === 'voice' ? t('voice.title') : t('cases.new.title')}
              </Text>
            </View>

            <GlassIconButton
              icon="close"
              size={32}
              accessibilityLabel="Cerrar"
              onPress={close}
            />
          </View>

          {/* Selector segmentado de modo (Formulario o Dictado) */}
          <SegmentedControl
            value={mode}
            onChange={(val) => {
              Keyboard.dismiss();
              setError(null);
              setVoiceStatus(null);
              setMode(val);
            }}
            options={[
              { value: 'form', label: t('cases.new.title') },
              { value: 'voice', label: t('voice.title') },
            ]}
          />

          <ScrollView
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            style={{ maxHeight: 430 }}
            contentContainerStyle={{ gap: 10 }}
          >
            {mode === 'form' ? (
              <GroupedSection style={{ marginTop: 4 }}>
                <TextFieldRow
                  icon="folder"
                  placeholder={t('cases.new.titleField')}
                  value={title}
                  onChangeText={setTitle}
                  maxLength={200}
                  returnKeyType="next"
                />
                <TextFieldRow
                  icon="tag"
                  placeholder={t('cases.new.reference')}
                  value={reference}
                  onChangeText={setReference}
                  maxLength={100}
                  returnKeyType="next"
                />
                <View style={styles.multilineRow}>
                  <View style={styles.multilineIconBox}>
                    <Symbol name="doc" size={17} color={palette.secondaryLabel} />
                  </View>
                  <TextInput
                    placeholder={t('cases.new.description')}
                    placeholderTextColor={palette.placeholder}
                    value={description}
                    onChangeText={setDescription}
                    maxLength={2000}
                    multiline
                    selectionColor={palette.label}
                    keyboardAppearance={palette.mode}
                    style={[styles.multilineInput, { color: palette.label }]}
                  />
                </View>
              </GroupedSection>
            ) : (
              <VoiceDictationPanel
                dictation={dictation}
                onChangeDictation={setDictation}
                dictationRef={dictationRef}
                voiceStatus={voiceStatus}
                transcribing={transcribing}
                isRecording={recorder.isRecording}
                durationSec={recorder.durationSec}
                metering={recorder.metering}
                audioResult={recorder.audioResult}
                aiPreview={aiPreview}
                onToggleRecord={handleToggleRecord}
                onReRecord={async () => {
                  setAiPreview(null);
                  await recorder.resetRecording();
                  const started = await recorder.startRecording();
                  if (!started) {
                    setError(t('voice.permissionDenied'));
                  }
                }}
                palette={palette}
                t={t}
              />
            )}
          </ScrollView>

          {error && (
            <Text variant="footnote" color={palette.danger} style={{ paddingHorizontal: 4 }}>
              {error}
            </Text>
          )}

          {/* Botones de acción inferiores */}
          <View style={styles.buttonRow}>
            <GlassButton
              label={t('common.cancel')}
              onPress={close}
              style={{ flex: 1 }}
            />
            <GlassButton
              label={
                mode === 'form'
                  ? busy
                    ? t('common.loading')
                    : t('common.create')
                  : busy || transcribing
                    ? t('common.loading')
                    : recorder.isRecording
                      ? t('voice.stopAndGenerate')
                      : t('voice.createFromDictation')
              }
              icon={
                mode === 'form'
                  ? 'plus'
                  : recorder.isRecording
                    ? 'sparkles'
                    : 'send'
              }
              onPress={mode === 'form' ? submit : submitVoice}
              loading={busy || transcribing}
              disabled={mode === 'voice' && !canSubmitVoice}
              style={{ flex: 1.5 }}
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const WAVE_BARS = [0.35, 0.65, 0.9, 0.5, 1.0, 0.75, 0.45, 0.85, 0.95, 0.6, 0.8, 0.4];

function VoiceDictationPanel({
  dictation,
  onChangeDictation,
  dictationRef,
  voiceStatus,
  transcribing,
  isRecording,
  durationSec,
  metering,
  audioResult,
  aiPreview,
  onToggleRecord,
  onReRecord,
  palette,
  t,
}: {
  dictation: string;
  onChangeDictation: (text: string) => void;
  dictationRef: React.RefObject<any>;
  voiceStatus: string | null;
  transcribing: boolean;
  isRecording: boolean;
  durationSec: number;
  metering: number;
  audioResult: RecordedAudioResult | null;
  aiPreview: GeminiVoiceExtractionResult | null;
  onToggleRecord: () => void;
  onReRecord: () => void;
  palette: any;
  t: (key: TranslationKey) => string;
}) {
  const pulse = useSharedValue(1);
  const ringOpacity = useSharedValue(0.32);
  const isDark = palette.mode === 'dark';

  useEffect(() => {
    if (isRecording || voiceStatus || transcribing) {
      pulse.value = withRepeat(
        withSequence(
          withTiming(1.15, { duration: 650, easing: Easing.inOut(Easing.ease) }),
          withTiming(1.0, { duration: 650, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      );
      ringOpacity.value = withRepeat(
        withSequence(
          withTiming(0.65, { duration: 650 }),
          withTiming(0.18, { duration: 650 })
        ),
        -1,
        true
      );
    } else {
      pulse.value = withTiming(1, { duration: 200 });
      ringOpacity.value = withTiming(0.24, { duration: 200 });
    }
  }, [isRecording, voiceStatus, transcribing, pulse, ringOpacity]);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));

  const haloStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value * 1.12 }],
    opacity: ringOpacity.value,
  }));

  if (voiceStatus) {
    return (
      <View style={styles.statusContainer}>
        <Animated.View style={pulseStyle}>
          <View
            style={[
              styles.statusCircle,
              {
                backgroundColor: palette.groupedBackground,
                borderColor: palette.separator,
              },
            ]}
          >
            <Symbol name="sparkles" size={28} color={palette.label} />
          </View>
        </Animated.View>
        <Text
          variant="subheadline"
          weight="600"
          color={palette.label}
          style={{ marginTop: 14, textAlign: 'center' }}
        >
          {voiceStatus}
        </Text>
        <Text
          variant="footnote"
          color={palette.secondaryLabel}
          style={{ marginTop: 4, textAlign: 'center' }}
        >
          {t('voice.recordingLiveHint')}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.voicePanel}>
      {/* Interactive Mobile Voice Recorder Card */}
      <View
        style={[
          styles.recorderCard,
          {
            backgroundColor: isRecording
              ? isDark
                ? 'rgba(255, 69, 58, 0.14)'
                : '#FFF5F5'
              : palette.groupedBackground,
            borderColor: isRecording
              ? 'rgba(217, 48, 54, 0.42)'
              : palette.separator,
          },
        ]}
      >
        {isRecording ? (
          <View style={styles.liveBadgeRow}>
            <View style={[styles.liveDot, { backgroundColor: palette.danger }]} />
            <Text variant="footnote" weight="600" color={palette.danger}>
              {t('voice.recordingActive')}
            </Text>
            <View style={styles.timerPill}>
              <Text variant="footnote" weight="700" color={palette.danger}>
                {formatTimer(durationSec)}
              </Text>
            </View>
          </View>
        ) : audioResult ? (
          <View style={styles.readyBadgeRow}>
            <View style={styles.readyLeft}>
              <Symbol name="checkmark" size={16} color={palette.label} />
              <Text variant="footnote" weight="600" color={palette.label}>
                {t('voice.audioReady')} ({formatTimer(audioResult.durationSec)})
              </Text>
            </View>
            <Pressable onPress={onReRecord} hitSlop={8} style={styles.reRecordBtn}>
              <Symbol name="refresh" size={14} color={palette.secondaryLabel} />
              <Text variant="caption" weight="500" color={palette.secondaryLabel}>
                {t('voice.reRecord')}
              </Text>
            </Pressable>
          </View>
        ) : null}

        {/* Center Microphone / Stop Recording Button */}
        <View style={styles.micCenterBlock}>
          <View style={styles.micOuterContainer}>
            <Animated.View
              pointerEvents="none"
              style={[
                styles.micHaloRing,
                haloStyle,
                {
                  backgroundColor: isRecording
                    ? 'rgba(217, 48, 54, 0.24)'
                    : isDark
                      ? 'rgba(255, 255, 255, 0.14)'
                      : 'rgba(28, 28, 30, 0.10)',
                },
              ]}
            />
            <Animated.View style={pulseStyle}>
              <Pressable
                onPress={onToggleRecord}
                accessibilityRole="button"
                accessibilityLabel={
                  isRecording ? t('voice.stopRecording') : t('voice.tapToRecord')
                }
                style={[
                  styles.micMainButton,
                  {
                    backgroundColor: isRecording
                      ? palette.danger
                      : isDark
                        ? '#2C2C2E'
                        : '#1C1C1E',
                    shadowColor: isRecording ? palette.danger : '#000000',
                  },
                ]}
              >
                <Symbol
                  name={isRecording ? 'stop' : 'mic'}
                  size={28}
                  color="#FFFFFF"
                />
              </Pressable>
            </Animated.View>
          </View>

          {/* Waveform Bars while recording */}
          {isRecording ? (
            <View style={styles.waveformContainer}>
              {WAVE_BARS.map((weight, idx) => {
                const dynamicFactor = Math.max(
                  0.22,
                  Math.min(1, metering * weight + ((durationSec + idx) % 3) * 0.12)
                );
                const barHeight = Math.round(8 + dynamicFactor * 24);
                return (
                  <View
                    key={idx}
                    style={[
                      styles.waveBar,
                      {
                        height: barHeight,
                        backgroundColor: palette.danger,
                        opacity: 0.55 + dynamicFactor * 0.45,
                      },
                    ]}
                  />
                );
              })}
            </View>
          ) : null}

          <Text
            variant="subheadline"
            weight="600"
            color={isRecording ? palette.danger : palette.label}
            style={{ marginTop: 8, textAlign: 'center' }}
          >
            {transcribing
              ? t('voice.transcribing')
              : isRecording
                ? t('voice.stopRecording')
                : t('voice.tapToRecord')}
          </Text>

          <Text
            variant="footnote"
            color={palette.secondaryLabel}
            style={{ marginTop: 4, textAlign: 'center', paddingHorizontal: 8 }}
          >
            {isRecording ? t('voice.recordingLiveHint') : t('voice.tapToRecordSub')}
          </Text>
        </View>
      </View>

      {/* Live AI Docket Preview Card */}
      {aiPreview ? (
        <View
          style={[
            styles.previewCard,
            {
              backgroundColor: palette.groupedBackground,
              borderColor: palette.separator,
            },
          ]}
        >
          <View style={styles.previewHeader}>
            <Symbol name="sparkles" size={15} color={palette.label} />
            <Text variant="footnote" weight="600" color={palette.label} style={{ flex: 1 }}>
              {t('voice.detectedPreview')}: {aiPreview.title}
            </Text>
          </View>
          {aiPreview.tags && aiPreview.tags.length > 0 ? (
            <View style={styles.tagsWrap}>
              {aiPreview.tags.slice(0, 4).map((tag, i) => (
                <View
                  key={i}
                  style={[
                    styles.tagBadge,
                    {
                      backgroundColor: palette.surface,
                      borderColor: palette.separator,
                    },
                  ]}
                >
                  <Text variant="caption" color={palette.label} numberOfLines={1}>
                    {tag}
                  </Text>
                </View>
              ))}
            </View>
          ) : null}
        </View>
      ) : null}

      <View style={styles.micHintRow}>
        <Symbol name="edit" size={15} color={palette.secondaryLabel} />
        <Text variant="footnote" color={palette.secondaryLabel} style={{ marginLeft: 6, flex: 1 }}>
          {t('voice.keyboardHint')}
        </Text>
      </View>

      <View
        style={[
          styles.dictationBox,
          {
            backgroundColor: palette.groupedBackground,
            borderColor: palette.separator,
          },
        ]}
      >
        <TextInput
          ref={dictationRef}
          value={dictation}
          onChangeText={onChangeDictation}
          placeholder={t('voice.dictationPlaceholder')}
          placeholderTextColor={palette.placeholder}
          multiline
          maxLength={5000}
          selectionColor={palette.label}
          keyboardAppearance={palette.mode}
          style={[styles.dictationInput, { color: palette.label }]}
        />
      </View>

      {dictation.trim().length > 0 && (
        <Text variant="caption" color={palette.secondaryLabel} style={{ alignSelf: 'flex-end' }}>
          {dictation.trim().length} / 5000
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  sheet: {
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 38 : 24,
    gap: 14,
    borderWidth: 1,
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.16,
    shadowRadius: 20,
    elevation: 20,
  },
  handleRow: {
    alignItems: 'center',
    marginBottom: 4,
  },
  handle: {
    width: 36,
    height: 4.5,
    borderRadius: 2.25,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
  },
  headerTitleGroup: {
    flex: 1,
  },
  multilineRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    minHeight: 88,
    paddingRight: 14,
    paddingVertical: 12,
  },
  multilineIconBox: {
    width: 44,
    alignItems: 'center',
    paddingTop: 2,
  },
  multilineInput: {
    flex: 1,
    fontSize: 16,
    lineHeight: 22,
    padding: 0,
    textAlignVertical: 'top',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
  },
  voicePanel: {
    gap: 10,
    marginTop: 4,
  },
  recorderCard: {
    borderRadius: radii.group,
    borderWidth: 1,
    paddingVertical: 16,
    paddingHorizontal: 16,
    alignItems: 'center',
    gap: 10,
  },
  liveBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  timerPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    backgroundColor: 'rgba(217, 48, 54, 0.14)',
  },
  readyBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  readyLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  reRecordBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  micCenterBlock: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  micOuterContainer: {
    width: 86,
    height: 86,
    alignItems: 'center',
    justifyContent: 'center',
  },
  micHaloRing: {
    position: 'absolute',
    width: 82,
    height: 82,
    borderRadius: 41,
  },
  micMainButton: {
    width: 66,
    height: 66,
    borderRadius: 33,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOpacity: 0.24,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 5 },
    elevation: 6,
  },
  waveformContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    height: 34,
    marginTop: 8,
  },
  waveBar: {
    width: 4,
    borderRadius: 2,
  },
  previewCard: {
    borderRadius: radii.group,
    borderWidth: 1,
    padding: 12,
    gap: 8,
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tagsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  tagBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    maxWidth: '100%',
  },
  micHintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 2,
    paddingHorizontal: 4,
  },
  dictationBox: {
    borderRadius: radii.group,
    borderWidth: 1,
    padding: 14,
    minHeight: 92,
  },
  dictationInput: {
    fontSize: 16,
    lineHeight: 22,
    padding: 0,
    textAlignVertical: 'top',
    minHeight: 76,
  },
  statusContainer: {
    paddingVertical: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    borderWidth: 1,
  },
});
