import { Stack } from 'expo-router';
import { COLORS } from '@/constants/FlashcardColors';

export default function ProfileLayout() {
  return (
    <Stack
      screenOptions={{
        headerTransparent: true,
        headerShadowVisible: false,
        headerLargeTitleShadowVisible: false,
        headerLargeStyle: { backgroundColor: 'transparent' },
        headerLargeTitle: true,
        headerBackButtonDisplayMode: 'minimal',
        headerTintColor: COLORS.primary,
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: 'Profile',
          headerLargeTitle: true,
        }}
      />
    </Stack>
  );
}
