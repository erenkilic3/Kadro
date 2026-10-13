import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppProvider } from '../context/AppContext';
import { COLORS } from '../constants/theme';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AppProvider>
        <StatusBar style="light" />
        <Stack
          screenOptions={{
            headerStyle: {
              backgroundColor: COLORS.background,
            },
            headerTintColor: COLORS.text,
            headerTitleStyle: {
              fontWeight: '700',
            },
            headerShadowVisible: false,
            contentStyle: {
              backgroundColor: COLORS.background,
            },
          }}
        >
          <Stack.Screen
            name="(tabs)"
            options={{
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="match/[id]"
            options={{
              title: 'Kadro Detayı & Saha',
              headerBackTitle: 'Geri',
            }}
          />
          <Stack.Screen
            name="gear/[id]"
            options={{
              title: 'İkinci El Ürün Detayı',
              headerBackTitle: 'Geri',
            }}
          />
        </Stack>
      </AppProvider>
    </SafeAreaProvider>
  );
}
