import React from 'react';
import { Alert, Platform, ScrollView, StyleSheet, Switch, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import {
  AmbientBackground,
  GlassButton,
  GlassIconButton,
  GroupedSection,
  HeroCard,
  SegmentedControl,
  Symbol,
  Text,
  radii,
  usePalette,
} from '../components/apple';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';

/**
 * Pantalla de Ajustes y Perfil con el kit de diseño estilo Apple de Iurify Case.
 */
export default function SettingsScreen() {
  const palette = usePalette();
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
    if (await confirmBiometrics(t('settings.biometricConfirm'))) {
      setBiometricEnabled(true);
    }
  };

  const initials = (user?.fullName ?? 'LC')
    .split(' ')
    .filter(Boolean)
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <AmbientBackground>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Tarjeta Héroe superior estilo Apple con información de perfil */}
        <HeroCard>
          <View style={styles.brandRow}>
            <Text variant="headline">
              Iurify <Text variant="headline" weight="500" color={palette.secondaryLabel}>Case</Text>
            </Text>
            <GlassIconButton icon="brand" size={36} accessibilityLabel="Iurify Case" />
          </View>

          <Animated.View entering={FadeIn.duration(260)} style={styles.heroText}>
            <Text variant="subheadline" weight="500" color={palette.secondaryLabel}>
              {t('settings.subtitle')}
            </Text>
            <Text variant="display" style={styles.headline} accessibilityRole="header">
              {t('settings.title')}
            </Text>
          </Animated.View>

          {/* Tarjeta de perfil del abogado */}
          <View
            style={[
              styles.profileBanner,
              {
                backgroundColor: palette.mode === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.65)',
                borderColor: palette.glass.border,
              },
            ]}
          >
            <View style={[styles.avatarCircle, { backgroundColor: palette.groupedBackground }]}>
              <Text variant="headline" weight="700" color={palette.label}>
                {initials}
              </Text>
            </View>
            <View style={styles.profileText}>
              <Text variant="headline" numberOfLines={1}>
                {user?.fullName ?? t('settings.notSignedIn')}
              </Text>
              <Text variant="footnote" color={palette.secondaryLabel} numberOfLines={1}>
                {user?.email ?? t('settings.role')}
              </Text>
            </View>
          </View>
        </HeroCard>

        {/* Secciones de configuración agrupadas al estilo de Ajustes de iOS */}
        <Animated.View entering={FadeInDown.duration(380).delay(80)} style={styles.body}>
          {/* 1. Sección de Apariencia */}
          <View style={styles.section}>
            <Text variant="footnote" weight="600" color={palette.secondaryLabel} style={styles.sectionHeaderTitle}>
              {t('settings.appearance').toUpperCase()}
            </Text>

            <GroupedSection>
              {/* Selector de Tema */}
              <View style={styles.settingRow}>
                <View style={styles.rowLabelGroup}>
                  <View style={[styles.settingIconBox, { backgroundColor: palette.groupedBackground }]}>
                    <Symbol name={theme === 'dark' ? 'darkMode' : 'lightMode'} size={17} color={palette.label} />
                  </View>
                  <Text variant="body" weight="500">
                    {t('settings.theme')}
                  </Text>
                </View>
                <SegmentedControl
                  value={theme}
                  onChange={setTheme}
                  style={styles.segmentedInline}
                  options={[
                    { value: 'light', label: t('settings.theme.light') },
                    { value: 'dark', label: t('settings.theme.dark') },
                  ]}
                />
              </View>

              {/* Selector de Idioma */}
              <View style={styles.settingRow}>
                <View style={styles.rowLabelGroup}>
                  <View style={[styles.settingIconBox, { backgroundColor: palette.groupedBackground }]}>
                    <Symbol name="globe" size={17} color={palette.label} />
                  </View>
                  <Text variant="body" weight="500">
                    {t('settings.language')}
                  </Text>
                </View>
                <SegmentedControl
                  value={language}
                  onChange={setLanguage}
                  style={styles.segmentedInline}
                  options={[
                    { value: 'en', label: t('settings.language.en') },
                    { value: 'es', label: t('settings.language.es') },
                  ]}
                />
              </View>

              {/* Interruptor de Traducción Automática */}
              <View style={styles.settingRow}>
                <View style={styles.rowLabelGroup}>
                  <View style={[styles.settingIconBox, { backgroundColor: palette.groupedBackground }]}>
                    <Symbol name="translate" size={17} color={palette.label} />
                  </View>
                  <View style={{ flex: 1, paddingRight: 8 }}>
                    <Text variant="body" weight="500">
                      {t('settings.autoTranslate')}
                    </Text>
                    <Text variant="footnote" color={palette.secondaryLabel} style={{ marginTop: 2 }}>
                      {t('settings.autoTranslateHint')}
                    </Text>
                  </View>
                </View>
                <Switch
                  value={autoTranslate}
                  onValueChange={setAutoTranslate}
                  trackColor={{ false: palette.separator, true: palette.label }}
                  thumbColor={Platform.OS === 'ios' ? undefined : '#FFFFFF'}
                />
              </View>
            </GroupedSection>
          </View>

          {/* 2. Sección de Seguridad */}
          <View style={styles.section}>
            <Text variant="footnote" weight="600" color={palette.secondaryLabel} style={styles.sectionHeaderTitle}>
              {t('settings.security').toUpperCase()}
            </Text>

            <GroupedSection>
              <View style={styles.settingRow}>
                <View style={styles.rowLabelGroup}>
                  <View style={[styles.settingIconBox, { backgroundColor: palette.groupedBackground }]}>
                    <Symbol name="fingerprint" size={18} color={palette.label} />
                  </View>
                  <View style={{ flex: 1, paddingRight: 8 }}>
                    <Text variant="body" weight="500">
                      {t('settings.biometric')}
                    </Text>
                    <Text variant="footnote" color={palette.secondaryLabel} style={{ marginTop: 2 }}>
                      {t('settings.biometricHint')}
                    </Text>
                  </View>
                </View>
                <Switch
                  value={biometricEnabled}
                  onValueChange={toggleBiometric}
                  trackColor={{ false: palette.separator, true: palette.label }}
                  thumbColor={Platform.OS === 'ios' ? undefined : '#FFFFFF'}
                />
              </View>
            </GroupedSection>
          </View>

          {/* 3. Acción de Cerrar Sesión */}
          {user && (
            <View style={styles.logoutWrapper}>
              <GlassButton
                label={t('settings.signOut')}
                icon="logout"
                onPress={signOut}
              />
            </View>
          )}
        </Animated.View>
      </ScrollView>
    </AmbientBackground>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: 130,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  heroText: {
    marginTop: 22,
    gap: 4,
  },
  headline: {
    marginTop: 2,
  },
  profileBanner: {
    marginTop: 20,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: radii.group,
    borderWidth: 1,
    gap: 14,
  },
  avatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileText: {
    flex: 1,
    gap: 3,
  },
  body: {
    paddingHorizontal: 16,
    paddingTop: 20,
    gap: 24,
  },
  section: {
    gap: 8,
  },
  sectionHeaderTitle: {
    paddingHorizontal: 12,
    letterSpacing: 0.4,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    minHeight: 56,
  },
  rowLabelGroup: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  settingIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentedInline: {
    minWidth: 150,
  },
  logoutWrapper: {
    marginTop: 6,
  },
});
