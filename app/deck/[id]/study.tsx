import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  Animated,
  TouchableOpacity,
  ActivityIndicator,
  useWindowDimensions,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { ChevronLeft, ChevronRight, X } from 'lucide-react-native';
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

  // Flip animation
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
      Animated.spring(flipAnim, {
        toValue: 0,
        useNativeDriver: true,
        friction: 8,
        tension: 10,
      }).start();
    } else {
      Animated.spring(flipAnim, {
        toValue: 180,
        useNativeDriver: true,
        friction: 8,
        tension: 10,
      }).start();
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
        <Text style={{ fontSize: 16, color: COLORS.textSecondary, fontFamily: 'SpaceGrotesk_500Medium', textAlign: 'center' }}>
          No cards in this deck yet.
        </Text>
        <AnimatedPressable onPress={() => router.back()} style={{ marginTop: 16 }}>
          <View style={{ backgroundColor: COLORS.primaryMuted, borderRadius: 12, paddingHorizontal: 20, paddingVertical: 10 }}>
            <Text style={{ color: COLORS.primary, fontFamily: 'SpaceGrotesk_600SemiBold', fontSize: 14 }}>Go back</Text>
          </View>
        </AnimatedPressable>
      </View>
    );
  }

  const card = deck.flashcards[currentIndex];
  const total = deck.flashcards.length;
  const progressText = `Card ${currentIndex + 1} of ${total}`;
  const progressPct = ((currentIndex + 1) / total) * 100;
  const cardWidth = width - 48;

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
        <Text
          style={{
            fontSize: 15,
            fontWeight: '600',
            color: COLORS.textSecondary,
            fontFamily: 'SpaceGrotesk_600SemiBold',
          }}
        >
          {progressText}
        </Text>
        <AnimatedPressable onPress={handleDone}>
          <View
            style={{
              backgroundColor: COLORS.surfaceSecondary,
              borderRadius: 20,
              paddingHorizontal: 14,
              paddingVertical: 7,
            }}
          >
            <Text style={{ fontSize: 14, fontWeight: '600', color: COLORS.textSecondary, fontFamily: 'SpaceGrotesk_600SemiBold' }}>
              Done
            </Text>
          </View>
        </AnimatedPressable>
      </View>

      {/* Progress bar */}
      <View style={{ marginHorizontal: 20, height: 4, backgroundColor: COLORS.surfaceSecondary, borderRadius: 2, marginBottom: 32 }}>
        <View
          style={{
            height: 4,
            width: `${progressPct}%`,
            backgroundColor: COLORS.primary,
            borderRadius: 2,
          }}
        />
      </View>

      {/* Card */}
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 }}>
        <TouchableOpacity
          onPress={flipCard}
          activeOpacity={1}
          style={{ width: cardWidth, height: cardWidth * 0.7 }}
        >
          {/* Front */}
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
              boxShadow: '0 8px 32px rgba(79,110,247,0.30)',
              borderCurve: 'continuous',
            }}
          >
            <Text
              style={{
                fontSize: 11,
                fontWeight: '600',
                color: 'rgba(255,255,255,0.6)',
                fontFamily: 'SpaceGrotesk_600SemiBold',
                letterSpacing: 1,
                textTransform: 'uppercase',
                marginBottom: 16,
              }}
            >
              Question
            </Text>
            <Text
              style={{
                fontSize: 20,
                fontWeight: '700',
                color: '#fff',
                fontFamily: 'SpaceGrotesk_700Bold',
                textAlign: 'center',
                lineHeight: 28,
                letterSpacing: -0.2,
              }}
            >
              {card.question}
            </Text>
            <Text
              style={{
                fontSize: 12,
                color: 'rgba(255,255,255,0.5)',
                fontFamily: 'SpaceGrotesk_400Regular',
                marginTop: 20,
              }}
            >
              Tap to reveal answer
            </Text>
          </Animated.View>

          {/* Back */}
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
              boxShadow: '0 8px 32px rgba(26,29,46,0.30)',
              borderCurve: 'continuous',
            }}
          >
            <Text
              style={{
                fontSize: 11,
                fontWeight: '600',
                color: 'rgba(255,255,255,0.5)',
                fontFamily: 'SpaceGrotesk_600SemiBold',
                letterSpacing: 1,
                textTransform: 'uppercase',
                marginBottom: 16,
              }}
            >
              Answer
            </Text>
            <Text
              style={{
                fontSize: 20,
                fontWeight: '700',
                color: '#fff',
                fontFamily: 'SpaceGrotesk_700Bold',
                textAlign: 'center',
                lineHeight: 28,
                letterSpacing: -0.2,
              }}
            >
              {card.answer}
            </Text>
          </Animated.View>
        </TouchableOpacity>
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
        <AnimatedPressable onPress={goPrev} disabled={currentIndex === 0}>
          <View
            style={{
              width: 52,
              height: 52,
              borderRadius: 26,
              backgroundColor: currentIndex === 0 ? COLORS.surfaceSecondary : COLORS.surface,
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: 1,
              borderColor: COLORS.border,
              boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
              opacity: currentIndex === 0 ? 0.4 : 1,
            }}
          >
            <ChevronLeft size={22} color={COLORS.text} />
          </View>
        </AnimatedPressable>

        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={{ fontSize: 13, color: COLORS.textTertiary, fontFamily: 'SpaceGrotesk_400Regular' }}>
            {isFlipped ? 'Showing answer' : 'Tap card to flip'}
          </Text>
        </View>

        <AnimatedPressable onPress={goNext} disabled={!deck || currentIndex >= deck.flashcards.length - 1}>
          <View
            style={{
              width: 52,
              height: 52,
              borderRadius: 26,
              backgroundColor: (!deck || currentIndex >= deck.flashcards.length - 1) ? COLORS.surfaceSecondary : COLORS.primary,
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: (!deck || currentIndex >= deck.flashcards.length - 1) ? 'none' : '0 4px 12px rgba(79,110,247,0.30)',
              opacity: (!deck || currentIndex >= deck.flashcards.length - 1) ? 0.4 : 1,
            }}
          >
            <ChevronRight size={22} color={(!deck || currentIndex >= deck.flashcards.length - 1) ? COLORS.text : '#fff'} />
          </View>
        </AnimatedPressable>
      </View>
    </View>
  );
}
