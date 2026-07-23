import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { router } from 'expo-router';
import { useAuthStore } from '../../stores/auth-store';
import { useThemeStore } from '../../stores/theme-store';

export default function HomeScreen() {
  const { profile, signOut } = useAuthStore();
  const { colors, cycleTheme, mode } = useThemeStore();

  if (!profile) return null;

  const canEditA =
    profile.role === 'admin' ||
    (profile.role === 'team_leader' && profile.team === 'A');
  const canEditB =
    profile.role === 'admin' ||
    (profile.role === 'team_leader' && profile.team === 'B');

  const roleLabels = {
    admin: 'Administrator',
    team_leader: 'Team Leader',
    viewer: 'Viewer',
  };

  const styles = createStyles(colors);
  const themeIcon = mode === 'dark' ? '🌙' : mode === 'light' ? '☀️' : '💻';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.pageTitle}>Dashboard</Text>
          <Text style={styles.pageSub}>
            Auckland Ismaili Volunteers — Roster Management
          </Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity onPress={cycleTheme} style={styles.themeBtn}>
            <Text style={{ fontSize: 20 }}>{themeIcon}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* User Info */}
      <View style={styles.userBanner}>
        <Text style={styles.userName}>{profile.name || profile.email}</Text>
        <Text style={styles.userRole}>
          {roleLabels[profile.role]}
          {profile.team ? ` · Team ${profile.team}` : ''}
        </Text>
      </View>

      {/* Team Cards */}
      <View style={styles.teamRow}>
        <TouchableOpacity
          style={styles.teamCard}
          onPress={() => router.push('/(tabs)/rosters?team=A')}
        >
          <Text style={styles.teamIcon}>🅰️</Text>
          <Text style={styles.teamTitle}>Team A</Text>
          <Text style={styles.teamDesc}>
            Odd cycles · Jan, Mar, May, Jul, Sep, Nov
          </Text>
          <Text style={styles.teamMembers}>59 members · 11 Nandi</Text>
          <Text style={[styles.teamAccess, canEditA && styles.accessFull]}>
            {canEditA ? '✓ Full Access' : '👁 View Only'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.teamCard}
          onPress={() => router.push('/(tabs)/rosters?team=B')}
        >
          <Text style={styles.teamIcon}>🅱️</Text>
          <Text style={styles.teamTitle}>Team B</Text>
          <Text style={styles.teamDesc}>
            Even cycles · Feb, Apr, Jun, Aug, Oct, Dec
          </Text>
          <Text style={styles.teamMembers}>62 members · 12 Nandi</Text>
          <Text style={[styles.teamAccess, canEditB && styles.accessFull]}>
            {canEditB ? '✓ Full Access' : '👁 View Only'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Text style={[styles.statNum, { color: colors.primary }]}>12</Text>
          <Text style={styles.statLabel}>Cycles / Year</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={[styles.statNum, { color: colors.green }]}>121</Text>
          <Text style={styles.statLabel}>Volunteers</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={[styles.statNum, { color: colors.gold }]}>17</Text>
          <Text style={styles.statLabel}>Duty Types</Text>
        </View>
      </View>

      {/* Quick Links */}
      <View style={styles.quickLinks}>
        <Text style={styles.sectionLabel}>Quick Links</Text>
        <View style={styles.linksRow}>
          <TouchableOpacity
            style={styles.linkChip}
            onPress={() => router.push('/(tabs)/calendar')}
          >
            <Text style={styles.linkChipText}>📅 Calendar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.linkChip}
            onPress={() => router.push('/(tabs)/info')}
          >
            <Text style={styles.linkChipText}>👥 Contacts</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.linkChip}
            onPress={() => router.push('/(tabs)/info')}
          >
            <Text style={styles.linkChipText}>📑 Duty Guide</Text>
          </TouchableOpacity>
          {profile.role === 'admin' && (
            <TouchableOpacity
              style={[styles.linkChip, { borderColor: colors.gold }]}
              onPress={() => router.push('/(tabs)/admin')}
            >
              <Text style={[styles.linkChipText, { color: colors.gold }]}>
                ⚙️ Admin
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Sign Out */}
      <TouchableOpacity style={styles.signOutBtn} onPress={signOut}>
        <Text style={styles.signOutText}>Sign Out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function createStyles(colors: any) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: { padding: 20, paddingBottom: 40 },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 16,
      marginTop: 50,
    },
    headerRight: { flexDirection: 'row', gap: 8 },
    themeBtn: {
      width: 40,
      height: 40,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
      justifyContent: 'center',
      alignItems: 'center',
    },
    pageTitle: {
      fontSize: 22,
      fontWeight: '800',
      color: colors.primary,
      letterSpacing: 0.3,
    },
    pageSub: { fontSize: 11, color: colors.textSecondary, marginTop: 2 },
    userBanner: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 10,
      padding: 14,
      marginBottom: 20,
    },
    userName: { fontSize: 14, fontWeight: '700', color: colors.text },
    userRole: { fontSize: 11, color: colors.textSecondary, marginTop: 2 },
    teamRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
    teamCard: {
      flex: 1,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 14,
      padding: 20,
      alignItems: 'center',
    },
    teamIcon: { fontSize: 32, marginBottom: 8 },
    teamTitle: {
      fontSize: 16,
      fontWeight: '800',
      color: colors.primary,
      marginBottom: 4,
    },
    teamDesc: {
      fontSize: 10,
      color: colors.textSecondary,
      textAlign: 'center',
    },
    teamMembers: {
      fontSize: 10,
      color: colors.textSecondary,
      marginTop: 8,
    },
    teamAccess: {
      fontSize: 9,
      fontWeight: '700',
      color: colors.gold,
      marginTop: 10,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    accessFull: { color: colors.green },
    statsRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
    statBox: {
      flex: 1,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 10,
      padding: 14,
      alignItems: 'center',
    },
    statNum: { fontSize: 24, fontWeight: '800' },
    statLabel: { fontSize: 9, color: colors.textSecondary, marginTop: 4 },
    quickLinks: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 10,
      padding: 14,
      marginBottom: 20,
    },
    sectionLabel: {
      fontSize: 10,
      fontWeight: '700',
      color: colors.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: 1,
      marginBottom: 10,
    },
    linksRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    linkChip: {
      backgroundColor: colors.surfaceElevated,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      paddingVertical: 8,
      paddingHorizontal: 14,
    },
    linkChipText: { fontSize: 11, color: colors.primary, fontWeight: '600' },
    signOutBtn: {
      borderWidth: 1,
      borderColor: 'rgba(248,120,120,0.3)',
      borderRadius: 8,
      padding: 12,
      alignItems: 'center',
    },
    signOutText: { fontSize: 12, color: '#f88', fontWeight: '600' },
  });
}
