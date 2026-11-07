import React, { useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { GlassButton, GlassInput } from './ui';
import { useCases } from '../context/CasesContext';
import { useSettings, useTheme } from '../context/SettingsContext';
import { fonts } from '../theme/theme';
import { caseService } from '../services/caseService';
import { TranslationKey } from '../i18n/translations';

type Mode = 'form' | 'voice';

export function NewCaseSheet({
  visible,
  onClose,
  onCreated,
}: {
  visible: boolean;
  onClose: () => void;
  onCreated: () => void;
}) {
  const palette = useTheme();
  const { t, language } = useSettings();
  const { createCase } = useCases();

  const [mode, setMode] = useState<Mode>('form');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [reference, setReference] = useState('');
  const [dictation, setDictation] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [voiceStatus, setVoiceStatus] = useState<string | null>(null);
  const dictationRef = useRef<TextInput | null>(null);

  const close = () => {
    setTitle('');
    setDescription('');
    setReference('');
    setDictation('');
    setError(null);
    setVoiceStatus(null);
    setMode('form');
    onClose();
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
      onCreated();
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
    const text = dictation.trim();
    if (!text) {
      setError(t('voice.emptyDictation'));
      return;
    }
    setBusy(true);
    setError(null);
    try {
      setVoiceStatus(t('voice.creating'));
      const lines = text.split(/[.\n]/).filter(Boolean);
      const autoTitle = (lines[0] || t('voice.untitledCase')).substring(0, 200);

      const created = await createCase({
        title: autoTitle,
        description: text,
      });

      setVoiceStatus(t('voice.analyzing'));
      await caseService.postNarrativeText(created.id, text, language);

      close();
      onCreated();
    } catch (err: any) {
      setVoiceStatus(null);
      const msg = err?.response?.data?.message || err?.response?.data?.detail;
      setError(msg || t('voice.processingError'));
    } finally {
      setBusy(false);
      setVoiceStatus(null);
    }
  };

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
          style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(20, 20, 24, 0.52)' }]}
          onPress={close}
        />

        <View
          style={[
            styles.sheet,
            {
              backgroundColor: palette.surfaceElevated,
              borderColor: palette.border,
              shadowColor: palette.shadow,
            },
          ]}
        >
          <View style={styles.handleRow}>
            <View style={[styles.handle, { backgroundColor: palette.border }]} />
          </View>

          {/* Header with mode toggle */}
          <View style={styles.headerRow}>
            <View style={[styles.iconBadge, { backgroundColor: palette.charcoal }]}>
              <Icon
                name={mode === 'voice' ? 'mic' : 'gavel'}
                size={18}
                color="#FFFFFF"
              />
            </View>
            <Text
              style={{
                fontFamily: fonts.hero,
                fontSize: 21,
                color: palette.text,
                flex: 1,
              }}
            >
              {mode === 'voice' ? t('voice.title') : t('cases.new.title')}
            </Text>
            <Pressable
              onPress={() => {
                setError(null);
                setVoiceStatus(null);
                setMode(mode === 'form' ? 'voice' : 'form');
              }}
              hitSlop={8}
              style={[
                styles.modeToggle,
                {
                  backgroundColor: palette.secondaryCard,
                  borderColor: palette.border,
                },
              ]}
            >
              <Icon
                name={mode === 'form' ? 'mic' : 'edit'}
                size={18}
                color={palette.accent}
              />
            </Pressable>
            <Pressable onPress={close} hitSlop={8} style={{ marginLeft: 8 }}>
              <Icon name="close" size={22} color={palette.textMuted} />
            </Pressable>
          </View>

          {mode === 'form' ? (
            <>
              <GlassInput
                icon="folder-open"
                placeholder={t('cases.new.titleField')}
                value={title}
                onChangeText={setTitle}
                maxLength={200}
              />
              <GlassInput
                icon="tag"
                placeholder={t('cases.new.reference')}
                value={reference}
                onChangeText={setReference}
                maxLength={100}
              />
              <GlassInput
                placeholder={t('cases.new.description')}
                value={description}
                onChangeText={setDescription}
                maxLength={2000}
                multiline
                style={{ minHeight: 86, textAlignVertical: 'top', paddingTop: 14 }}
              />
            </>
          ) : (
            <VoiceDictationPanel
              dictation={dictation}
              onChangeDictation={setDictation}
              dictationRef={dictationRef}
              voiceStatus={voiceStatus}
              palette={palette}
              t={t}
            />
          )}

          {error ? (
            <Text
              style={{
                fontFamily: fonts.medium,
                fontSize: 13,
                color: palette.danger,
              }}
            >
              {error}
            </Text>
          ) : null}

          {mode === 'form' ? (
            <View style={{ flexDirection: 'row', gap: 12, marginTop: 4 }}>
              <GlassButton
                label={t('common.cancel')}
                variant="glass"
                onPress={close}
                style={{ flex: 1 }}
              />
              <GlassButton
                label={t('common.create')}
                icon="add"
                onPress={submit}
                loading={busy}
                style={{ flex: 1 }}
              />
            </View>
          ) : (
            <View style={{ flexDirection: 'row', gap: 12, marginTop: 4 }}>
              <GlassButton
                label={t('common.cancel')}
                variant="glass"
                onPress={close}
                style={{ flex: 1 }}
              />
              <GlassButton
                label={t('voice.createFromDictation')}
                icon="send"
                onPress={submitVoice}
                loading={busy}
                disabled={!dictation.trim() || busy}
                style={{ flex: 1 }}
              />
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function VoiceDictationPanel({
  dictation,
  onChangeDictation,
  dictationRef,
  voiceStatus,
  palette,
  t,
}: {
  dictation: string;
  onChangeDictation: (text: string) => void;
  dictationRef: React.RefObject<any>;
  voiceStatus: string | null;
  palette: any;
  t: (key: TranslationKey) => string;
}) {
  const pulse = useSharedValue(1);

  React.useEffect(() => {
    if (voiceStatus) {
      pulse.value = withRepeat(
        withTiming(1.15, { duration: 900, easing: Easing.inOut(Easing.ease) }),
        -1,
        true,
      );
    } else {
      pulse.value = withTiming(1, { duration: 200 });
    }
  }, [voiceStatus, pulse]);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));

  if (voiceStatus) {
    return (
      <View style={styles.voicePanel}>
        <Animated.View style={pulseStyle}>
          <View style={[styles.statusCircle, { backgroundColor: palette.accent + '22' }]}>
            <Icon name="hearing" size={28} color={palette.accent} />
          </View>
        </Animated.View>
        <Text
          style={{
            fontFamily: fonts.medium,
            fontSize: 14,
            color: palette.accent,
            marginTop: 12,
            textAlign: 'center',
          }}
        >
          {voiceStatus}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.voicePanel}>
      {/* Mic hint row */}
      <View style={styles.micHintRow}>
        <Icon name="mic" size={20} color={palette.accent} />
        <Text
          style={{
            fontFamily: fonts.medium,
            fontSize: 13,
            color: palette.textMuted,
            flex: 1,
            marginLeft: 8,
          }}
        >
          {t('voice.keyboardHint')}
        </Text>
      </View>

      {/* Dictation text area */}
      <View
        style={[
          styles.dictationBox,
          {
            backgroundColor: palette.secondaryCard,
            borderColor: palette.border,
          },
        ]}
      >
        <TextInput
          ref={dictationRef}
          value={dictation}
          onChangeText={onChangeDictation}
          placeholder={t('voice.dictationPlaceholder')}
          placeholderTextColor={palette.textMuted + '88'}
          multiline
          maxLength={5000}
          autoFocus
          style={{
            fontFamily: fonts.body,
            fontSize: 15,
            color: palette.text,
            minHeight: 120,
            textAlignVertical: 'top',
            padding: 0,
          }}
        />
      </View>

      {dictation.trim().length > 0 && (
        <Text
          style={{
            fontFamily: fonts.body,
            fontSize: 12,
            color: palette.textMuted,
            alignSelf: 'flex-end',
          }}
        >
          {dictation.trim().length} / 5000
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  sheet: {
    marginHorizontal: 14,
    marginBottom: 18,
    paddingHorizontal: 22,
    paddingTop: 12,
    paddingBottom: 24,
    gap: 14,
    borderRadius: 28,
    borderWidth: 1,
    shadowOpacity: 0.18,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: -6 },
    elevation: 16,
  },
  handleRow: { alignItems: 'center', marginBottom: 4 },
  handle: { width: 40, height: 4, borderRadius: 2 },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 2,
  },
  iconBadge: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modeToggle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  voicePanel: { gap: 8 },
  micHintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  dictationBox: {
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  statusCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
});
