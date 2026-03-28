import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
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

import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { DIRECTORY_DATA, type Household, type Member } from '@/constants/directory';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { upsertHousehold } from '@/lib/firestore';

const GROUPS = [
  'St. Matthew', 'St. Mark', 'St. Luke', 'St. John',
  'St. Paul', 'St. Joseph', 'St. Peter', 'N/A',
];

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  colors,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  keyboardType?: 'default' | 'phone-pad' | 'email-address';
  colors: typeof Colors.light;
}) {
  return (
    <View style={styles.field}>
      <ThemedText style={[styles.fieldLabel, { color: colors.muted }]}>{label}</ThemedText>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder ?? label}
        placeholderTextColor={colors.muted}
        keyboardType={keyboardType ?? 'default'}
        style={[
          styles.fieldInput,
          { color: colors.text, backgroundColor: colors.surface, borderColor: colors.border },
        ]}
      />
    </View>
  );
}

export default function EditHousehold() {
  const { mode, id } = useLocalSearchParams<{ mode: 'new' | 'edit'; id?: string }>();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const isNew = mode === 'new';

  const existing = id ? DIRECTORY_DATA.find((h) => h.id === id) : undefined;

  const [householdName, setHouseholdName] = useState(existing?.householdName ?? '');
  const [group, setGroup] = useState(existing?.group ?? 'St. Matthew');
  const [members, setMembers] = useState<Member[]>(
    existing?.members ?? [{ name: '' }],
  );
  const [address, setAddress] = useState(existing?.address ?? '');
  const [city, setCity] = useState(existing?.city ?? '');
  const [state, setState] = useState(existing?.state ?? '');
  const [zip, setZip] = useState(existing?.zip ?? '');
  const [phone, setPhone] = useState(existing?.phone ?? '');
  const [phoneAlt, setPhoneAlt] = useState(existing?.phoneAlt ?? '');
  const [email, setEmail] = useState((existing as any)?.email ?? '');
  const [saving, setSaving] = useState(false);

  const addMember = () => setMembers((m) => [...m, { name: '' }]);
  const removeMember = (i: number) => setMembers((m) => m.filter((_, idx) => idx !== i));
  const updateMember = (i: number, field: keyof Member, value: string) =>
    setMembers((m) => m.map((mem, idx) => (idx === i ? { ...mem, [field]: value } : mem)));

  const handleSave = async () => {
    if (!householdName.trim()) {
      Alert.alert('Required', 'Household name is required.');
      return;
    }
    setSaving(true);
    try {
      const cleanMembers = members.filter((m) => m.name.trim());
      const newId = isNew
        ? `h-${Date.now()}`
        : (id as string);

      const household: Household = {
        id: newId,
        householdName: householdName.trim(),
        group,
        members: cleanMembers,
        address: address.trim(),
        city: city.trim(),
        state: state.trim(),
        zip: zip.trim(),
        phone: phone.trim(),
        phoneAlt: phoneAlt.trim(),
        ...(email.trim() ? { email: email.trim() } : {}),
      };

      await upsertHousehold(household);
      router.back();
    } catch {
      Alert.alert('Error', 'Could not save. Check your connection.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={[styles.header, { borderColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
          <IconSymbol name="xmark" size={18} color={colors.muted} />
        </TouchableOpacity>
        <ThemedText type="defaultSemiBold" style={styles.headerTitle}>
          {isNew ? 'Add Household' : 'Edit Household'}
        </ThemedText>
        <TouchableOpacity
          onPress={handleSave}
          disabled={saving}
          style={[styles.saveBtn, { backgroundColor: colors.accent, opacity: saving ? 0.6 : 1 }]}
        >
          <ThemedText style={styles.saveBtnText}>{saving ? 'Saving…' : 'Save'}</ThemedText>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Field label="Household Name *" value={householdName} onChangeText={setHouseholdName} colors={colors} />

          {/* Group picker */}
          <View style={styles.field}>
            <ThemedText style={[styles.fieldLabel, { color: colors.muted }]}>Group</ThemedText>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.groupPicker}>
              {GROUPS.map((g) => (
                <TouchableOpacity
                  key={g}
                  onPress={() => setGroup(g)}
                  style={[
                    styles.groupChip,
                    {
                      backgroundColor: group === g ? colors.accent : colors.surface,
                      borderColor: group === g ? colors.accent : colors.border,
                    },
                  ]}
                >
                  <ThemedText
                    style={[
                      styles.groupChipText,
                      { color: group === g ? '#fff' : colors.text },
                    ]}
                  >
                    {g}
                  </ThemedText>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Members */}
          <View style={styles.field}>
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
                  style={[
                    styles.memberInput,
                    { color: colors.text, backgroundColor: colors.surface, borderColor: colors.border },
                  ]}
                />
                <TextInput
                  value={member.role ?? ''}
                  onChangeText={(v) => updateMember(i, 'role', v)}
                  placeholder="Role (optional)"
                  placeholderTextColor={colors.muted}
                  style={[
                    styles.memberRoleInput,
                    { color: colors.text, backgroundColor: colors.surface, borderColor: colors.border },
                  ]}
                />
                {members.length > 1 && (
                  <TouchableOpacity onPress={() => removeMember(i)} style={styles.removeBtn}>
                    <IconSymbol name="minus.circle.fill" size={20} color="#EF4444" />
                  </TouchableOpacity>
                )}
              </View>
            ))}
          </View>

          <Field label="Address" value={address} onChangeText={setAddress} colors={colors} />
          <View style={styles.row}>
            <View style={{ flex: 2 }}>
              <Field label="City" value={city} onChangeText={setCity} colors={colors} />
            </View>
            <View style={{ flex: 1 }}>
              <Field label="State" value={state} onChangeText={setState} placeholder="OK" colors={colors} />
            </View>
            <View style={{ flex: 1 }}>
              <Field label="ZIP" value={zip} onChangeText={setZip} keyboardType="phone-pad" colors={colors} />
            </View>
          </View>
          <Field label="Phone" value={phone} onChangeText={setPhone} keyboardType="phone-pad" colors={colors} />
          <Field label="Alt. Phone" value={phoneAlt} onChangeText={setPhoneAlt} keyboardType="phone-pad" colors={colors} />
          <Field label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" colors={colors} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerBtn: { padding: 6, width: 36, alignItems: 'center' },
  headerTitle: { fontSize: 17 },
  saveBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  saveBtnText: { fontSize: 14, fontWeight: '700', color: '#fff' },
  scrollContent: { padding: 20, paddingBottom: 40, gap: 4 },
  field: { marginBottom: 16 },
  fieldLabel: { fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 6 },
  fieldLabelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  fieldInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 15,
  },
  addLink: { fontSize: 13, fontWeight: '600' },
  memberRow: { flexDirection: 'row', gap: 8, marginBottom: 8, alignItems: 'center' },
  memberInput: {
    flex: 2,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  memberRoleInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  removeBtn: { padding: 4 },
  row: { flexDirection: 'row', gap: 10 },
  groupPicker: { flexDirection: 'row' },
  groupChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
  },
  groupChipText: { fontSize: 13, fontWeight: '500' },
});
