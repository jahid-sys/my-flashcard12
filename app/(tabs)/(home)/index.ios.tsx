import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  Animated,
  RefreshControl,
} from 'react-native';
import { useRouter, useFocusEffect, Stack } from 'expo-router';
import { BookOpen, Plus, GraduationCap, Clock, Bell, ChevronRight } from 'lucide-react-native';
import { COLORS, getSubjectColor } from '@/constants/FlashcardColors';
import { AnimatedPressable } from '@/components/AnimatedPressable';
import { DeckCardSkeleton } from '@/components/SkeletonLoader';
import { apiGet } from '@/utils/api';
import { useAuth } from '@/contexts/AuthContext';
import { formatDistanceToNow } from '@/utils/dateUtils';

interface Deck {
  id: string;
  title: string;
  subject: string;
  description?: string;
  card_count: number;
  created_at: string;
  updated_at: string;
  last_studied_at?: string;
  last_quiz_score?: number;
}

function AnimatedDeckCard({ deck, index, onPress }: { deck: Deck; index: number; onPress: () => void }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(16)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 350, delay: index * 70, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 350, delay: index * 70, useNativeDriver: true }),
    ]).start();
  }, []);

  const subjectColor = getSubjectColor(deck.subject);
  const dateLabel = deck.last_studied_at
    ? formatDistanceToNow(deck.last_studied_at)
    : formatDistanceToNow(deck.created_at);
  const datePrefix = deck.last_studied_at ? 'Studied' : 'Created';
  const cardCountText = `${deck.card_count ?? 0} cards`;
  const scoreText = deck.last_quiz_score != null ? `${Math.round(Number(deck.last_quiz_score))}%` : null;
  const subjectLabel = deck.subject || 'General';

  return (
    <Animated.View style={{ opacity, transform: [{ translateY }] }}>
      <AnimatedPressable onPress={onPress}>
        <View
          style={{
            backgroundColor: COLORS.surface,
            borderRadius: 20,
            padding: 16,
            marginBottom: 12,
            borderWidth: 1,
            borderColor: COLORS.border,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.06,
            shadowRadius: 8,
            elevation: 2,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <View
              style={{
                backgroundColor: subjectColor.bg,
                borderRadius: 20,
                paddingHorizontal: 12,
                paddingVertical: 5,
                alignSelf: 'flex-start',
              }}
            >
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: '700',
                  color: subjectColor.text,
                  fontFamily: 'Nunito_700Bold',
                }}
              >
                {subjectLabel}
              </Text>
            </View>
            {scoreText != null && (
              <View
                style={{
                  backgroundColor: COLORS.primaryMuted,
                  borderRadius: 20,
                  paddingHorizontal: 10,
                  paddingVertical: 4,
                }}
              >
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: '700',
                    color: COLORS.primary,
                    fontFamily: 'Nunito_700Bold',
                    fontVariant: ['tabular-nums'],
                  }}
                >
                  {scoreText}
                </Text>
              </View>
            )}
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 }}>
            <Text
              style={{
                fontSize: 17,
                fontWeight: '700',
                color: COLORS.text,
                fontFamily: 'Nunito_700Bold',
                flex: 1,
                marginRight: 8,
              }}
              numberOfLines={2}
            >
              {deck.title}
            </Text>
            <View
              style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                backgroundColor: COLORS.surfaceSecondary,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <ChevronRight size={16} color={COLORS.textSecondary} />
            </View>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 10, gap: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <BookOpen size={13} color={COLORS.textTertiary} />
              <Text style={{ fontSize: 13, color: COLORS.textSecondary, fontFamily: 'Nunito_600SemiBold' }}>
                {cardCountText}
              </Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Clock size={13} color={COLORS.textTertiary} />
              <Text style={{ fontSize: 13, color: COLORS.textTertiary, fontFamily: 'Nunito_400Regular' }}>
                {datePrefix}
              </Text>
              <Text style={{ fontSize: 13, color: COLORS.textTertiary, fontFamily: 'Nunito_400Regular' }}>
                {dateLabel}
              </Text>
            </View>
          </View>
        </View>
      </AnimatedPressable>
    </Animated.View>
  );
}

function EmptyState({ onCreatePress }: { onCreatePress: () => void }) {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, paddingTop: 60 }}>
      <View
        style={{
          width: 80,
          height: 80,
          borderRadius: 24,
          backgroundColor: COLORS.primaryMuted,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 20,
        }}
      >
        <GraduationCap size={36} color={COLORS.primary} />
      </View>
      <Text
        style={{
          fontSize: 22,
          fontWeight: '800',
          color: COLORS.text,
          fontFamily: 'Nunito_800ExtraBold',
          textAlign: 'center',
          marginBottom: 8,
        }}
      >
        No decks yet
      </Text>
      <Text
        style={{
          fontSize: 15,
          color: COLORS.textSecondary,
          fontFamily: 'Nunito_400Regular',
          textAlign: 'center',
          lineHeight: 22,
          maxWidth: 280,
          marginBottom: 28,
        }}
      >
        Paste your lecture notes and let AI create flashcards for you in seconds.
      </Text>
      <AnimatedPressable onPress={onCreatePress}>
        <View
          style={{
            backgroundColor: COLORS.primary,
            borderRadius: 16,
            paddingHorizontal: 28,
            paddingVertical: 15,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
            shadowColor: COLORS.primary,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.35,
            shadowRadius: 10,
            elevation: 4,
          }}
        >
          <Plus size={18} color="#fff" />
          <Text
            style={{
              fontSize: 16,
              fontWeight: '700',
              color: '#fff',
              fontFamily: 'Nunito_700Bold',
            }}
          >
            Create your first deck
          </Text>
        </View>
      </AnimatedPressable>
    </View>
  );
}

export default function HomeScreen() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [decks, setDecks] = useState<Deck[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDecks = useCallback(async () => {
    console.log('[HomeScreen] Fetching decks');
    try {
      setError(null);
      const data = await apiGet<Deck[]>('/api/decks');
      setDecks(Array.isArray(data) ? data : []);
    } catch (e: any) {
      console.error('[HomeScreen] Failed to fetch decks:', e);
      setError('Couldn\'t load your decks. Check your connection and try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (!authLoading && !user) {
        router.replace('/auth-screen');
        return;
      }
      if (!authLoading && user) {
        fetchDecks();
      }
    }, [authLoading, user])
  );

  const handleRefresh = () => {
    console.log('[HomeScreen] Refreshing decks');
    setRefreshing(true);
    fetchDecks();
  };

  const handleCreateDeck = () => {
    console.log('[HomeScreen] Navigate to create-deck');
    router.push('/create-deck');
  };

  const handleDeckPress = (deck: Deck) => {
    console.log('[HomeScreen] Navigate to deck:', deck.id, deck.title);
    router.push(`/deck/${deck.id}`);
  };

  const handleBellPress = () => {
    console.log('[HomeScreen] Bell icon pressed');
  };

  const totalCards = decks.reduce((sum, d) => sum + (d.card_count ?? 0), 0);
  const firstName = user?.name ? user.name.split(' ')[0] : 'Student';
  const initials = (user?.name || user?.email || 'S')
    .split(' ')
    .map((w: string) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const deckCountText = String(decks.length);
  const cardCountText = String(totalCards);

  const ListHeader = () => (
    <View style={{ paddingTop: 8, paddingBottom: 4 }}>
      {/* Header row */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              backgroundColor: COLORS.secondary,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ fontSize: 16, fontWeight: '800', color: '#fff', fontFamily: 'Nunito_800ExtraBold' }}>
              {initials}
            </Text>
          </View>
          <View>
            <Text style={{ fontSize: 22, fontWeight: '800', color: COLORS.text, fontFamily: 'Nunito_800ExtraBold' }}>
              Hello, {firstName}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Text style={{ fontSize: 13, color: COLORS.primary, fontFamily: 'Nunito_700Bold' }}>⚡</Text>
              <Text style={{ fontSize: 13, color: COLORS.textSecondary, fontFamily: 'Nunito_600SemiBold' }}>
                {deckCountText} decks ready
              </Text>
            </View>
          </View>
        </View>
        <AnimatedPressable onPress={handleBellPress}>
          <View
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: COLORS.surface,
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: 1,
              borderColor: COLORS.border,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.06,
              shadowRadius: 4,
              elevation: 1,
            }}
          >
            <Bell size={18} color={COLORS.text} />
          </View>
        </AnimatedPressable>
      </View>

      {/* Hero banner */}
      <AnimatedPressable onPress={handleCreateDeck}>
        <View
          style={{
            backgroundColor: COLORS.secondary,
            borderRadius: 24,
            padding: 24,
            minHeight: 160,
            marginBottom: 16,
            overflow: 'hidden',
            shadowColor: COLORS.secondary,
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.3,
            shadowRadius: 14,
            elevation: 6,
          }}
        >
          <Text style={{ position: 'absolute', top: 16, right: 24, fontSize: 28, opacity: 0.25, color: '#fff' }}>✦</Text>
          <Text style={{ position: 'absolute', top: 48, right: 60, fontSize: 16, opacity: 0.2, color: '#fff' }}>★</Text>
          <Text style={{ position: 'absolute', bottom: 32, right: 32, fontSize: 20, opacity: 0.2, color: '#fff' }}>✦</Text>
          <Text style={{ position: 'absolute', top: 24, right: 100, fontSize: 12, opacity: 0.15, color: '#fff' }}>★</Text>

          <View
            style={{
              backgroundColor: COLORS.primary,
              borderRadius: 20,
              paddingHorizontal: 12,
              paddingVertical: 5,
              alignSelf: 'flex-start',
              marginBottom: 12,
            }}
          >
            <Text style={{ fontSize: 12, fontWeight: '700', color: '#fff', fontFamily: 'Nunito_700Bold' }}>
              AI-Powered
            </Text>
          </View>

          <Text
            style={{
              fontSize: 28,
              fontWeight: '800',
              color: '#fff',
              fontFamily: 'Nunito_800ExtraBold',
              lineHeight: 34,
              marginBottom: 6,
              maxWidth: '70%',
            }}
          >
            Your Flashcards
          </Text>
          <Text
            style={{
              fontSize: 14,
              color: 'rgba(255,255,255,0.75)',
              fontFamily: 'Nunito_400Regular',
              marginBottom: 20,
            }}
          >
            Study smarter, not harder
          </Text>

          <View
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              backgroundColor: COLORS.surfaceDark,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <ChevronRight size={20} color="#fff" />
          </View>
        </View>
      </AnimatedPressable>

      {/* Stats row */}
      <View style={{ flexDirection: 'row', gap: 12, marginBottom: 24 }}>
        <View
          style={{
            flex: 1,
            backgroundColor: COLORS.surface,
            borderRadius: 20,
            padding: 16,
            borderWidth: 1,
            borderColor: COLORS.border,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.05,
            shadowRadius: 6,
            elevation: 1,
          }}
        >
          <Text style={{ fontSize: 22, marginBottom: 4 }}>📚</Text>
          <Text
            style={{
              fontSize: 28,
              fontWeight: '800',
              color: COLORS.text,
              fontFamily: 'Nunito_800ExtraBold',
              fontVariant: ['tabular-nums'],
            }}
          >
            {deckCountText}
          </Text>
          <Text style={{ fontSize: 13, color: COLORS.textSecondary, fontFamily: 'Nunito_600SemiBold', marginTop: 2 }}>
            Decks
          </Text>
        </View>
        <View
          style={{
            flex: 1,
            backgroundColor: COLORS.surface,
            borderRadius: 20,
            padding: 16,
            borderWidth: 1,
            borderColor: COLORS.border,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.05,
            shadowRadius: 6,
            elevation: 1,
          }}
        >
          <Text style={{ fontSize: 22, marginBottom: 4 }}>🃏</Text>
          <Text
            style={{
              fontSize: 28,
              fontWeight: '800',
              color: COLORS.text,
              fontFamily: 'Nunito_800ExtraBold',
              fontVariant: ['tabular-nums'],
            }}
          >
            {cardCountText}
          </Text>
          <Text style={{ fontSize: 13, color: COLORS.textSecondary, fontFamily: 'Nunito_600SemiBold', marginTop: 2 }}>
            Cards
          </Text>
        </View>
      </View>

      {/* Section heading */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <Text style={{ fontSize: 20, fontWeight: '800', color: COLORS.text, fontFamily: 'Nunito_800ExtraBold' }}>
          My Decks
        </Text>
        <AnimatedPressable onPress={handleCreateDeck}>
          <Text style={{ fontSize: 14, color: COLORS.primary, fontFamily: 'Nunito_700Bold' }}>
            + New
          </Text>
        </AnimatedPressable>
      </View>
    </View>
  );

  if (authLoading || (loading && !refreshing)) {
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.background, paddingHorizontal: 20, paddingTop: 80 }}>
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 20 }}>
          <View style={{ width: 80, height: 30, borderRadius: 15, backgroundColor: COLORS.surfaceSecondary }} />
          <View style={{ width: 80, height: 30, borderRadius: 15, backgroundColor: COLORS.surfaceSecondary }} />
        </View>
        <DeckCardSkeleton />
        <DeckCardSkeleton />
        <DeckCardSkeleton />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.background }}>
      <Stack.Screen options={{ title: 'My Decks', headerLargeTitle: true }} />
      <FlatList
        data={decks}
        keyExtractor={(item) => item.id}
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingBottom: 120,
          flexGrow: 1,
        }}
        ListHeaderComponent={<ListHeader />}
        ListEmptyComponent={
          error ? (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 60 }}>
              <Text style={{ fontSize: 15, color: COLORS.danger, textAlign: 'center', fontFamily: 'Nunito_600SemiBold' }}>
                {error}
              </Text>
              <AnimatedPressable onPress={fetchDecks} style={{ marginTop: 16 }}>
                <View style={{ backgroundColor: COLORS.primaryMuted, borderRadius: 12, paddingHorizontal: 20, paddingVertical: 10 }}>
                  <Text style={{ color: COLORS.primary, fontFamily: 'Nunito_700Bold', fontSize: 14 }}>Try again</Text>
                </View>
              </AnimatedPressable>
            </View>
          ) : (
            <EmptyState onCreatePress={handleCreateDeck} />
          )
        }
        renderItem={({ item, index }) => (
          <AnimatedDeckCard
            deck={item}
            index={index}
            onPress={() => handleDeckPress(item)}
          />
        )}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={COLORS.primary}
          />
        }
      />

      {/* FAB */}
      <View style={{ position: 'absolute', bottom: 100, right: 20 }}>
        <AnimatedPressable onPress={handleCreateDeck} scaleValue={0.93}>
          <View
            style={{
              width: 56,
              height: 56,
              borderRadius: 28,
              backgroundColor: COLORS.primary,
              alignItems: 'center',
              justifyContent: 'center',
              shadowColor: COLORS.primary,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.4,
              shadowRadius: 12,
              elevation: 6,
            }}
          >
            <Plus size={24} color="#fff" />
          </View>
        </AnimatedPressable>
      </View>
    </View>
  );
}
