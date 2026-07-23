import { Redirect } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { useAuthStore } from '../stores/auth-store';
import { useThemeStore } from '../stores/theme-store';

export default function Index() {
  const { session, isLoading, forcePasswordChange } = useAuthStore();
  const { colors } = useThemeStore();

  if (isLoading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: colors.background,
        }}
      >
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!session) {
    return <Redirect href="/(auth)/login" />;
  }

  if (forcePasswordChange) {
    return <Redirect href="/(auth)/force-password" />;
  }

  return <Redirect href="/(tabs)/home" />;
}
