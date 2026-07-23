import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useState } from 'react';
import { useThemeStore } from '../../../stores/theme-store';
import { CYCLES } from '../../../constants/cycles';

export default function CalendarScreen() {
  const { colors } = useThemeStore();
  const [expandedCycle, setExpandedCycle] = useState<number | null>(null);
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const styles = createStyles(colors);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.pageTitle}>🔄 Year Cycles 2026</Text>
      <Text style={styles.pageSub}>
        All 12 duty cycles with team assignments
      </Text>

      {CYCLES.map((cycle, idx) => {
        const isExpanded = expandedCycle === idx;
        return (
          <View key={idx} style={styles.cycleCard}>
            <TouchableOpacity
              style={styles.cycleHeader}
              onPress={() => setExpandedCycle(isExpanded ? null : idx)}
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.cycleName}>
                  Cycle {idx + 1}: {cycle.label}
                </Text>
              </View>
              <View
                style={[
                  styles.teamBadge,
                  cycle.team === 'A' ? styles.badgeA : styles.badgeB,
                ]}
              >
                <Text
                  style={[
                    styles.badgeText,
                    { color: cycle.team === 'A' ? '#4FC3F7' : '#34D399' },
                  ]}
                >
                  Team {cycle.team}
                </Text>
              </View>
              <Text style={styles.eventCount}>{cycle.events.length} events</Text>
            </TouchableOpacity>

            {isExpanded && (
              <View style={styles.cycleBody}>
                {cycle.events.map((ev, i) => {
                  const d = new Date(ev.date);
                  return (
                    <View key={i} style={styles.eventRow}>
                      <Text style={styles.eventDate}>
                        {d.toLocaleDateString('en-NZ', {
                          day: 'numeric',
                          month: 'short',
                        })}
                      </Text>
                      <Text style={styles.eventDay}>{days[d.getDay()]}</Text>
                      <Text style={styles.eventName}>{ev.name}</Text>
                    </View>
                  );
                })}
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
    pageTitle: { fontSize: 20, fontWeight: '800', color: colors.primary },
    pageSub: {
      fontSize: 11,
      color: colors.textSecondary,
      marginTop: 2,
      marginBottom: 20,
    },
    cycleCard: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 10,
      marginBottom: 10,
      overflow: 'hidden',
    },
    cycleHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 14,
      gap: 10,
    },
    cycleName: { fontSize: 12, fontWeight: '700', color: colors.text },
    teamBadge: {
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 10,
    },
    badgeA: {
      backgroundColor: 'rgba(79,195,247,0.12)',
      borderWidth: 1,
      borderColor: 'rgba(79,195,247,0.25)',
    },
    badgeB: {
      backgroundColor: 'rgba(52,211,153,0.12)',
      borderWidth: 1,
      borderColor: 'rgba(52,211,153,0.25)',
    },
    badgeText: { fontSize: 9, fontWeight: '700' },
    eventCount: { fontSize: 10, color: colors.textSecondary },
    cycleBody: { padding: 14, paddingTop: 0 },
    eventRow: {
      flexDirection: 'row',
      paddingVertical: 6,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      gap: 12,
    },
    eventDate: { fontSize: 11, color: colors.primary, width: 50 },
    eventDay: { fontSize: 11, color: colors.textSecondary, width: 30 },
    eventName: { fontSize: 11, color: colors.text, flex: 1 },
  });
}
