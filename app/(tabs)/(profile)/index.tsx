import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { LogOut, BookOpen, CreditCard, Trophy, BarChart2 } from 'lucide-react-native';
import { COLORS } from '@/constants/FlashcardColors';
import { AnimatedPressable } from '@/components/AnimatedPressable';
import { apiGet } from '@/utils/api';
import { useAuth } from '@/contexts/AuthContext';

interface ProfileStats {
  total_decks: number;
  total_cards: number;
  quizzes_taken: number;
  average_score: number;
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color: string }) {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: COLORS.surface,
        borderRadius: 14,
        padding: 14,
        alignItems: 'center',
        gap: 6,
        borderWidth: 1,
        borderColor: COLORS.border,
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        borderCurve: 'continuous',
      }}
    >
      <View
        style={{
          width: 40,
          height: 40,
          borderRadius: 12,
          backgroundColor: `${color}18`,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {icon}
      </View>
      <Text
        style={{
          fontSize: 22,
          fontWeight: '700',
          color: COLORS.text,
          fontFamily: 'SpaceGrotesk_700Bold',
          fontVariant: ['tabular-nums'],
        }}
      >
        {value}
      </Text>
      <Text
        style={{
          fontSize: 12,
          color: COLORS.textSecondary,
          fontFamily: 'SpaceGrotesk_500Medium',
          textAlign: 'center',
        }}
      >
        {label}
      </Text>
    </View>
  );
}

export default function ProfileScreen() {
  const router = useRouter();
  const { user, loading: authLoading, signOut } = useAuth();
  const [stats, setStats] = useState<ProfileStats | null>(null);
  const [signingOut, setSigningOut] = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (!authLoading && !user) {
        router.replace('/auth-screen');
      }
    }, [authLoading, user])
  );

  useEffect(() => {
    if (user) {
      fetchStats();
    }
  }, [user]);

  const fetchStats = async () => {
    console.log('[ProfileScreen] Fetching profile stats');
    try {
      const data = await apiGet<ProfileStats>('/api/profile/stats');
      setStats(data);
    } catch (e) {
      console.error('[ProfileScreen] Failed to fetch stats:', e);
      // Use fallback zeros
      setStats({ total_decks: 0, total_cards: 0, quizzes_taken: 0, average_score: 0 });
    }
  };

  const handleSignOut = async () => {
    console.log('[ProfileScreen] Sign out pressed');
    setSigningOut(true);
    try {
      await signOut();
      router.replace('/auth-screen');
    } catch (e) {
      console.error('[ProfileScreen] Sign out error:', e);
    } finally {
      setSigningOut(false);
    }
  };

  if (!user) return null;

  const initials = (user.name || user.email || 'U')
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const displayName = user.name || user.email || 'Student';
  const displayEmail = user.email || '';
  const avgScoreText = stats ? `${Math.round(Number(stats.average_score))}%` : '—';
  const totalDecksText = stats ? String(stats.total_decks) : '—';
  const totalCardsText = stats ? String(stats.total_cards) : '—';
  const quizzesTakenText = stats ? String(stats.quizzes_taken) : '—';

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: COLORS.background }}
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 120 }}
    >
      {/* Avatar + Name */}
      <View style={{ alignItems: 'center', paddingTop: 24, paddingBottom: 32 }}>
        <View
          style={{
            width: 80,
            height: 80,
            borderRadius: 40,
            backgroundColor: COLORS.primaryMuted,
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 14,
            borderWidth: 2,
            borderColor: COLORS.primary,
          }}
        >
          <Text
            style={{
              fontSize: 28,
              fontWeight: '700',
              color: COLORS.primary,
              fontFamily: 'SpaceGrotesk_700Bold',
            }}
          >
            {initials}
          </Text>
        </View>
        <Text
          style={{
            fontSize: 22,
            fontWeight: '700',
            color: COLORS.text,
            fontFamily: 'SpaceGrotesk_700Bold',
            letterSpacing: -0.3,
          }}
        >
          {displayName}
        </Text>
        <Text
          style={{
            fontSize: 14,
            color: COLORS.textSecondary,
            fontFamily: 'SpaceGrotesk_400Regular',
            marginTop: 4,
          }}
        >
          {displayEmail}
        </Text>
      </View>

      {/* Stats */}
      <Text
        style={{
          fontSize: 13,
          fontWeight: '600',
          color: COLORS.textTertiary,
          fontFamily: 'SpaceGrotesk_600SemiBold',
          letterSpacing: 0.5,
          textTransform: 'uppercase',
          marginBottom: 12,
        }}
      >
        Your Stats
      </Text>
      <View style={{ flexDirection: 'row', gap: 10, marginBottom: 10 }}>
        <StatCard
          icon={<BookOpen size={18} color={COLORS.primary} />}
          label="Total Decks"
          value={totalDecksText}
          color={COLORS.primary}
        />
        <StatCard
          icon={<CreditCard size={18} color="#16A34A" />}
          label="Total Cards"
          value={totalCardsText}
          color="#16A34A"
        />
      </View>
      <View style={{ flexDirection: 'row', gap: 10, marginBottom: 32 }}>
        <StatCard
          icon={<Trophy size={18} color="#D97706" />}
          label="Quizzes Taken"
          value={quizzesTakenText}
          color="#D97706"
        />
        <StatCard
          icon={<BarChart2 size={18} color="#9333EA" />}
          label="Avg Score"
          value={avgScoreText}
          color="#9333EA"
        />
      </View>

      {/* Sign Out */}
      <AnimatedPressable onPress={handleSignOut} disabled={signingOut}>
        <View
          style={{
            backgroundColor: 'rgba(239,68,68,0.08)',
            borderRadius: 14,
            paddingVertical: 15,
            alignItems: 'center',
            flexDirection: 'row',
            justifyContent: 'center',
            gap: 8,
            borderWidth: 1,
            borderColor: 'rgba(239,68,68,0.15)',
            borderCurve: 'continuous',
          }}
        >
          <LogOut size={18} color={COLORS.danger} />
          <Text
            style={{
              fontSize: 15,
              fontWeight: '600',
              color: COLORS.danger,
              fontFamily: 'SpaceGrotesk_600SemiBold',
            }}
          >
            {signingOut ? 'Signing out...' : 'Sign out'}
          </Text>
        </View>
      </AnimatedPressable>
    </ScrollView>
  );
}
