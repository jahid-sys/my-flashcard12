import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { GraduationCap, Mail, Lock, User, Eye, EyeOff } from 'lucide-react-native';
import { COLORS } from '@/constants/FlashcardColors';
import { AnimatedPressable } from '@/components/AnimatedPressable';
import { useAuth } from '@/contexts/AuthContext';

type Mode = 'signin' | 'signup';

export default function AuthScreen() {
  const router = useRouter();
  const { user, loading, signInWithEmail, signUpWithEmail, signInWithApple, signInWithGoogle } = useAuth();

  const [mode, setMode] = useState<Mode>('signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [socialLoading, setSocialLoading] = useState<'apple' | 'google' | null>(null);

  useEffect(() => {
    if (user && !loading) {
      console.log('[AuthScreen] User authenticated, navigating to home');
      router.replace('/(tabs)/(home)');
    }
  }, [user, loading]);

  const handleSubmit = async () => {
    console.log('[AuthScreen] Submit pressed, mode:', mode);
    setError(null);
    if (!email.trim() || !password.trim()) {
      setError('Please fill in all required fields.');
      return;
    }
    setSubmitting(true);
    try {
      if (mode === 'signin') {
        console.log('[AuthScreen] Signing in with email');
        await signInWithEmail(email.trim(), password);
      } else {
        console.log('[AuthScreen] Signing up with email');
        await signUpWithEmail(email.trim(), password, name.trim() || undefined);
      }
    } catch (e: any) {
      console.error('[AuthScreen] Auth error:', e);
      setError(e?.message || 'Authentication failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleApple = async () => {
    console.log('[AuthScreen] Apple sign in pressed');
    setSocialLoading('apple');
    setError(null);
    try {
      await signInWithApple();
    } catch (e: any) {
      if (!e?.message?.includes('cancel')) {
        setError(e?.message || 'Apple sign in failed.');
      }
    } finally {
      setSocialLoading(null);
    }
  };

  const handleGoogle = async () => {
    console.log('[AuthScreen] Google sign in pressed');
    setSocialLoading('google');
    setError(null);
    try {
      await signInWithGoogle();
    } catch (e: any) {
      setError(e?.message || 'Google sign in failed.');
    } finally {
      setSocialLoading(null);
    }
  };

  const toggleMode = () => {
    console.log('[AuthScreen] Toggle mode to:', mode === 'signin' ? 'signup' : 'signin');
    setMode(mode === 'signin' ? 'signup' : 'signin');
    setError(null);
  };

  const isSignIn = mode === 'signin';
  const buttonLabel = isSignIn ? 'Sign in' : 'Create account';
  const subtitleText = isSignIn ? 'Welcome back, scholar' : 'Start studying smarter';
  const togglePrompt = isSignIn ? "Don't have an account? " : 'Already have an account? ';
  const toggleAction = isSignIn ? 'Sign up' : 'Sign in';
  const appleLabel = isSignIn ? 'Sign in with Apple' : 'Sign up with Apple';
  const googleLabel = isSignIn ? 'Sign in with Google' : 'Sign up with Google';

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: COLORS.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24, paddingVertical: 48 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Logo */}
        <View style={{ alignItems: 'center', marginBottom: 40 }}>
          <View
            style={{
              width: 80,
              height: 80,
              borderRadius: 24,
              backgroundColor: COLORS.primary,
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 16,
              shadowColor: COLORS.primary,
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: 0.35,
              shadowRadius: 12,
              elevation: 6,
            }}
          >
            <GraduationCap size={38} color="#fff" />
          </View>
          <Text
            style={{
              fontSize: 30,
              fontWeight: '800',
              color: COLORS.text,
              fontFamily: 'Nunito_800ExtraBold',
            }}
          >
            FlashAI
          </Text>
          <Text
            style={{
              fontSize: 15,
              color: COLORS.textSecondary,
              fontFamily: 'Nunito_400Regular',
              marginTop: 6,
              textAlign: 'center',
            }}
          >
            {subtitleText}
          </Text>
        </View>

        {/* Social Buttons */}
        <AnimatedPressable onPress={handleApple} disabled={socialLoading !== null}>
          <View
            style={{
              backgroundColor: COLORS.surfaceDark,
              borderRadius: 16,
              paddingVertical: 15,
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'row',
              gap: 10,
              marginBottom: 10,
            }}
          >
            {socialLoading === 'apple' ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Text style={{ fontSize: 17, color: '#fff' }}></Text>
                <Text style={{ fontSize: 15, fontWeight: '700', color: '#fff', fontFamily: 'Nunito_700Bold' }}>
                  {appleLabel}
                </Text>
              </>
            )}
          </View>
        </AnimatedPressable>

        <AnimatedPressable onPress={handleGoogle} disabled={socialLoading !== null}>
          <View
            style={{
              backgroundColor: COLORS.surface,
              borderRadius: 16,
              paddingVertical: 15,
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'row',
              gap: 10,
              marginBottom: 24,
              borderWidth: 1.5,
              borderColor: COLORS.border,
            }}
          >
            {socialLoading === 'google' ? (
              <ActivityIndicator color={COLORS.primary} size="small" />
            ) : (
              <>
                <Text style={{ fontSize: 16 }}>G</Text>
                <Text style={{ fontSize: 15, fontWeight: '700', color: COLORS.text, fontFamily: 'Nunito_700Bold' }}>
                  {googleLabel}
                </Text>
              </>
            )}
          </View>
        </AnimatedPressable>

        {/* Divider */}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 24, gap: 12 }}>
          <View style={{ flex: 1, height: 1, backgroundColor: COLORS.border }} />
          <Text style={{ fontSize: 13, color: COLORS.textTertiary, fontFamily: 'Nunito_400Regular' }}>or</Text>
          <View style={{ flex: 1, height: 1, backgroundColor: COLORS.border }} />
        </View>

        {/* Form */}
        {!isSignIn && (
          <View style={{ marginBottom: 16 }}>
            <Text style={labelStyle}>Name</Text>
            <View style={inputWrapStyle}>
              <User size={16} color={COLORS.textTertiary} />
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="Your full name"
                placeholderTextColor={COLORS.textTertiary}
                autoCapitalize="words"
                returnKeyType="next"
                style={inputStyle}
              />
            </View>
          </View>
        )}

        <View style={{ marginBottom: 16 }}>
          <Text style={labelStyle}>Email</Text>
          <View style={inputWrapStyle}>
            <Mail size={16} color={COLORS.textTertiary} />
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="you@university.edu"
              placeholderTextColor={COLORS.textTertiary}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="next"
              style={inputStyle}
            />
          </View>
        </View>

        <View style={{ marginBottom: 24 }}>
          <Text style={labelStyle}>Password</Text>
          <View style={inputWrapStyle}>
            <Lock size={16} color={COLORS.textTertiary} />
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              placeholderTextColor={COLORS.textTertiary}
              secureTextEntry={!showPassword}
              returnKeyType="done"
              onSubmitEditing={handleSubmit}
              style={inputStyle}
            />
            <AnimatedPressable onPress={() => setShowPassword(!showPassword)}>
              {showPassword ? (
                <EyeOff size={18} color={COLORS.textTertiary} />
              ) : (
                <Eye size={18} color={COLORS.textTertiary} />
              )}
            </AnimatedPressable>
          </View>
        </View>

        {error && (
          <View
            style={{
              backgroundColor: 'rgba(239,68,68,0.08)',
              borderRadius: 12,
              padding: 12,
              marginBottom: 16,
              borderWidth: 1,
              borderColor: 'rgba(239,68,68,0.15)',
            }}
          >
            <Text style={{ fontSize: 13, color: COLORS.danger, fontFamily: 'Nunito_600SemiBold' }}>
              {error}
            </Text>
          </View>
        )}

        <AnimatedPressable onPress={handleSubmit} disabled={submitting}>
          <View
            style={{
              backgroundColor: COLORS.primary,
              borderRadius: 16,
              height: 56,
              alignItems: 'center',
              justifyContent: 'center',
              opacity: submitting ? 0.8 : 1,
              shadowColor: COLORS.primary,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.35,
              shadowRadius: 10,
              elevation: 4,
            }}
          >
            {submitting ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={{ fontSize: 16, fontWeight: '700', color: '#fff', fontFamily: 'Nunito_700Bold' }}>
                {buttonLabel}
              </Text>
            )}
          </View>
        </AnimatedPressable>

        <AnimatedPressable onPress={toggleMode} style={{ marginTop: 20, alignItems: 'center' }}>
          <View style={{ flexDirection: 'row' }}>
            <Text style={{ fontSize: 14, color: COLORS.textSecondary, fontFamily: 'Nunito_400Regular' }}>
              {togglePrompt}
            </Text>
            <Text style={{ fontSize: 14, color: COLORS.primary, fontFamily: 'Nunito_700Bold' }}>
              {toggleAction}
            </Text>
          </View>
        </AnimatedPressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const labelStyle = {
  fontSize: 13,
  fontWeight: '600' as const,
  color: COLORS.textSecondary,
  fontFamily: 'Nunito_600SemiBold',
  marginBottom: 6,
};

const inputWrapStyle = {
  flexDirection: 'row' as const,
  alignItems: 'center' as const,
  backgroundColor: COLORS.surfaceSecondary,
  borderRadius: 12,
  paddingHorizontal: 14,
  borderWidth: 1,
  borderColor: COLORS.border,
};

const inputStyle = {
  flex: 1,
  paddingVertical: 14,
  paddingLeft: 10,
  fontSize: 15,
  color: COLORS.text,
  fontFamily: 'Nunito_400Regular',
};
