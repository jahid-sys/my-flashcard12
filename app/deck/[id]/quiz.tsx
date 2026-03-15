import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  Animated,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { CheckCircle, XCircle, ChevronRight } from 'lucide-react-native';
import { COLORS } from '@/constants/FlashcardColors';
import { AnimatedPressable } from '@/components/AnimatedPressable';
import { apiPost } from '@/utils/api';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface QuizQuestion {
  flashcard_id: string;
  question: string;
  correct_answer: string;
  options: string[];
}

interface AnswerRecord {
  flashcard_id: string;
  question: string;
  selected_answer: string;
  correct_answer: string;
  is_correct: boolean;
}

export default function QuizScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [answers, setAnswers] = useState<AnswerRecord[]>([]);

  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    fetchQuiz();
  }, [id]);

  useEffect(() => {
    if (questions.length > 0) {
      const pct = (currentIndex / questions.length) * 100;
      Animated.timing(progressAnim, {
        toValue: pct,
        duration: 300,
        useNativeDriver: false,
      }).start();
    }
  }, [currentIndex, questions.length]);

  const fetchQuiz = async () => {
    console.log('[QuizMode] Fetching quiz for deck:', id);
    try {
      const result = await apiPost<{ questions: QuizQuestion[] }>(`/api/decks/${id}/quiz`, {});
      const qs = Array.isArray(result?.questions) ? result.questions : [];
      setQuestions(qs);
    } catch (e: any) {
      console.error('[QuizMode] Failed to fetch quiz:', e);
      setError('Couldn\'t load quiz questions. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAnswer = async (option: string) => {
    if (selectedAnswer !== null) return;
    console.log('[QuizMode] Answer selected:', option, 'for question:', currentIndex);

    if (Platform.OS === 'ios') {
      try {
        const Haptics = require('expo-haptics');
        const isCorrect = option === questions[currentIndex].correct_answer;
        if (isCorrect) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } else {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        }
      } catch {}
    }

    setSelectedAnswer(option);
    const q = questions[currentIndex];
    const isCorrect = option === q.correct_answer;
    const record: AnswerRecord = {
      flashcard_id: q.flashcard_id,
      question: q.question,
      selected_answer: option,
      correct_answer: q.correct_answer,
      is_correct: isCorrect,
    };
    setAnswers((prev) => [...prev, record]);
  };

  const handleNext = () => {
    console.log('[QuizMode] Next pressed, currentIndex:', currentIndex);
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setSelectedAnswer(null);
    } else {
      // Navigate to results
      const allAnswers = answers;
      const answersParam = JSON.stringify(allAnswers);
      console.log('[QuizMode] Quiz complete, navigating to results');
      router.replace({
        pathname: `/deck/${id}/results`,
        params: { answers: answersParam },
      });
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.background, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={COLORS.primary} />
        <Text style={{ marginTop: 12, fontSize: 14, color: COLORS.textSecondary, fontFamily: 'SpaceGrotesk_500Medium' }}>
          Loading quiz...
        </Text>
      </View>
    );
  }

  if (error || questions.length === 0) {
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.background, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <Text style={{ fontSize: 15, color: COLORS.danger, textAlign: 'center', fontFamily: 'SpaceGrotesk_500Medium', marginBottom: 16 }}>
          {error || 'No quiz questions available for this deck.'}
        </Text>
        <AnimatedPressable onPress={() => router.back()}>
          <View style={{ backgroundColor: COLORS.primaryMuted, borderRadius: 12, paddingHorizontal: 20, paddingVertical: 10 }}>
            <Text style={{ color: COLORS.primary, fontFamily: 'SpaceGrotesk_600SemiBold', fontSize: 14 }}>Go back</Text>
          </View>
        </AnimatedPressable>
      </View>
    );
  }

  const question = questions[currentIndex];
  const total = questions.length;
  const progressLabel = `${currentIndex + 1} / ${total}`;
  const isLastQuestion = currentIndex === questions.length - 1;
  const nextLabel = isLastQuestion ? 'See results' : 'Next question';

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.background }}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <View
        style={{
          paddingHorizontal: 20,
          paddingTop: insets.top + 12,
          paddingBottom: 16,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <AnimatedPressable onPress={() => router.back()}>
            <View style={{ padding: 4 }}>
              <XCircle size={22} color={COLORS.textTertiary} />
            </View>
          </AnimatedPressable>
          <Text
            style={{
              fontSize: 14,
              fontWeight: '600',
              color: COLORS.textSecondary,
              fontFamily: 'SpaceGrotesk_600SemiBold',
              fontVariant: ['tabular-nums'],
            }}
          >
            {progressLabel}
          </Text>
          <View style={{ width: 30 }} />
        </View>

        {/* Progress bar */}
        <View style={{ height: 6, backgroundColor: COLORS.surfaceSecondary, borderRadius: 3 }}>
          <Animated.View
            style={{
              height: 6,
              borderRadius: 3,
              backgroundColor: COLORS.primary,
              width: progressAnim.interpolate({
                inputRange: [0, 100],
                outputRange: ['0%', '100%'],
              }),
            }}
          />
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: insets.bottom + 100 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Question */}
        <View
          style={{
            backgroundColor: COLORS.surface,
            borderRadius: 20,
            padding: 24,
            marginBottom: 24,
            borderWidth: 1,
            borderColor: COLORS.border,
            boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.03)',
            borderCurve: 'continuous',
          }}
        >
          <Text
            style={{
              fontSize: 11,
              fontWeight: '600',
              color: COLORS.primary,
              fontFamily: 'SpaceGrotesk_600SemiBold',
              letterSpacing: 1,
              textTransform: 'uppercase',
              marginBottom: 12,
            }}
          >
            Question {currentIndex + 1}
          </Text>
          <Text
            style={{
              fontSize: 19,
              fontWeight: '700',
              color: COLORS.text,
              fontFamily: 'SpaceGrotesk_700Bold',
              lineHeight: 27,
              letterSpacing: -0.2,
            }}
          >
            {question.question}
          </Text>
        </View>

        {/* Options */}
        {question.options.map((option, idx) => {
          const isSelected = selectedAnswer === option;
          const isCorrect = option === question.correct_answer;
          const showResult = selectedAnswer !== null;

          let bgColor = COLORS.surface;
          let borderColor = COLORS.border;
          let textColor = COLORS.text;

          if (showResult) {
            if (isCorrect) {
              bgColor = 'rgba(34,197,94,0.08)';
              borderColor = COLORS.accent;
              textColor = '#16A34A';
            } else if (isSelected && !isCorrect) {
              bgColor = 'rgba(239,68,68,0.08)';
              borderColor = COLORS.danger;
              textColor = COLORS.danger;
            }
          } else if (isSelected) {
            bgColor = COLORS.primaryMuted;
            borderColor = COLORS.primary;
            textColor = COLORS.primary;
          }

          const optionLetter = String.fromCharCode(65 + idx);

          return (
            <AnimatedPressable
              key={idx}
              onPress={() => handleSelectAnswer(option)}
              disabled={selectedAnswer !== null}
            >
              <View
                style={{
                  backgroundColor: bgColor,
                  borderRadius: 14,
                  padding: 16,
                  marginBottom: 10,
                  borderWidth: 1.5,
                  borderColor: borderColor,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 12,
                  borderCurve: 'continuous',
                }}
              >
                <View
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 14,
                    backgroundColor: showResult
                      ? isCorrect
                        ? 'rgba(34,197,94,0.15)'
                        : isSelected
                        ? 'rgba(239,68,68,0.12)'
                        : COLORS.surfaceSecondary
                      : COLORS.surfaceSecondary,
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  {showResult && isCorrect ? (
                    <CheckCircle size={16} color={COLORS.accent} />
                  ) : showResult && isSelected && !isCorrect ? (
                    <XCircle size={16} color={COLORS.danger} />
                  ) : (
                    <Text
                      style={{
                        fontSize: 12,
                        fontWeight: '700',
                        color: COLORS.textSecondary,
                        fontFamily: 'SpaceGrotesk_700Bold',
                      }}
                    >
                      {optionLetter}
                    </Text>
                  )}
                </View>
                <Text
                  style={{
                    flex: 1,
                    fontSize: 15,
                    fontWeight: '500',
                    color: textColor,
                    fontFamily: 'SpaceGrotesk_500Medium',
                    lineHeight: 21,
                  }}
                >
                  {option}
                </Text>
              </View>
            </AnimatedPressable>
          );
        })}
      </ScrollView>

      {/* Next button */}
      {selectedAnswer !== null && (
        <View
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            padding: 20,
            paddingBottom: insets.bottom + 20,
            backgroundColor: COLORS.background,
            borderTopWidth: 1,
            borderTopColor: COLORS.divider,
          }}
        >
          <AnimatedPressable onPress={handleNext}>
            <View
              style={{
                backgroundColor: COLORS.primary,
                borderRadius: 14,
                paddingVertical: 15,
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'row',
                gap: 8,
                borderCurve: 'continuous',
              }}
            >
              <Text style={{ fontSize: 15, fontWeight: '600', color: '#fff', fontFamily: 'SpaceGrotesk_600SemiBold' }}>
                {nextLabel}
              </Text>
              <ChevronRight size={18} color="#fff" />
            </View>
          </AnimatedPressable>
        </View>
      )}
    </View>
  );
}
