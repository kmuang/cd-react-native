import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
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

import { PinPad } from '@/components/pin-pad';
import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { type CommunityLeader, type Household, type Member } from '@/constants/directory';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useDirectory } from '@/hooks/use-directory';
import { verifyPin } from '@/lib/admin-auth';
import { adminSession } from '@/lib/admin-session';
import { deleteHousehold, upsertHousehold } from '@/lib/firestore';

const GROUPS = [
  'St. Matthew', 'St. Mark', 'St. Luke', 'St. John',
  'St. Paul', 'St. Joseph', 'St. Peter', 'N/A',
];

// ─── PIN Screen ──────────────────────────────────────────────────────────────

function PinScreen({ onSuccess }: { onSuccess: () => void }) {
  const [error, setError] = useState(false);
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  const handleSubmit = async (pin: string) => {
    const ok = await verifyPin(pin);
    if (ok) {
      adminSession.login();
      onSuccess();
    } else {
      setError(true);
      setTimeout(() => setError(false), 600);
    }
  };

  return (
    <SafeAreaView style={[styles.pinScreen, { backgroundColor: colors.background }]}>
      <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
        <IconSymbol name="xmark" size={18} color={colors.muted} />
      </TouchableOpacity>
      <View style={styles.pinHeader}>
        <View style={[styles.lockIcon, { backgroundColor: colors.accent + '18' }]}>
          <IconSymbol name="lock.fill" size={28} color={colors.accent} />
        </View>
        <ThemedText type="title" style={styles.pinTitle}>Admin Access</ThemedText>
        <ThemedText style={[styles.pinSubtitle, { color: colors.muted }]}>
          Enter your PIN to continue
        </ThemedText>
        {error && (
          <ThemedText style={styles.pinError}>Incorrect PIN. Try again.</ThemedText>
        )}
      </View>
      <PinPad onSubmit={handleSubmit} error={error} />
    </SafeAreaView>
  );
}

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
  onSave: (h: Household) => Promise<void>;   // just writes; doesn't close
  onCancel: () => void;                       // closes the form
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
  const removeMember = (i: number) =>
    setMembers((m) => m.filter((_, idx) => idx !== i));
  const updateMember = (i: number, field: keyof Member, value: string) =>
    setMembers((m) =>
      m.map((mem, idx) => (idx === i ? { ...mem, [field]: value } : mem)),
    );

  // Auto-save: debounce 700ms after any field change
  useEffect(() => {
    if (!name.trim()) return; // require at least a name
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setSaveStatus('idle');

    debounceRef.current = setTimeout(async () => {
      setSaveStatus('saving');
      try {
        const household: Household = {
          id: idRef.current,
          householdName: name.trim(),
          group,
          members: members.filter((m) => m.name.trim()),
          address: address.trim(),
          city: city.trim(),
          state: state.trim(),
          zip: zip.trim(),
          phone: phone.trim(),
          phoneAlt: phoneAlt.trim(),
          ...(email.trim() ? { email: email.trim() } : {}),
        };
        await onSave(household);
        setSaveStatus('saved');
      } catch {
        setSaveStatus('error');
      }
    }, 700);

    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [name, group, members, address, city, state, zip, phone, phoneAlt, email]);

  const inputStyle = [
    styles.input,
    { color: colors.text, backgroundColor: colors.background, borderColor: colors.border },
  ];

  return (
    <View style={[styles.editCard, { backgroundColor: colors.card, borderColor: colors.accent + '40' }]}>
      {/* Form header */}
      <View style={styles.editCardHeader}>
        <ThemedText type="defaultSemiBold" style={[styles.editCardTitle, { color: colors.accent }]}>
          {isNew ? 'New Household' : 'Edit Household'}
        </ThemedText>
        <View style={styles.editCardActions}>
          {saveStatus === 'saving' && (
            <ThemedText style={[styles.statusText, { color: colors.muted }]}>Saving…</ThemedText>
          )}
          {saveStatus === 'saved' && (
            <ThemedText style={[styles.statusText, { color: '#10B981' }]}>✓ Saved</ThemedText>
          )}
          {saveStatus === 'error' && (
            <ThemedText style={[styles.statusText, { color: '#EF4444' }]}>Error</ThemedText>
          )}
          <TouchableOpacity onPress={onCancel} style={[styles.editActionBtn, { backgroundColor: colors.surface }]}>
            <ThemedText style={[styles.editActionText, { color: colors.muted }]}>Done</ThemedText>
          </TouchableOpacity>
        </View>
      </View>

      {/* Household name */}
      <View style={styles.formField}>
        <ThemedText style={[styles.fieldLabel, { color: colors.muted }]}>Household Name *</ThemedText>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="Full name"
          placeholderTextColor={colors.muted}
          style={inputStyle}
        />
      </View>

      {/* Group */}
      <View style={styles.formField}>
        <ThemedText style={[styles.fieldLabel, { color: colors.muted }]}>Group</ThemedText>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.chipRow}>
            {GROUPS.map((g) => (
              <TouchableOpacity
                key={g}
                onPress={() => setGroup(g)}
                style={[
                  styles.chip,
                  {
                    backgroundColor: group === g ? colors.accent : colors.surface,
                    borderColor: group === g ? colors.accent : colors.border,
                  },
                ]}
              >
                <ThemedText style={[styles.chipText, { color: group === g ? '#fff' : colors.text }]}>
                  {g}
                </ThemedText>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>

      {/* Members */}
      <View style={styles.formField}>
        <View style={styles.fieldLabelRow}>
          <ThemedText style={[styles.fieldLabel, { color: colors.muted }]}>Members</ThemedText>
          <TouchableOpacity onPress={addMember}>
            <ThemedText style={[styles.addLink, { color: colors.accent }]}>+ Add</ThemedText>
          </TouchableOpacity>
        </View>
        {members.map((member, i) => (
          <View key={i} style={styles.memberRow}>
            <TextInput
              value={member.name}
              onChangeText={(v) => updateMember(i, 'name', v)}
              placeholder="Name"
              placeholderTextColor={colors.muted}
              style={[inputStyle, { flex: 2 }]}
            />
            <TextInput
              value={member.role ?? ''}
              onChangeText={(v) => updateMember(i, 'role', v)}
              placeholder="Role"
              placeholderTextColor={colors.muted}
              style={[inputStyle, { flex: 1 }]}
            />
            {members.length > 1 && (
              <TouchableOpacity onPress={() => removeMember(i)}>
                <IconSymbol name="minus.circle.fill" size={20} color="#EF4444" />
              </TouchableOpacity>
            )}
          </View>
        ))}
      </View>

      {/* Address row */}
      <View style={styles.formField}>
        <ThemedText style={[styles.fieldLabel, { color: colors.muted }]}>Address</ThemedText>
        <TextInput value={address} onChangeText={setAddress} placeholder="Street" placeholderTextColor={colors.muted} style={[inputStyle, { marginBottom: 6 }]} />
        <View style={styles.addressRow}>
          <TextInput value={city} onChangeText={setCity} placeholder="City" placeholderTextColor={colors.muted} style={[inputStyle, { flex: 2 }]} />
          <TextInput value={state} onChangeText={setState} placeholder="ST" placeholderTextColor={colors.muted} style={[inputStyle, { flex: 1 }]} />
          <TextInput value={zip} onChangeText={setZip} placeholder="ZIP" placeholderTextColor={colors.muted} keyboardType="phone-pad" style={[inputStyle, { flex: 1 }]} />
        </View>
      </View>

      {/* Phone */}
      <View style={styles.formField}>
        <ThemedText style={[styles.fieldLabel, { color: colors.muted }]}>Phone</ThemedText>
        <TextInput value={phone} onChangeText={setPhone} placeholder="Primary" placeholderTextColor={colors.muted} keyboardType="phone-pad" style={[inputStyle, { marginBottom: 6 }]} />
        <TextInput value={phoneAlt} onChangeText={setPhoneAlt} placeholder="Alternate (optional)" placeholderTextColor={colors.muted} keyboardType="phone-pad" style={inputStyle} />
      </View>

      {/* Email */}
      <View style={styles.formField}>
        <ThemedText style={[styles.fieldLabel, { color: colors.muted }]}>Email</ThemedText>
        <TextInput value={email} onChangeText={setEmail} placeholder="email@example.com" placeholderTextColor={colors.muted} keyboardType="email-address" autoCapitalize="none" style={inputStyle} />
      </View>
    </View>
  );
}

// ─── Household Card (collapsed + expanded) ───────────────────────────────────

function HouseholdCard({
  household,
  isEditing,
  onToggleEdit,
  onDelete,
  onSaved,
  colors,
}: {
  household: Household;
  isEditing: boolean;
  onToggleEdit: () => void;  // opens edit / closes + refreshes
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
        onCancel={onToggleEdit}  // onToggleEdit handles close + refresh when already editing
        colors={colors}
      />
    );
  }

  return (
    <View style={[styles.householdRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.householdInfo}>
        <ThemedText type="defaultSemiBold" style={styles.householdName} numberOfLines={1}>
          {household.householdName}
        </ThemedText>
        <ThemedText style={[styles.householdMeta, { color: colors.muted }]}>
          {household.group} · {household.members.length} member{household.members.length !== 1 ? 's' : ''}
        </ThemedText>
      </View>
      <View style={styles.rowActions}>
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: colors.accent + '15' }]}
          onPress={onToggleEdit}
        >
          <IconSymbol name="pencil" size={15} color={colors.accent} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: '#EF444420' }]}
          onPress={onDelete}
        >
          <IconSymbol name="trash" size={15} color="#EF4444" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Dashboard ───────────────────────────────────────────────────────────────

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

function Dashboard() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const { households, leaders, status, refresh } = useDirectory();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [addingNew, setAddingNew] = useState(false);

  const toggleEdit = (id: string) =>
    setEditingId((prev) => (prev === id ? null : id));

  // Called by auto-save — writes to Firestore without closing the form
  const handleSave = async (h: Household) => {
    await upsertHousehold(h);
  };

  // Called when "Done" is pressed — refreshes list and closes the form
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

  const handleLogout = () => {
    adminSession.logout();
    router.back();
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.dashHeader, { borderColor: colors.border }]}>
        <TouchableOpacity onPress={handleLogout} style={styles.headerBtn}>
          <IconSymbol name="xmark" size={18} color={colors.muted} />
        </TouchableOpacity>
        <ThemedText type="defaultSemiBold" style={styles.dashTitle}>Admin Panel</ThemedText>
        <TouchableOpacity onPress={() => router.push('/admin/change-pin')} style={styles.headerBtn}>
          <IconSymbol name="key.fill" size={18} color={colors.muted} />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Leaders */}
          <View style={styles.sectionRow}>
            <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>Community Leaders</ThemedText>
            <TouchableOpacity
              style={[styles.editLeadersBtn, { backgroundColor: colors.accent + '15' }]}
              onPress={() => router.push('/admin/edit-leaders')}
            >
              <IconSymbol name="pencil" size={14} color={colors.accent} />
              <ThemedText style={[styles.editLeadersBtnText, { color: colors.accent }]}>Edit</ThemedText>
            </TouchableOpacity>
          </View>
          {leaders.map((l, i) => (
            <View key={i} style={[styles.leaderRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <ThemedText style={[styles.leaderRole, { color: colors.muted }]}>{l.role}</ThemedText>
              <ThemedText type="defaultSemiBold" style={styles.leaderName}>{l.name}</ThemedText>
            </View>
          ))}

          {/* Households header */}
          <View style={[styles.sectionRow, { marginTop: 28 }]}>
            <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>
              Households{status === 'loading' ? ' …' : ` (${households.length})`}
            </ThemedText>
            <TouchableOpacity
              style={[styles.addBtn, { backgroundColor: addingNew ? colors.muted : colors.accent }]}
              onPress={() => { setAddingNew((v) => !v); setEditingId(null); }}
            >
              <IconSymbol name={addingNew ? 'xmark' : 'plus'} size={15} color="#fff" />
              <ThemedText style={styles.addBtnText}>{addingNew ? 'Cancel' : 'Add'}</ThemedText>
            </TouchableOpacity>
          </View>

          {/* Add new household form */}
          {addingNew && (
            <InlineEditForm
              initial={BLANK_HOUSEHOLD}
              isNew
              onSave={handleSave}
              onCancel={handleDone}
              colors={colors}
            />
          )}

          {/* Household list */}
          {households.map((h) => (
            <HouseholdCard
              key={h.id}
              household={h}
              isEditing={editingId === h.id}
              onToggleEdit={() => {
                if (editingId === h.id) { handleDone(); } else { setAddingNew(false); toggleEdit(h.id); }
              }}
              onDelete={() => handleDelete(h.id, h.householdName)}
              onSaved={handleSave}
              colors={colors}
            />
          ))}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────

export default function AdminIndex() {
  const [authenticated, setAuthenticated] = useState(adminSession.isAuthenticated);

  if (!authenticated) {
    return <PinScreen onSuccess={() => setAuthenticated(true)} />;
  }

  return <Dashboard />;
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  // PIN
  pinScreen: { flex: 1, alignItems: 'center', paddingTop: 60, gap: 48 },
  backBtn: { position: 'absolute', top: 56, right: 24, padding: 8 },
  pinHeader: { alignItems: 'center', gap: 10 },
  lockIcon: { width: 64, height: 64, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  pinTitle: { fontSize: 26 },
  pinSubtitle: { fontSize: 14 },
  pinError: { fontSize: 13, color: '#EF4444', marginTop: 4 },

  // Dashboard
  container: { flex: 1 },
  dashHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: StyleSheet.hairlineWidth },
  headerBtn: { padding: 8, width: 36, alignItems: 'center' },
  dashTitle: { fontSize: 17 },
  scrollView: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 40, gap: 8 },

  sectionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  sectionTitle: { fontSize: 16 },

  editLeadersBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  editLeadersBtnText: { fontSize: 13, fontWeight: '600' },
  leaderRow: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 10, borderWidth: 1 },
  leaderRole: { fontSize: 13, minWidth: 150 },
  leaderName: { fontSize: 14, flex: 1 },

  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20 },
  addBtnText: { fontSize: 13, fontWeight: '700', color: '#fff' },

  // Collapsed household card
  householdRow: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 12, borderWidth: 1, gap: 12 },
  householdInfo: { flex: 1 },
  householdName: { fontSize: 15, marginBottom: 3 },
  householdMeta: { fontSize: 12 },
  rowActions: { flexDirection: 'row', gap: 8 },
  actionBtn: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },

  // Inline edit card
  editCard: { borderRadius: 14, borderWidth: 1.5, padding: 16, gap: 14 },
  editCardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  editCardTitle: { fontSize: 14, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  editCardActions: { flexDirection: 'row', gap: 8 },
  editActionBtn: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20 },
  editActionText: { fontSize: 13, fontWeight: '600' },

  // Form fields
  formField: { gap: 6 },
  fieldLabel: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.6 },
  fieldLabelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  addLink: { fontSize: 13, fontWeight: '600' },
  input: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14 },
  memberRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  addressRow: { flexDirection: 'row', gap: 6 },
  chipRow: { flexDirection: 'row', gap: 8, paddingBottom: 2 },
  chip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, borderWidth: 1 },
  chipText: { fontSize: 12, fontWeight: '500' },
  statusText: { fontSize: 13, fontWeight: '500', alignSelf: 'center' },
});
