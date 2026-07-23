import { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Linking,
  StyleSheet,
} from 'react-native';
import { useThemeStore } from '../../../stores/theme-store';
import { loadLeadershipContacts } from '../../../lib/supabase';

interface Contact {
  role: string;
  name: string;
  phone?: string;
  email?: string;
  addr?: string;
  group: string;
}

const DEFAULT_CONTACTS: Contact[] = [
  { role: 'Council Member', name: 'Salman Momin', phone: '+64 22 070 6786', email: 'ssjinnah@gmail.com', group: 'council' },
  { role: 'Asst. CMC', name: 'Sameer Hirani', phone: '+64 22 397 9442', email: 'sameerhirani99@gmail.com', group: 'council' },
  { role: 'IVC Director', name: 'Irfan Jalia', phone: '+64 22 571 3757', email: 'jaliairfan@gmail.com', group: 'council' },
  { role: 'IV Deputy Director', name: 'Shahzad Saleem', phone: '+64 20 4057 2575', email: 'shazad.saleem@anzin.org', group: 'council' },
  { role: 'IV Facilitator', name: 'Muskaan Somjee', phone: '+64 20 4065 7515', email: 'muskaansomjee@gmail.com', group: 'council' },
  { role: 'Team Lead', name: 'Irfan Ismail', phone: '+64 27 258 6371', email: 'iirfanih@gmail.com', group: 'teamA' },
  { role: 'Team Lead', name: 'Karishma Dharani', phone: '+64 29 777 8786', email: 'tabbudharani@gmail.com', group: 'teamA' },
  { role: 'Asst. Team Lead', name: 'Aaliyah Vishram', email: 'aaliyahvishram@gmail.com', group: 'teamA' },
  { role: 'Team Lead', name: 'Rumina Kotadia', phone: '+64 22 137 0350', email: 'ruminaamin@gmail.com', group: 'teamB' },
  { role: 'Team Lead', name: 'Sadiq Daredia', phone: '+64 22 356 8786', group: 'teamB' },
  { role: 'Asst. Team Lead', name: 'Ahad Lokhandwala', email: 'ahadloks@gmail.com', group: 'teamB' },
  { role: 'Safety Lead', name: 'Riyaz Sutar', phone: '+64 20 400 00134', group: 'safety' },
  { role: 'Emergency', name: '', phone: '111', group: 'emergency' },
  { role: 'Non-Emergency', name: '', phone: '105', group: 'emergency' },
];

const GROUPS = [
  { key: 'council', label: 'IVC Leadership' },
  { key: 'teamA', label: 'Team A' },
  { key: 'teamB', label: 'Team B' },
  { key: 'safety', label: 'Safety' },
  { key: 'emergency', label: 'Emergency' },
];

export default function InfoScreen() {
  const { colors } = useThemeStore();
  const [contacts, setContacts] = useState<Contact[]>(DEFAULT_CONTACTS);
  const [tab, setTab] = useState<'contacts' | 'guide'>('contacts');

  useEffect(() => {
    loadLeadershipContacts().then((data) => {
      if (data && Array.isArray(data) && data.length) {
        setContacts(data);
      }
    });
  }, []);

  const styles = createStyles(colors);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.pageTitle}>Info</Text>
      <Text style={styles.pageSub}>
        Auckland Jamatkhana — 2-4 Ascension Place, Rosedale
      </Text>

      {/* Tab Toggle */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, tab === 'contacts' && styles.tabActive]}
          onPress={() => setTab('contacts')}
        >
          <Text
            style={[
              styles.tabText,
              tab === 'contacts' && styles.tabTextActive,
            ]}
          >
            👥 Contacts
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, tab === 'guide' && styles.tabActive]}
          onPress={() => setTab('guide')}
        >
          <Text
            style={[styles.tabText, tab === 'guide' && styles.tabTextActive]}
          >
            📑 Duty Guide
          </Text>
        </TouchableOpacity>
      </View>

      {tab === 'contacts' && (
        <>
          {GROUPS.map((group) => {
            const items = contacts.filter((c) => c.group === group.key);
            if (!items.length) return null;
            return (
              <View key={group.key} style={styles.groupSection}>
                <Text style={styles.groupLabel}>{group.label}</Text>
                {items.map((contact, idx) => (
                  <View key={idx} style={styles.contactCard}>
                    <View style={styles.contactInfo}>
                      <Text style={styles.contactRole}>{contact.role}</Text>
                      {contact.name ? (
                        <Text style={styles.contactName}>{contact.name}</Text>
                      ) : null}
                    </View>
                    <View style={styles.contactActions}>
                      {contact.phone && (
                        <TouchableOpacity
                          onPress={() =>
                            Linking.openURL(
                              `tel:${contact.phone!.replace(/\s/g, '')}`
                            )
                          }
                          style={styles.actionBtn}
                        >
                          <Text style={styles.actionPhone}>
                            📞 {contact.phone}
                          </Text>
                        </TouchableOpacity>
                      )}
                      {contact.email && (
                        <TouchableOpacity
                          onPress={() =>
                            Linking.openURL(`mailto:${contact.email}`)
                          }
                        >
                          <Text style={styles.actionEmail}>
                            ✉️ {contact.email}
                          </Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                ))}
              </View>
            );
          })}
        </>
      )}

      {tab === 'guide' && (
        <View style={styles.guideSection}>
          <View style={styles.guideCard}>
            <Text style={styles.guideTitle}>⏰ Punctuality</Text>
            <Text style={styles.guideText}>
              If assigned Number 1, Nandi Labelling, Chai Station, Entrance, or
              Seating & Discipline — arrive 15–20 minutes before Dua time.
            </Text>
          </View>
          <View style={styles.guideCard}>
            <Text style={styles.guideTitle}>🚪 Entrance Duty</Text>
            <Text style={styles.guideText}>
              Greet every person with "Ya Ali Madad". Close the door promptly to
              prevent outside noise. Maintain a welcoming presence.
            </Text>
          </View>
          <View style={styles.guideCard}>
            <Text style={styles.guideTitle}>🔔 Nandi Duty</Text>
            <Text style={styles.guideText}>
              Must be clearly audible to the entire congregation. Practice
              delivery beforehand. Speak with confidence and clarity.
            </Text>
          </View>
          <View style={styles.guideCard}>
            <Text style={styles.guideTitle}>👔 Uniform Policy</Text>
            <Text style={styles.guideText}>
              Wear uniform throughout the entire month of duty cycle. Formal for
              Chandraat & Khushiyali; casual for other events.
            </Text>
          </View>
          <View style={styles.guideCard}>
            <Text style={styles.guideTitle}>🙏 Etiquette</Text>
            <Text style={styles.guideText}>
              Perform duty with sincerity and humility. Be courteous to all.
              Mobile phones on silent during duty hours.
            </Text>
          </View>
        </View>
      )}
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
      marginBottom: 16,
    },
    tabs: {
      flexDirection: 'row',
      backgroundColor: colors.surface,
      borderRadius: 10,
      padding: 4,
      marginBottom: 20,
      borderWidth: 1,
      borderColor: colors.border,
    },
    tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 8 },
    tabActive: { backgroundColor: colors.primary },
    tabText: { fontSize: 12, fontWeight: '600', color: colors.textSecondary },
    tabTextActive: { color: '#fff' },
    groupSection: { marginBottom: 20 },
    groupLabel: {
      fontSize: 11,
      fontWeight: '700',
      color: colors.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: 1,
      marginBottom: 8,
    },
    contactCard: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 10,
      padding: 12,
      marginBottom: 6,
    },
    contactInfo: { marginBottom: 6 },
    contactRole: { fontSize: 10, fontWeight: '700', color: colors.textSecondary },
    contactName: { fontSize: 13, fontWeight: '600', color: colors.text },
    contactActions: { gap: 4 },
    actionBtn: {},
    actionPhone: { fontSize: 12, color: colors.primary },
    actionEmail: { fontSize: 11, color: colors.green },
    guideSection: { gap: 12 },
    guideCard: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 10,
      padding: 16,
    },
    guideTitle: { fontSize: 13, fontWeight: '700', color: colors.text, marginBottom: 6 },
    guideText: { fontSize: 12, color: colors.textSecondary, lineHeight: 20 },
  });
}
