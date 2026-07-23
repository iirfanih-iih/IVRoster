import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useThemeStore } from '../stores/theme-store';
import { useAuthStore } from '../stores/auth-store';

export default function RootLayout() {
  const { initialize: initTheme, isDark, colors } = useThemeStore();
  const { initialize: initAuth } = useAuthStore();

  useEffect(() => {
    initTheme();
    initAuth();
  }, []);

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
        }}
      />
    </>
  );
}
