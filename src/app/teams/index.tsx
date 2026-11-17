import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../../context/AppContext';
import { useTheme } from '../../context/ThemeContext';
import { EmptyState } from '../../components/EmptyState';
import { PositionBadge } from '../../components/PositionBadge';
import { FONT_SIZE, NUMERIC_STYLE, RADIUS, SPACING } from '../../constants/theme';
import { MatchFormat, Team, User } from '../../types';
import { getInitials } from '../../utils/formatters';

export default function TeamsScreen() {
  const {
    teams,
    currentUser,
    createTeam,
    addTeamMember,
    removeTeamMember,
    transferTeamCaptain,
    searchPlayers,
  } = useApp();
  const { colors } = useTheme();

  const [createVisible, setCreateVisible] = useState(false);
  const [teamName, setTeamName] = useState('');
  const [city, setCity] = useState(currentUser.city || 'İstanbul');
  const [district, setDistrict] = useState(currentUser.district || 'Kadıköy');
  const [format, setFormat] = useState<MatchFormat>('7v7');
  const [bio, setBio] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [memberModalTeam, setMemberModalTeam] = useState<Team | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [searching, setSearching] = useState(false);

  const handleCreateTeam = async () => {
    try {
      setSubmitting(true);
      await createTeam({
        name: teamName,
        city,
        district,
        format,
        bio,
      });
      setTeamName('');
      setBio('');
      setCreateVisible(false);
    } catch (err) {
      Alert.alert(
        'Oluşturulamadı',
        err instanceof Error ? err.message : 'Takım oluşturulurken hata oluştu.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleSearchPlayers = async (query: string) => {
    setSearchQuery(query);
    setSearching(true);
    try {
      const found = await searchPlayers(query);
      setSearchResults(found);
    } catch {
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  const handleAddMember = async (team: Team, player: User) => {
    try {
      await addTeamMember(team.id, player.id);
      setMemberModalTeam(null);
      Alert.alert('Eklendi', `${player.name} takıma dahil edildi.`);
    } catch (err) {
      Alert.alert(
        'Eklenemedi',
        err instanceof Error ? err.message : 'Oyuncu eklenirken hata oluştu.'
      );
    }
  };

  const handleRemoveMember = async (team: Team, playerId: string, playerName: string) => {
    try {
      await removeTeamMember(team.id, playerId);
      Alert.alert('Güncellendi', `${playerName} takımdan ayrıldı.`);
    } catch (err) {
      Alert.alert(
        'İşlem Başarısız',
        err instanceof Error ? err.message : 'Oyuncu çıkarılamadı.'
      );
    }
  };

  const handleTransferCaptain = async (team: Team, newCaptainId: string, name: string) => {
    try {
      await transferTeamCaptain(team.id, newCaptainId);
      Alert.alert('Kaptan Değişti', `${name} yeni takım kaptanı olarak atandı.`);
    } catch (err) {
      Alert.alert(
        'Atama Başarısız',
        err instanceof Error ? err.message : 'Kaptan ataması yapılamadı.'
      );
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.topRow}>
          <Text style={[styles.subText, { color: colors.textSecondary }]}>
            {teams.length} kayıtlı takım
          </Text>
          <TouchableOpacity
            style={[styles.createBtn, { backgroundColor: colors.primary }]}
            onPress={() => setCreateVisible(true)}
          >
            <Ionicons name="add" size={16} color="#FFFFFF" />
            <Text style={styles.createBtnText}>Takım Kur</Text>
          </TouchableOpacity>
        </View>

        {teams.length === 0 ? (
          <EmptyState
            icon="shield-outline"
            title="Henüz takım yok"
            description="Bölgesel liglere katılmak ve arkadaşlarınla kadro kurmak için bir takım oluştur."
            buttonText="İlk Takımı Kur"
            onPress={() => setCreateVisible(true)}
          />
        ) : (
          teams.map((team) => {
            const isCaptain = team.captainId === currentUser.id;
            const existingIds = new Set(team.members.map((m) => m.playerId));
            return (
              <View
                key={team.id}
                style={[
                  styles.teamCard,
                  { backgroundColor: colors.surface, borderColor: colors.surfaceBorder },
                ]}
              >
                <View style={styles.teamHeader}>
                  <View style={[styles.teamBadge, { backgroundColor: colors.surfaceLight }]}>
                    <Text style={[styles.teamInitials, { color: colors.text }]}>
                      {getInitials(team.name)}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.teamTitle, { color: colors.text }]}>{team.name}</Text>
                    <Text style={[styles.teamMeta, { color: colors.textSecondary }]}>
                      {team.district}, {team.city} · {team.format} · {team.members.length} oyuncu
                    </Text>
                  </View>
                  {isCaptain && (
                    <TouchableOpacity
                      style={[
                        styles.addMemberBtn,
                        { backgroundColor: `${colors.primary}18` },
                      ]}
                      onPress={() => {
                        setMemberModalTeam(team);
                        void handleSearchPlayers('');
                      }}
                    >
                      <Ionicons name="person-add-outline" size={15} color={colors.primary} />
                      <Text style={[styles.addMemberText, { color: colors.primary }]}>
                        Oyuncu Ekle
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>

                {team.bio ? (
                  <Text style={[styles.teamBio, { color: colors.textSecondary }]}>{team.bio}</Text>
                ) : null}

                <View style={[styles.membersList, { borderTopColor: colors.surfaceBorder }]}>
                  {team.members.map((member) => {
                    const isSelf = member.playerId === currentUser.id;
                    const memberIsCaptain = member.playerId === team.captainId;
                    return (
                      <View
                        key={member.id}
                        style={[
                          styles.memberRow,
                          { borderBottomColor: colors.surfaceBorder },
                        ]}
                      >
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.memberName, { color: colors.text }]}>
                            {member.playerName}
                            {memberIsCaptain ? ' (Kaptan)' : ''}
                          </Text>
                        </View>
                        {member.playerPosition && (
                          <PositionBadge position={member.playerPosition} size="sm" />
                        )}
                        {isCaptain && !memberIsCaptain && (
                          <TouchableOpacity
                            style={styles.memberActionBtn}
                            onPress={() =>
                              handleTransferCaptain(team, member.playerId, member.playerName)
                            }
                            hitSlop={14}
                          >
                            <Text style={[styles.captainLink, { color: colors.primary }]}>
                              Kaptan Yap
                            </Text>
                          </TouchableOpacity>
                        )}
                        {(isCaptain || isSelf) && !memberIsCaptain && (
                          <TouchableOpacity
                            onPress={() =>
                              handleRemoveMember(team, member.playerId, member.playerName)
                            }
                            hitSlop={14}
                          >
                            <Ionicons name="close-circle-outline" size={18} color={colors.danger} />
                          </TouchableOpacity>
                        )}
                      </View>
                    );
                  })}
                </View>

                {memberModalTeam?.id === team.id && existingIds.size > 0 && null}
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Create Team Modal */}
      <Modal
        visible={createVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setCreateVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Yeni Takım Kur</Text>
              <TouchableOpacity onPress={() => setCreateVisible(false)} hitSlop={14}>
                <Ionicons name="close" size={22} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.label, { color: colors.textSecondary }]}>Takım Adı *</Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.surfaceLight,
                  borderColor: colors.surfaceBorder,
                  color: colors.text,
                },
              ]}
              placeholder="Örn: Kadıköy Yıldızları"
              placeholderTextColor={colors.textTertiary}
              value={teamName}
              onChangeText={setTeamName}
            />

            <View style={styles.row}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>Şehir</Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: colors.surfaceLight,
                      borderColor: colors.surfaceBorder,
                      color: colors.text,
                    },
                  ]}
                  value={city}
                  onChangeText={setCity}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>İlçe</Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: colors.surfaceLight,
                      borderColor: colors.surfaceBorder,
                      color: colors.text,
                    },
                  ]}
                  value={district}
                  onChangeText={setDistrict}
                />
              </View>
            </View>

            <Text style={[styles.label, { color: colors.textSecondary }]}>Format</Text>
            <View style={styles.chipRow}>
              {(['5v5', '6v6', '7v7', '8v8'] as MatchFormat[]).map((f) => (
                <TouchableOpacity
                  key={f}
                  style={[
                    styles.chip,
                    {
                      backgroundColor: format === f ? colors.primary : colors.surfaceLight,
                      borderColor: format === f ? colors.primary : colors.surfaceBorder,
                    },
                  ]}
                  onPress={() => setFormat(f)}
                >
                  <Text
                    style={{
                      fontSize: FONT_SIZE.xs,
                      fontWeight: '700',
                      color: format === f ? '#FFFFFF' : colors.textSecondary,
                    }}
                  >
                    {f}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.label, { color: colors.textSecondary }]}>Açıklama</Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.surfaceLight,
                  borderColor: colors.surfaceBorder,
                  color: colors.text,
                },
              ]}
              placeholder="Oyun tarzı ve hedefler"
              placeholderTextColor={colors.textTertiary}
              value={bio}
              onChangeText={setBio}
            />

            <TouchableOpacity
              style={[styles.submitBtn, { backgroundColor: colors.primary }]}
              onPress={handleCreateTeam}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.submitBtnText}>Takımı Oluştur</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Add Player to Team Modal */}
      <Modal
        visible={Boolean(memberModalTeam)}
        transparent
        animationType="slide"
        onRequestClose={() => setMemberModalTeam(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { backgroundColor: colors.surface, maxHeight: '80%' }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                {memberModalTeam?.name} · Oyuncu Ekle
              </Text>
              <TouchableOpacity onPress={() => setMemberModalTeam(null)} hitSlop={14}>
                <Ionicons name="close" size={22} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.surfaceLight,
                  borderColor: colors.surfaceBorder,
                  color: colors.text,
                  marginBottom: 10,
                },
              ]}
              placeholder="Oyuncu adı ile ara..."
              placeholderTextColor={colors.textTertiary}
              value={searchQuery}
              onChangeText={handleSearchPlayers}
            />

            {searching ? (
              <ActivityIndicator style={{ marginVertical: 20 }} color={colors.primary} />
            ) : (
              <ScrollView>
                {searchResults
                  .filter(
                    (p) =>
                      memberModalTeam &&
                      !memberModalTeam.members.some((m) => m.playerId === p.id)
                  )
                  .map((player) => (
                    <TouchableOpacity
                      key={player.id}
                      style={[
                        styles.searchPlayerRow,
                        { borderBottomColor: colors.surfaceBorder },
                      ]}
                      onPress={() => memberModalTeam && handleAddMember(memberModalTeam, player)}
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.memberName, { color: colors.text }]}>
                          {player.name}
                        </Text>
                        <Text style={{ fontSize: 11, color: colors.textSecondary }}>
                          {player.district} · Yetenek {player.rating.toFixed(1)}
                        </Text>
                      </View>
                      <PositionBadge position={player.position} size="sm" />
                      <Ionicons name="add-circle" size={22} color={colors.primary} />
                    </TouchableOpacity>
                  ))}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xxxl,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  subText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '600',
    ...NUMERIC_STYLE,
  },
  createBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderRadius: RADIUS.sm,
    gap: 4,
  },
  createBtnText: {
    color: '#FFFFFF',
    fontSize: FONT_SIZE.xs,
    fontWeight: '700',
  },
  teamCard: {
    borderRadius: RADIUS.md,
    borderWidth: 1,
    padding: SPACING.md + 2,
    marginBottom: SPACING.md,
  },
  teamHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  teamBadge: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  teamInitials: {
    fontSize: 14,
    fontWeight: '800',
  },
  teamTitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
  },
  teamMeta: {
    fontSize: 11,
    marginTop: 2,
    ...NUMERIC_STYLE,
  },
  addMemberBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: RADIUS.sm,
  },
  addMemberText: {
    fontSize: 11,
    fontWeight: '700',
  },
  teamBio: {
    fontSize: FONT_SIZE.xs,
    lineHeight: 18,
    marginTop: 10,
  },
  membersList: {
    marginTop: 12,
    paddingTop: 8,
    borderTopWidth: 1,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  memberName: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '700',
  },
  memberActionBtn: {
    paddingHorizontal: 6,
  },
  captainLink: {
    fontSize: 11,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    padding: SPACING.lg,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  modalTitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 5,
    marginTop: 10,
  },
  input: {
    borderWidth: 1,
    borderRadius: RADIUS.sm,
    paddingHorizontal: 12,
    paddingVertical: 11,
    fontSize: FONT_SIZE.sm,
  },
  row: {
    flexDirection: 'row',
  },
  chipRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 2,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
  },
  submitBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: RADIUS.md,
    paddingVertical: 14,
    marginTop: 18,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: FONT_SIZE.sm,
    fontWeight: '700',
  },
  searchPlayerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
});
