import { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useThemeStore } from '../../../stores/theme-store';
import { useAuthStore } from '../../../stores/auth-store';
import {
  getCyclesForTeam,
  cycleToRosterEvents,
  CYCLES,
} from '../../../constants/cycles';
import { TEAM_A_MEMBERS } from '../../../constants/members-team-a';
import {
  generateRoster,
  generateAllForCycle,
  DutyRow,
  RosterEvent,
  GenerationContext,
  MembersData,
} from '../../../lib/roster-engine';
import { dbSaveRoster, dbLoadRosters } from '../../../lib/supabase';

export default function CycleScreen() {
  const { colors } = useThemeStore();
  const { profile } = useAuthStore();
  const params = useLocalSearchParams<{ team: string; cycleIdx: string }>();
  const team = params.team as 'A' | 'B';
  const cycleIdx = parseInt(params.cycleIdx || '0');

  const teamCycles = getCyclesForTeam(team);
  const cycle = teamCycles[cycleIdx];
  const events = cycleToRosterEvents(cycle);

  // TODO: Load Team B members when available
  const members: MembersData = TEAM_A_MEMBERS;

  const [generatedRosters, setGeneratedRosters] = useState<
    Record<string, DutyRow[]>
  >({});
  const [loading, setLoading] = useState(false);
  const [expandedEvent, setExpandedEvent] = useState<string | null>(null);

  const canEdit =
    profile?.role === 'admin' ||
    (profile?.role === 'team_leader' && profile?.team === team);

  const globalCycleNum = CYCLES.indexOf(cycle) + 1;

  const handleGenerateAll = useCallback(async () => {
    if (!canEdit) return;
    setLoading(true);
    try {
      const result = generateAllForCycle(events, members);
      setGeneratedRosters(result);

      // Save to Supabase
      for (const [eventId, roster] of Object.entries(result)) {
        await dbSaveRoster(team, eventId, roster, false);
      }

      Alert.alert(
        'Generated!',
        `Rosters generated for all ${events.length} events in this cycle.`
      );
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to generate rosters.');
    } finally {
      setLoading(false);
    }
  }, [canEdit, events, members, team]);

  const handleGenerateOne = useCallback(
    async (ev: RosterEvent) => {
      if (!canEdit) return;
      const context: GenerationContext = {
        dutyCounts: {},
        prevAssign: {},
        allEvents: events,
      };
      // Initialize counts from already generated rosters
      [...members.male, ...members.female].forEach((m) => {
        context.dutyCounts[m.name] = 0;
      });

      const roster = generateRoster(ev, members, context);
      const updated = { ...generatedRosters, [ev.id]: roster };
      setGeneratedRosters(updated);

      await dbSaveRoster(team, ev.id, roster, false);
    },
    [canEdit, events, members, team, generatedRosters]
  );

  const styles = createStyles(colors);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backBtn}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.pageTitle}>
          Cycle {globalCycleNum}: {cycle.label}
        </Text>
        <Text style={styles.pageSub}>
          Team {team} · {events.length} events
        </Text>
      </View>

      {/* Generate All Button */}
      {canEdit && (
        <TouchableOpacity
          style={styles.generateAllBtn}
          onPress={handleGenerateAll}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.generateAllText}>
              ⚡ Generate All ({events.length} events)
            </Text>
          )}
        </TouchableOpacity>
      )}

      {/* Events List */}
      {events.map((ev) => {
        const roster = generatedRosters[ev.id];
        const isExpanded = expandedEvent === ev.id;
        const date = new Date(ev.date);
        const dateStr = date.toLocaleDateString('en-NZ', {
          weekday: 'short',
          day: 'numeric',
          month: 'short',
        });

        return (
          <View key={ev.id} style={styles.eventCard}>
            <TouchableOpacity
              style={styles.eventHeader}
              onPress={() =>
                setExpandedEvent(isExpanded ? null : ev.id)
              }
            >
              <View>
                <Text style={styles.eventName}>{ev.name}</Text>
                <Text style={styles.eventDate}>{dateStr}</Text>
              </View>
              <View style={styles.eventRight}>
                {roster ? (
                  <View style={styles.generatedBadge}>
                    <Text style={styles.generatedText}>✓ Generated</Text>
                  </View>
                ) : (
                  canEdit && (
                    <TouchableOpacity
                      style={styles.genBtn}
                      onPress={() => handleGenerateOne(ev)}
                    >
                      <Text style={styles.genBtnText}>Generate</Text>
                    </TouchableOpacity>
                  )
                )}
                <Text style={styles.expandArrow}>
                  {isExpanded ? '▼' : '›'}
                </Text>
              </View>
            </TouchableOpacity>

            {/* Expanded Roster View */}
            {isExpanded && roster && (
              <View style={styles.rosterBody}>
                {roster.map((row, idx) => (
                  <View key={idx} style={styles.dutyRow}>
                    <Text style={styles.dutyName}>{row.duty}</Text>
                    <View style={styles.assignees}>
                      {row.male.length > 0 && (
                        <View style={styles.genderCol}>
                          <Text style={styles.genderLabel}>M</Text>
                          {row.male.map((name, i) => (
                            <Text key={i} style={styles.memberName}>
                              {name}
                            </Text>
                          ))}
                        </View>
                      )}
                      {row.female.length > 0 && (
                        <View style={styles.genderCol}>
                          <Text style={styles.genderLabel}>F</Text>
                          {row.female.map((name, i) => (
                            <Text key={i} style={styles.memberName}>
                              {name}
                            </Text>
                          ))}
                        </View>
                      )}
                      {row.male.length === 0 && row.female.length === 0 && (
                        <Text style={styles.emptyText}>—</Text>
                      )}
                    </View>
                  </View>
                ))}
              </View>
            )}

            {isExpanded && !roster && (
              <View style={styles.rosterBody}>
                <Text style={styles.emptyText}>
                  Not yet generated. Tap "Generate" above.
                </Text>
              </View>
            )}
          </View>
        );
      })}
    </ScrollView>
  );
}

function createStyles(colors: any) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: { padding: 20, paddingTop: 60, paddingBottom: 40 },
    header: { marginBottom: 20 },
    backBtn: { fontSize: 13, color: colors.primary, marginBottom: 8 },
    pageTitle: { fontSize: 20, fontWeight: '800', color: colors.primary },
    pageSub: { fontSize: 11, color: colors.textSecondary, marginTop: 2 },
    generateAllBtn: {
      backgroundColor: colors.navy,
      borderRadius: 10,
      padding: 14,
      alignItems: 'center',
      marginBottom: 20,
    },
    generateAllText: { color: '#fff', fontWeight: '700', fontSize: 14 },
    eventCard: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      marginBottom: 10,
      overflow: 'hidden',
    },
    eventHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 14,
    },
    eventName: { fontSize: 13, fontWeight: '700', color: colors.text },
    eventDate: { fontSize: 10, color: colors.primary, marginTop: 2 },
    eventRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    generatedBadge: {
      backgroundColor: 'rgba(52,211,153,0.12)',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
    },
    generatedText: { fontSize: 10, fontWeight: '600', color: colors.green },
    genBtn: {
      backgroundColor: colors.primary,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 6,
    },
    genBtnText: { fontSize: 10, fontWeight: '700', color: '#fff' },
    expandArrow: { fontSize: 16, color: colors.textSecondary },
    rosterBody: {
      padding: 14,
      paddingTop: 0,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    dutyRow: {
      paddingVertical: 8,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    dutyName: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 4,
    },
    assignees: { flexDirection: 'row', gap: 16 },
    genderCol: { flex: 1 },
    genderLabel: {
      fontSize: 9,
      fontWeight: '700',
      color: colors.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: 1,
      marginBottom: 2,
    },
    memberName: { fontSize: 11, color: colors.text, lineHeight: 18 },
    emptyText: {
      fontSize: 11,
      color: colors.textSecondary,
      fontStyle: 'italic',
      padding: 12,
    },
  });
}
