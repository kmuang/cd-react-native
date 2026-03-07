import { useState, useMemo } from 'react';
import {
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Linking,
  Platform,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import {
  DIRECTORY_DATA,
  COMMUNITY_LEADERS,
  type Household,
} from '@/constants/directory';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

const CATEGORY_GROUPS = [
  'St. Matthew',
  'St. Mark',
  'St. Luke',
  'St. John',
  'St. Paul',
  'St. Joseph',
  'St. Peter',
] as const;

const ACCENT_LIGHT = '#2563EB'; // Modern blue
const ACCENT_DARK = '#60A5FA';
const CARD_BG_LIGHT = '#FFFFFF';
const CARD_BG_DARK = '#1F2937';
const SEARCH_BG_LIGHT = '#F3F4F6';
const SEARCH_BG_DARK = '#374151';

function GroupDropdown({
  group,
  households,
  isExpanded,
  onToggle,
  colorScheme,
}: {
  group: string;
  households: Household[];
  isExpanded: boolean;
  onToggle: () => void;
  colorScheme: 'light' | 'dark';
}) {
  const dropdownBg =
    colorScheme === 'dark' ? '#374151' : '#F9FAFB';
  const iconColor = colorScheme === 'dark' ? Colors.dark.icon : Colors.light.icon;

  return (
    <View style={styles.groupDropdown}>
      <TouchableOpacity
        style={[styles.groupHeader, { backgroundColor: dropdownBg }]}
        onPress={onToggle}
        activeOpacity={0.7}>
        <IconSymbol
          name="chevron.right"
          size={20}
          color={iconColor}
          style={[
            styles.groupChevron,
            { transform: [{ rotate: isExpanded ? '90deg' : '0deg' }] },
          ]}
        />
        <ThemedText type="defaultSemiBold" style={styles.groupHeaderText}>
          {group}
        </ThemedText>
        <ThemedText style={styles.groupCount}>
          {households.length} household{households.length !== 1 ? 's' : ''}
        </ThemedText>
      </TouchableOpacity>
      {isExpanded && (
        <View
          style={[
            styles.groupContent,
            {
              borderLeftColor:
                colorScheme === 'dark' ? '#60A5FA' : '#2563EB',
            },
          ]}>
          {households.map((household) => (
            <View key={household.id} style={styles.cardWrapper}>
              <HouseholdCard household={household} />
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

function HouseholdCard({ household }: { household: Household }) {
  const [expanded, setExpanded] = useState(false);
  const colorScheme = useColorScheme() ?? 'light';
  const accent = colorScheme === 'dark' ? ACCENT_DARK : ACCENT_LIGHT;
  const cardBg = colorScheme === 'dark' ? CARD_BG_DARK : CARD_BG_LIGHT;
  const iconColor = colorScheme === 'dark' ? Colors.dark.icon : Colors.light.icon;

  const fullAddress = [household.address, household.city, household.state]
    .filter(Boolean)
    .join(', ');

  const handlePhonePress = () => {
    const num = household.phone.replace(/\D/g, '');
    if (num) Linking.openURL(`tel:${num}`);
  };

  const handleEmailPress = () => {
    if (household.email) {
      Linking.openURL(`mailto:${household.email}`);
    }
  };

  const handleAddressPress = () => {
    const query = encodeURIComponent(fullAddress);
    const url = Platform.select({
      ios: `maps:0,0?q=${query}`,
      android: `geo:0,0?q=${query}`,
      default: `https://maps.google.com/?q=${query}`,
    });
    Linking.openURL(url);
  };

  const cardBorder =
    colorScheme === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={() => setExpanded(!expanded)}
      style={[
        styles.card,
        { backgroundColor: cardBg, borderWidth: 1, borderColor: cardBorder },
      ]}>
      <View style={styles.cardHeader}>
        <View style={styles.householdInfo}>
          {household.group && (
            <ThemedText style={styles.groupBadge}>{household.group}</ThemedText>
          )}
          <ThemedText type="defaultSemiBold" style={styles.householdName}>
            {household.householdName}
          </ThemedText>
          <ThemedText style={styles.memberCount}>
            {household.members.length} member{household.members.length !== 1 ? 's' : ''}
          </ThemedText>
        </View>
        <IconSymbol
          name="chevron.right"
          size={22}
          color={iconColor}
          style={[styles.chevron, { transform: [{ rotate: expanded ? '90deg' : '0deg' }] }]}
        />
      </View>

      {expanded && (
        <View
          style={[
            styles.cardContent,
            {
              borderTopColor:
                colorScheme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
            },
          ]}>
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <IconSymbol name="person.2.fill" size={18} color={accent} />
              <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>
                Members
              </ThemedText>
            </View>
            {household.members.map((member, idx) => (
              <ThemedText key={idx} style={styles.memberRow}>
                {member.name}
                {member.role && (
                  <ThemedText style={styles.role}> · {member.role}</ThemedText>
                )}
              </ThemedText>
            ))}
          </View>

          {fullAddress && (
            <TouchableOpacity
              onPress={handleAddressPress}
              style={styles.contactRow}>
              <IconSymbol name="mappin" size={18} color={accent} />
              <ThemedText style={styles.contactText}>{fullAddress}</ThemedText>
            </TouchableOpacity>
          )}

          {household.phone && (
            <TouchableOpacity onPress={handlePhonePress} style={styles.contactRow}>
              <IconSymbol name="phone.fill" size={18} color={accent} />
              <ThemedText style={styles.contactText}>
                {[household.phone, household.phoneAlt].filter(Boolean).join(' · ')}
              </ThemedText>
            </TouchableOpacity>
          )}

          {household.email && (
            <TouchableOpacity onPress={handleEmailPress} style={styles.contactRow}>
              <IconSymbol name="envelope.fill" size={18} color={accent} />
              <ThemedText style={[styles.contactText, styles.link]}>
                {household.email}
              </ThemedText>
            </TouchableOpacity>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
}

export default function DirectoryScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(
    () =>
      Object.fromEntries(
        [...CATEGORY_GROUPS, 'N/A'].map((g) => [g, false])
      )
  );

  const toggleGroup = (group: string) => {
    setExpandedGroups((prev) => ({ ...prev, [group]: !prev[group] }));
  };
  const colorScheme = useColorScheme() ?? 'light';
  const searchBg = colorScheme === 'dark' ? SEARCH_BG_DARK : SEARCH_BG_LIGHT;
  const textColor = colorScheme === 'dark' ? Colors.dark.text : Colors.light.text;
  const iconColor = colorScheme === 'dark' ? Colors.dark.icon : Colors.light.icon;

  const filteredHouseholds = useMemo(() => {
    const query = searchQuery.trim();
    if (!query) return DIRECTORY_DATA;

    const q = query.toLowerCase();
    const qDigits = query.replace(/\D/g, '');

    return DIRECTORY_DATA.filter((h) => {
      // Match by household name
      if (h.householdName && h.householdName.toLowerCase().includes(q)) {
        return true;
      }
      // Match by any member name
      if (h.members?.length) {
        for (const m of h.members) {
          if (m.name && m.name.toLowerCase().includes(q)) return true;
        }
      }
      // Match by address or city
      if ((h.address && h.address.toLowerCase().includes(q)) ||
          (h.city && h.city.toLowerCase().includes(q))) {
        return true;
      }
      // Match by phone (partial digits allowed)
      if (qDigits.length >= 2) {
        const phoneDigits = (h.phone || '').replace(/\D/g, '');
        const altDigits = (h.phoneAlt || '').replace(/\D/g, '');
        if (phoneDigits.includes(qDigits) || altDigits.includes(qDigits)) {
          return true;
        }
      }
      if ((h.phone && h.phone.includes(query)) ||
          (h.phoneAlt && h.phoneAlt.includes(query))) {
        return true;
      }
      // Match by group or email
      if ((h.group && h.group.toLowerCase().includes(q)) ||
          (h.email && h.email.toLowerCase().includes(q))) {
        return true;
      }
      return false;
    });
  }, [searchQuery]);

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: Colors[colorScheme ?? 'light'].background }]}
      edges={['top']}>
      <View style={styles.header}>
        <ThemedText type="title" style={styles.title}>
          Zomi Catholic Community
        </ThemedText>
        <ThemedText style={styles.subtitle}>
          Parish Directory · {DIRECTORY_DATA.length} households
        </ThemedText>
      </View>

      <View style={[styles.searchContainer, { backgroundColor: searchBg }]}>
        <IconSymbol name="magnifyingglass" size={20} color={iconColor} />
        <TextInput
          style={[styles.searchInput, { color: textColor }]}
          placeholder="Search members, address, or phone..."
          placeholderTextColor={iconColor}
          value={searchQuery}
          onChangeText={setSearchQuery}
          returnKeyType="search"
        />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {COMMUNITY_LEADERS.length > 0 && (
          <View
            style={[
              styles.leadersSection,
            {
              backgroundColor:
                colorScheme === 'dark' ? 'rgba(96,165,250,0.15)' : 'rgba(37,99,235,0.08)',
            },
            ]}>
            <ThemedText type="defaultSemiBold" style={styles.leadersTitle}>
              Community Leaders
            </ThemedText>
            {COMMUNITY_LEADERS.map((leader, idx) => (
              <View key={idx} style={styles.leaderRow}>
                <ThemedText style={styles.leaderRole}>{leader.role}</ThemedText>
                <ThemedText type="defaultSemiBold">{leader.name}</ThemedText>
              </View>
            ))}
          </View>
        )}
        {filteredHouseholds.length === 0 ? (
          <ThemedView style={styles.emptyState}>
            <IconSymbol name="magnifyingglass" size={48} color={iconColor} />
            <ThemedText style={styles.emptyText}>No households found</ThemedText>
            <ThemedText style={styles.emptySubtext}>
              Try a different search term
            </ThemedText>
          </ThemedView>
        ) : (
          [...CATEGORY_GROUPS, 'N/A'].map((group) => {
            const householdsInGroup = filteredHouseholds.filter(
              (h) => h.group === group
            );
            const hasSearch = searchQuery.trim().length > 0;
            const shouldExpand = hasSearch
              ? householdsInGroup.length > 0
              : (expandedGroups[group] ?? false);
            return (
              <GroupDropdown
                key={group}
                group={group}
                households={householdsInGroup}
                isExpanded={shouldExpand}
                onToggle={() => toggleGroup(group)}
                colorScheme={colorScheme ?? 'light'}
              />
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 20,
  },
  title: {
    marginBottom: 6,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    opacity: 0.6,
    letterSpacing: 0.2,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 0,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingTop: 16,
    paddingBottom: 40,
  },
  card: {
    borderRadius: 12,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  householdInfo: {
    flex: 1,
  },
  householdName: {
    fontSize: 17,
    marginBottom: 4,
    fontWeight: '600',
  },
  memberCount: {
    fontSize: 13,
    opacity: 0.65,
  },
  chevron: {
    marginLeft: 8,
  },
  cardContent: {
    marginTop: 18,
    paddingTop: 18,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  section: {
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 14,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    opacity: 0.8,
  },
  memberRow: {
    fontSize: 15,
    marginBottom: 6,
    paddingLeft: 26,
  },
  role: {
    opacity: 0.7,
    fontSize: 14,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  contactText: {
    flex: 1,
    fontSize: 15,
    lineHeight: 22,
  },
  link: {
    color: '#2563EB',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
  },
  emptySubtext: {
    fontSize: 15,
    opacity: 0.7,
  },
  cardWrapper: {
    marginBottom: 12,
  },
  groupBadge: {
    fontSize: 11,
    opacity: 0.7,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  leadersSection: {
    marginBottom: 20,
    padding: 20,
    borderRadius: 12,
  },
  leadersTitle: {
    marginBottom: 14,
    fontSize: 15,
    letterSpacing: 0.3,
  },
  leaderRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 6,
  },
  leaderRole: {
    fontSize: 14,
    minWidth: 140,
    opacity: 0.8,
  },
  groupDropdown: {
    marginBottom: 12,
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 18,
    borderRadius: 10,
    gap: 12,
  },
  groupChevron: {
    marginRight: 0,
  },
  groupHeaderText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
  },
  groupCount: {
    fontSize: 13,
    opacity: 0.65,
  },
  groupContent: {
    marginTop: 10,
    marginLeft: 12,
    paddingLeft: 12,
    borderLeftWidth: 3,
  },
});
