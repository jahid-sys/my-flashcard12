import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { CheckCircle, XCircle, RotateCcw, Brain, Home } from 'lucide-react-native';
import { COLORS } from '@/constants/FlashcardColors';
import { AnimatedPressable } from '@/components/AnimatedPressable';
import { apiPost } from '@/utils/api';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface AnswerRecord {
  flashcard_id: string;
  question: string;
  selected_answer: string;
  correct_answer: string;
  is_correct: boolean;
}

export default function ResultsScreen() {
  const { id, answers: answersParam } = useLocalSearchParams<{ id: string; answers: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const scoreAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const answers: AnswerRecord[] = (() => {
    try {
      return JSON.parse(answersParam || '[]');
    } catch {
      return [];
    }
  })();

  const total = answers.length;
  const correct = answers.filter((a) => a.is_correct).length;
  const pct = total > 0 ? Math.round((correct / total) * 100) : 0;
  const passed = pct >= 70;

  const scoreText = `${correct}/${total}`;
  const pctText = `${pct}%`;

  const motivationalMessage = (() => {
    if (pct >= 90) return 'Excellent! You\'ve mastered this material.';
    if (pct >= 70) return 'Great work! A little more review and you\'ll ace it.';
    if (pct >= 50) return 'Good effort! Focus on the cards you missed.';
    return 'Keep going! Review your notes and try again.';
  })();

  const passBadgeText = passed ? 'Passed 🎉' : 'Keep Studying';

  useEffect(() => {
    Animated.parallel([
      Animated.timing(scoreAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, delay: 200, useNativeDriver: true }),
    ]).start();

    saveAttempt();
  }, []);

  const saveAttempt = async () => {
    console.log('[Results] Saving quiz attempt, deckId:', id, 'correct:', correct, 'total:', total);
    setSaving(true);
    try {
      await apiPost('/api/quiz-attempts', {
        deck_id: id,
        answers: answers.map((a) => ({
          flashcard_id: a.flashcard_id,
          selected_answer: a.selected_answer,
        })),
      });
      setSaved(true);
      console.log('[Results] Quiz attempt saved successfully');
    } catch (e) {
      console.error('[Results] Failed to save quiz attempt:', e);
    } finally {
      setSaving(false);
    }
  };

  const handleStudyAgain = () => {
    console.log('[Results] Study again pressed');
    router.replace(`/deck/${id}/study`);
  };

  const handleRetakeQuiz = () => {
    console.log('[Results] Retake quiz pressed');
    router.replace(`/deck/${id}/quiz`);
  };

  const handleBackToDeck = () => {
    console.log('[Results] Back to deck pressed');
    router.replace(`/deck/${id}`);
  };

  const scaleInterp = scoreAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.5, 1.1, 1],
  });

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.background }}>
      <Stack.Screen options={{ headerShown: false }} />

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: insets.top + 24,
          paddingBottom: insets.bottom + 40,
        }}
      >
        {/* Score Hero */}
        <Animated.View
          style={{
            alignItems: 'center',
            marginBottom: 32,
            opacity: fadeAnim,
          }}
        >
          <Animated.View
            style={{
              transform: [{ scale: scaleInterp }],
              width: 120,
              height: 120,
              borderRadius: 60,
              backgroundColor: passed ? 'rgba(34,197,94,0.10)' : 'rgba(239,68,68,0.08)',
              borderWidth: 3,
              borderColor: passed ? COLORS.accent : COLORS.danger,
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 20,
            }}
          >
            <Text
              style={{
                fontSize: 32,
                fontWeight: '800',
                color: passed ? COLORS.accent : COLORS.danger,
                fontFamily: 'SpaceGrotesk_700Bold',
                fontVariant: ['tabular-nums'],
              }}
            >
              {scoreText}
            </Text>
            <Text
              style={{
                fontSize: 14,
                fontWeight: '600',
                color: passed ? COLORS.accent : COLORS.danger,
                fontFamily: 'SpaceGrotesk_600SemiBold',
              }}
            >
              {pctText}
            </Text>
          </Animated.View>

          {/* Pass/Fail badge */}
          <View
            style={{
              backgroundColor: passed ? 'rgba(34,197,94,0.10)' : 'rgba(239,68,68,0.08)',
              borderRadius: 20,
              paddingHorizontal: 16,
              paddingVertical: 7,
              marginBottom: 12,
            }}
          >
            <Text
              style={{
                fontSize: 15,
                fontWeight: '700',
                color: passed ? COLORS.accent : COLORS.danger,
                fontFamily: 'SpaceGrotesk_700Bold',
              }}
            >
              {passBadgeText}
            </Text>
          </View>

          <Text
            style={{
              fontSize: 15,
              color: COLORS.textSecondary,
              fontFamily: 'SpaceGrotesk_400Regular',
              textAlign: 'center',
              lineHeight: 22,
              maxWidth: 280,
            }}
          >
            {motivationalMessage}
          </Text>

          {saving && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12 }}>
              <ActivityIndicator size="small" color={COLORS.textTertiary} />
              <Text style={{ fontSize: 12, color: COLORS.textTertiary, fontFamily: 'SpaceGrotesk_400Regular' }}>
                Saving results...
              </Text>
            </View>
          )}
        </Animated.View>

        {/* Action Buttons */}
        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 28 }}>
          <AnimatedPressable onPress={handleStudyAgain} style={{ flex: 1 }}>
            <View
              style={{
                backgroundColor: COLORS.surface,
                borderRadius: 14,
                paddingVertical: 14,
                alignItems: 'center',
                flexDirection: 'row',
                justifyContent: 'center',
                gap: 7,
                borderWidth: 1.5,
                borderColor: COLORS.primary,
                borderCurve: 'continuous',
              }}
            >
              <Brain size={16} color={COLORS.primary} />
              <Text style={{ fontSize: 14, fontWeight: '600', color: COLORS.primary, fontFamily: 'SpaceGrotesk_600SemiBold' }}>
                Study again
              </Text>
            </View>
          </AnimatedPressable>
          <AnimatedPressable onPress={handleRetakeQuiz} style={{ flex: 1 }}>
            <View
              style={{
                backgroundColor: COLORS.primary,
                borderRadius: 14,
                paddingVertical: 14,
                alignItems: 'center',
                flexDirection: 'row',
                justifyContent: 'center',
                gap: 7,
                borderCurve: 'continuous',
              }}
            >
              <RotateCcw size={16} color="#fff" />
              <Text style={{ fontSize: 14, fontWeight: '600', color: '#fff', fontFamily: 'SpaceGrotesk_600SemiBold' }}>
                Retake quiz
              </Text>
            </View>
          </AnimatedPressable>
        </View>

        {/* Answer Breakdown */}
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
          Answer breakdown
        </Text>

        {answers.map((answer, index) => {
          const itemNum = `${index + 1}`;
          return (
            <View
              key={index}
              style={{
                backgroundColor: COLORS.surface,
                borderRadius: 14,
                padding: 14,
                marginBottom: 10,
                borderWidth: 1,
                borderColor: answer.is_correct ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.12)',
                borderCurve: 'continuous',
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}>
                <View
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: 12,
                    backgroundColor: answer.is_correct ? 'rgba(34,197,94,0.10)' : 'rgba(239,68,68,0.08)',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    marginTop: 1,
                  }}
                >
                  {answer.is_correct ? (
                    <CheckCircle size={14} color={COLORS.accent} />
                  ) : (
                    <XCircle size={14} color={COLORS.danger} />
                  )}
                </View>
                <View style={{ flex: 1, gap: 4 }}>
                  <Text
                    style={{
                      fontSize: 13,
                      fontWeight: '600',
                      color: COLORS.text,
                      fontFamily: 'SpaceGrotesk_600SemiBold',
                      lineHeight: 18,
                    }}
                    numberOfLines={3}
                  >
                    {answer.question}
                  </Text>
                  {!answer.is_correct && (
                    <View style={{ gap: 2 }}>
                      <Text style={{ fontSize: 12, color: COLORS.danger, fontFamily: 'SpaceGrotesk_400Regular' }}>
                        Your answer: {answer.selected_answer}
                      </Text>
                      <Text style={{ fontSize: 12, color: COLORS.accent, fontFamily: 'SpaceGrotesk_500Medium' }}>
                        Correct: {answer.correct_answer}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            </View>
          );
        })}

        {/* Back to deck */}
        <AnimatedPressable onPress={handleBackToDeck} style={{ marginTop: 8 }}>
          <View style={{ alignItems: 'center', paddingVertical: 12, flexDirection: 'row', justifyContent: 'center', gap: 6 }}>
            <Home size={15} color={COLORS.textTertiary} />
            <Text style={{ fontSize: 14, color: COLORS.textTertiary, fontFamily: 'SpaceGrotesk_500Medium' }}>
              Back to deck
            </Text>
          </View>
        </AnimatedPressable>
      </ScrollView>
    </View>
  );
}
