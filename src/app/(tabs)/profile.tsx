import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../../context/AppContext';
import { MatchCard } from '../../components/MatchCard';
import { GearCard } from '../../components/GearCard';
import { PositionBadge } from '../../components/PositionBadge';
import { EmptyState } from '../../components/EmptyState';
import { COLORS, FONT_SIZE, SPACING } from '../../constants/theme';
import { PlayerPosition } from '../../types';

export default function ProfileScreen() {
  const { currentUser, matches, gearItems, updateUser, resetDemoData, markGearSold } = useApp();
  const [profileTab, setProfileTab] = useState<'MATCHES' | 'LISTINGS' | 'SETTINGS'>('MATCHES');
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(currentUser.name || '');
  const [phone, setPhone] = useState(currentUser.phone || '');
  const [bio, setBio] = useState(currentUser.bio || '');
  const [position, setPosition] = useState<PlayerPosition>(currentUser.position || 'MID');

  // Filter matches user has joined or created
  const myMatches = matches.filter(
    (m) =>
      m.organizerId === currentUser.id ||
      m.roster.some((s) => s.assignedPlayer?.id === currentUser.id)
  );

  // Filter gear items listed by user
  const myListings = gearItems.filter((g) => g.sellerId === currentUser.id);

  const handleSaveProfile = async () => {
    await updateUser({
      name: name.trim(),
      phone: phone.trim(),
      bio: bio.trim(),
      position,
    });
    setIsEditing(false);
    Alert.alert('✅ Güncellendi', 'Profil bilgileriniz başarıyla kaydedildi.');
  };

  const handleResetData = () => {
    Alert.alert(
      'Demo Verilerini Sıfırla',
      'Tüm maç ve pazar verileri orijinal başlangıç durumuna döndürülecek. Devam edilsin mi?',
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Sıfırla',
          style: 'destructive',
          onPress: async () => {
            await resetDemoData();
            Alert.alert('Başarılı', 'Demo verileri sıfırlandı.');
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Profile Identity Card */}
        <View style={styles.card}>
          <View style={styles.avatarRow}>
            <View style={styles.avatarCircle}>
              <Ionicons name="person" size={40} color={COLORS.white} />
            </View>
            <View style={{ flex: 1, marginLeft: SPACING.md }}>
              <View style={styles.nameRow}>
                <Text style={styles.userName}>{currentUser.name}</Text>
                <TouchableOpacity onPress={() => setIsEditing(!isEditing)}>
                  <Ionicons
                    name={isEditing ? 'close' : 'create-outline'}
                    size={20}
                    color={COLORS.primaryLight}
                  />
                </TouchableOpacity>
              </View>
              <View style={{ marginTop: 4 }}>
                <PositionBadge position={currentUser.position || 'MID'} size="sm" />
              </View>
            </View>
          </View>

          {/* Stats Bar */}
          <View style={styles.statsBar}>
            <View style={styles.statCol}>
              <Text style={styles.statVal}>⭐ {currentUser.rating}</Text>
              <Text style={styles.statLbl}>Fair-Play</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statCol}>
              <Text style={styles.statVal}>{currentUser.matchesPlayed}</Text>
              <Text style={styles.statLbl}>Maç Sayısı</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statCol}>
              <Text style={styles.statVal}>%98</Text>
              <Text style={styles.statLbl}>Devamlılık</Text>
            </View>
          </View>

          {/* Bio */}
          {currentUser.bio && !isEditing && (
            <Text style={styles.bioText}>{currentUser.bio}</Text>
          )}

          {/* Edit Form */}
          {isEditing && (
            <View style={styles.editForm}>
              <Text style={styles.inputLabel}>İsim Soyisim</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholderTextColor={COLORS.textTertiary}
              />

              <Text style={styles.inputLabel}>Telefon</Text>
              <TextInput
                style={styles.input}
                value={phone}
                onChangeText={setPhone}
                placeholderTextColor={COLORS.textTertiary}
              />

              <Text style={styles.inputLabel}>Ana Mevki</Text>
              <View style={styles.posRow}>
                {(['GK', 'DEF', 'MID', 'FWD'] as PlayerPosition[]).map((p) => (
                  <TouchableOpacity
                    key={p}
                    style={[styles.posButton, position === p && styles.posButtonActive]}
                    onPress={() => setPosition(p)}
                  >
                    <Text
                      style={[styles.posButtonText, position === p && styles.posButtonTextActive]}
                    >
                      {p}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.inputLabel}>Hakkımda / Oyun Tarzı</Text>
              <TextInput
                style={[styles.input, { height: 60 }]}
                value={bio}
                onChangeText={setBio}
                multiline
                placeholderTextColor={COLORS.textTertiary}
              />

              <TouchableOpacity style={styles.saveBtn} onPress={handleSaveProfile}>
                <Text style={styles.saveBtnText}>Değişiklikleri Kaydet</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Tab Selection */}
        <View style={styles.segmentContainer}>
          <TouchableOpacity
            style={[styles.segmentBtn, profileTab === 'MATCHES' && styles.segmentBtnActive]}
            onPress={() => setProfileTab('MATCHES')}
          >
            <Text
              style={[
                styles.segmentText,
                profileTab === 'MATCHES' && styles.segmentTextActive,
              ]}
            >
              ⚽ Maçlarım ({myMatches.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.segmentBtn, profileTab === 'LISTINGS' && styles.segmentBtnActive]}
            onPress={() => setProfileTab('LISTINGS')}
          >
            <Text
              style={[
                styles.segmentText,
                profileTab === 'LISTINGS' && styles.segmentTextActive,
              ]}
            >
              🛍️ İlanlarım ({myListings.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.segmentBtn, profileTab === 'SETTINGS' && styles.segmentBtnActive]}
            onPress={() => setProfileTab('SETTINGS')}
          >
            <Text
              style={[
                styles.segmentText,
                profileTab === 'SETTINGS' && styles.segmentTextActive,
              ]}
            >
              ⚙️ Ayarlar
            </Text>
          </TouchableOpacity>
        </View>

        {/* Tab Content */}
        {profileTab === 'MATCHES' && (
          <View>
            {myMatches.length > 0 ? (
              myMatches.map((m) => (
                <MatchCard key={m.id} match={m} currentUserId={currentUser.id} />
              ))
            ) : (
              <EmptyState
                icon="calendar-outline"
                title="Henüz Bir Maça Katılmadın"
                description="Maçlar sekmesinden sana uygun semtteki bir kadroya başvurabilirsin."
              />
            )}
          </View>
        )}

        {profileTab === 'LISTINGS' && (
          <View>
            {myListings.length > 0 ? (
              myListings.map((g) => (
                <View key={g.id} style={{ marginBottom: 8 }}>
                  <GearCard item={g} />
                  {g.status === 'Available' && (
                    <TouchableOpacity
                      style={styles.markSoldBtn}
                      onPress={() => markGearSold(g.id)}
                    >
                      <Ionicons name="checkmark-done" size={16} color={COLORS.warning} />
                      <Text style={styles.markSoldText}>Satıldı Olarak İşaretle</Text>
                    </TouchableOpacity>
                  )}
                </View>
              ))
            ) : (
              <EmptyState
                icon="pricetag-outline"
                title="Henüz Bir İlan Vermedin"
                description="İkinci el krampon, forma veya kaleci ekipmanlarını pazarda satmak için 'İlan / Maç' sekmesini kullanabilirsin."
              />
            )}
          </View>
        )}

        {profileTab === 'SETTINGS' && (
          <View style={styles.settingsCard}>
            <Text style={styles.settingsHeader}>Uygulama & Demo Yönetimi</Text>
            <Text style={styles.settingsDesc}>
              Öğretim görevlisi veya sınıf sunumu sırasında başlangıç verilerine dönmek için demo verilerini tek tıkla sıfırlayabilirsiniz.
            </Text>

            <TouchableOpacity style={styles.resetBtn} onPress={handleResetData}>
              <Ionicons name="refresh" size={18} color={COLORS.danger} />
              <Text style={styles.resetBtnText}>Demo Verilerini Sıfırla (Reset)</Text>
            </TouchableOpacity>

            <View style={styles.infoRow}>
              <Text style={styles.infoKey}>Uygulama Adı</Text>
              <Text style={styles.infoVal}>Kadro Mobile v1.0.0</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoKey}>Geliştirici</Text>
              <Text style={styles.infoVal}>Eren Kılıç</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoKey}>Mimari</Text>
              <Text style={styles.infoVal}>Expo Router + MVVM Clean Arch</Text>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xxxl,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    marginBottom: SPACING.lg,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.primaryDark,
    justifyContent: 'center',
    alignItems: 'center',
  },
  nameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  userName: {
    color: COLORS.text,
    fontSize: FONT_SIZE.xl,
    fontWeight: '800',
  },
  statsBar: {
    flexDirection: 'row',
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 12,
    marginTop: SPACING.md,
    paddingVertical: 10,
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  statCol: {
    alignItems: 'center',
  },
  statVal: {
    color: COLORS.text,
    fontSize: FONT_SIZE.md,
    fontWeight: '800',
  },
  statLbl: {
    color: COLORS.textTertiary,
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: COLORS.surfaceBorder,
  },
  bioText: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZE.xs,
    marginTop: SPACING.md,
    lineHeight: 18,
    fontStyle: 'italic',
  },
  editForm: {
    marginTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
    paddingTop: SPACING.md,
  },
  inputLabel: {
    color: COLORS.textSecondary,
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 4,
    marginTop: 8,
  },
  input: {
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 8,
    color: COLORS.text,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: FONT_SIZE.sm,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
  },
  posRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  posButton: {
    flex: 1,
    backgroundColor: COLORS.surfaceLight,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
  },
  posButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  posButtonText: {
    color: COLORS.textSecondary,
    fontWeight: '700',
    fontSize: FONT_SIZE.xs,
  },
  posButtonTextActive: {
    color: COLORS.black,
  },
  saveBtn: {
    backgroundColor: COLORS.primaryLight,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    marginTop: 14,
  },
  saveBtnText: {
    color: COLORS.black,
    fontWeight: '800',
    fontSize: FONT_SIZE.sm,
  },
  segmentContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 4,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    marginBottom: SPACING.md,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 9,
    alignItems: 'center',
    borderRadius: 8,
  },
  segmentBtnActive: {
    backgroundColor: COLORS.surfaceLight,
  },
  segmentText: {
    color: COLORS.textTertiary,
    fontSize: FONT_SIZE.xs,
    fontWeight: '700',
  },
  segmentTextActive: {
    color: COLORS.accent,
  },
  markSoldBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    paddingVertical: 6,
    borderRadius: 8,
    marginTop: -8,
    marginBottom: 8,
    gap: 4,
  },
  markSoldText: {
    color: COLORS.warning,
    fontSize: FONT_SIZE.xs,
    fontWeight: '700',
  },
  settingsCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
  },
  settingsHeader: {
    color: COLORS.text,
    fontSize: FONT_SIZE.md,
    fontWeight: '800',
    marginBottom: 4,
  },
  settingsDesc: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZE.xs,
    lineHeight: 18,
    marginBottom: SPACING.md,
  },
  resetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: COLORS.danger,
    borderRadius: 10,
    paddingVertical: 12,
    gap: 6,
    marginBottom: SPACING.lg,
  },
  resetBtnText: {
    color: COLORS.danger,
    fontWeight: '700',
    fontSize: FONT_SIZE.sm,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
  },
  infoKey: {
    color: COLORS.textTertiary,
    fontSize: FONT_SIZE.xs,
  },
  infoVal: {
    color: COLORS.text,
    fontSize: FONT_SIZE.xs,
    fontWeight: '600',
  },
});
