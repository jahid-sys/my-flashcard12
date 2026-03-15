import { Stack } from 'expo-router';
import { COLORS } from '@/constants/FlashcardColors';

export default function DeckLayout() {
  return (
    <Stack
      screenOptions={{
        headerTintColor: COLORS.primary,
        headerBackButtonDisplayMode: 'minimal',
        headerStyle: { backgroundColor: COLORS.background },
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen name="index" options={{ title: '' }} />
      <Stack.Screen name="study" options={{ title: 'Study Mode', headerShown: false }} />
      <Stack.Screen name="quiz" options={{ title: 'Quiz', headerShown: false }} />
      <Stack.Screen name="results" options={{ title: 'Results', headerShown: false }} />
    </Stack>
  );
}
