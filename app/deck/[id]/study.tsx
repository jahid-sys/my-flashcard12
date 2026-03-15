import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  Animated,
  TouchableOpacity,
  ActivityIndicator,
  useWindowDimensions,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { COLORS } from '@/constants/FlashcardColors';
import { AnimatedPressable } from '@/components/AnimatedPressable';
import { apiGet } from '@/utils/api';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface Flashcard {
  id: string;
  question: string;
  answer: string;
}

interface DeckData {
  id: string;
  title: string;
  flashcards: Flashcard[];
}

export default function StudyScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  const [deck, setDeck] = useState<DeckData | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  const flipAnim = useRef(new Animated.Value(0)).current;

  const frontInterpolate = flipAnim.interpolate({
    inputRange: [0, 180],
    outputRange: ['0deg', '180deg'],
  });
  const backInterpolate = flipAnim.interpolate({
    inputRange: [0, 180],
    outputRange: ['180deg', '360deg'],
  });
  const frontOpacity = flipAnim.interpolate({
    inputRange: [89, 90],
    outputRange: [1, 0],
  });
  const backOpacity = flipAnim.interpolate({
    inputRange: [89, 90],
    outputRange: [0, 1],
  });

  useEffect(() => {
    fetchDeck();
  }, [id]);

  const fetchDeck = async () => {
    console.log('[StudyMode] Fetching deck:', id);
    try {
      const data = await apiGet<DeckData>(`/api/decks/${id}`);
      setDeck(data);
    } catch (e) {
      console.error('[StudyMode] Failed to fetch deck:', e);
    } finally {
      setLoading(false);
    }
  };

  const flipCard = () => {
    console.log('[StudyMode] Card tapped, flipping. isFlipped:', isFlipped);
    if (isFlipped) {
      Animated.spring(flipAnim, { toValue: 0, useNativeDriver: true, friction: 8, tension: 10 }).start();
    } else {
      Animated.spring(flipAnim, { toValue: 180, useNativeDriver: true, friction: 8, tension: 10 }).start();
    }
    setIsFlipped(!isFlipped);
  };

  const goNext = () => {
    if (!deck || currentIndex >= deck.flashcards.length - 1) return;
    console.log('[StudyMode] Next card pressed, index:', currentIndex + 1);
    resetFlip();
    setCurrentIndex(currentIndex + 1);
  };

  const goPrev = () => {
    if (currentIndex <= 0) return;
    console.log('[StudyMode] Previous card pressed, index:', currentIndex - 1);
    resetFlip();
    setCurrentIndex(currentIndex - 1);
  };

  const resetFlip = () => {
    flipAnim.setValue(0);
    setIsFlipped(false);
  };

  const handleDone = () => {
    console.log('[StudyMode] Done pressed');
    router.back();
  };

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.background, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={COLORS.primary} />
      </View>
    );
  }

  if (!deck || !deck.flashcards || deck.flashcards.length === 0) {
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.background, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <Text style={{ fontSize: 16, color: COLORS.textSecondary, fontFamily: 'Nunito_600SemiBold', textAlign: 'center' }}>
          No cards in this deck yet.
        </Text>
        <AnimatedPressable onPress={() => router.back()} style={{ marginTop: 16 }}>
          <View style={{ backgroundColor: COLORS.primaryMuted, borderRadius: 12, paddingHorizontal: 20, paddingVertical: 10 }}>
            <Text style={{ color: COLORS.primary, fontFamily: 'Nunito_700Bold', fontSize: 14 }}>Go back</Text>
          </View>
        </AnimatedPressable>
      </View>
    );
  }

  const card = deck.flashcards[currentIndex];
  const total = deck.flashcards.length;
  const progressPct = ((currentIndex + 1) / total) * 100;
  const cardWidth = width - 48;
  const isAtEnd = currentIndex >= deck.flashcards.length - 1;
  const isAtStart = currentIndex === 0;
  const flipHintText = isFlipped ? 'Showing answer' : 'Tap card to flip';

  // Progress dots
  const dotCount = Math.min(total, 7);
  const dotStart = Math.max(0, Math.min(currentIndex - 3, total - dotCount));

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.background }}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 20,
          paddingTop: insets.top + 12,
          paddingBottom: 12,
        }}
      >
        <View
          style={{
            backgroundColor: COLORS.primary,
            borderRadius: 20,
            paddingHorizontal: 14,
            paddingVertical: 6,
          }}
        >
          <Text style={{ fontSize: 13, fontWeight: '700', color: '#fff', fontFamily: 'Nunito_700Bold' }}>
            {currentIndex + 1} / {total}
          </Text>
        </View>
        <AnimatedPressable onPress={handleDone}>
          <View
            style={{
              backgroundColor: COLORS.surfaceDark,
              borderRadius: 20,
              paddingHorizontal: 16,
              paddingVertical: 8,
            }}
          >
            <Text style={{ fontSize: 14, fontWeight: '700', color: '#fff', fontFamily: 'Nunito_700Bold' }}>
              Done
            </Text>
          </View>
        </AnimatedPressable>
      </View>

      {/* Progress bar */}
      <View style={{ marginHorizontal: 20, height: 5, backgroundColor: COLORS.surfaceSecondary, borderRadius: 3, marginBottom: 32 }}>
        <View
          style={{
            height: 5,
            width: `${progressPct}%`,
            backgroundColor: COLORS.primary,
            borderRadius: 3,
          }}
        />
      </View>

      {/* Card */}
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 }}>
        <TouchableOpacity
          onPress={flipCard}
          activeOpacity={1}
          style={{ width: cardWidth, height: cardWidth * 0.72 }}
        >
          {/* Front - orange */}
          <Animated.View
            style={{
              position: 'absolute',
              width: '100%',
              height: '100%',
              borderRadius: 24,
              backgroundColor: COLORS.primary,
              alignItems: 'center',
              justifyContent: 'center',
              padding: 28,
              backfaceVisibility: 'hidden',
              transform: [{ perspective: 1000 }, { rotateY: frontInterpolate }],
              opacity: frontOpacity,
              shadowColor: COLORS.primary,
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.35,
              shadowRadius: 16,
              elevation: 8,
            }}
          >
            <Text style={{ position: 'absolute', top: 16, right: 20, fontSize: 20, opacity: 0.2, color: '#fff' }}>✦</Text>
            <Text style={{ position: 'absolute', bottom: 20, left: 20, fontSize: 14, opacity: 0.15, color: '#fff' }}>★</Text>
            <Text
              style={{
                fontSize: 11,
                fontWeight: '700',
                color: 'rgba(255,255,255,0.65)',
                fontFamily: 'Nunito_700Bold',
                letterSpacing: 1.5,
                textTransform: 'uppercase',
                marginBottom: 16,
              }}
            >
              Question
            </Text>
            <Text
              style={{
                fontSize: 20,
                fontWeight: '800',
                color: '#fff',
                fontFamily: 'Nunito_800ExtraBold',
                textAlign: 'center',
                lineHeight: 28,
              }}
            >
              {card.question}
            </Text>
            <Text
              style={{
                fontSize: 12,
                color: 'rgba(255,255,255,0.55)',
                fontFamily: 'Nunito_400Regular',
                marginTop: 20,
              }}
            >
              Tap to reveal answer
            </Text>
          </Animated.View>

          {/* Back - dark */}
          <Animated.View
            style={{
              position: 'absolute',
              width: '100%',
              height: '100%',
              borderRadius: 24,
              backgroundColor: COLORS.cardFlip,
              alignItems: 'center',
              justifyContent: 'center',
              padding: 28,
              backfaceVisibility: 'hidden',
              transform: [{ perspective: 1000 }, { rotateY: backInterpolate }],
              opacity: backOpacity,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.3,
              shadowRadius: 16,
              elevation: 8,
            }}
          >
            <Text
              style={{
                fontSize: 11,
                fontWeight: '700',
                color: 'rgba(255,255,255,0.5)',
                fontFamily: 'Nunito_700Bold',
                letterSpacing: 1.5,
                textTransform: 'uppercase',
                marginBottom: 16,
              }}
            >
              Answer
            </Text>
            <Text
              style={{
                fontSize: 20,
                fontWeight: '800',
                color: '#fff',
                fontFamily: 'Nunito_800ExtraBold',
                textAlign: 'center',
                lineHeight: 28,
              }}
            >
              {card.answer}
            </Text>
          </Animated.View>
        </TouchableOpacity>
      </View>

      {/* Progress dots */}
      <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 6, marginBottom: 16 }}>
        {Array.from({ length: dotCount }).map((_, i) => {
          const dotIndex = dotStart + i;
          const isActive = dotIndex === currentIndex;
          return (
            <View
              key={dotIndex}
              style={{
                width: isActive ? 20 : 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: isActive ? COLORS.primary : COLORS.surfaceSecondary,
              }}
            />
          );
        })}
      </View>

      {/* Navigation */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 20,
          paddingBottom: insets.bottom + 32,
          paddingHorizontal: 24,
        }}
      >
        <AnimatedPressable onPress={goPrev} disabled={isAtStart}>
          <View
            style={{
              width: 52,
              height: 52,
              borderRadius: 26,
              backgroundColor: isAtStart ? COLORS.surfaceSecondary : COLORS.surface,
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: 1,
              borderColor: COLORS.border,
              opacity: isAtStart ? 0.4 : 1,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.06,
              shadowRadius: 4,
              elevation: 1,
            }}
          >
            <ChevronLeft size={22} color={COLORS.text} />
          </View>
        </AnimatedPressable>

        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={{ fontSize: 13, color: COLORS.textTertiary, fontFamily: 'Nunito_400Regular' }}>
            {flipHintText}
          </Text>
        </View>

        <AnimatedPressable onPress={goNext} disabled={isAtEnd}>
          <View
            style={{
              width: 52,
              height: 52,
              borderRadius: 26,
              backgroundColor: isAtEnd ? COLORS.surfaceSecondary : COLORS.primary,
              alignItems: 'center',
              justifyContent: 'center',
              opacity: isAtEnd ? 0.4 : 1,
              shadowColor: isAtEnd ? 'transparent' : COLORS.primary,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: isAtEnd ? 0 : 4,
            }}
          >
            <ChevronRight size={22} color={isAtEnd ? COLORS.text : '#fff'} />
          </View>
        </AnimatedPressable>
      </View>
    </View>
  );
}
