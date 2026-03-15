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
              width: 72,
              height: 72,
              borderRadius: 20,
              backgroundColor: COLORS.primaryMuted,
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 16,
              borderCurve: 'continuous',
              borderWidth: 1,
              borderColor: COLORS.border,
            }}
          >
            <GraduationCap size={34} color={COLORS.primary} />
          </View>
          <Text
            style={{
              fontSize: 28,
              fontWeight: '700',
              color: COLORS.text,
              fontFamily: 'SpaceGrotesk_700Bold',
              letterSpacing: -0.5,
            }}
          >
            FlashAI
          </Text>
          <Text
            style={{
              fontSize: 15,
              color: COLORS.textSecondary,
              fontFamily: 'SpaceGrotesk_400Regular',
              marginTop: 6,
              textAlign: 'center',
            }}
          >
            {isSignIn ? 'Welcome back, scholar' : 'Start studying smarter'}
          </Text>
        </View>

        {/* Social Buttons */}
        <AnimatedPressable onPress={handleApple} disabled={socialLoading !== null}>
          <View
            style={{
              backgroundColor: COLORS.text,
              borderRadius: 14,
              paddingVertical: 14,
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'row',
              gap: 10,
              marginBottom: 10,
              borderCurve: 'continuous',
            }}
          >
            {socialLoading === 'apple' ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Text style={{ fontSize: 17, color: '#fff' }}></Text>
                <Text style={{ fontSize: 15, fontWeight: '600', color: '#fff', fontFamily: 'SpaceGrotesk_600SemiBold' }}>
                  {isSignIn ? 'Sign in with Apple' : 'Sign up with Apple'}
                </Text>
              </>
            )}
          </View>
        </AnimatedPressable>

        <AnimatedPressable onPress={handleGoogle} disabled={socialLoading !== null}>
          <View
            style={{
              backgroundColor: COLORS.surface,
              borderRadius: 14,
              paddingVertical: 14,
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'row',
              gap: 10,
              marginBottom: 24,
              borderWidth: 1,
              borderColor: COLORS.border,
              borderCurve: 'continuous',
            }}
          >
            {socialLoading === 'google' ? (
              <ActivityIndicator color={COLORS.primary} size="small" />
            ) : (
              <>
                <Text style={{ fontSize: 16 }}>G</Text>
                <Text style={{ fontSize: 15, fontWeight: '600', color: COLORS.text, fontFamily: 'SpaceGrotesk_600SemiBold' }}>
                  {isSignIn ? 'Sign in with Google' : 'Sign up with Google'}
                </Text>
              </>
            )}
          </View>
        </AnimatedPressable>

        {/* Divider */}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 24, gap: 12 }}>
          <View style={{ flex: 1, height: 1, backgroundColor: COLORS.border }} />
          <Text style={{ fontSize: 13, color: COLORS.textTertiary, fontFamily: 'SpaceGrotesk_400Regular' }}>or</Text>
          <View style={{ flex: 1, height: 1, backgroundColor: COLORS.border }} />
        </View>

        {/* Form */}
        {!isSignIn && (
          <View style={{ marginBottom: 16 }}>
            <Text style={{ fontSize: 13, fontWeight: '600', color: COLORS.textSecondary, fontFamily: 'SpaceGrotesk_600SemiBold', marginBottom: 6 }}>
              Name
            </Text>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: COLORS.surfaceSecondary,
                borderRadius: 12,
                paddingHorizontal: 14,
                borderWidth: 1,
                borderColor: COLORS.border,
                borderCurve: 'continuous',
              }}
            >
              <User size={16} color={COLORS.textTertiary} />
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="Your full name"
                placeholderTextColor={COLORS.textTertiary}
                autoCapitalize="words"
                returnKeyType="next"
                style={{
                  flex: 1,
                  paddingVertical: 14,
                  paddingLeft: 10,
                  fontSize: 15,
                  color: COLORS.text,
                  fontFamily: 'SpaceGrotesk_400Regular',
                }}
              />
            </View>
          </View>
        )}

        <View style={{ marginBottom: 16 }}>
          <Text style={{ fontSize: 13, fontWeight: '600', color: COLORS.textSecondary, fontFamily: 'SpaceGrotesk_600SemiBold', marginBottom: 6 }}>
            Email
          </Text>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: COLORS.surfaceSecondary,
              borderRadius: 12,
              paddingHorizontal: 14,
              borderWidth: 1,
              borderColor: COLORS.border,
              borderCurve: 'continuous',
            }}
          >
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
              style={{
                flex: 1,
                paddingVertical: 14,
                paddingLeft: 10,
                fontSize: 15,
                color: COLORS.text,
                fontFamily: 'SpaceGrotesk_400Regular',
              }}
            />
          </View>
        </View>

        <View style={{ marginBottom: 24 }}>
          <Text style={{ fontSize: 13, fontWeight: '600', color: COLORS.textSecondary, fontFamily: 'SpaceGrotesk_600SemiBold', marginBottom: 6 }}>
            Password
          </Text>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: COLORS.surfaceSecondary,
              borderRadius: 12,
              paddingHorizontal: 14,
              borderWidth: 1,
              borderColor: COLORS.border,
              borderCurve: 'continuous',
            }}
          >
            <Lock size={16} color={COLORS.textTertiary} />
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              placeholderTextColor={COLORS.textTertiary}
              secureTextEntry={!showPassword}
              returnKeyType="done"
              onSubmitEditing={handleSubmit}
              style={{
                flex: 1,
                paddingVertical: 14,
                paddingLeft: 10,
                fontSize: 15,
                color: COLORS.text,
                fontFamily: 'SpaceGrotesk_400Regular',
              }}
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
              borderRadius: 10,
              padding: 12,
              marginBottom: 16,
              borderWidth: 1,
              borderColor: 'rgba(239,68,68,0.15)',
            }}
          >
            <Text style={{ fontSize: 13, color: COLORS.danger, fontFamily: 'SpaceGrotesk_500Medium' }}>
              {error}
            </Text>
          </View>
        )}

        <AnimatedPressable onPress={handleSubmit} disabled={submitting}>
          <View
            style={{
              backgroundColor: COLORS.primary,
              borderRadius: 14,
              paddingVertical: 15,
              alignItems: 'center',
              justifyContent: 'center',
              borderCurve: 'continuous',
              opacity: submitting ? 0.8 : 1,
            }}
          >
            {submitting ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={{ fontSize: 15, fontWeight: '600', color: '#fff', fontFamily: 'SpaceGrotesk_600SemiBold' }}>
                {buttonLabel}
              </Text>
            )}
          </View>
        </AnimatedPressable>

        <AnimatedPressable onPress={toggleMode} style={{ marginTop: 20, alignItems: 'center' }}>
          <Text style={{ fontSize: 14, color: COLORS.textSecondary, fontFamily: 'SpaceGrotesk_400Regular' }}>
            {isSignIn ? "Don't have an account? " : 'Already have an account? '}
            <Text style={{ color: COLORS.primary, fontFamily: 'SpaceGrotesk_600SemiBold' }}>
              {isSignIn ? 'Sign up' : 'Sign in'}
            </Text>
          </Text>
        </AnimatedPressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
