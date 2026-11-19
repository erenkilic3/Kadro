import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider, useTheme } from '../context/ThemeContext';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { AppProvider } from '../context/AppContext';

function RootStack() {
  const { colors, isDark } = useTheme();
  const { isAuthenticated, isAuthLoading, isPasswordRecovery } = useAuth();

  if (isAuthLoading) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colors.background,
        }}
      >
        <StatusBar style={isDark ? 'light' : 'dark'} />
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

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
        <Stack.Protected guard={!isAuthenticated}>
          <Stack.Screen
            name="login"
            options={{
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="register"
            options={{
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="forgot-password"
            options={{
              headerShown: false,
            }}
          />
        </Stack.Protected>

        <Stack.Protected guard={isAuthenticated && isPasswordRecovery}>
          <Stack.Screen
            name="reset-password"
            options={{
              headerShown: false,
            }}
          />
        </Stack.Protected>

        <Stack.Protected guard={isAuthenticated && !isPasswordRecovery}>
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
          <Stack.Screen
            name="notifications"
            options={{
              title: 'Bildirimler',
              headerBackTitle: 'Geri',
            }}
          />
          <Stack.Screen
            name="teams/index"
            options={{
              title: 'Takımlarım',
              headerBackTitle: 'Geri',
            }}
          />
          <Stack.Screen
            name="venue/[id]"
            options={{
              title: 'Halı Saha Tesisi',
              headerBackTitle: 'Geri',
            }}
          />
        </Stack.Protected>
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AuthProvider>
          <AppProvider>
            <RootStack />
          </AppProvider>
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
