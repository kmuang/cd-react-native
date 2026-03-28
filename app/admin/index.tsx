import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  Image,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PinPad } from '@/components/pin-pad';
import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useDirectory } from '@/hooks/use-directory';
import { verifyPin } from '@/lib/admin-auth';
import { adminSession } from '@/lib/admin-session';

// ─── PIN Screen ───────────────────────────────────────────────────────────────

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
        <Image
          source={require('@/assets/images/catholic.png')}
          style={styles.pinLogo}
          resizeMode="contain"
        />
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

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  icon,
  color,
  bg,
}: {
  label: string;
  value: number | string;
  icon: string;
  color: string;
  bg: string;
}) {
  return (
    <View style={[styles.statCard, { backgroundColor: bg }]}>
      <View style={[styles.statIcon, { backgroundColor: color + '20' }]}>
        <IconSymbol name={icon as any} size={18} color={color} />
      </View>
      <ThemedText style={[styles.statValue, { color }]}>{value}</ThemedText>
      <ThemedText style={styles.statLabel}>{label}</ThemedText>
    </View>
  );
}

// ─── Nav Card ─────────────────────────────────────────────────────────────────

function NavCard({
  label,
  description,
  icon,
  color,
  onPress,
  colors,
}: {
  label: string;
  description: string;
  icon: string;
  color: string;
  onPress: () => void;
  colors: typeof Colors.light;
}) {
  return (
    <TouchableOpacity
      style={[styles.navCard, { backgroundColor: colors.card, borderColor: colors.border }]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      <View style={[styles.navIcon, { backgroundColor: color + '18' }]}>
        <IconSymbol name={icon as any} size={26} color={color} />
      </View>
      <View style={styles.navText}>
        <ThemedText type="defaultSemiBold" style={styles.navLabel}>{label}</ThemedText>
        <ThemedText style={[styles.navDescription, { color: colors.muted }]}>{description}</ThemedText>
      </View>
      <IconSymbol name="chevron.right" size={16} color={colors.muted} />
    </TouchableOpacity>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

function MainPage() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const { households, leaders, status } = useDirectory();

  const stats = useMemo(() => {
    const totalMembers = households.reduce((sum, h) => sum + h.members.length, 0);
    const groups = new Set(households.map((h) => h.group).filter(Boolean));
    return {
      households: households.length,
      members: totalMembers,
      groups: groups.size,
      leaders: leaders.length,
    };
  }, [households, leaders]);

  const cardBg = colorScheme === 'dark' ? colors.card : colors.surface;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { borderColor: colors.border }]}>
        <TouchableOpacity onPress={() => { adminSession.logout(); router.back(); }} style={styles.headerBtn}>
          <IconSymbol name="xmark" size={18} color={colors.muted} />
        </TouchableOpacity>
        <View style={styles.headerTitleRow}>
          <Image
            source={require('@/assets/images/catholic.png')}
            style={styles.headerLogo}
            resizeMode="contain"
          />
          <ThemedText type="defaultSemiBold" style={styles.headerTitle}>Admin Panel</ThemedText>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={[styles.directoryBtn, { backgroundColor: colors.accent + '15' }]}
          >
            <IconSymbol name="person.2.fill" size={14} color={colors.accent} />
            <ThemedText style={[styles.directoryBtnText, { color: colors.accent }]}>Directory</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push('/admin/change-pin')} style={styles.headerBtn}>
            <IconSymbol name="circle.grid.3x3.fill" size={18} color={colors.muted} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Welcome */}
        <View style={styles.welcome}>
          <View style={[styles.welcomeIcon, { backgroundColor: colors.accent + '18' }]}>
            <IconSymbol name="person.2.fill" size={28} color={colors.accent} />
          </View>
          <View>
            <ThemedText type="defaultSemiBold" style={styles.welcomeTitle}>
              Zomi Catholic Community
            </ThemedText>
            <ThemedText style={[styles.welcomeSub, { color: colors.muted }]}>
              {status === 'loading' ? 'Loading data…' : 'Directory Management'}
            </ThemedText>
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsGrid}>
          <StatCard label="Households" value={stats.households} icon="house.fill" color="#2563EB" bg={cardBg} />
          <StatCard label="Members" value={stats.members} icon="person.2.fill" color="#10B981" bg={cardBg} />
          <StatCard label="Groups" value={stats.groups} icon="person.2.fill" color="#F59E0B" bg={cardBg} />
          <StatCard label="Leaders" value={stats.leaders} icon="person.2.fill" color="#8B5CF6" bg={cardBg} />
        </View>

        {/* Navigation */}
        <ThemedText style={[styles.sectionLabel, { color: colors.muted }]}>Manage</ThemedText>

        <NavCard
          label="Households"
          description={`${stats.households} households · ${stats.members} members`}
          icon="house.fill"
          color="#2563EB"
          onPress={() => router.push('/admin/households')}
          colors={colors}
        />
        <NavCard
          label="Community Leaders"
          description={`${stats.leaders} leaders`}
          icon="person.2.fill"
          color="#8B5CF6"
          onPress={() => router.push('/admin/edit-leaders')}
          colors={colors}
        />

        <ThemedText style={[styles.sectionLabel, { color: colors.muted, marginTop: 8 }]}>Settings</ThemedText>

        <NavCard
          label="Change PIN"
          description="Update your admin access PIN"
          icon="person.2.fill"
          color="#F59E0B"
          onPress={() => router.push('/admin/change-pin')}
          colors={colors}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────

export default function AdminIndex() {
  const [authenticated, setAuthenticated] = useState(adminSession.isAuthenticated);

  if (!authenticated) {
    return <PinScreen onSuccess={() => setAuthenticated(true)} />;
  }

  return <MainPage />;
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  // PIN
  pinScreen: { flex: 1, alignItems: 'center', paddingTop: 60, gap: 48 },
  backBtn: { position: 'absolute', top: 56, right: 24, padding: 8 },
  pinHeader: { alignItems: 'center', gap: 10 },
  lockIcon: { width: 64, height: 64, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  pinLogo: { width: 80, height: 80, borderRadius: 20, marginBottom: 8 },
  pinTitle: { fontSize: 26 },
  pinSubtitle: { fontSize: 14 },
  pinError: { fontSize: 13, color: '#EF4444', marginTop: 4 },

  // Main page
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth },
  headerBtn: { padding: 8, width: 36, alignItems: 'center' },
  headerTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerLogo: { width: 28, height: 28, borderRadius: 6 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  directoryBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20 },
  directoryBtnText: { fontSize: 13, fontWeight: '600' },
  headerTitle: { fontSize: 17 },
  scrollContent: { padding: 20, paddingBottom: 48, gap: 12 },

  // Welcome
  welcome: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 8 },
  welcomeIcon: { width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  welcomeTitle: { fontSize: 16, marginBottom: 2 },
  welcomeSub: { fontSize: 13 },

  // Stats
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  statCard: { flex: 1, minWidth: '45%', borderRadius: 14, padding: 16, gap: 6 },
  statIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  statValue: { fontSize: 28, fontWeight: '700', lineHeight: 32 },
  statLabel: { fontSize: 12, opacity: 0.7 },

  // Section label
  sectionLabel: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8 },

  // Nav cards
  navCard: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 14, borderWidth: 1, gap: 14 },
  navIcon: { width: 50, height: 50, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  navText: { flex: 1 },
  navLabel: { fontSize: 16, marginBottom: 2 },
  navDescription: { fontSize: 13 },
});
