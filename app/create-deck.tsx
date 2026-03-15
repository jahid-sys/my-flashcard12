import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { X, Sparkles, RotateCcw, Save, ChevronRight } from 'lucide-react-native';
import { COLORS } from '@/constants/FlashcardColors';
import { AnimatedPressable } from '@/components/AnimatedPressable';
import { apiPost } from '@/utils/api';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface GeneratedCard {
  question: string;
  answer: string;
}

type Step = 'form' | 'preview';

export default function CreateDeckScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [notes, setNotes] = useState('');
  const [step, setStep] = useState<Step>('form');
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [generatedCards, setGeneratedCards] = useState<GeneratedCard[]>([]);
  const [deckId, setDeckId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expandedCard, setExpandedCard] = useState<number | null>(null);

  const dotsAnim = useRef(new Animated.Value(0)).current;

  const startDotsAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(dotsAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.timing(dotsAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
      ])
    ).start();
  };

  const handleGenerate = async () => {
    console.log('[CreateDeck] Generate flashcards pressed, title:', title, 'subject:', subject);
    if (!title.trim()) {
      setError('Please enter a deck title.');
      return;
    }
    if (!notes.trim()) {
      setError('Please paste some notes to generate flashcards from.');
      return;
    }
    setError(null);
    setGenerating(true);
    startDotsAnimation();

    try {
      console.log('[CreateDeck] POST /api/decks');
      const deck = await apiPost<{ id: string }>('/api/decks', {
        title: title.trim(),
        subject: subject.trim() || 'General',
        description: description.trim() || undefined,
      });
      setDeckId(deck.id);

      console.log('[CreateDeck] POST /api/decks/:id/generate, deckId:', deck.id);
      const result = await apiPost<{ flashcards: GeneratedCard[] }>(`/api/decks/${deck.id}/generate`, {
        notes: notes.trim(),
      });
      const cards = Array.isArray(result?.flashcards) ? result.flashcards : [];
      setGeneratedCards(cards);
      setStep('preview');
    } catch (e: any) {
      console.error('[CreateDeck] Generation failed:', e);
      setError(e?.message || 'Failed to generate flashcards. Please try again.');
    } finally {
      setGenerating(false);
      dotsAnim.stopAnimation();
    }
  };

  const handleRegenerate = async () => {
    console.log('[CreateDeck] Regenerate pressed');
    if (!deckId) return;
    setError(null);
    setGenerating(true);
    startDotsAnimation();
    try {
      console.log('[CreateDeck] POST /api/decks/:id/generate (regenerate), deckId:', deckId);
      const result = await apiPost<{ flashcards: GeneratedCard[] }>(`/api/decks/${deckId}/generate`, {
        notes: notes.trim(),
      });
      const cards = Array.isArray(result?.flashcards) ? result.flashcards : [];
      setGeneratedCards(cards);
    } catch (e: any) {
      console.error('[CreateDeck] Regeneration failed:', e);
      setError(e?.message || 'Failed to regenerate. Please try again.');
    } finally {
      setGenerating(false);
      dotsAnim.stopAnimation();
    }
  };

  const handleSave = async () => {
    console.log('[CreateDeck] Save deck pressed, deckId:', deckId);
    if (!deckId) return;
    setSaving(true);
    try {
      router.replace(`/deck/${deckId}`);
    } catch (e: any) {
      console.error('[CreateDeck] Save error:', e);
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    console.log('[CreateDeck] Close pressed');
    router.back();
  };

  const toggleCard = (index: number) => {
    setExpandedCard(expandedCard === index ? null : index);
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: COLORS.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 20,
          paddingTop: insets.top + 16,
          paddingBottom: 16,
          borderBottomWidth: 1,
          borderBottomColor: COLORS.divider,
        }}
      >
        <Text
          style={{
            fontSize: 18,
            fontWeight: '700',
            color: COLORS.text,
            fontFamily: 'SpaceGrotesk_700Bold',
          }}
        >
          {step === 'form' ? 'New Deck' : 'Preview Cards'}
        </Text>
        <AnimatedPressable onPress={handleClose}>
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
            <X size={16} color={COLORS.textSecondary} />
          </View>
        </AnimatedPressable>
      </View>

      {step === 'form' ? (
        <ScrollView
          contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Title */}
          <View style={{ marginBottom: 16 }}>
            <Text style={labelStyle}>Deck title *</Text>
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder="e.g. Cell Biology Chapter 3"
              placeholderTextColor={COLORS.textTertiary}
              style={inputStyle}
              returnKeyType="next"
            />
          </View>

          {/* Subject */}
          <View style={{ marginBottom: 16 }}>
            <Text style={labelStyle}>Subject</Text>
            <TextInput
              value={subject}
              onChangeText={setSubject}
              placeholder="e.g. Biology, History, Math"
              placeholderTextColor={COLORS.textTertiary}
              style={inputStyle}
              returnKeyType="next"
            />
          </View>

          {/* Description */}
          <View style={{ marginBottom: 16 }}>
            <Text style={labelStyle}>Description</Text>
            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder="Optional — what's this deck about?"
              placeholderTextColor={COLORS.textTertiary}
              multiline
              numberOfLines={2}
              style={[inputStyle, { minHeight: 72, textAlignVertical: 'top', paddingTop: 12 }]}
            />
          </View>

          {/* Notes */}
          <View style={{ marginBottom: 24 }}>
            <Text style={labelStyle}>Your notes *</Text>
            <TextInput
              value={notes}
              onChangeText={setNotes}
              placeholder="Paste your lecture notes, textbook excerpts, or any study material here..."
              placeholderTextColor={COLORS.textTertiary}
              multiline
              style={[inputStyle, { minHeight: 160, textAlignVertical: 'top', paddingTop: 12 }]}
            />
          </View>

          {error && (
            <View
              style={{
                backgroundColor: 'rgba(239,68,68,0.08)',
                borderRadius: 10,
                padding: 12,
                marginBottom: 16,
                borderWidth: 1,
                borderColor: 'rgba(239,68,68,0.15)',
              }}
            >
              <Text style={{ fontSize: 13, color: COLORS.danger, fontFamily: 'SpaceGrotesk_500Medium' }}>
                {error}
              </Text>
            </View>
          )}

          <AnimatedPressable onPress={handleGenerate} disabled={generating}>
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
                opacity: generating ? 0.8 : 1,
              }}
            >
              {generating ? (
                <>
                  <ActivityIndicator color="#fff" size="small" />
                  <Text style={{ fontSize: 15, fontWeight: '600', color: '#fff', fontFamily: 'SpaceGrotesk_600SemiBold' }}>
                    Generating flashcards...
                  </Text>
                </>
              ) : (
                <>
                  <Sparkles size={18} color="#fff" />
                  <Text style={{ fontSize: 15, fontWeight: '600', color: '#fff', fontFamily: 'SpaceGrotesk_600SemiBold' }}>
                    Generate flashcards
                  </Text>
                </>
              )}
            </View>
          </AnimatedPressable>
        </ScrollView>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 120 }}>
          {/* Card count */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <Text
              style={{
                fontSize: 15,
                color: COLORS.textSecondary,
                fontFamily: 'SpaceGrotesk_500Medium',
              }}
            >
              {generatedCards.length} cards generated
            </Text>
            <AnimatedPressable onPress={handleRegenerate} disabled={generating}>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 6,
                  backgroundColor: COLORS.surfaceSecondary,
                  borderRadius: 10,
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                }}
              >
                {generating ? (
                  <ActivityIndicator size="small" color={COLORS.primary} />
                ) : (
                  <RotateCcw size={14} color={COLORS.primary} />
                )}
                <Text style={{ fontSize: 13, color: COLORS.primary, fontFamily: 'SpaceGrotesk_600SemiBold' }}>
                  Regenerate
                </Text>
              </View>
            </AnimatedPressable>
          </View>

          {error && (
            <View
              style={{
                backgroundColor: 'rgba(239,68,68,0.08)',
                borderRadius: 10,
                padding: 12,
                marginBottom: 16,
                borderWidth: 1,
                borderColor: 'rgba(239,68,68,0.15)',
              }}
            >
              <Text style={{ fontSize: 13, color: COLORS.danger, fontFamily: 'SpaceGrotesk_500Medium' }}>
                {error}
              </Text>
            </View>
          )}

          {generatedCards.map((card, index) => {
            const isExpanded = expandedCard === index;
            const cardNum = `${index + 1}`;
            return (
              <AnimatedPressable key={index} onPress={() => toggleCard(index)}>
                <View
                  style={{
                    backgroundColor: COLORS.surface,
                    borderRadius: 14,
                    padding: 14,
                    marginBottom: 10,
                    borderWidth: 1,
                    borderColor: COLORS.border,
                    borderCurve: 'continuous',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
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
                      <Text style={{ fontSize: 11, fontWeight: '700', color: COLORS.primary, fontFamily: 'SpaceGrotesk_700Bold' }}>
                        {cardNum}
                      </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text
                        style={{
                          fontSize: 14,
                          fontWeight: '600',
                          color: COLORS.text,
                          fontFamily: 'SpaceGrotesk_600SemiBold',
                          lineHeight: 20,
                        }}
                        numberOfLines={isExpanded ? undefined : 2}
                      >
                        {card.question}
                      </Text>
                      {isExpanded && (
                        <View
                          style={{
                            marginTop: 10,
                            paddingTop: 10,
                            borderTopWidth: 1,
                            borderTopColor: COLORS.divider,
                          }}
                        >
                          <Text
                            style={{
                              fontSize: 13,
                              color: COLORS.textSecondary,
                              fontFamily: 'SpaceGrotesk_400Regular',
                              lineHeight: 19,
                            }}
                          >
                            {card.answer}
                          </Text>
                        </View>
                      )}
                    </View>
                    <ChevronRight
                      size={16}
                      color={COLORS.textTertiary}
                      style={{ transform: [{ rotate: isExpanded ? '90deg' : '0deg' }] }}
                    />
                  </View>
                </View>
              </AnimatedPressable>
            );
          })}
        </ScrollView>
      )}

      {/* Save button for preview step */}
      {step === 'preview' && (
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
          <AnimatedPressable onPress={handleSave} disabled={saving}>
            <View
              style={{
                backgroundColor: COLORS.accent,
                borderRadius: 14,
                paddingVertical: 15,
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'row',
                gap: 8,
                borderCurve: 'continuous',
              }}
            >
              {saving ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <Save size={18} color="#fff" />
                  <Text style={{ fontSize: 15, fontWeight: '600', color: '#fff', fontFamily: 'SpaceGrotesk_600SemiBold' }}>
                    Save deck
                  </Text>
                </>
              )}
            </View>
          </AnimatedPressable>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

const labelStyle = {
  fontSize: 13,
  fontWeight: '600' as const,
  color: COLORS.textSecondary,
  fontFamily: 'SpaceGrotesk_600SemiBold',
  marginBottom: 6,
};

const inputStyle = {
  backgroundColor: COLORS.surfaceSecondary,
  borderRadius: 12,
  paddingHorizontal: 14,
  paddingVertical: 13,
  fontSize: 15,
  color: COLORS.text,
  fontFamily: 'SpaceGrotesk_400Regular',
  borderWidth: 1,
  borderColor: COLORS.border,
  borderCurve: 'continuous' as const,
};
