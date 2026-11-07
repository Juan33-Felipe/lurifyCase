import React, { useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { GlassButton, GlassInput } from './ui';
import { useCases } from '../context/CasesContext';
import { useSettings, useTheme } from '../context/SettingsContext';
import { fonts } from '../theme/theme';

/**
 * Clean editorial bottom sheet to open a new legal docket (FR-007).
 */
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
  const { t } = useSettings();
  const { createCase } = useCases();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [reference, setReference] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const close = () => {
    setTitle('');
    setDescription('');
    setReference('');
    setError(null);
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
    } catch {
      setError(t('common.networkError'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={close} statusBarTranslucent>
      <KeyboardAvoidingView
        style={{ flex: 1, justifyContent: 'flex-end' }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Pressable
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: 'rgba(20, 20, 24, 0.52)' },
          ]}
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

          <View style={styles.headerRow}>
            <View
              style={[
                styles.iconBadge,
                { backgroundColor: palette.charcoal },
              ]}
            >
              <Icon name="gavel" size={18} color="#FFFFFF" />
            </View>
            <Text style={{ fontFamily: fonts.hero, fontSize: 21, color: palette.text, flex: 1 }}>
              {t('cases.new.title')}
            </Text>
            <Pressable onPress={close} hitSlop={8}>
              <Icon name="close" size={22} color={palette.textMuted} />
            </Pressable>
          </View>

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

          {error ? (
            <Text style={{ fontFamily: fonts.medium, fontSize: 13, color: palette.danger }}>
              {error}
            </Text>
          ) : null}

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
        </View>
      </KeyboardAvoidingView>
    </Modal>
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
  handleRow: {
    alignItems: 'center',
    marginBottom: 4,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
  },
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
});
