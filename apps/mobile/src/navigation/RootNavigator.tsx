import React from 'react';
import { Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { getUiCopy } from '@manzil/shared';
import HomeScreen from '../screens/HomeScreen';
import SearchScreen from '../screens/SearchScreen';
import ConciergeScreen from '../screens/ConciergeScreen';
import ProfileScreen from '../screens/ProfileScreen';

const locale = 'uz' as const;
const copy = getUiCopy(locale);
const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

function HomeStackNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="HomeStack"
        component={HomeScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}

export default function RootNavigator() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={{
          tabBarActiveTintColor: '#005454',
          tabBarInactiveTintColor: '#6e7979',
          headerShown: false,
        }}
      >
        <Tab.Screen
          name="Home"
          component={HomeStackNavigator}
          options={{
            tabBarLabel: copy.nav.feed,
            tabBarIcon: ({ color }) => <Text style={{ color }}>🏠</Text>,
          }}
        />
        <Tab.Screen
          name="Search"
          component={SearchScreen}
          options={{
            tabBarLabel: copy.nav.discover,
            tabBarIcon: ({ color }) => <Text style={{ color }}>🔍</Text>,
          }}
        />
        <Tab.Screen
          name="Concierge"
          component={ConciergeScreen}
          options={{
            tabBarLabel: copy.nav.concierge,
            tabBarIcon: ({ color }) => <Text style={{ color }}>✨</Text>,
          }}
        />
        <Tab.Screen
          name="Profile"
          component={ProfileScreen}
          options={{
            tabBarLabel: copy.nav.profile,            tabBarIcon: ({ color }) => <Text style={{ color }}>👤</Text>,
          }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
