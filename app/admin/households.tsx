import { useMemo, useRef, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
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
import { type Household, type Member } from '@/constants/directory';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useDirectory } from '@/hooks/use-directory';
import { deleteHousehold, upsertHousehold } from '@/lib/firestore';

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

const BLANK_HOUSEHOLD: Household = {
  id: '',
  householdName: '',
  group: 'St. Matthew',
  members: [{ name: '' }],
  address: '',
  city: '',
  state: '',
  zip: '',
  phone: '',
  phoneAlt: '',
};

// ─── Inline Edit Form ─────────────────────────────────────────────────────────

function InlineEditForm({
  initial,
  isNew,
  onSave,
  onCancel,
  colors,
}: {
  initial: Household;
  isNew: boolean;
  onSave: (h: Household) => Promise<void>;
  onCancel: () => void;
  colors: typeof Colors.light;
}) {
  const [name, setName] = useState(initial.householdName);
  const [group, setGroup] = useState(initial.group || 'St. Matthew');
  const [members, setMembers] = useState<Member[]>(
    initial.members.length > 0 ? initial.members : [{ name: '' }],
  );
  const [address, setAddress] = useState(initial.address ?? '');
  const [city, setCity] = useState(initial.city ?? '');
  const [state, setState] = useState(initial.state ?? '');
  const [zip, setZip] = useState(initial.zip ?? '');
  const [phone, setPhone] = useState(initial.phone ?? '');
  const [phoneAlt, setPhoneAlt] = useState(initial.phoneAlt ?? '');
  const [email, setEmail] = useState((initial as any).email ?? '');

  type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const idRef = useRef(isNew ? `h-${Date.now()}` : initial.id);

  const addMember = () => setMembers((m) => [...m, { name: '' }]);
  const removeMember = (i: number) => setMembers((m) => m.filter((_, idx) => idx !== i));
  const updateMember = (i: number, field: keyof Member, value: string) =>
    setMembers((m) => m.map((mem, idx) => (idx === i ? { ...mem, [field]: value } : mem)));

  const triggerSave = (fields: {
    name: string; group: string; members: Member[];
    address: string; city: string; state: string; zip: string;
    phone: string; phoneAlt: string; email: string;
  }) => {
    if (!fields.name.trim()) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setSaveStatus('idle');
    debounceRef.current = setTimeout(async () => {
      setSaveStatus('saving');
      try {
        await onSave({
          id: idRef.current,
          householdName: fields.name.trim(),
          group: fields.group,
          members: fields.members.filter((m) => m.name.trim()),
          address: fields.address.trim(),
          city: fields.city.trim(),
          state: fields.state.trim(),
          zip: fields.zip.trim(),
          phone: fields.phone.trim(),
          phoneAlt: fields.phoneAlt.trim(),
          ...(fields.email.trim() ? { email: fields.email.trim() } : {}),
        });
        setSaveStatus('saved');
      } catch {
        setSaveStatus('error');
      }
    }, 700);
  };

  const set = (field: string, value: string | Member[] | string) => {
    const current = { name, group, members, address, city, state, zip, phone, phoneAlt, email };
    const updated = { ...current, [field]: value };
    triggerSave(updated);
  };

  const inputStyle = [
    styles.input,
    { color: colors.text, backgroundColor: colors.background, borderColor: colors.border },
  ];

  return (
    <View style={[styles.editCard, { backgroundColor: colors.card, borderColor: colors.accent + '40' }]}>
      <View style={styles.editCardHeader}>
        <ThemedText type="defaultSemiBold" style={[styles.editCardTitle, { color: colors.accent }]}>
          {isNew ? 'New Household' : 'Edit Household'}
        </ThemedText>
        <View style={styles.editCardActions}>
          {saveStatus === 'saving' && <ThemedText style={[styles.statusText, { color: colors.muted }]}>Saving…</ThemedText>}
          {saveStatus === 'saved' && <ThemedText style={[styles.statusText, { color: '#10B981' }]}>✓ Saved</ThemedText>}
          {saveStatus === 'error' && <ThemedText style={[styles.statusText, { color: '#EF4444' }]}>Error</ThemedText>}
          <TouchableOpacity onPress={onCancel} style={[styles.editActionBtn, { backgroundColor: colors.surface }]}>
            <ThemedText style={[styles.editActionText, { color: colors.muted }]}>Done</ThemedText>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.formField}>
        <ThemedText style={[styles.fieldLabel, { color: colors.muted }]}>Household Name *</ThemedText>
        <TextInput value={name} onChangeText={(v) => { setName(v); set('name', v); }}
          placeholder="Full name" placeholderTextColor={colors.muted} style={inputStyle} />
      </View>

      <View style={styles.formField}>
        <View style={styles.fieldLabelRow}>
          <IconSymbol name="square.grid.2x2.fill" size={13} color={colors.muted} />
          <ThemedText style={[styles.fieldLabel, { color: colors.muted }]}>Group</ThemedText>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.chipRow}>
            {GROUPS.map((g) => (
              <TouchableOpacity key={g} onPress={() => { setGroup(g); set('group', g); }}
                style={[styles.chip, { backgroundColor: group === g ? colors.accent : colors.surface, borderColor: group === g ? colors.accent : colors.border }]}>
                <ThemedText style={[styles.chipText, { color: group === g ? '#fff' : colors.text }]}>{g}</ThemedText>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>

      <View style={styles.formField}>
        <View style={styles.fieldLabelRow}>
          <View style={styles.fieldLabelIcon}>
            <IconSymbol name="person.2.fill" size={13} color={colors.muted} />
            <ThemedText style={[styles.fieldLabel, { color: colors.muted }]}>Members</ThemedText>
          </View>
          <TouchableOpacity onPress={addMember}>
            <ThemedText style={[styles.addLink, { color: colors.accent }]}>+ Add</ThemedText>
          </TouchableOpacity>
        </View>
        {members.map((member, i) => (
          <View key={i} style={styles.memberRow}>
            <TextInput value={member.name}
              onChangeText={(v) => { const updated = members.map((m, idx) => idx === i ? { ...m, name: v } : m); setMembers(updated); set('members', updated as any); }}
              placeholder="Name" placeholderTextColor={colors.muted} style={[inputStyle, { flex: 2 }]} />
            <TextInput value={member.role ?? ''}
              onChangeText={(v) => { const updated = members.map((m, idx) => idx === i ? { ...m, role: v } : m); setMembers(updated); set('members', updated as any); }}
              placeholder="Role" placeholderTextColor={colors.muted} style={[inputStyle, { flex: 1 }]} />
            {members.length > 1 && (
              <TouchableOpacity onPress={() => { const updated = members.filter((_, idx) => idx !== i); setMembers(updated); set('members', updated as any); }}>
                <IconSymbol name="minus.circle.fill" size={20} color="#EF4444" />
              </TouchableOpacity>
            )}
          </View>
        ))}
      </View>

      <View style={styles.formField}>
        <ThemedText style={[styles.fieldLabel, { color: colors.muted }]}>Address</ThemedText>
        <TextInput value={address} onChangeText={(v) => { setAddress(v); set('address', v); }}
          placeholder="Street" placeholderTextColor={colors.muted} style={[inputStyle, { marginBottom: 6 }]} />
        <View style={styles.addressRow}>
          <TextInput value={city} onChangeText={(v) => { setCity(v); set('city', v); }}
            placeholder="City" placeholderTextColor={colors.muted} style={[inputStyle, { flex: 2 }]} />
          <TextInput value={state} onChangeText={(v) => { setState(v); set('state', v); }}
            placeholder="ST" placeholderTextColor={colors.muted} style={[inputStyle, { flex: 1 }]} />
          <TextInput value={zip} onChangeText={(v) => { setZip(v); set('zip', v); }}
            placeholder="ZIP" placeholderTextColor={colors.muted} keyboardType="phone-pad" style={[inputStyle, { flex: 1 }]} />
        </View>
      </View>

      <View style={styles.formField}>
        <ThemedText style={[styles.fieldLabel, { color: colors.muted }]}>Phone</ThemedText>
        <TextInput value={phone} onChangeText={(v) => { setPhone(v); set('phone', v); }}
          placeholder="Primary" placeholderTextColor={colors.muted} keyboardType="phone-pad" style={[inputStyle, { marginBottom: 6 }]} />
        <TextInput value={phoneAlt} onChangeText={(v) => { setPhoneAlt(v); set('phoneAlt', v); }}
          placeholder="Alternate (optional)" placeholderTextColor={colors.muted} keyboardType="phone-pad" style={inputStyle} />
      </View>

      <View style={styles.formField}>
        <ThemedText style={[styles.fieldLabel, { color: colors.muted }]}>Email</ThemedText>
        <TextInput value={email} onChangeText={(v) => { setEmail(v); set('email', v); }}
          placeholder="email@example.com" placeholderTextColor={colors.muted}
          keyboardType="email-address" autoCapitalize="none" style={inputStyle} />
      </View>
    </View>
  );
}

// ─── Household Card ───────────────────────────────────────────────────────────

function HouseholdCard({
  household, isEditing, onToggleEdit, onDelete, onSaved, colors,
}: {
  household: Household;
  isEditing: boolean;
  onToggleEdit: () => void;
  onDelete: () => void;
  onSaved: (h: Household) => Promise<void>;
  colors: typeof Colors.light;
}) {
  if (isEditing) {
    return (
      <InlineEditForm
        initial={household}
        isNew={false}
        onSave={onSaved}
        onCancel={onToggleEdit}
        colors={colors}
      />
    );
  }

  return (
    <View style={[styles.householdRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.householdInfo}>
        <View style={styles.nameRow}>
          <ThemedText type="defaultSemiBold" style={styles.householdName} numberOfLines={1}>
            {household.householdName}
          </ThemedText>
          <TouchableOpacity
            style={[styles.inlineEditBtn, { backgroundColor: colors.accent + '15' }]}
            onPress={onToggleEdit}
          >
            <IconSymbol name="pencil" size={12} color={colors.accent} />
            <ThemedText style={[styles.inlineEditText, { color: colors.accent }]}>Edit</ThemedText>
          </TouchableOpacity>
        </View>
        <ThemedText style={[styles.householdMeta, { color: colors.muted }]}>
          {household.group} · {household.members.length} member{household.members.length !== 1 ? 's' : ''}
        </ThemedText>
      </View>
      <TouchableOpacity onPress={onDelete}>
        <IconSymbol name="trash" size={18} color="#EF4444" />
      </TouchableOpacity>
    </View>
  );
}

// ─── Group Section ────────────────────────────────────────────────────────────

function GroupSection({
  group, households, expanded, onToggle,
  editingId, onToggleEdit, onDelete, onSaved, colors,
}: {
  group: string;
  households: Household[];
  expanded: boolean;
  onToggle: () => void;
  editingId: string | null;
  onToggleEdit: (id: string) => void;
  onDelete: (id: string, name: string) => void;
  onSaved: (h: Household) => Promise<void>;
  colors: typeof Colors.light;
}) {
  const groupColor = GROUP_COLORS[group] ?? '#94A3B8';
  if (households.length === 0) return null;

  return (
    <View style={[styles.groupSection, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <TouchableOpacity style={styles.groupHeader} onPress={onToggle} activeOpacity={0.7}>
        <IconSymbol name="person.2.fill" size={15} color={groupColor} />
        <ThemedText type="defaultSemiBold" style={[styles.groupTitle, { color: groupColor }]}>
          {group}
        </ThemedText>
        <View style={[styles.groupBadge, { backgroundColor: groupColor + '20' }]}>
          <ThemedText style={[styles.groupBadgeText, { color: groupColor }]}>
            {households.length}
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
          {households.map((h) => (
            <HouseholdCard
              key={h.id}
              household={h}
              isEditing={editingId === h.id}
              onToggleEdit={() => onToggleEdit(h.id)}
              onDelete={() => onDelete(h.id, h.householdName)}
              onSaved={onSaved}
              colors={colors}
            />
          ))}
        </View>
      )}
    </View>
  );
}

// ─── Households Screen ────────────────────────────────────────────────────────

export default function HouseholdsScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const { households, status, refresh } = useDirectory();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [addingNew, setAddingNew] = useState(false);
  const [query, setQuery] = useState('');
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(
    () => Object.fromEntries(GROUPS.map((g) => [g, false])),
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

  const handleSave = async (h: Household) => {
    await upsertHousehold(h);
  };

  const handleDone = () => {
    setEditingId(null);
    setAddingNew(false);
    refresh();
  };

  const handleDelete = (id: string, name: string) => {
    Alert.alert('Delete Household', `Remove "${name}" from the directory?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteHousehold(id);
            if (editingId === id) setEditingId(null);
            refresh();
          } catch {
            Alert.alert('Error', 'Could not delete. Check your connection.');
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={[styles.header, { borderColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.replace('/admin')} style={styles.headerBtn}>
          <IconSymbol name="house.fill" size={18} color={colors.muted} />
        </TouchableOpacity>
        <ThemedText type="defaultSemiBold" style={styles.headerTitle}>Households</ThemedText>
        <TouchableOpacity
          style={[styles.addBtn, { backgroundColor: addingNew ? colors.muted : colors.accent }]}
          onPress={() => { setAddingNew((v) => !v); setEditingId(null); }}
        >
          <IconSymbol name={addingNew ? 'xmark' : 'plus'} size={14} color="#fff" />
          <ThemedText style={styles.addBtnText}>{addingNew ? 'Cancel' : 'Add'}</ThemedText>
        </TouchableOpacity>
      </View>

      {/* Search bar */}
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

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {addingNew && (
            <InlineEditForm
              initial={BLANK_HOUSEHOLD}
              isNew
              onSave={handleSave}
              onCancel={handleDone}
              colors={colors}
            />
          )}

          {status === 'loading' && !households.length ? (
            <ThemedText style={[styles.emptyText, { color: colors.muted }]}>Loading…</ThemedText>
          ) : filtered.length === 0 ? (
            <ThemedText style={[styles.emptyText, { color: colors.muted }]}>No results found</ThemedText>
          ) : (
            GROUPS.map((group) => {
              const groupHouseholds = filtered.filter((h) => h.group === group);
              const hasSearch = query.trim().length > 0;
              return (
                <GroupSection
                  key={group}
                  group={group}
                  households={groupHouseholds}
                  expanded={hasSearch ? groupHouseholds.length > 0 : (expandedGroups[group] ?? false)}
                  onToggle={() => toggleGroup(group)}
                  editingId={editingId}
                  onToggleEdit={(id) => {
                    if (editingId === id) { handleDone(); }
                    else { setAddingNew(false); setEditingId(id); }
                  }}
                  onDelete={handleDelete}
                  onSaved={handleSave}
                  colors={colors}
                />
              );
            })
          )}
        </ScrollView>
      </KeyboardAvoidingView>
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
  searchInput: { flex: 1, fontSize: 15, paddingVertical: 0, outlineWidth: 0, outlineStyle: 'none' },
  resultsBadge: { minWidth: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 },
  resultsBadgeText: { fontSize: 11, fontWeight: '700', color: '#fff' },

  groupSection: { borderRadius: 14, borderWidth: 1, overflow: 'hidden' },
  groupHeader: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 16, gap: 10 },
  groupTitle: { flex: 1, fontSize: 15 },
  groupBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20 },
  groupBadgeText: { fontSize: 12, fontWeight: '700' },
  groupContent: { paddingHorizontal: 12, paddingBottom: 12, gap: 8 },

  householdRow: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 12, borderWidth: 1, gap: 12 },
  householdInfo: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 3 },
  householdName: { fontSize: 15, flexShrink: 1 },
  inlineEditBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  inlineEditText: { fontSize: 12, fontWeight: '600' },
  householdMeta: { fontSize: 12 },

  editCard: { borderRadius: 14, borderWidth: 1.5, padding: 16, gap: 14 },
  editCardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  editCardTitle: { fontSize: 14, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  editCardActions: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  editActionBtn: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20 },
  editActionText: { fontSize: 13, fontWeight: '600' },
  statusText: { fontSize: 13, fontWeight: '500' },

  formField: { gap: 6 },
  fieldLabel: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.6 },
  fieldLabelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  fieldLabelIcon: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  addLink: { fontSize: 13, fontWeight: '600' },
  input: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14 },
  memberRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  addressRow: { flexDirection: 'row', gap: 6 },
  chipRow: { flexDirection: 'row', gap: 8, paddingBottom: 2 },
  chip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, borderWidth: 1 },
  chipText: { fontSize: 12, fontWeight: '500' },
});
