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
        borderRadius: 20,
        padding: 16,
        alignItems: 'center',
        gap: 6,
        borderWidth: 1,
        borderColor: COLORS.border,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 6,
        elevation: 1,
      }}
    >
      <View
        style={{
          width: 44,
          height: 44,
          borderRadius: 14,
          backgroundColor: `${color}18`,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {icon}
      </View>
      <Text
        style={{
          fontSize: 26,
          fontWeight: '800',
          color: color,
          fontFamily: 'Nunito_800ExtraBold',
          fontVariant: ['tabular-nums'],
        }}
      >
        {value}
      </Text>
      <Text
        style={{
          fontSize: 12,
          color: COLORS.textSecondary,
          fontFamily: 'Nunito_600SemiBold',
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
    .map((w: string) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const displayName = user.name || user.email || 'Student';
  const displayEmail = user.email || '';
  const avgScoreText = stats ? `${Math.round(Number(stats.average_score))}%` : '—';
  const totalDecksText = stats ? String(stats.total_decks) : '—';
  const totalCardsText = stats ? String(stats.total_cards) : '—';
  const quizzesTakenText = stats ? String(stats.quizzes_taken) : '—';
  const signOutLabel = signingOut ? 'Signing out...' : 'Sign out';

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: COLORS.background }}
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 120 }}
    >
      {/* Avatar + Name */}
      <View style={{ alignItems: 'center', paddingTop: 32, paddingBottom: 32 }}>
        <View
          style={{
            width: 88,
            height: 88,
            borderRadius: 44,
            backgroundColor: COLORS.secondary,
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 16,
            shadowColor: COLORS.secondary,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 10,
            elevation: 4,
          }}
        >
          <Text
            style={{
              fontSize: 30,
              fontWeight: '800',
              color: '#fff',
              fontFamily: 'Nunito_800ExtraBold',
            }}
          >
            {initials}
          </Text>
        </View>
        <Text
          style={{
            fontSize: 24,
            fontWeight: '800',
            color: COLORS.text,
            fontFamily: 'Nunito_800ExtraBold',
          }}
        >
          {displayName}
        </Text>
        <Text
          style={{
            fontSize: 14,
            color: COLORS.textSecondary,
            fontFamily: 'Nunito_400Regular',
            marginTop: 4,
          }}
        >
          {displayEmail}
        </Text>
      </View>

      {/* Stats heading */}
      <Text
        style={{
          fontSize: 13,
          fontWeight: '700',
          color: COLORS.textTertiary,
          fontFamily: 'Nunito_700Bold',
          letterSpacing: 0.8,
          textTransform: 'uppercase',
          marginBottom: 12,
        }}
      >
        Your Stats
      </Text>
      <View style={{ flexDirection: 'row', gap: 10, marginBottom: 10 }}>
        <StatCard
          icon={<BookOpen size={20} color={COLORS.primary} />}
          label="Total Decks"
          value={totalDecksText}
          color={COLORS.primary}
        />
        <StatCard
          icon={<CreditCard size={20} color="#16A34A" />}
          label="Total Cards"
          value={totalCardsText}
          color="#16A34A"
        />
      </View>
      <View style={{ flexDirection: 'row', gap: 10, marginBottom: 36 }}>
        <StatCard
          icon={<Trophy size={20} color="#D97706" />}
          label="Quizzes Taken"
          value={quizzesTakenText}
          color="#D97706"
        />
        <StatCard
          icon={<BarChart2 size={20} color={COLORS.secondary} />}
          label="Avg Score"
          value={avgScoreText}
          color={COLORS.secondary}
        />
      </View>

      {/* Sign Out */}
      <AnimatedPressable onPress={handleSignOut} disabled={signingOut}>
        <View
          style={{
            backgroundColor: COLORS.surfaceDark,
            borderRadius: 16,
            paddingVertical: 16,
            alignItems: 'center',
            flexDirection: 'row',
            justifyContent: 'center',
            gap: 8,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.2,
            shadowRadius: 8,
            elevation: 4,
          }}
        >
          <LogOut size={18} color="#fff" />
          <Text
            style={{
              fontSize: 15,
              fontWeight: '700',
              color: '#fff',
              fontFamily: 'Nunito_700Bold',
            }}
          >
            {signOutLabel}
          </Text>
        </View>
      </AnimatedPressable>
    </ScrollView>
  );
}
