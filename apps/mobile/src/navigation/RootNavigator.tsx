import React from 'react';
import { Text, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { getUiCopy } from '@manzil/shared';
import HomeScreen from '../screens/HomeScreen';
import SearchScreen from '../screens/SearchScreen';
import ConciergeScreen from '../screens/ConciergeScreen';
import ProfileScreen from '../screens/ProfileScreen';
import SavedScreen from '../screens/SavedScreen';
import BusinessDetailScreen from '../screens/BusinessDetailScreen';
import ReviewScreen from '../screens/ReviewScreen';
import OnboardingFlow from '../screens/OnboardingFlow';
import { useAppState } from '../app-state';
import { colors } from '../theme';
import type { MainStackParamList, RootTabParamList } from './types';

const locale = 'uz' as const;
const copy = getUiCopy(locale);
const Tab = createBottomTabNavigator<RootTabParamList>();
const Stack = createNativeStackNavigator<MainStackParamList>();

function TabIcon({ glyph, color }: { glyph: string; color: string }) {
  return (
    <View style={{ width: 32, height: 26, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ color, fontWeight: '900', fontSize: glyph === 'AI' ? 11 : 20 }}>{glyph}</Text>
    </View>
  );
}

function ScreenStack({ initial }: { initial: keyof MainStackParamList }) {
  return (
    <Stack.Navigator
      initialRouteName={initial}
      screenOptions={{
        headerShadowVisible: false,
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.primary,
        headerTitleStyle: { color: colors.ink, fontWeight: '900' },
        contentStyle: { backgroundColor: colors.background }
      }}
    >
      <Stack.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Search" component={SearchScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Concierge" component={ConciergeScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Saved" component={SavedScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Profile" component={ProfileScreen} options={{ headerShown: false }} />
      <Stack.Screen name="BusinessDetail" component={BusinessDetailScreen} options={{ title: 'Manzil' }} />
      <Stack.Screen name="Review" component={ReviewScreen} options={{ title: 'Sharh yozish' }} />
    </Stack.Navigator>
  );
}

export default function RootNavigator() {
  const { hasCompletedOnboarding, completeOnboarding } = useAppState();

  if (!hasCompletedOnboarding) {
    return <OnboardingFlow onComplete={completeOnboarding} onGuest={completeOnboarding} />;
  }

  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={{
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.subtle,
          headerShown: false,
          tabBarHideOnKeyboard: true,
          tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.surfaceHigh, borderTopWidth: 1, height: 78, paddingTop: 8, paddingBottom: 12 },
          tabBarLabelStyle: { fontSize: 11, fontWeight: '800' },
          tabBarItemStyle: { borderRadius: 14, marginHorizontal: 2 }
        }}
      >
        <Tab.Screen name="HomeTab" children={() => <ScreenStack initial="Home" />} options={{ tabBarLabel: copy.nav.feed, tabBarAccessibilityLabel: 'Bosh sahifa', tabBarIcon: ({ color }) => <TabIcon color={color} glyph="⌂" /> }} />
        <Tab.Screen name="SearchTab" children={() => <ScreenStack initial="Search" />} options={{ tabBarLabel: copy.nav.discover, tabBarAccessibilityLabel: 'Kashfiyot', tabBarIcon: ({ color }) => <TabIcon color={color} glyph="⌕" /> }} />
        <Tab.Screen name="ConciergeTab" children={() => <ScreenStack initial="Concierge" />} options={{ tabBarLabel: 'Gurman', tabBarAccessibilityLabel: 'Gurman yordamchisi', tabBarIcon: ({ color }) => <TabIcon color={color} glyph="AI" /> }} />
        <Tab.Screen name="SavedTab" children={() => <ScreenStack initial="Saved" />} options={{ tabBarLabel: copy.actions.saved, tabBarAccessibilityLabel: 'Saqlangan joylar', tabBarIcon: ({ color }) => <TabIcon color={color} glyph="☆" /> }} />
        <Tab.Screen name="ProfileTab" children={() => <ScreenStack initial="Profile" />} options={{ tabBarLabel: copy.nav.profile, tabBarAccessibilityLabel: 'Profil', tabBarIcon: ({ color }) => <TabIcon color={color} glyph="◉" /> }} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
