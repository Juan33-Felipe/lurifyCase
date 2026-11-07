import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GlassView } from '../components/Glass';
import { GlassButton, GlassInput, Reveal } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { useSettings, useTheme } from '../context/SettingsContext';
import { fonts, radius } from '../theme/theme';

/** Entry point before the Dashboard (FR-008): credentials + biometric unlock. */
export default function LoginScreen() {
  const palette = useTheme();
  const { t, biometricEnabled } = useSettings();
  const { status, signIn, unlockWithBiometrics } = useAuth();
  const insets = useSafeAreaInsets();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const locked = status === 'locked';

  const submit = async () => {
    if (!email.trim() || !password) {
      setError(t('login.missingFields'));
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await signIn(email, password);
    } catch (e: any) {
      const code = e?.response?.status;
      setError(code === 401 || code === 400 || code === 422 ? t('login.invalidCredentials') : t('common.networkError'));
    } finally {
      setSubmitting(false);
    }
  };

  const biometric = async () => {
    setError(null);
    const ok = await unlockWithBiometrics(t('login.biometricPrompt'));
    if (!ok) setError(t('login.biometricFailed'));
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingHorizontal: 20, paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 }}
        showsVerticalScrollIndicator={false}
      >
        <Reveal index={0} style={{ alignItems: 'center', marginBottom: 28 }}>
          <LinearGradient
            colors={palette.accentGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ width: 84, height: 84, borderRadius: 28, alignItems: 'center', justifyContent: 'center', shadowColor: palette.accent, shadowOpacity: 0.5, shadowRadius: 20, shadowOffset: { width: 0, height: 10 }, elevation: 10 }}
          >
            <Icon name="gavel" size={40} color="#fff" />
          </LinearGradient>
          <Text style={{ fontFamily: fonts.heading, fontSize: 30, color: palette.text, marginTop: 18 }}>Iurify Case</Text>
        </Reveal>

        <Reveal index={1}>
          <GlassView strong borderRadius={radius.xl} contentStyle={{ padding: 24, gap: 16 }}>
            <View>
              <Text style={{ fontFamily: fonts.heading, fontSize: 24, color: palette.text }}>{t('login.title')}</Text>
              <Text style={{ fontFamily: fonts.body, fontSize: 14, lineHeight: 21, color: palette.textMuted, marginTop: 6 }}>
                {locked ? t('login.lockedHint') : t('login.subtitle')}
              </Text>
            </View>

            {locked ? (
              <GlassButton label={t('login.biometric')} icon="fingerprint" onPress={biometric} />
            ) : (
              <>
                <GlassInput
                  icon="mail-outline"
                  placeholder={t('login.email')}
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="email-address"
                  textContentType="username"
                />
                <View>
                  <GlassInput
                    icon="lock-outline"
                    placeholder={t('login.password')}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    textContentType="password"
                    onSubmitEditing={submit}
                  />
                  <Icon
                    name={showPassword ? 'visibility-off' : 'visibility'}
                    size={20}
                    color={palette.textMuted}
                    onPress={() => setShowPassword((v) => !v)}
                    style={{ position: 'absolute', right: 14, top: 15 }}
                  />
                </View>
              </>
            )}

            {error ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: palette.dangerSoft, padding: 12, borderRadius: radius.sm }}>
                <Icon name="error-outline" size={18} color={palette.danger} />
                <Text style={{ flex: 1, fontFamily: fonts.label, fontSize: 13, color: palette.danger }}>{error}</Text>
              </View>
            ) : null}

            {!locked ? (
              <GlassButton label={submitting ? t('login.signingIn') : t('login.signIn')} icon="login" onPress={submit} loading={submitting} />
            ) : (
              <Text style={{ textAlign: 'center', fontFamily: fonts.body, fontSize: 12, color: palette.textMuted }}>
                {biometricEnabled ? t('login.secure') : ''}
              </Text>
            )}
          </GlassView>
        </Reveal>

        <Reveal index={2} style={{ marginTop: 20, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6 }}>
          <Icon name="verified-user" size={16} color={palette.textMuted} />
          <Text style={{ fontFamily: fonts.label, fontSize: 12, color: palette.textMuted }}>{t('login.secure')}</Text>
        </Reveal>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
