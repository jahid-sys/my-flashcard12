import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  Animated,
  RefreshControl,
} from 'react-native';
import { useRouter, useFocusEffect, Stack } from 'expo-router';
import { BookOpen, Plus, GraduationCap, Clock } from 'lucide-react-native';
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

  return (
    <Animated.View style={{ opacity, transform: [{ translateY }] }}>
      <AnimatedPressable onPress={onPress}>
        <View
          style={{
            backgroundColor: COLORS.surface,
            borderRadius: 16,
            padding: 16,
            marginBottom: 12,
            borderWidth: 1,
            borderColor: COLORS.border,
            boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.03)',
            borderCurve: 'continuous',
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <View
              style={{
                backgroundColor: subjectColor.bg,
                borderRadius: 8,
                paddingHorizontal: 10,
                paddingVertical: 4,
                alignSelf: 'flex-start',
              }}
            >
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: '600',
                  color: subjectColor.text,
                  fontFamily: 'SpaceGrotesk_600SemiBold',
                }}
              >
                {deck.subject || 'General'}
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
                    fontFamily: 'SpaceGrotesk_700Bold',
                    fontVariant: ['tabular-nums'],
                  }}
                >
                  {scoreText}
                </Text>
              </View>
            )}
          </View>

          <Text
            style={{
              fontSize: 17,
              fontWeight: '700',
              color: COLORS.text,
              fontFamily: 'SpaceGrotesk_700Bold',
              marginTop: 10,
              letterSpacing: -0.2,
            }}
            numberOfLines={2}
          >
            {deck.title}
          </Text>

          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <BookOpen size={13} color={COLORS.textTertiary} />
              <Text
                style={{
                  fontSize: 13,
                  color: COLORS.textSecondary,
                  fontFamily: 'SpaceGrotesk_500Medium',
                }}
              >
                {cardCountText}
              </Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Clock size={13} color={COLORS.textTertiary} />
              <Text style={{ fontSize: 13, color: COLORS.textTertiary, fontFamily: 'SpaceGrotesk_400Regular' }}>
                {datePrefix}
              </Text>
              <Text style={{ fontSize: 13, color: COLORS.textTertiary, fontFamily: 'SpaceGrotesk_400Regular' }}>
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
          width: 72,
          height: 72,
          borderRadius: 20,
          backgroundColor: COLORS.primaryMuted,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 20,
          borderCurve: 'continuous',
        }}
      >
        <GraduationCap size={32} color={COLORS.primary} />
      </View>
      <Text
        style={{
          fontSize: 20,
          fontWeight: '700',
          color: COLORS.text,
          fontFamily: 'SpaceGrotesk_700Bold',
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
          fontFamily: 'SpaceGrotesk_400Regular',
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
            borderRadius: 14,
            paddingHorizontal: 24,
            paddingVertical: 14,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
            borderCurve: 'continuous',
          }}
        >
          <Plus size={18} color="#fff" />
          <Text
            style={{
              fontSize: 15,
              fontWeight: '600',
              color: '#fff',
              fontFamily: 'SpaceGrotesk_600SemiBold',
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

  const totalCards = decks.reduce((sum, d) => sum + (d.card_count ?? 0), 0);

  const ListHeader = () => (
    <View style={{ paddingTop: 8, paddingBottom: 4 }}>
      <View style={{ flexDirection: 'row', gap: 8, marginBottom: 20 }}>
        <View
          style={{
            backgroundColor: COLORS.primaryMuted,
            borderRadius: 20,
            paddingHorizontal: 12,
            paddingVertical: 6,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <BookOpen size={13} color={COLORS.primary} />
          <Text style={{ fontSize: 13, fontWeight: '600', color: COLORS.primary, fontFamily: 'SpaceGrotesk_600SemiBold' }}>
            {decks.length}
          </Text>
          <Text style={{ fontSize: 13, color: COLORS.primary, fontFamily: 'SpaceGrotesk_400Regular' }}>
            {decks.length === 1 ? 'deck' : 'decks'}
          </Text>
        </View>
        <View
          style={{
            backgroundColor: 'rgba(34,197,94,0.10)',
            borderRadius: 20,
            paddingHorizontal: 12,
            paddingVertical: 6,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <Text style={{ fontSize: 13, fontWeight: '600', color: '#16A34A', fontFamily: 'SpaceGrotesk_600SemiBold' }}>
            {totalCards}
          </Text>
          <Text style={{ fontSize: 13, color: '#16A34A', fontFamily: 'SpaceGrotesk_400Regular' }}>
            {totalCards === 1 ? 'card' : 'cards'}
          </Text>
        </View>
      </View>
    </View>
  );

  if (authLoading || (loading && !refreshing)) {
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.background, paddingHorizontal: 20, paddingTop: 120 }}>
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
        ListHeaderComponent={decks.length > 0 ? <ListHeader /> : null}
        ListEmptyComponent={
          error ? (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 60 }}>
              <Text style={{ fontSize: 15, color: COLORS.danger, textAlign: 'center', fontFamily: 'SpaceGrotesk_500Medium' }}>
                {error}
              </Text>
              <AnimatedPressable onPress={fetchDecks} style={{ marginTop: 16 }}>
                <View style={{ backgroundColor: COLORS.primaryMuted, borderRadius: 12, paddingHorizontal: 20, paddingVertical: 10 }}>
                  <Text style={{ color: COLORS.primary, fontFamily: 'SpaceGrotesk_600SemiBold', fontSize: 14 }}>Try again</Text>
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
              boxShadow: '0 4px 16px rgba(79,110,247,0.40)',
            }}
          >
            <Plus size={24} color="#fff" />
          </View>
        </AnimatedPressable>
      </View>
    </View>
  );
}
