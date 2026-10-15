import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider, useTheme } from '../context/ThemeContext';
import { AppProvider } from '../context/AppContext';

function RootStack() {
  const { colors, isDark } = useTheme();

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: colors.surface,
          },
          headerTintColor: colors.text,
          headerTitleStyle: {
            fontWeight: '800',
            fontSize: 17,
          },
          headerShadowVisible: false,
          contentStyle: {
            backgroundColor: colors.background,
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
            title: 'Maç & Kadro Detayı',
            headerBackTitle: 'Geri',
          }}
        />
        <Stack.Screen
          name="gear/[id]"
          options={{
            title: 'Ekipman Detayı',
            headerBackTitle: 'Geri',
          }}
        />
        <Stack.Screen
          name="league/[id]"
          options={{
            title: 'Bölgesel Lig & Puan Durumu',
            headerBackTitle: 'Geri',
          }}
        />
        <Stack.Screen
          name="league/create"
          options={{
            title: 'Yeni Bölgesel Lig Kur',
            headerBackTitle: 'Geri',
          }}
        />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AppProvider>
          <RootStack />
        </AppProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

