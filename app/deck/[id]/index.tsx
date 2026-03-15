import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack, useFocusEffect } from 'expo-router';
import {
  BookOpen,
  Brain,
  ClipboardList,
  ChevronDown,
  ChevronUp,
  Trash2,
  CheckCircle,
  XCircle,
  Calendar,
} from 'lucide-react-native';
import { COLORS, getSubjectColor } from '@/constants/FlashcardColors';
import { AnimatedPressable } from '@/components/AnimatedPressable';
import { apiGet, apiDelete } from '@/utils/api';
import { formatDistanceToNow, formatDate } from '@/utils/dateUtils';

interface Flashcard {
  id: string;
  question: string;
  answer: string;
}

interface QuizAttempt {
  id: string;
  score: number;
  total_questions: number;
  created_at: string;
}

interface DeckDetail {
  id: string;
  title: string;
  subject: string;
  description?: string;
  card_count: number;
  created_at: string;
  flashcards: Flashcard[];
}

function CardPreview({ card, index }: { card: Flashcard; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const cardNum = `${index + 1}`;

  return (
    <AnimatedPressable onPress={() => setExpanded(!expanded)}>
      <View
        style={{
          backgroundColor: COLORS.surface,
          borderRadius: 14,
          padding: 14,
          marginBottom: 8,
          borderWidth: 1,
          borderColor: COLORS.border,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.04,
          shadowRadius: 4,
          elevation: 1,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}>
          <View
            style={{
              width: 24,
              height: 24,
              borderRadius: 12,
              backgroundColor: COLORS.primaryMuted,
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              marginTop: 1,
            }}
          >
            <Text style={{ fontSize: 10, fontWeight: '700', color: COLORS.primary, fontFamily: 'Nunito_700Bold' }}>
              {cardNum}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontSize: 14,
                fontWeight: '700',
                color: COLORS.text,
                fontFamily: 'Nunito_700Bold',
                lineHeight: 20,
              }}
              numberOfLines={expanded ? undefined : 2}
            >
              {card.question}
            </Text>
            {expanded && (
              <View style={{ marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: COLORS.divider }}>
                <Text
                  style={{
                    fontSize: 13,
                    color: COLORS.textSecondary,
                    fontFamily: 'Nunito_400Regular',
                    lineHeight: 19,
                  }}
                >
                  {card.answer}
                </Text>
              </View>
            )}
          </View>
          {expanded ? (
            <ChevronUp size={16} color={COLORS.textTertiary} />
          ) : (
            <ChevronDown size={16} color={COLORS.textTertiary} />
          )}
        </View>
      </View>
    </AnimatedPressable>
  );
}

export default function DeckDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [deck, setDeck] = useState<DeckDetail | null>(null);
  const [attempts, setAttempts] = useState<QuizAttempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchData = useCallback(async () => {
    console.log('[DeckDetail] Fetching deck:', id);
    try {
      setError(null);
      const [deckData, attemptsData] = await Promise.all([
        apiGet<DeckDetail>(`/api/decks/${id}`),
        apiGet<QuizAttempt[]>(`/api/decks/${id}/attempts`).catch(() => []),
      ]);
      setDeck(deckData);
      setAttempts(Array.isArray(attemptsData) ? attemptsData : []);
    } catch (e: any) {
      console.error('[DeckDetail] Failed to fetch deck:', e);
      setError('Couldn\'t load this deck. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useFocusEffect(useCallback(() => { fetchData(); }, [fetchData]));

  const handleStudy = () => {
    console.log('[DeckDetail] Study pressed, deckId:', id);
    router.push(`/deck/${id}/study`);
  };

  const handleQuiz = () => {
    console.log('[DeckDetail] Quiz pressed, deckId:', id);
    router.push(`/deck/${id}/quiz`);
  };

  const handleDelete = async () => {
    console.log('[DeckDetail] Delete deck pressed, deckId:', id);
    setDeleting(true);
    try {
      await apiDelete(`/api/decks/${id}`);
      router.replace('/(tabs)/(home)');
    } catch (e: any) {
      console.error('[DeckDetail] Delete failed:', e);
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.background, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={COLORS.primary} />
      </View>
    );
  }

  if (error || !deck) {
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.background, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <Text style={{ fontSize: 15, color: COLORS.danger, textAlign: 'center', fontFamily: 'Nunito_600SemiBold', marginBottom: 16 }}>
          {error || 'Deck not found.'}
        </Text>
        <AnimatedPressable onPress={fetchData}>
          <View style={{ backgroundColor: COLORS.primaryMuted, borderRadius: 12, paddingHorizontal: 20, paddingVertical: 10 }}>
            <Text style={{ color: COLORS.primary, fontFamily: 'Nunito_700Bold', fontSize: 14 }}>Try again</Text>
          </View>
        </AnimatedPressable>
      </View>
    );
  }

  const subjectColor = getSubjectColor(deck.subject);
  const cardCountText = `${deck.card_count ?? deck.flashcards?.length ?? 0} cards`;
  const createdText = formatDate(deck.created_at);
  const subjectLabel = deck.subject || 'General';

  return (
    <>
      <Stack.Screen
        options={{
          title: deck.title,
          headerRight: () => (
            <AnimatedPressable onPress={handleDelete} disabled={deleting}>
              <View style={{ padding: 4 }}>
                {deleting ? (
                  <ActivityIndicator size="small" color={COLORS.danger} />
                ) : (
                  <Trash2 size={20} color={COLORS.danger} />
                )}
              </View>
            </AnimatedPressable>
          ),
        }}
      />
      <ScrollView
        style={{ flex: 1, backgroundColor: COLORS.background }}
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
      >
        {/* Hero banner */}
        <View
          style={{
            backgroundColor: COLORS.primary,
            borderRadius: 24,
            padding: 24,
            marginTop: 8,
            marginBottom: 16,
            overflow: 'hidden',
            shadowColor: COLORS.primary,
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.3,
            shadowRadius: 14,
            elevation: 6,
          }}
        >
          <Text style={{ position: 'absolute', top: 12, right: 20, fontSize: 24, opacity: 0.2, color: '#fff' }}>✦</Text>
          <Text style={{ position: 'absolute', bottom: 20, right: 40, fontSize: 16, opacity: 0.15, color: '#fff' }}>★</Text>

          <View
            style={{
              backgroundColor: 'rgba(255,255,255,0.2)',
              borderRadius: 20,
              paddingHorizontal: 12,
              paddingVertical: 5,
              alignSelf: 'flex-start',
              marginBottom: 12,
            }}
          >
            <Text style={{ fontSize: 12, fontWeight: '700', color: '#fff', fontFamily: 'Nunito_700Bold' }}>
              {subjectLabel}
            </Text>
          </View>
          <Text
            style={{
              fontSize: 24,
              fontWeight: '800',
              color: '#fff',
              fontFamily: 'Nunito_800ExtraBold',
              marginBottom: 8,
              lineHeight: 30,
            }}
          >
            {deck.title}
          </Text>
          {deck.description ? (
            <Text
              style={{
                fontSize: 14,
                color: 'rgba(255,255,255,0.8)',
                fontFamily: 'Nunito_400Regular',
                lineHeight: 20,
                marginBottom: 12,
              }}
            >
              {deck.description}
            </Text>
          ) : null}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
              <BookOpen size={14} color="rgba(255,255,255,0.7)" />
              <Text style={{ fontSize: 13, color: 'rgba(255,255,255,0.85)', fontFamily: 'Nunito_600SemiBold' }}>
                {cardCountText}
              </Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
              <Calendar size={14} color="rgba(255,255,255,0.7)" />
              <Text style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', fontFamily: 'Nunito_400Regular' }}>
                {createdText}
              </Text>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={{ flexDirection: 'row', gap: 12, marginBottom: 28 }}>
          <AnimatedPressable onPress={handleStudy} style={{ flex: 1 }}>
            <View
              style={{
                backgroundColor: COLORS.primary,
                borderRadius: 16,
                paddingVertical: 16,
                alignItems: 'center',
                flexDirection: 'row',
                justifyContent: 'center',
                gap: 8,
                shadowColor: COLORS.primary,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
                elevation: 4,
              }}
            >
              <Brain size={18} color="#fff" />
              <Text style={{ fontSize: 15, fontWeight: '700', color: '#fff', fontFamily: 'Nunito_700Bold' }}>
                Study
              </Text>
            </View>
          </AnimatedPressable>
          <AnimatedPressable onPress={handleQuiz} style={{ flex: 1 }}>
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
              <ClipboardList size={18} color="#fff" />
              <Text style={{ fontSize: 15, fontWeight: '700', color: '#fff', fontFamily: 'Nunito_700Bold' }}>
                Quiz
              </Text>
            </View>
          </AnimatedPressable>
        </View>

        {/* Past Scores */}
        {attempts.length > 0 && (
          <>
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
              Past Scores
            </Text>
            {attempts.slice(0, 5).map((attempt) => {
              const pct = Math.round((Number(attempt.score) / Math.max(Number(attempt.total_questions), 1)) * 100);
              const passed = pct >= 70;
              const pctText = `${pct}%`;
              const scoreText = `${attempt.score}/${attempt.total_questions}`;
              const dateText = formatDistanceToNow(attempt.created_at);
              const badgeLabel = passed ? 'Passed' : 'Keep studying';
              return (
                <View
                  key={attempt.id}
                  style={{
                    backgroundColor: COLORS.surface,
                    borderRadius: 14,
                    padding: 14,
                    marginBottom: 8,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    borderWidth: 1,
                    borderColor: COLORS.border,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.04,
                    shadowRadius: 4,
                    elevation: 1,
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    {passed ? (
                      <CheckCircle size={18} color={COLORS.accent} />
                    ) : (
                      <XCircle size={18} color={COLORS.danger} />
                    )}
                    <View>
                      <Text style={{ fontSize: 15, fontWeight: '700', color: COLORS.text, fontFamily: 'Nunito_700Bold' }}>
                        {pctText}
                      </Text>
                      <Text style={{ fontSize: 12, color: COLORS.textTertiary, fontFamily: 'Nunito_400Regular' }}>
                        {scoreText}
                      </Text>
                    </View>
                  </View>
                  <View style={{ alignItems: 'flex-end', gap: 4 }}>
                    <View
                      style={{
                        backgroundColor: passed ? 'rgba(34,197,94,0.10)' : 'rgba(239,68,68,0.08)',
                        borderRadius: 8,
                        paddingHorizontal: 8,
                        paddingVertical: 3,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 11,
                          fontWeight: '700',
                          color: passed ? COLORS.accent : COLORS.danger,
                          fontFamily: 'Nunito_700Bold',
                        }}
                      >
                        {badgeLabel}
                      </Text>
                    </View>
                    <Text style={{ fontSize: 12, color: COLORS.textTertiary, fontFamily: 'Nunito_400Regular' }}>
                      {dateText}
                    </Text>
                  </View>
                </View>
              );
            })}
            <View style={{ marginBottom: 20 }} />
          </>
        )}

        {/* All Cards */}
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
          All Cards
        </Text>
        {(deck.flashcards || []).map((card, index) => (
          <CardPreview key={card.id} card={card} index={index} />
        ))}
      </ScrollView>
    </>
  );
}
