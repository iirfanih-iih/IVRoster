import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useState, useEffect } from 'react';
import { useThemeStore } from '../../../stores/theme-store';
import { useAuthStore } from '../../../stores/auth-store';
import { getCyclesForTeam, CycleDefinition } from '../../../constants/cycles';

export default function RostersScreen() {
  const { colors } = useThemeStore();
  const { profile } = useAuthStore();
  const params = useLocalSearchParams<{ team?: string }>();
  const [selectedTeam, setSelectedTeam] = useState<'A' | 'B'>(
    (params.team as 'A' | 'B') || profile?.team || 'A'
  );

  const cycles = getCyclesForTeam(selectedTeam);
  const canEdit =
    profile?.role === 'admin' ||
    (profile?.role === 'team_leader' && profile?.team === selectedTeam);

  const styles = createStyles(colors);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.pageTitle}>Rosters</Text>
        <Text style={styles.pageSub}>
          {canEdit ? 'Generate & manage duty rosters' : 'View duty rosters'}
        </Text>
      </View>

      {/* Team Toggle */}
      <View style={styles.teamToggle}>
        <TouchableOpacity
          style={[styles.toggleBtn, selectedTeam === 'A' && styles.toggleActive]}
          onPress={() => setSelectedTeam('A')}
        >
          <Text
            style={[
              styles.toggleText,
              selectedTeam === 'A' && styles.toggleTextActive,
            ]}
          >
            Team A
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggleBtn, selectedTeam === 'B' && styles.toggleActive]}
          onPress={() => setSelectedTeam('B')}
        >
          <Text
            style={[
              styles.toggleText,
              selectedTeam === 'B' && styles.toggleTextActive,
            ]}
          >
            Team B
          </Text>
        </TouchableOpacity>
      </View>

      {/* Access Badge */}
      <View style={[styles.accessBadge, canEdit ? styles.accessFull : styles.accessView]}>
        <Text style={styles.accessText}>
          {canEdit ? '✓ Full Access — Can generate & edit' : '👁 View Only'}
        </Text>
      </View>

      {/* Cycle List */}
      {cycles.map((cycle, idx) => (
        <TouchableOpacity
          key={idx}
          style={styles.cycleCard}
          onPress={() =>
            router.push({
              pathname: '/(tabs)/rosters/cycle',
              params: { team: selectedTeam, cycleIdx: idx.toString() },
            })
          }
        >
          <View style={styles.cycleHeader}>
            <View>
              <Text style={styles.cycleName}>
                Cycle {CYCLES.indexOf(cycle) + 1}: {cycle.label}
              </Text>
              <Text style={styles.cycleEvents}>
                {cycle.events.length} events
              </Text>
            </View>
            <Text style={styles.cycleArrow}>›</Text>
          </View>
          <View style={styles.eventPills}>
            {cycle.events.slice(0, 4).map((ev, i) => (
              <View key={i} style={styles.eventPill}>
                <Text style={styles.eventPillText}>{ev.name}</Text>
              </View>
            ))}
            {cycle.events.length > 4 && (
              <View style={styles.eventPill}>
                <Text style={styles.eventPillText}>
                  +{cycle.events.length - 4} more
                </Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

// Need global CYCLES for indexOf
import { CYCLES } from '../../../constants/cycles';

function createStyles(colors: any) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: { padding: 20, paddingTop: 60, paddingBottom: 40 },
    header: { marginBottom: 20 },
    pageTitle: {
      fontSize: 22,
      fontWeight: '800',
      color: colors.primary,
    },
    pageSub: { fontSize: 11, color: colors.textSecondary, marginTop: 2 },
    teamToggle: {
      flexDirection: 'row',
      backgroundColor: colors.surface,
      borderRadius: 10,
      padding: 4,
      marginBottom: 14,
      borderWidth: 1,
      borderColor: colors.border,
    },
    toggleBtn: {
      flex: 1,
      paddingVertical: 10,
      alignItems: 'center',
      borderRadius: 8,
    },
    toggleActive: {
      backgroundColor: colors.primary,
    },
    toggleText: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.textSecondary,
    },
    toggleTextActive: { color: '#fff' },
    accessBadge: {
      borderRadius: 8,
      padding: 10,
      marginBottom: 16,
      alignItems: 'center',
    },
    accessFull: {
      backgroundColor: 'rgba(52,211,153,0.1)',
      borderWidth: 1,
      borderColor: 'rgba(52,211,153,0.3)',
    },
    accessView: {
      backgroundColor: 'rgba(245,158,11,0.1)',
      borderWidth: 1,
      borderColor: 'rgba(245,158,11,0.3)',
    },
    accessText: { fontSize: 11, fontWeight: '600', color: colors.text },
    cycleCard: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      padding: 16,
      marginBottom: 10,
    },
    cycleHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 10,
    },
    cycleName: { fontSize: 13, fontWeight: '700', color: colors.text },
    cycleEvents: { fontSize: 10, color: colors.textSecondary, marginTop: 2 },
    cycleArrow: { fontSize: 22, color: colors.textSecondary },
    eventPills: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
    eventPill: {
      backgroundColor: colors.surfaceElevated,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
    },
    eventPillText: { fontSize: 10, color: colors.textSecondary },
  });
}
