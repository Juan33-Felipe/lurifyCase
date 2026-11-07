import React, { useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  AmbientBackground,
  GlassButton,
  GlassIconButton,
  GroupedSection,
  HeroCard,
  InlineMessage,
  SegmentedControl,
  Text,
  TextFieldRow,
  TextFieldRowRef,
  appleLight,
} from '../components/apple';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';

type AuthTab = 'login' | 'register';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Pantalla de autenticación (RF-008), con el kit estilo Apple.
 * Diseño: docs/superpowers/specs/2026-11-07-login-apple-design.md
 * Siempre en modo claro. Sin biometría: la sesión guardada entra directo.
 */
export default function LoginScreen() {
  const { t } = useSettings();
  const { signIn, signUp } = useAuth();
  const insets = useSafeAreaInsets();

  const [activeTab, setActiveTab] = useState<AuthTab>('login');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const passwordRef = useRef<TextFieldRowRef>(null);
  const regEmailRef = useRef<TextFieldRowRef>(null);
  const regPasswordRef = useRef<TextFieldRowRef>(null);
  const regConfirmRef = useRef<TextFieldRowRef>(null);

  const isLogin = activeTab === 'login';

  const changeTab = (tab: AuthTab) => {
    setActiveTab(tab);
    setError(null);
  };

  /** POST /api/v1/auth/login */
  const submitLogin = async () => {
    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) return setError(t('login.missingFields'));
    if (!EMAIL_REGEX.test(trimmedEmail)) return setError(t('login.invalidEmail'));

    setError(null);
    setSubmitting(true);
    try {
      await signIn(trimmedEmail, password);
    } catch (e: any) {
      const code = e?.response?.status;
      const serverMsg = e?.response?.data?.message || e?.response?.data?.error;
      if (code === 400 || code === 401 || code === 422) {
        setError(serverMsg || t('login.invalidCredentials'));
      } else if (!e?.response) {
        setError(t('common.networkError'));
      } else {
        setError(serverMsg || t('common.error'));
      }
    } finally {
      setSubmitting(false);
    }
  };

  /** POST /api/v1/auth/register */
  const submitRegister = async () => {
    const trimmedName = fullName.trim();
    const trimmedEmail = email.trim();
    if (!trimmedName || !trimmedEmail || !password || !confirmPassword) {
      return setError(t('login.missingRegisterFields'));
    }
    if (!EMAIL_REGEX.test(trimmedEmail)) return setError(t('login.invalidEmail'));
    if (password.length < 6) return setError(t('login.passwordLength'));
    if (password !== confirmPassword) return setError(t('login.passwordsMismatch'));

    setError(null);
    setSubmitting(true);
    try {
      await signUp(trimmedName, trimmedEmail, password);
    } catch (e: any) {
      const code = e?.response?.status;
      const serverMsg = e?.response?.data?.message || e?.response?.data?.error;
      if (code === 409) {
        setError(t('login.emailConflict'));
      } else if (code === 400 || code === 422) {
        setError(serverMsg || t('login.registrationFailed'));
      } else if (!e?.response) {
        setError(t('common.networkError'));
      } else {
        setError(serverMsg || t('common.error'));
      }
    } finally {
      setSubmitting(false);
    }
  };

  const passwordLabels = { showLabel: t('login.showPassword'), hideLabel: t('login.hidePassword') };

  return (
    <AmbientBackground>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ flexGrow: 1, paddingBottom: insets.bottom + 24 }}
        >
          <HeroCard>
            <View style={styles.brandRow}>
              <Text variant="headline">
                Iurify <Text variant="headline" weight="500" color={appleLight.secondaryLabel}>Case</Text>
              </Text>
              <GlassIconButton icon="brand" size={36} accessibilityLabel="Iurify Case" />
            </View>

            <Animated.View key={activeTab} entering={FadeIn.duration(260)} style={styles.heroText}>
              <Text variant="subheadline" weight="500" color={appleLight.secondaryLabel}>
                {isLogin ? t('login.heroOverline') : t('login.registerOverline')}
              </Text>
              <Text variant="display" style={styles.headline} accessibilityRole="header">
                {isLogin ? t('login.heroTitle') : t('login.registerHeroTitle')}
              </Text>
            </Animated.View>
          </HeroCard>

          <Animated.View entering={FadeInDown.duration(380).delay(80)} style={styles.form}>
            <SegmentedControl
              value={activeTab}
              onChange={changeTab}
              options={[
                { value: 'login', label: t('login.tabLogin') },
                { value: 'register', label: t('login.tabRegister') },
              ]}
            />

            {isLogin ? (
              <GroupedSection key="login">
                <TextFieldRow
                  icon="mail"
                  placeholder={t('login.email')}
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="email-address"
                  textContentType="username"
                  autoComplete="email"
                  returnKeyType="next"
                  onSubmitEditing={() => passwordRef.current?.focus()}
                />
                <TextFieldRow
                  ref={passwordRef}
                  icon="lock"
                  placeholder={t('login.password')}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  autoCapitalize="none"
                  textContentType="password"
                  autoComplete="current-password"
                  returnKeyType="done"
                  onSubmitEditing={submitLogin}
                  {...passwordLabels}
                />
              </GroupedSection>
            ) : (
              <GroupedSection key="register">
                <TextFieldRow
                  icon="person"
                  placeholder={t('login.fullName')}
                  value={fullName}
                  onChangeText={setFullName}
                  autoCapitalize="words"
                  autoCorrect={false}
                  textContentType="name"
                  autoComplete="name"
                  returnKeyType="next"
                  onSubmitEditing={() => regEmailRef.current?.focus()}
                />
                <TextFieldRow
                  ref={regEmailRef}
                  icon="mail"
                  placeholder={t('login.email')}
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="email-address"
                  textContentType="emailAddress"
                  autoComplete="email"
                  returnKeyType="next"
                  onSubmitEditing={() => regPasswordRef.current?.focus()}
                />
                <TextFieldRow
                  ref={regPasswordRef}
                  icon="lock"
                  placeholder={t('login.password')}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  autoCapitalize="none"
                  textContentType="newPassword"
                  autoComplete="new-password"
                  returnKeyType="next"
                  onSubmitEditing={() => regConfirmRef.current?.focus()}
                  {...passwordLabels}
                />
                <TextFieldRow
                  ref={regConfirmRef}
                  icon="lock"
                  placeholder={t('login.confirmPassword')}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry
                  autoCapitalize="none"
                  textContentType="newPassword"
                  autoComplete="new-password"
                  returnKeyType="done"
                  onSubmitEditing={submitRegister}
                  {...passwordLabels}
                />
              </GroupedSection>
            )}

            {error ? <InlineMessage message={error} /> : null}

            <GlassButton
              label={
                isLogin
                  ? submitting ? t('login.signingIn') : t('login.signIn')
                  : submitting ? t('login.registering') : t('login.tabRegister')
              }
              icon={isLogin ? 'arrowRight' : 'plus'}
              loading={submitting}
              onPress={isLogin ? submitLogin : submitRegister}
              style={styles.cta}
            />
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </AmbientBackground>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  heroText: {
    marginTop: 30,
    gap: 6,
  },
  headline: {
    marginTop: 2,
  },
  form: {
    paddingHorizontal: 16,
    paddingTop: 18,
    gap: 14,
  },
  cta: {
    marginTop: 4,
  },
});
