import React, { useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeIn } from 'react-native-reanimated';
import { GlassView } from '../components/Glass';
import { GlassButton, GlassInput, Reveal } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { useSettings, useTheme } from '../context/SettingsContext';
import { fonts, radius } from '../theme/theme';

type AuthTab = 'login' | 'register';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Production Authentication Screen (FR-008).
 * Provides segmented tab navigation for Login and Registration flows,
 * with real API endpoints, client validation, and graceful error handling.
 */
export default function LoginScreen() {
  const palette = useTheme();
  const { t, biometricEnabled } = useSettings();
  const { status, signIn, signUp, unlockWithBiometrics } = useAuth();
  const insets = useSafeAreaInsets();

  const [activeTab, setActiveTab] = useState<AuthTab>('login');

  // Login form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Registration form state
  const [fullName, setFullName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Status state
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Input references for seamless keyboard next/done flow
  const passwordInputRef = useRef<React.ElementRef<typeof TextInput>>(null);
  const regEmailRef = useRef<React.ElementRef<typeof TextInput>>(null);
  const regPasswordRef = useRef<React.ElementRef<typeof TextInput>>(null);
  const regConfirmPasswordRef = useRef<React.ElementRef<typeof TextInput>>(null);

  const locked = status === 'locked';

  const handleTabChange = (tab: AuthTab) => {
    setActiveTab(tab);
    setError(null);
  };

  /** Validates & submits Login targeting POST /api/v1/auth/login */
  const submitLogin = async () => {
    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      setError(t('login.missingFields'));
      return;
    }
    if (!EMAIL_REGEX.test(trimmedEmail)) {
      setError(t('login.invalidEmail'));
      return;
    }

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

  /** Validates & submits Registration targeting POST /api/v1/auth/register */
  const submitRegister = async () => {
    const trimmedName = fullName.trim();
    const trimmedEmail = email.trim();

    if (!trimmedName || !trimmedEmail || !password || !confirmPassword) {
      setError(t('login.missingRegisterFields'));
      return;
    }
    if (!EMAIL_REGEX.test(trimmedEmail)) {
      setError(t('login.invalidEmail'));
      return;
    }
    if (password.length < 6) {
      setError(t('login.passwordLength'));
      return;
    }
    if (password !== confirmPassword) {
      setError(t('login.passwordsMismatch'));
      return;
    }

    setError(null);
    setSubmitting(true);
    try {
      await signUp(trimmedName, trimmedEmail, password);
    } catch (e: any) {
      const code = e?.response?.status;
      const serverMsg = e?.response?.data?.message || e?.response?.data?.error;
      if (code === 409) {
        // Conflict: Email already registered
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

  const biometric = async () => {
    setError(null);
    const ok = await unlockWithBiometrics(t('login.biometricPrompt'));
    if (!ok) setError(t('login.biometricFailed'));
  };

  const isLight = palette.mode === 'light';

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: 'center',
          paddingHorizontal: 20,
          paddingTop: insets.top + 24,
          paddingBottom: insets.bottom + 24,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Brand Icon & Heading */}
        <Reveal index={0} style={{ alignItems: 'center', marginBottom: 24 }}>
          <LinearGradient
            colors={palette.accentGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              width: 80,
              height: 80,
              borderRadius: 26,
              alignItems: 'center',
              justifyContent: 'center',
              shadowColor: isLight ? '#2563EB' : palette.accent,
              shadowOpacity: 0.35,
              shadowRadius: 18,
              shadowOffset: { width: 0, height: 8 },
              elevation: 8,
            }}
          >
            <Icon name="gavel" size={38} color="#FFFFFF" />
          </LinearGradient>
          <Text
            style={{
              fontFamily: fonts.heading,
              fontSize: 28,
              color: palette.text,
              marginTop: 16,
              letterSpacing: -0.5,
            }}
          >
            Iurify Case
          </Text>
        </Reveal>

        {/* Main Glassmorphic Authentication Card */}
        <Reveal index={1}>
          <GlassView
            strong
            borderRadius={radius.xl}
            style={{
              borderWidth: 1.2,
              borderColor: isLight ? '#DCE3F1' : palette.border,
              backgroundColor: isLight ? 'rgba(255, 255, 255, 0.94)' : palette.surface,
              shadowColor: isLight ? '#2563EB' : palette.shadow,
              shadowOpacity: isLight ? 0.08 : 0.25,
              shadowRadius: 22,
              shadowOffset: { width: 0, height: 10 },
              elevation: 4,
            }}
            contentStyle={{ padding: 22, gap: 16 }}
          >
            {/* Segmented Switch: Login vs Register (only shown when not biometrically locked) */}
            {!locked && (
              <View
                style={{
                  flexDirection: 'row',
                  backgroundColor: palette.secondaryCard,
                  borderRadius: radius.pill,
                  padding: 4,
                  borderWidth: 1,
                  borderColor: isLight ? '#DCE3F1' : palette.border,
                }}
              >
                <Pressable
                  onPress={() => handleTabChange('login')}
                  style={{
                    flex: 1,
                    paddingVertical: 10,
                    borderRadius: radius.pill,
                    backgroundColor: activeTab === 'login' ? palette.charcoal : 'transparent',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Text
                    style={{
                      fontFamily: activeTab === 'login' ? fonts.semibold : fonts.medium,
                      fontSize: 13.5,
                      color: activeTab === 'login' ? '#FFFFFF' : palette.textMuted,
                    }}
                  >
                    {t('login.tabLogin')}
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() => handleTabChange('register')}
                  style={{
                    flex: 1,
                    paddingVertical: 10,
                    borderRadius: radius.pill,
                    backgroundColor: activeTab === 'register' ? palette.charcoal : 'transparent',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Text
                    style={{
                      fontFamily: activeTab === 'register' ? fonts.semibold : fonts.medium,
                      fontSize: 13.5,
                      color: activeTab === 'register' ? '#FFFFFF' : palette.textMuted,
                    }}
                  >
                    {t('login.tabRegister')}
                  </Text>
                </Pressable>
              </View>
            )}

            {/* Header Titles */}
            <View>
              <Text
                style={{
                  fontFamily: fonts.heading,
                  fontSize: 22,
                  color: palette.text,
                  letterSpacing: -0.3,
                }}
              >
                {locked
                  ? t('login.title')
                  : activeTab === 'login'
                    ? t('login.title')
                    : t('login.registerTitle')}
              </Text>
              <Text
                style={{
                  fontFamily: fonts.body,
                  fontSize: 13.5,
                  lineHeight: 20,
                  color: palette.textMuted,
                  marginTop: 4,
                }}
              >
                {locked
                  ? t('login.lockedHint')
                  : activeTab === 'login'
                    ? t('login.subtitle')
                    : t('login.registerSubtitle')}
              </Text>
            </View>

            {/* Form Fields & State Transitions */}
            {locked ? (
              <GlassButton
                label={t('login.biometric')}
                icon="fingerprint"
                onPress={biometric}
                style={{ marginTop: 6 }}
              />
            ) : activeTab === 'login' ? (
              <Animated.View key="login-form" entering={FadeIn.duration(200)} style={{ gap: 14 }}>
                {/* Email */}
                <GlassInput
                  icon="mail-outline"
                  placeholder={t('login.email')}
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="email-address"
                  textContentType="username"
                  returnKeyType="next"
                  onSubmitEditing={() => passwordInputRef.current?.focus()}
                />

                {/* Password with Eye Toggle */}
                <View style={{ position: 'relative' }}>
                  <GlassInput
                    ref={passwordInputRef}
                    icon="lock-outline"
                    placeholder={t('login.password')}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    textContentType="password"
                    returnKeyType="done"
                    onSubmitEditing={submitLogin}
                    style={{ paddingRight: 44 }}
                  />
                  <Pressable
                    onPress={() => setShowPassword((v) => !v)}
                    hitSlop={12}
                    accessibilityLabel="Toggle password visibility"
                    style={{ position: 'absolute', right: 14, top: 15 }}
                  >
                    <Icon
                      name={showPassword ? 'visibility-off' : 'visibility'}
                      size={20}
                      color={palette.textMuted}
                    />
                  </Pressable>
                </View>

                {/* Submit Action */}
                <GlassButton
                  label={submitting ? t('login.signingIn') : t('login.signIn')}
                  icon="login"
                  onPress={submitLogin}
                  loading={submitting}
                  style={{ marginTop: 4 }}
                />
              </Animated.View>
            ) : (
              <Animated.View
                key="register-form"
                entering={FadeIn.duration(200)}
                style={{ gap: 14 }}
              >
                {/* Full Name */}
                <GlassInput
                  icon="person-outline"
                  placeholder={t('login.fullName')}
                  value={fullName}
                  onChangeText={setFullName}
                  autoCapitalize="words"
                  autoCorrect={false}
                  textContentType="name"
                  returnKeyType="next"
                  onSubmitEditing={() => regEmailRef.current?.focus()}
                />

                {/* Email */}
                <GlassInput
                  ref={regEmailRef}
                  icon="mail-outline"
                  placeholder={t('login.email')}
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="email-address"
                  textContentType="emailAddress"
                  returnKeyType="next"
                  onSubmitEditing={() => regPasswordRef.current?.focus()}
                />

                {/* Password with Eye Toggle */}
                <View style={{ position: 'relative' }}>
                  <GlassInput
                    ref={regPasswordRef}
                    icon="lock-outline"
                    placeholder={t('login.password')}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    textContentType="newPassword"
                    returnKeyType="next"
                    onSubmitEditing={() => regConfirmPasswordRef.current?.focus()}
                    style={{ paddingRight: 44 }}
                  />
                  <Pressable
                    onPress={() => setShowPassword((v) => !v)}
                    hitSlop={12}
                    accessibilityLabel="Toggle password visibility"
                    style={{ position: 'absolute', right: 14, top: 15 }}
                  >
                    <Icon
                      name={showPassword ? 'visibility-off' : 'visibility'}
                      size={20}
                      color={palette.textMuted}
                    />
                  </Pressable>
                </View>

                {/* Confirm Password with Eye Toggle */}
                <View style={{ position: 'relative' }}>
                  <GlassInput
                    ref={regConfirmPasswordRef}
                    icon="lock"
                    placeholder={t('login.confirmPassword')}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry={!showConfirmPassword}
                    autoCapitalize="none"
                    textContentType="newPassword"
                    returnKeyType="done"
                    onSubmitEditing={submitRegister}
                    style={{ paddingRight: 44 }}
                  />
                  <Pressable
                    onPress={() => setShowConfirmPassword((v) => !v)}
                    hitSlop={12}
                    accessibilityLabel="Toggle confirm password visibility"
                    style={{ position: 'absolute', right: 14, top: 15 }}
                  >
                    <Icon
                      name={showConfirmPassword ? 'visibility-off' : 'visibility'}
                      size={20}
                      color={palette.textMuted}
                    />
                  </Pressable>
                </View>

                {/* Submit Action */}
                <GlassButton
                  label={submitting ? t('login.registering') : t('login.registerAction')}
                  icon="person-add"
                  onPress={submitRegister}
                  loading={submitting}
                  style={{ marginTop: 4 }}
                />
              </Animated.View>
            )}

            {/* Graceful Error Notification */}
            {error ? (
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 10,
                  backgroundColor: palette.dangerSoft,
                  padding: 12,
                  borderRadius: radius.md,
                  borderWidth: 1,
                  borderColor: isLight ? 'rgba(229, 72, 77, 0.25)' : 'rgba(229, 72, 77, 0.4)',
                }}
              >
                <Icon name="error-outline" size={18} color={palette.danger} />
                <Text
                  style={{
                    flex: 1,
                    fontFamily: fonts.label,
                    fontSize: 13,
                    lineHeight: 18,
                    color: palette.danger,
                  }}
                >
                  {error}
                </Text>
              </View>
            ) : null}

            {locked && (
              <Text
                style={{
                  textAlign: 'center',
                  fontFamily: fonts.body,
                  fontSize: 12,
                  color: palette.textMuted,
                }}
              >
                {biometricEnabled ? t('login.secure') : ''}
              </Text>
            )}
          </GlassView>
        </Reveal>

        {/* Security / Confidentiality Badge */}
        <Reveal
          index={2}
          style={{
            marginTop: 22,
            flexDirection: 'row',
            justifyContent: 'center',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <Icon name="verified-user" size={16} color={palette.textMuted} />
          <Text
            style={{
              fontFamily: fonts.label,
              fontSize: 12,
              color: palette.textMuted,
              letterSpacing: 0.1,
            }}
          >
            {t('login.secure')}
          </Text>
        </Reveal>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
