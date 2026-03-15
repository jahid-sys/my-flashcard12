import React from 'react';
import { View } from 'react-native';
import { Stack, usePathname, useRouter } from 'expo-router';
import FloatingTabBar from '@/components/FloatingTabBar';
import { BookOpen, User } from 'lucide-react-native';
import { COLORS } from '@/constants/FlashcardColors';
import { useTheme } from '@react-navigation/native';

const TABS = [
  {
    name: '(home)',
    route: '/(tabs)/(home)' as const,
    icon: 'book' as const,
    label: 'My Decks',
  },
  {
    name: '(profile)',
    route: '/(tabs)/(profile)' as const,
    icon: 'person' as const,
    label: 'Profile',
  },
];

export default function TabLayout() {
  const theme = useTheme();
  const pathname = usePathname();
  const router = useRouter();

  const isHome = pathname.includes('(home)') || pathname === '/' || pathname === '/index';
  const isProfile = pathname.includes('(profile)') || pathname.includes('profile');

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <Stack screenOptions={{ headerShown: false, animation: 'none' }}>
        <Stack.Screen name="(home)" />
        <Stack.Screen name="(profile)" />
      </Stack>
      <FloatingTabBar
        tabs={TABS}
        containerWidth={220}
        borderRadius={35}
        bottomMargin={20}
      />
    </View>
  );
}
