import { useMemo, useState } from 'react';
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { type Household } from '@/constants/directory';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useDirectory } from '@/hooks/use-directory';
import { removeHousehold } from '@/lib/directory-store';

const GROUPS = [
  'St. Matthew', 'St. Mark', 'St. Luke', 'St. John',
  'St. Paul', 'St. Joseph', 'St. Peter', 'N/A',
];

const GROUP_COLORS: Record<string, string> = {
  'St. Matthew': '#6366F1',
  'St. Mark':    '#10B981',
  'St. Luke':    '#F59E0B',
  'St. John':    '#3B82F6',
  'St. Paul':    '#EF4444',
  'St. Joseph':  '#8B5CF6',
  'St. Peter':   '#14B8A6',
  'N/A':         '#94A3B8',
};

async function confirmDelete(name: string): Promise<boolean> {
  const message = `Remove "${name}" from the directory?`;
  if (Platform.OS === 'web') {
    return window.confirm(message);
  }
  return new Promise((resolve) => {
    Alert.alert('Delete Household', message, [
      { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
      { text: 'Delete', style: 'destructive', onPress: () => resolve(true) },
    ]);
  });
}

function HouseholdCard({
  household,
  onEdit,
  onDelete,
  colors,
}: {
  household: Household;
  onEdit: () => void;
  onDelete: () => void;
  colors: typeof Colors.light;
}) {
  return (
    <View style={[styles.householdRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <TouchableOpacity style={styles.householdInfo} onPress={onEdit} activeOpacity={0.7}>
        <ThemedText type="defaultSemiBold" style={styles.householdName} numberOfLines={1}>
          {household.householdName}
        </ThemedText>
        <ThemedText style={[styles.householdMeta, { color: colors.muted }]}>
          {household.members.length} member{household.members.length !== 1 ? 's' : ''}
          {household.phone ? ` · ${household.phone}` : ''}
        </ThemedText>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.inlineEditBtn, { backgroundColor: colors.accent + '15' }]}
        onPress={onEdit}
      >
        <IconSymbol name="pencil" size={12} color={colors.accent} />
        <ThemedText style={[styles.inlineEditText, { color: colors.accent }]}>Edit</ThemedText>
      </TouchableOpacity>
      <TouchableOpacity onPress={onDelete} style={styles.deleteBtn}>
        <IconSymbol name="trash" size={18} color="#EF4444" />
      </TouchableOpacity>
    </View>
  );
}

export default function HouseholdsScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const { households, status } = useDirectory();
  const [query, setQuery] = useState('');
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(
    () => Object.fromEntries(GROUPS.map((g, i) => [g, i === 0])),
  );

  const toggleGroup = (g: string) =>
    setExpandedGroups((prev) => ({ ...prev, [g]: !prev[g] }));

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return households;
    return households.filter((h) =>
      h.householdName?.toLowerCase().includes(q) ||
      h.members?.some((m) => m.name?.toLowerCase().includes(q)) ||
      h.group?.toLowerCase().includes(q) ||
      h.phone?.includes(q) ||
      h.city?.toLowerCase().includes(q),
    );
  }, [query, households]);

  const openEdit = (id: string) => {
    router.push({ pathname: '/admin/edit-household', params: { mode: 'edit', id } });
  };

  const openNew = () => {
    router.push({ pathname: '/admin/edit-household', params: { mode: 'new' } });
  };

  const handleDelete = async (id: string, name: string) => {
    const ok = await confirmDelete(name);
    if (!ok) return;
    await removeHousehold(id);
  };

  const hasSearch = query.trim().length > 0;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={[styles.header, { borderColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.replace('/admin')} style={styles.headerBtn}>
          <IconSymbol name="house.fill" size={18} color={colors.muted} />
        </TouchableOpacity>
        <ThemedText type="defaultSemiBold" style={styles.headerTitle}>Households</ThemedText>
        <TouchableOpacity style={[styles.addBtn, { backgroundColor: colors.accent }]} onPress={openNew}>
          <IconSymbol name="plus" size={14} color="#fff" />
          <ThemedText style={styles.addBtnText}>Add</ThemedText>
        </TouchableOpacity>
      </View>

      <View style={[styles.searchBar, { backgroundColor: colors.surface }]}>
        <IconSymbol name="magnifyingglass" size={16} color={colors.muted} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search name, member, group, phone…"
          placeholderTextColor={colors.muted}
          style={[styles.searchInput, { color: colors.text }]}
          returnKeyType="search"
          clearButtonMode="while-editing"
        />
        {query.length > 0 && (
          <View style={[styles.resultsBadge, { backgroundColor: colors.accent }]}>
            <ThemedText style={styles.resultsBadgeText}>{filtered.length}</ThemedText>
          </View>
        )}
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {status === 'loading' && !households.length ? (
          <ThemedText style={[styles.emptyText, { color: colors.muted }]}>Loading…</ThemedText>
        ) : filtered.length === 0 ? (
          <ThemedText style={[styles.emptyText, { color: colors.muted }]}>No results found</ThemedText>
        ) : (
          GROUPS.map((group) => {
            const groupHouseholds = filtered.filter((h) => h.group === group);
            if (groupHouseholds.length === 0) return null;
            const expanded = hasSearch ? true : (expandedGroups[group] ?? false);
            const groupColor = GROUP_COLORS[group] ?? '#94A3B8';
            return (
              <View key={group} style={[styles.groupSection, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <TouchableOpacity style={styles.groupHeader} onPress={() => toggleGroup(group)} activeOpacity={0.7}>
                  <IconSymbol name="person.2.fill" size={15} color={groupColor} />
                  <ThemedText type="defaultSemiBold" style={[styles.groupTitle, { color: groupColor }]}>
                    {group}
                  </ThemedText>
                  <View style={[styles.groupBadge, { backgroundColor: groupColor + '20' }]}>
                    <ThemedText style={[styles.groupBadgeText, { color: groupColor }]}>
                      {groupHouseholds.length}
                    </ThemedText>
                  </View>
                  <IconSymbol
                    name="chevron.right"
                    size={14}
                    color={colors.muted}
                    style={{ transform: [{ rotate: expanded ? '90deg' : '0deg' }] }}
                  />
                </TouchableOpacity>
                {expanded && (
                  <View style={styles.groupContent}>
                    {groupHouseholds.map((h) => (
                      <HouseholdCard
                        key={h.id}
                        household={h}
                        onEdit={() => openEdit(h.id)}
                        onDelete={() => handleDelete(h.id, h.householdName)}
                        colors={colors}
                      />
                    ))}
                  </View>
                )}
              </View>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth },
  headerBtn: { padding: 6, width: 36 },
  headerTitle: { fontSize: 17 },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20 },
  addBtnText: { fontSize: 13, fontWeight: '700', color: '#fff' },
  scrollContent: { padding: 20, paddingBottom: 40, gap: 8 },
  emptyText: { textAlign: 'center', marginTop: 40, fontSize: 15 },
  searchBar: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 20, marginVertical: 10, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, gap: 10 },
  searchInput: { flex: 1, fontSize: 15, paddingVertical: 0, outlineWidth: 0 },
  resultsBadge: { minWidth: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 },
  resultsBadgeText: { fontSize: 11, fontWeight: '700', color: '#fff' },

  groupSection: { borderRadius: 14, borderWidth: 1, overflow: 'hidden' },
  groupHeader: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 16, gap: 10 },
  groupTitle: { flex: 1, fontSize: 15 },
  groupBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20 },
  groupBadgeText: { fontSize: 12, fontWeight: '700' },
  groupContent: { paddingHorizontal: 12, paddingBottom: 12, gap: 8 },

  householdRow: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 12, borderWidth: 1, gap: 8 },
  householdInfo: { flex: 1 },
  householdName: { fontSize: 15, marginBottom: 3 },
  householdMeta: { fontSize: 12 },
  inlineEditBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  inlineEditText: { fontSize: 12, fontWeight: '600' },
  deleteBtn: { padding: 4 },
});
