import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useThemeStore } from '../../../stores/theme-store';
import { useAuthStore } from '../../../stores/auth-store';

export default function AdminScreen() {
  const { colors } = useThemeStore();
  const { profile } = useAuthStore();

  if (profile?.role !== 'admin') {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.red, fontSize: 14 }}>
          Access Denied — Admin only
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ padding: 20, paddingTop: 60 }}
    >
      <Text
        style={{ fontSize: 20, fontWeight: '800', color: colors.primary }}
      >
        ⚙️ Admin Panel
      </Text>
      <Text
        style={{
          fontSize: 11,
          color: colors.textSecondary,
          marginTop: 2,
          marginBottom: 20,
        }}
      >
        User management, audit logs, and system settings
      </Text>

      <View
        style={{
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: 12,
          padding: 20,
          alignItems: 'center',
        }}
      >
        <Text style={{ fontSize: 32, marginBottom: 12 }}>🚧</Text>
        <Text
          style={{
            fontSize: 14,
            fontWeight: '600',
            color: colors.text,
            marginBottom: 6,
          }}
        >
          Coming in Phase 4
        </Text>
        <Text
          style={{
            fontSize: 12,
            color: colors.textSecondary,
            textAlign: 'center',
            lineHeight: 20,
          }}
        >
          User management, audit logs, and member search will be built in the
          next session. For now, use the web admin panel.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});
