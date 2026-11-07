import React from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { GlassButton, Reveal, ScreenHeader, WavePatternBackground } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { useSettings, useTheme } from '../context/SettingsContext';
import { fonts, radius } from '../theme/theme';

export default function SettingsScreen() {
  const palette = useTheme();
  const {
    t,
    theme,
    setTheme,
    language,
    setLanguage,
    biometricEnabled,
    setBiometricEnabled,
    autoTranslate,
    setAutoTranslate,
  } = useSettings();
  const { user, signOut, biometricsAvailable, confirmBiometrics } = useAuth();

  const toggleBiometric = async (next: boolean) => {
    if (!next) {
      setBiometricEnabled(false);
      return;
    }
    if (!(await biometricsAvailable())) {
      Alert.alert(t('settings.biometric'), t('settings.biometricUnavailable'));
      return;
    }
    if (await confirmBiometrics(t('settings.biometricConfirm'))) setBiometricEnabled(true);
  };

  const initials = (user?.fullName ?? 'LC')
    .split(' ')
    .filter(Boolean)
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <View style={{ flex: 1, backgroundColor: palette.background }}>
      <ScreenHeader title={t('settings.title')} subtitle={t('settings.subtitle')} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Lawyer Profile Dark Charcoal Card with Wave Overlay */}
        <Reveal index={0}>
          <View
            style={[
              styles.profileCard,
              {
                backgroundColor: palette.charcoal,
                shadowColor: palette.shadow,
              },
            ]}
          >
            <WavePatternBackground variant="card" />
            <View style={styles.avatarCircle}>
              <Text style={{ fontFamily: fonts.heading, fontSize: 18, color: '#1E1E20' }}>
                {initials}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontFamily: fonts.heading,
                  fontSize: 17,
                  color: palette.onCharcoal,
                }}
              >
                {user?.fullName ?? t('settings.notSignedIn')}
              </Text>
              <Text
                style={{
                  fontFamily: fonts.body,
                  fontSize: 13,
                  color: palette.onCharcoalMuted,
                  marginTop: 3,
                }}
              >
                {user?.email ?? t('settings.role')}
              </Text>
            </View>
          </View>
        </Reveal>

        {/* Display & Language Section */}
        <Reveal index={1}>
          <Section title={t('settings.appearance')}>
            <Row label={t('settings.theme')}>
              <Segmented
                value={theme}
                onChange={setTheme}
                options={[
                  { value: 'light', label: t('settings.theme.light'), icon: 'light-mode' },
                  { value: 'dark', label: t('settings.theme.dark'), icon: 'dark-mode' },
                ]}
              />
            </Row>
            <Row label={t('settings.language')}>
              <Segmented
                value={language}
                onChange={setLanguage}
                options={[
                  { value: 'en', label: t('settings.language.en'), icon: 'language' },
                  { value: 'es', label: t('settings.language.es'), icon: 'language' },
                ]}
              />
            </Row>
            <View style={[styles.securityRow, { paddingHorizontal: 0, paddingTop: 14 }]}>
              <View
                style={[
                  styles.securityIconBox,
                  { backgroundColor: palette.secondaryCard },
                ]}
              >
                <Icon name="translate" size={20} color={palette.text} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: fonts.semibold, fontSize: 14.5, color: palette.text }}>
                  {t('settings.autoTranslate')}
                </Text>
                <Text
                  style={{
                    fontFamily: fonts.body,
                    fontSize: 12,
                    color: palette.textMuted,
                    marginTop: 2,
                  }}
                >
                  {t('settings.autoTranslateHint')}
                </Text>
              </View>
              <Switch
                value={autoTranslate}
                onValueChange={setAutoTranslate}
                trackColor={{ false: palette.border, true: palette.charcoal }}
                thumbColor={autoTranslate ? palette.surface : palette.surfaceElevated}
              />
            </View>
          </Section>
        </Reveal>

        {/* Confidentiality & Biometrics Section */}
        <Reveal index={2}>
          <Section title={t('settings.security')}>
            <View style={styles.securityRow}>
              <View
                style={[
                  styles.securityIconBox,
                  { backgroundColor: palette.secondaryCard },
                ]}
              >
                <Icon name="fingerprint" size={22} color={palette.text} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: fonts.semibold, fontSize: 15, color: palette.text }}>
                  {t('settings.biometric')}
                </Text>
                <Text
                  style={{
                    fontFamily: fonts.body,
                    fontSize: 12.5,
                    color: palette.textMuted,
                    marginTop: 2,
                  }}
                >
                  {t('settings.biometricHint')}
                </Text>
              </View>
              <Switch
                value={biometricEnabled}
                onValueChange={toggleBiometric}
                trackColor={{ false: palette.border, true: palette.charcoal }}
                thumbColor="#FFFFFF"
              />
            </View>
          </Section>
        </Reveal>

        {user ? (
          <Reveal index={3}>
            <GlassButton
              label={t('settings.signOut')}
              icon="logout"
              variant="danger"
              onPress={signOut}
            />
          </Reveal>
        ) : null}
      </ScrollView>
    </View>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const palette = useTheme();
  return (
    <View style={{ gap: 10 }}>
      <Text
        style={{
          fontFamily: fonts.semibold,
          fontSize: 16,
          color: palette.text,
          paddingHorizontal: 4,
        }}
      >
        {title}
      </Text>
      <View
        style={[
          styles.sectionCard,
          {
            backgroundColor: palette.surface,
            borderColor: palette.border,
            shadowColor: palette.shadow,
          },
        ]}
      >
        {children}
      </View>
    </View>
  );
}

function Row({
  label,
  children,
  last,
}: {
  label: string;
  children: React.ReactNode;
  last?: boolean;
}) {
  const palette = useTheme();
  return (
    <View
      style={{
        padding: 18,
        gap: 12,
        borderBottomWidth: last ? 0 : 1,
        borderBottomColor: palette.border,
      }}
    >
      <Text style={{ fontFamily: fonts.semibold, fontSize: 14.5, color: palette.text }}>
        {label}
      </Text>
      {children}
    </View>
  );
}

function Segmented<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string; icon: React.ComponentProps<typeof Icon>['name'] }[];
}) {
  const palette = useTheme();
  return (
    <View
      style={{
        flexDirection: 'row',
        padding: 4,
        borderRadius: radius.md,
        backgroundColor: palette.secondaryCard,
        borderWidth: 1,
        borderColor: palette.border,
      }}
    >
      {options.map((o) => {
        const active = o.value === value;
        return (
          <Pressable
            key={o.value}
            onPress={() => onChange(o.value)}
            style={{
              flex: 1,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              paddingVertical: 10,
              borderRadius: radius.sm,
              backgroundColor: active ? palette.charcoal : 'transparent',
            }}
          >
            <Icon
              name={o.icon}
              size={17}
              color={active ? '#FFFFFF' : palette.textMuted}
            />
            <Text
              style={{
                fontFamily: active ? fonts.heading : fonts.medium,
                fontSize: 13,
                color: active ? '#FFFFFF' : palette.textMuted,
              }}
            >
              {o.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 140,
    gap: 22,
  },
  profileCard: {
    borderRadius: 24,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    overflow: 'hidden',
    shadowOpacity: 0.14,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
  avatarCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#F1F4FB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionCard: {
    borderRadius: 22,
    borderWidth: 1,
    overflow: 'hidden',
    shadowOpacity: 0.04,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  securityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 18,
  },
  securityIconBox: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
