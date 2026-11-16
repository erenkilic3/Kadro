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
            backgroundColor: colors.background,
          },
          headerTintColor: colors.text,
          headerTitleStyle: {
            fontWeight: '700',
            fontSize: 16,
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
            title: 'Maç Detayı',
            headerBackTitle: 'Geri',
          }}
        />
        <Stack.Screen
          name="gear/[id]"
          options={{
            title: 'Ekipman',
            headerBackTitle: 'Geri',
          }}
        />
        <Stack.Screen
          name="league/[id]"
          options={{
            title: 'Lig Detayı',
            headerBackTitle: 'Geri',
          }}
        />
        <Stack.Screen
          name="league/create"
          options={{
            title: 'Yeni Lig',
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
