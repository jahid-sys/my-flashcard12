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

  const ringColor = passed ? COLORS.primary : COLORS.danger;
  const ringBg = passed ? COLORS.primaryMuted : 'rgba(239,68,68,0.08)';

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
              width: 130,
              height: 130,
              borderRadius: 65,
              backgroundColor: ringBg,
              borderWidth: 4,
              borderColor: ringColor,
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 20,
              shadowColor: ringColor,
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: 0.3,
              shadowRadius: 12,
              elevation: 6,
            }}
          >
            <Text
              style={{
                fontSize: 34,
                fontWeight: '800',
                color: ringColor,
                fontFamily: 'Nunito_800ExtraBold',
                fontVariant: ['tabular-nums'],
              }}
            >
              {scoreText}
            </Text>
            <Text
              style={{
                fontSize: 15,
                fontWeight: '700',
                color: ringColor,
                fontFamily: 'Nunito_700Bold',
              }}
            >
              {pctText}
            </Text>
          </Animated.View>

          {/* Pass/Fail badge */}
          <View
            style={{
              backgroundColor: passed ? COLORS.primary : COLORS.surfaceDark,
              borderRadius: 20,
              paddingHorizontal: 20,
              paddingVertical: 8,
              marginBottom: 12,
              shadowColor: passed ? COLORS.primary : '#000',
              shadowOffset: { width: 0, height: 3 },
              shadowOpacity: 0.25,
              shadowRadius: 6,
              elevation: 4,
            }}
          >
            <Text
              style={{
                fontSize: 15,
                fontWeight: '700',
                color: '#fff',
                fontFamily: 'Nunito_700Bold',
              }}
            >
              {passBadgeText}
            </Text>
          </View>

          <Text
            style={{
              fontSize: 15,
              color: COLORS.textSecondary,
              fontFamily: 'Nunito_400Regular',
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
              <Text style={{ fontSize: 12, color: COLORS.textTertiary, fontFamily: 'Nunito_400Regular' }}>
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
                backgroundColor: COLORS.surfaceDark,
                borderRadius: 16,
                paddingVertical: 15,
                alignItems: 'center',
                flexDirection: 'row',
                justifyContent: 'center',
                gap: 7,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 3 },
                shadowOpacity: 0.2,
                shadowRadius: 6,
                elevation: 3,
              }}
            >
              <Brain size={16} color="#fff" />
              <Text style={{ fontSize: 14, fontWeight: '700', color: '#fff', fontFamily: 'Nunito_700Bold' }}>
                Study again
              </Text>
            </View>
          </AnimatedPressable>
          <AnimatedPressable onPress={handleRetakeQuiz} style={{ flex: 1 }}>
            <View
              style={{
                backgroundColor: COLORS.primary,
                borderRadius: 16,
                paddingVertical: 15,
                alignItems: 'center',
                flexDirection: 'row',
                justifyContent: 'center',
                gap: 7,
                shadowColor: COLORS.primary,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.35,
                shadowRadius: 8,
                elevation: 4,
              }}
            >
              <RotateCcw size={16} color="#fff" />
              <Text style={{ fontSize: 14, fontWeight: '700', color: '#fff', fontFamily: 'Nunito_700Bold' }}>
                Retake quiz
              </Text>
            </View>
          </AnimatedPressable>
        </View>

        {/* Answer Breakdown */}
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
          Answer breakdown
        </Text>

        {answers.map((answer, index) => {
          const yourAnswerLabel = answer.selected_answer;
          const correctAnswerLabel = answer.correct_answer;
          return (
            <View
              key={index}
              style={{
                backgroundColor: COLORS.surface,
                borderRadius: 16,
                padding: 14,
                marginBottom: 10,
                borderWidth: 1,
                borderColor: answer.is_correct ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.12)',
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
                    width: 26,
                    height: 26,
                    borderRadius: 13,
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
                      fontWeight: '700',
                      color: COLORS.text,
                      fontFamily: 'Nunito_700Bold',
                      lineHeight: 18,
                    }}
                    numberOfLines={3}
                  >
                    {answer.question}
                  </Text>
                  {!answer.is_correct && (
                    <View style={{ gap: 2 }}>
                      <Text style={{ fontSize: 12, color: COLORS.danger, fontFamily: 'Nunito_400Regular' }}>
                        Your answer: {yourAnswerLabel}
                      </Text>
                      <Text style={{ fontSize: 12, color: COLORS.accent, fontFamily: 'Nunito_600SemiBold' }}>
                        Correct: {correctAnswerLabel}
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
            <Text style={{ fontSize: 14, color: COLORS.textTertiary, fontFamily: 'Nunito_600SemiBold' }}>
              Back to deck
            </Text>
          </View>
        </AnimatedPressable>
      </ScrollView>
    </View>
  );
}
