import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../../context/AppContext';
import { useTheme } from '../../context/ThemeContext';
import { PitchLineup } from '../../components/PitchLineup';
import { PositionBadge } from '../../components/PositionBadge';
import { MatchPredictionCard } from '../../components/MatchPredictionCard';
import { PreMatchStatsCard } from '../../components/PreMatchStatsCard';
import { AiPredictionBotCard } from '../../components/AiPredictionBotCard';
import { PostMatchEvaluationSection } from '../../components/PostMatchEvaluationSection';
import { VenueEvaluationSection } from '../../components/VenueEvaluationSection';
import { JoinRequestModal } from '../../components/JoinRequestModal';
import { CaptainRequestsSection } from '../../components/CaptainRequestsSection';
import { ReportModal } from '../../components/ReportModal';
import { EmptyState } from '../../components/EmptyState';
import { FONT_SIZE, NUMERIC_STYLE, RADIUS, SPACING } from '../../constants/theme';
import { RosterSlot } from '../../types';
import { resolveMatchupStats } from '../../utils/matchupStats';
import { generateAiMatchPrediction } from '../../utils/aiPredictor';
import { getInitials } from '../../utils/formatters';
import { validateMatchInput, validateMatchScores } from '../../utils/validators';

export default function MatchDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const {
    matches,
    leagues,
    currentUser,
    joinMatchSlot,
    leaveMatch,
    sendJoinRequest,
    cancelJoinRequest,
    approveJoinRequest,
    rejectJoinRequest,
    getMatchJoinRequests,
    getUserMatchJoinRequest,
    getVenueByMatch,
    votePrediction,
    updateMatch,
    completeMatch,
    deleteMatch,
  } = useApp();
  const { colors } = useTheme();

  const [requestTargetSlot, setRequestTargetSlot] = useState<RosterSlot | null>(null);
  const [reportVisible, setReportVisible] = useState(false);

  // Organizer Edit & Complete Modals
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [completeModalVisible, setCompleteModalVisible] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editVenueName, setEditVenueName] = useState('');
  const [editCity, setEditCity] = useState('');
  const [editDistrict, setEditDistrict] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editTime, setEditTime] = useState('');
  const [editPitchType, setEditPitchType] = useState<'Açık Saha' | 'Kapalı Saha'>('Açık Saha');
  const [editFee, setEditFee] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [score1Text, setScore1Text] = useState('2');
  const [score2Text, setScore2Text] = useState('2');

  const match = matches.find((m) => m.id === id);

  if (!match) {
    return (
      <View style={[styles.notFoundContainer, { backgroundColor: colors.background }]}>
        <EmptyState
          icon="alert-circle-outline"
          title="Maç bulunamadı"
          description="Aradığınız maç ilanı kaldırılmış veya süresi dolmuş olabilir."
          buttonText="Geri Dön"
          onPress={() => router.back()}
        />
      </View>
    );
  }

  const isCaptain = match.organizerId === currentUser.id;
  const isCompleted = Boolean(match.isCompleted);
  const resolvedVenue = getVenueByMatch(match);
  const isUserJoined = match.roster.some((s) => s.assignedPlayer?.id === currentUser.id);
  const vacantSlots = match.roster
    .slice(0, Math.ceil(match.totalSlots / 2))
    .filter((s) => !s.isFilled);
  const filledCount = match.roster.filter((s) => s.isFilled).length;

  const matchJoinRequests = getMatchJoinRequests(match.id);
  const userRequest = getUserMatchJoinRequest(match.id);
  const pendingSlotIds =
    userRequest?.status === 'PENDING' ? [userRequest.slotId] : [];

  const matchupStats = resolveMatchupStats(match, leagues);
  const aiPrediction = generateAiMatchPrediction(matchupStats, {
    format: match.format,
    roster: match.roster,
  });

  const openEditModal = () => {
    setEditTitle(match.title);
    setEditVenueName(match.venueName);
    setEditCity(match.city || 'İstanbul');
    setEditDistrict(match.district);
    setEditAddress(match.address);
    setEditDate(match.date);
    setEditTime(match.time);
    setEditPitchType(match.pitchType);
    setEditFee(String(match.feePerPlayer));
    setEditNotes(match.notes || '');
    setEditModalVisible(true);
  };

  const handleSaveEdit = async () => {
    const parsedFee = Number(editFee);
    const validation = validateMatchInput({
      title: editTitle,
      venueName: editVenueName,
      district: editDistrict,
      city: editCity,
      date: editDate,
      time: editTime,
      format: match.format,
      feePerPlayer: parsedFee,
      missingPositions: match.missingPositions.length > 0 ? match.missingPositions : ['MID'],
    });
    if (!validation.valid) {
      Alert.alert('Geçersiz Bilgi', validation.error || 'Lütfen alanları kontrol edin.');
      return;
    }

    try {
      setIsSaving(true);
      await updateMatch(match.id, {
        title: editTitle.trim(),
        venueName: editVenueName.trim(),
        city: editCity.trim() || 'İstanbul',
        district: editDistrict.trim(),
        address: editAddress.trim() || `${editDistrict.trim()}, ${editCity.trim() || 'İstanbul'}`,
        date: editDate.trim(),
        time: editTime.trim(),
        pitchType: editPitchType,
        feePerPlayer: parsedFee,
        notes: editNotes.trim(),
      });
      setEditModalVisible(false);
      Alert.alert('Güncellendi', 'Maç bilgileri güncellendi.');
    } catch (err) {
      Alert.alert('Hata', err instanceof Error ? err.message : 'Maç güncellenemedi.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCompleteMatch = async () => {
    const s1 = Number(score1Text);
    const s2 = Number(score2Text);
    const validation = validateMatchScores(s1, s2);
    if (!validation.valid) {
      Alert.alert('Geçersiz Skor', validation.error || 'Skorlar tam sayı olmalıdır.');
      return;
    }

    try {
      setIsSaving(true);
      await completeMatch(match.id, s1, s2);
      setCompleteModalVisible(false);
      Alert.alert('Maç Tamamlandı', 'Skor kaydedildi ve oyuncu değerlendirmeleri açıldı.');
    } catch (err) {
      Alert.alert('Hata', err instanceof Error ? err.message : 'Maç tamamlanamadı.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteMatch = () => {
    const runDelete = async () => {
      try {
        await deleteMatch(match.id);
        router.back();
      } catch (err) {
        Alert.alert('Hata', err instanceof Error ? err.message : 'Maç silinemedi.');
      }
    };

    if (Platform.OS === 'web') {
      void runDelete();
      return;
    }
    Alert.alert('Maçı Sil', 'Bu maç ilanını kalıcı olarak silmek istiyor musunuz?', [
      { text: 'Vazgeç', style: 'cancel' },
      { text: 'Sil', style: 'destructive', onPress: () => void runDelete() },
    ]);
  };

  const handleSlotSelect = (slot: RosterSlot) => {
    if (isCompleted) {
      Alert.alert('Maç Tamamlandı', 'Tamamlanan maçların kadrosu değiştirilemez.');
      return;
    }
    if (slot.isFilled) {
      if (slot.assignedPlayer?.id === currentUser.id) {
        handleLeave();
      } else {
        Alert.alert('Dolu Mevki', `Bu mevkide ${slot.assignedPlayer?.name} yer alıyor.`);
      }
      return;
    }

    if (isCaptain) {
      Alert.alert(
        'Kadroya Ekle',
        `Kaptan olarak ${slot.position} mevkisine kendinizi eklemek istiyor musunuz?`,
        [
          { text: 'Vazgeç', style: 'cancel' },
          {
            text: 'Kadroya Al',
            onPress: async () => {
              const ok = await joinMatchSlot(match.id, slot.id);
              if (ok) {
                Alert.alert('Eklendiniz', `${slot.position} mevkisine dahil oldunuz.`);
              }
            },
          },
        ]
      );
      return;
    }

    if (isUserJoined) {
      Alert.alert('Bilgi', 'Bu maçın kadrosunda zaten yer alıyorsunuz.');
      return;
    }

    if (userRequest?.status === 'PENDING') {
      Alert.alert(
        'Bekleyen İstek',
        `${userRequest.position} mevkisi için kaptan onayı bekleyen bir isteğiniz zaten var.`,
        [
          { text: 'Tamam', style: 'cancel' },
          {
            text: 'İsteği İptal Et',
            style: 'destructive',
            onPress: async () => {
              await cancelJoinRequest(userRequest.id);
            },
          },
        ]
      );
      return;
    }

    setRequestTargetSlot(slot);
  };

  const handleQuickRequest = () => {
    if (vacantSlots.length === 0) {
      Alert.alert('Kadro Dolu', 'Bu maçta boş mevki kalmamıştır.');
      return;
    }

    if (userRequest?.status === 'PENDING') {
      Alert.alert(
        'Onay Bekleniyor',
        `${userRequest.position} mevkisi için isteğiniz takım kaptanına iletildi. İptal etmek ister misiniz?`,
        [
          { text: 'Bekle', style: 'cancel' },
          {
            text: 'İsteği İptal Et',
            style: 'destructive',
            onPress: async () => {
              await cancelJoinRequest(userRequest.id);
            },
          },
        ]
      );
      return;
    }

    const preferredSlot =
      vacantSlots.find((s) => s.position === currentUser.position) || vacantSlots[0];
    setRequestTargetSlot(preferredSlot);
  };

  const handleSubmitJoinRequest = async (message?: string) => {
    if (!requestTargetSlot) return;
    const ok = await sendJoinRequest(match.id, requestTargetSlot.id, message);
    setRequestTargetSlot(null);

    if (ok) {
      Alert.alert(
        'İstek Gönderildi',
        `${requestTargetSlot.position} mevkisi için başvurunuz kaptan ${match.organizerName} onayına gönderildi.`
      );
    } else {
      Alert.alert('Gönderilemedi', 'Bu mevki dolmuş veya aktif bir isteğiniz bulunuyor.');
    }
  };

  const handleLeave = () => {
    Alert.alert('Kadrodan Ayrıl', 'Bu maçtaki yerinizi boşaltmak istediğinize emin misiniz?', [
      { text: 'Vazgeç', style: 'cancel' },
      {
        text: 'Ayrıl',
        style: 'destructive',
        onPress: async () => {
          await leaveMatch(match.id);
          Alert.alert('Ayrıldınız', 'Mevkiniz boş bırakıldı.');
        },
      },
    ]);
  };

  const handleCancelPending = () => {
    if (!userRequest) return;
    Alert.alert(
      'İsteği İptal Et',
      'Takıma katılma isteğinizi geri çekmek istiyor musunuz?',
      [
        { text: 'Vazgeç', style: 'cancel' },
        {
          text: 'İptal Et',
          style: 'destructive',
          onPress: async () => {
            await cancelJoinRequest(userRequest.id);
          },
        },
      ]
    );
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
    >
      {/* Hero Card */}
      <View
        style={[
          styles.heroCard,
          { backgroundColor: colors.surface, borderColor: colors.surfaceBorder },
        ]}
      >
        <View style={styles.badgeRow}>
          <View style={[styles.formatPill, { backgroundColor: colors.surfaceLight }]}>
            <Text style={[styles.formatText, { color: colors.primary }]}>{match.format}</Text>
          </View>
          <View style={[styles.formatPill, { backgroundColor: colors.surfaceLight }]}>
            <Text style={[styles.pitchText, { color: colors.textSecondary }]}>
              {match.pitchType}
            </Text>
          </View>
          {isCaptain && (
            <View style={[styles.formatPill, { backgroundColor: `${colors.primary}18` }]}>
              <Text style={[styles.formatText, { color: colors.primary }]}>Kaptansın</Text>
            </View>
          )}
          <View style={{ flex: 1 }} />
          <Text style={[styles.feeNumber, { color: colors.text }]}>
            ₺{match.feePerPlayer}
            <Text style={[styles.feePer, { color: colors.textTertiary }]}> /kişi</Text>
          </Text>
        </View>

        <Text style={[styles.title, { color: colors.text }]}>{match.title}</Text>

        <View style={styles.metaRow}>
          <Ionicons name="calendar-outline" size={15} color={colors.textTertiary} />
          <Text style={[styles.metaText, { color: colors.textSecondary }]}>
            {match.date} · {match.time}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.metaRow}
          disabled={!resolvedVenue}
          onPress={() => resolvedVenue && router.push(`/venue/${resolvedVenue.id}` as any)}
          activeOpacity={0.75}
        >
          <Ionicons name="location-outline" size={15} color={colors.textTertiary} />
          <Text
            style={[
              styles.metaText,
              {
                color: resolvedVenue ? colors.primary : colors.textSecondary,
                flex: 1,
                fontWeight: resolvedVenue ? '600' : '400',
              },
            ]}
          >
            {match.venueName} ({match.address})
          </Text>
          {resolvedVenue && resolvedVenue.evaluationsCount > 0 && (
            <View style={[styles.venueScoreChip, { backgroundColor: `${colors.warning}1A` }]}>
              <Ionicons name="star" size={12} color={colors.warning} />
              <Text style={[styles.venueScoreChipText, { color: colors.text }]}>
                {resolvedVenue.overallRating.toFixed(1)}
              </Text>
            </View>
          )}
        </TouchableOpacity>

        {isCompleted && match.finalScore && (
          <View style={[styles.scoreBanner, { backgroundColor: colors.surfaceLight }]}>
            <Text style={[styles.scoreBannerLabel, { color: colors.textTertiary }]}>
              MAÇ SONUCU
            </Text>
            <Text style={[styles.scoreBannerValue, { color: colors.text }]}>
              {match.finalScore.team1} - {match.finalScore.team2}
            </Text>
          </View>
        )}

        {isCaptain ? (
          <View style={[styles.organizerToolbar, { borderTopColor: colors.surfaceBorder }]}>
            {!isCompleted && (
              <>
                <TouchableOpacity
                  style={[styles.toolbarBtn, { backgroundColor: colors.surfaceLight }]}
                  onPress={openEditModal}
                >
                  <Ionicons name="create-outline" size={14} color={colors.text} />
                  <Text style={[styles.toolbarBtnText, { color: colors.text }]}>Düzenle</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.toolbarBtn, { backgroundColor: `${colors.primary}18` }]}
                  onPress={() => setCompleteModalVisible(true)}
                >
                  <Ionicons name="checkmark-done-outline" size={14} color={colors.primary} />
                  <Text style={[styles.toolbarBtnText, { color: colors.primary }]}>
                    Maçı Tamamla
                  </Text>
                </TouchableOpacity>
              </>
            )}
            <TouchableOpacity
              style={[styles.toolbarBtn, { backgroundColor: `${colors.danger}15` }]}
              onPress={handleDeleteMatch}
            >
              <Ionicons name="trash-outline" size={14} color={colors.danger} />
              <Text style={[styles.toolbarBtnText, { color: colors.danger }]}>Sil</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={[styles.organizerToolbar, { borderTopColor: colors.surfaceBorder }]}>
            <TouchableOpacity
              style={[styles.toolbarBtn, { backgroundColor: colors.surfaceLight }]}
              onPress={() => setReportVisible(true)}
            >
              <Ionicons name="flag-outline" size={14} color={colors.textSecondary} />
              <Text style={[styles.toolbarBtnText, { color: colors.textSecondary }]}>
                Maçı Bildir
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Captain Approval Management (Shown strictly to the match organizer) */}
      {isCaptain && (
        <CaptainRequestsSection
          requests={matchJoinRequests}
          onApprove={approveJoinRequest}
          onReject={rejectJoinRequest}
        />
      )}

      {/* Player Pending / Rejected Request Status Card */}
      {!isCaptain && !isCompleted && !isUserJoined && userRequest?.status === 'PENDING' && (
        <View
          style={[
            styles.requestStatusCard,
            { backgroundColor: colors.surface, borderColor: colors.surfaceBorder },
          ]}
        >
          <View style={styles.requestStatusHeader}>
            <View style={[styles.statusBadge, { backgroundColor: `${colors.warning}20` }]}>
              <Ionicons name="time-outline" size={14} color={colors.warning} />
              <Text style={[styles.statusBadgeText, { color: colors.warning }]}>
                Kaptan Onayı Bekleniyor
              </Text>
            </View>
            <PositionBadge position={userRequest.position} size="sm" />
          </View>

          <Text style={[styles.requestStatusDesc, { color: colors.textSecondary }]}>
            {match.organizerName} başvurunuzu onayladığında {userRequest.position} mevkisi ile
            takıma dahil olacaksınız.
          </Text>

          {userRequest.message ? (
            <Text style={[styles.requestNotePreview, { color: colors.textTertiary }]}>
              {`Notunuz: "${userRequest.message}"`}
            </Text>
          ) : null}

          <View style={styles.requestStatusActions}>
            <TouchableOpacity
              style={[styles.cancelReqBtn, { backgroundColor: `${colors.danger}15` }]}
              onPress={handleCancelPending}
            >
              <Text style={[styles.cancelReqText, { color: colors.danger }]}>
                İsteği İptal Et
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {!isCaptain && !isCompleted && !isUserJoined && userRequest?.status === 'REJECTED' && (
        <View
          style={[
            styles.rejectedNotice,
            { backgroundColor: `${colors.danger}12`, borderColor: colors.surfaceBorder },
          ]}
        >
          <Ionicons name="close-circle-outline" size={17} color={colors.danger} />
          <Text style={[styles.rejectedText, { color: colors.textSecondary }]}>
            Önceki katılma isteğiniz kaptan tarafından onaylanmadı. Uygun başka bir mevki için
            yeniden istek gönderebilirsiniz.
          </Text>
        </View>
      )}

      {/* Pre-Match Opponent Statistics */}
      <PreMatchStatsCard stats={matchupStats} isCompleted={match.isCompleted} />

      {/* Score & Outcome Prediction */}
      <AiPredictionBotCard
        stats={matchupStats}
        prediction={aiPrediction}
        userVote={match.prediction?.userVote}
        isCompleted={match.isCompleted}
        finalScore={match.finalScore}
        onApplyOutcome={
          match.prediction ? (choice) => votePrediction(match.id, choice) : undefined
        }
      />

      {/* Community Prediction Poll */}
      {match.prediction && (
        <MatchPredictionCard
          prediction={match.prediction}
          matchId={match.id}
          onVote={(choice) => votePrediction(match.id, choice)}
        />
      )}

      {/* Organizer Info */}
      <View
        style={[
          styles.organizerBox,
          { backgroundColor: colors.surface, borderColor: colors.surfaceBorder },
        ]}
      >
        <View style={[styles.orgAvatar, { backgroundColor: colors.surfaceLight }]}>
          <Text style={[styles.orgInitials, { color: colors.text }]}>
            {getInitials(match.organizerName)}
          </Text>
        </View>
        <View style={{ flex: 1, marginLeft: 10 }}>
          <Text style={[styles.orgLabel, { color: colors.textTertiary }]}>Takım Kaptanı</Text>
          <Text style={[styles.orgName, { color: colors.text }]}>{match.organizerName}</Text>
        </View>
        <TouchableOpacity
          style={[styles.callBtn, { backgroundColor: colors.surfaceLight }]}
          onPress={() => Alert.alert('İletişim', `Kaptan Tel: ${match.organizerPhone}`)}
          activeOpacity={0.8}
        >
          <Ionicons name="call-outline" size={15} color={colors.text} />
          <Text style={[styles.callBtnText, { color: colors.text }]}>İletişim</Text>
        </TouchableOpacity>
      </View>

      {/* Missing Positions Summary */}
      <View
        style={[
          styles.missingBanner,
          { backgroundColor: colors.surface, borderColor: colors.surfaceBorder },
        ]}
      >
        {vacantSlots.length > 0 ? (
          <>
            <Text style={[styles.missingBannerTitle, { color: colors.text }]}>
              {vacantSlots.length} Boş Mevki
            </Text>
            <View style={styles.posChips}>
              {match.missingPositions.map((p, i) => (
                <PositionBadge key={`${p}_${i}`} position={p} size="sm" />
              ))}
            </View>
          </>
        ) : (
          <View style={styles.readyRow}>
            <Ionicons name="checkmark-circle" size={18} color={colors.success} />
            <Text style={[styles.missingBannerTitle, { color: colors.success }]}>
              Kadro tamamlandı
            </Text>
          </View>
        )}
      </View>

      {/* Tactical Pitch */}
      <View style={styles.sectionHeaderRow}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Saha Dizilimi</Text>
        <Text style={[styles.sectionHint, { color: colors.textTertiary }]}>
          {isCaptain ? 'Boş mevkiye dokunarak katıl' : 'Boş mevkiye dokunarak istek gönder'}
        </Text>
      </View>

      <PitchLineup
        roster={match.roster}
        onSelectSlot={handleSlotSelect}
        currentUserId={currentUser.id}
        pendingSlotIds={pendingSlotIds}
      />

      {/* Roster Table */}
      <View
        style={[
          styles.rosterCard,
          { backgroundColor: colors.surface, borderColor: colors.surfaceBorder },
        ]}
      >
        <View style={[styles.rosterHeader, { borderBottomColor: colors.surfaceBorder }]}>
          <Text style={[styles.rosterTitle, { color: colors.text }]}>Oyuncu Listesi</Text>
          <Text style={[styles.rosterCount, { color: colors.primary }]}>
            {filledCount}/{match.totalSlots}
          </Text>
        </View>

        {match.roster.slice(0, Math.ceil(match.totalSlots / 2)).map((slot, idx, arr) => {
          const isPendingSlot = !slot.isFilled && pendingSlotIds.includes(slot.id);
          return (
            <View
              key={slot.id}
              style={[
                styles.rosterRow,
                { borderBottomColor: colors.surfaceBorder },
                idx === arr.length - 1 && { borderBottomWidth: 0 },
              ]}
            >
              <View style={styles.slotPos}>
                <PositionBadge position={slot.position} size="sm" />
              </View>
              <View style={{ flex: 1, marginLeft: 8 }}>
                <Text
                  style={[
                    styles.slotName,
                    { color: slot.isFilled ? colors.text : colors.textTertiary },
                  ]}
                >
                  {slot.isFilled
                    ? slot.assignedPlayer?.name
                    : isPendingSlot
                    ? 'Onay bekleniyor'
                    : 'Boş mevki'}
                </Text>
              </View>
              {slot.isFilled ? (
                <Ionicons name="checkmark" size={16} color={colors.success} />
              ) : isPendingSlot ? (
                <View style={[styles.pendingSlotBadge, { backgroundColor: `${colors.warning}20` }]}>
                  <Text style={[styles.pendingSlotText, { color: colors.warning }]}>Bekliyor</Text>
                </View>
              ) : (
                <TouchableOpacity
                  style={[styles.miniJoinBtn, { backgroundColor: colors.primary }]}
                  onPress={() => handleSlotSelect(slot)}
                >
                  <Text style={styles.miniJoinText}>
                    {isCaptain ? 'Katıl' : 'İstek Gönder'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          );
        })}
      </View>

      {match.notes ? (
        <View
          style={[
            styles.notesBox,
            { backgroundColor: colors.surface, borderColor: colors.surfaceBorder },
          ]}
        >
          <Text style={[styles.notesTitle, { color: colors.textSecondary }]}>Kaptan Notu</Text>
          <Text style={[styles.notesBody, { color: colors.text }]}>{match.notes}</Text>
        </View>
      ) : null}

      {/* Post-Match Evaluation (Enabled strictly when match is completed) */}
      {isCompleted ? (
        <PostMatchEvaluationSection match={match} currentUserId={currentUser.id} />
      ) : (
        <View
          style={[
            styles.evalPendingCard,
            { backgroundColor: colors.surface, borderColor: colors.surfaceBorder },
          ]}
        >
          <Ionicons name="star-outline" size={17} color={colors.textTertiary} />
          <Text style={[styles.evalPendingText, { color: colors.textSecondary }]}>
            Maç tamamlandıktan sonra oyuncular birbirini değerlendirebilir.
          </Text>
        </View>
      )}

      {/* Halı Saha Tesisi Değerlendirmesi */}
      <VenueEvaluationSection match={match} currentUserId={currentUser.id} />

      {/* Bottom CTA */}
      <View style={styles.bottomBar}>
        {isCompleted ? (
          <View style={[styles.completedBar, { backgroundColor: colors.surfaceLight }]}>
            <Text style={[styles.completedBarText, { color: colors.textSecondary }]}>
              Maç Tamamlandı
              {match.finalScore
                ? ` (${match.finalScore.team1} - ${match.finalScore.team2})`
                : ''}
            </Text>
          </View>
        ) : isUserJoined ? (
          <TouchableOpacity
            style={[styles.leaveBtn, { backgroundColor: `${colors.danger}15` }]}
            onPress={handleLeave}
          >
            <Text style={[styles.leaveBtnText, { color: colors.danger }]}>Kadrodan Ayrıl</Text>
          </TouchableOpacity>
        ) : userRequest?.status === 'PENDING' ? (
          <TouchableOpacity
            style={[styles.pendingCtaBtn, { backgroundColor: `${colors.warning}18` }]}
            onPress={handleCancelPending}
          >
            <Text style={[styles.pendingCtaText, { color: colors.warning }]}>
              Kaptan Onayı Bekleniyor (İptal Et)
            </Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[
              styles.joinBtn,
              {
                backgroundColor: vacantSlots.length > 0 ? colors.primary : colors.surfaceLight,
              },
            ]}
            onPress={
              isCaptain
                ? () => vacantSlots[0] && handleSlotSelect(vacantSlots[0])
                : handleQuickRequest
            }
            disabled={vacantSlots.length === 0}
          >
            <Text
              style={[
                styles.joinBtnText,
                { color: vacantSlots.length > 0 ? '#FFFFFF' : colors.textTertiary },
              ]}
            >
              {vacantSlots.length > 0
                ? isCaptain
                  ? 'Boş Mevkiye Katıl'
                  : 'Takıma Katılma İsteği Gönder'
                : 'Kadro Doldu'}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Join Request Modal */}
      <JoinRequestModal
        visible={Boolean(requestTargetSlot)}
        matchTitle={match.title}
        captainName={match.organizerName}
        feePerPlayer={match.feePerPlayer}
        position={requestTargetSlot?.position || null}
        onClose={() => setRequestTargetSlot(null)}
        onSubmit={handleSubmitJoinRequest}
      />

      {/* Organizer Edit Match Modal */}
      <Modal
        visible={editModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setEditModalVisible(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View
            style={[
              styles.modalSheet,
              { backgroundColor: colors.surface, borderTopColor: colors.surfaceBorder },
            ]}
          >
            <View style={[styles.modalHeader, { borderBottomColor: colors.surfaceBorder }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Maçı Düzenle</Text>
              <TouchableOpacity onPress={() => setEditModalVisible(false)} hitSlop={14}>
                <Ionicons name="close" size={22} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.modalScroll}>
              <Text style={[styles.modalLabel, { color: colors.textSecondary }]}>Başlık *</Text>
              <TextInput
                style={[
                  styles.modalInput,
                  { backgroundColor: colors.surfaceLight, color: colors.text },
                ]}
                value={editTitle}
                onChangeText={setEditTitle}
              />

              <Text style={[styles.modalLabel, { color: colors.textSecondary }]}>Tesis Adı *</Text>
              <TextInput
                style={[
                  styles.modalInput,
                  { backgroundColor: colors.surfaceLight, color: colors.text },
                ]}
                value={editVenueName}
                onChangeText={setEditVenueName}
              />

              <View style={styles.modalRow}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.modalLabel, { color: colors.textSecondary }]}>Şehir</Text>
                  <TextInput
                    style={[
                      styles.modalInput,
                      { backgroundColor: colors.surfaceLight, color: colors.text },
                    ]}
                    value={editCity}
                    onChangeText={setEditCity}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.modalLabel, { color: colors.textSecondary }]}>İlçe *</Text>
                  <TextInput
                    style={[
                      styles.modalInput,
                      { backgroundColor: colors.surfaceLight, color: colors.text },
                    ]}
                    value={editDistrict}
                    onChangeText={setEditDistrict}
                  />
                </View>
              </View>

              <View style={styles.modalRow}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.modalLabel, { color: colors.textSecondary }]}>Tarih *</Text>
                  <TextInput
                    style={[
                      styles.modalInput,
                      { backgroundColor: colors.surfaceLight, color: colors.text },
                    ]}
                    value={editDate}
                    onChangeText={setEditDate}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.modalLabel, { color: colors.textSecondary }]}>Saat *</Text>
                  <TextInput
                    style={[
                      styles.modalInput,
                      { backgroundColor: colors.surfaceLight, color: colors.text },
                    ]}
                    value={editTime}
                    onChangeText={setEditTime}
                  />
                </View>
              </View>

              <Text style={[styles.modalLabel, { color: colors.textSecondary }]}>Saha Türü</Text>
              <View style={styles.modalRow}>
                {(['Açık Saha', 'Kapalı Saha'] as const).map((pt) => (
                  <TouchableOpacity
                    key={pt}
                    style={[
                      styles.modalChoiceBtn,
                      {
                        backgroundColor:
                          editPitchType === pt ? colors.primary : colors.surfaceLight,
                      },
                    ]}
                    onPress={() => setEditPitchType(pt)}
                  >
                    <Text
                      style={[
                        styles.modalChoiceText,
                        { color: editPitchType === pt ? '#FFFFFF' : colors.textSecondary },
                      ]}
                    >
                      {pt}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={[styles.modalLabel, { color: colors.textSecondary }]}>
                Kişi Başı Ücret (₺) *
              </Text>
              <TextInput
                style={[
                  styles.modalInput,
                  { backgroundColor: colors.surfaceLight, color: colors.text },
                ]}
                keyboardType="numeric"
                value={editFee}
                onChangeText={setEditFee}
              />

              <Text style={[styles.modalLabel, { color: colors.textSecondary }]}>Notlar</Text>
              <TextInput
                style={[
                  styles.modalInput,
                  styles.modalArea,
                  { backgroundColor: colors.surfaceLight, color: colors.text },
                ]}
                multiline
                value={editNotes}
                onChangeText={setEditNotes}
              />

              <TouchableOpacity
                style={[
                  styles.joinBtn,
                  { backgroundColor: colors.primary, marginTop: 14, opacity: isSaving ? 0.7 : 1 },
                ]}
                onPress={handleSaveEdit}
                disabled={isSaving}
              >
                {isSaving ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={[styles.joinBtnText, { color: '#FFFFFF' }]}>
                    Değişiklikleri Kaydet
                  </Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Complete Match Modal */}
      <Modal
        visible={completeModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setCompleteModalVisible(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View
            style={[
              styles.modalSheet,
              { backgroundColor: colors.surface, borderTopColor: colors.surfaceBorder },
            ]}
          >
            <View style={[styles.modalHeader, { borderBottomColor: colors.surfaceBorder }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Maçı Tamamla & Skor Gir</Text>
              <TouchableOpacity onPress={() => setCompleteModalVisible(false)} hitSlop={14}>
                <Ionicons name="close" size={22} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalScroll}>
              <Text style={[styles.evalPendingText, { color: colors.textSecondary, marginBottom: 12 }]}>
                Maç skorunu onayladıktan sonra oyuncular birbirini değerlendirebilir.
              </Text>

              <View style={styles.modalRow}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.modalLabel, { color: colors.textSecondary }]}>
                    Ev Sahibi Skoru
                  </Text>
                  <TextInput
                    style={[
                      styles.modalInput,
                      styles.scoreInput,
                      { backgroundColor: colors.surfaceLight, color: colors.text },
                    ]}
                    keyboardType="number-pad"
                    value={score1Text}
                    onChangeText={setScore1Text}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.modalLabel, { color: colors.textSecondary }]}>
                    Konuk Takım Skoru
                  </Text>
                  <TextInput
                    style={[
                      styles.modalInput,
                      styles.scoreInput,
                      { backgroundColor: colors.surfaceLight, color: colors.text },
                    ]}
                    keyboardType="number-pad"
                    value={score2Text}
                    onChangeText={setScore2Text}
                  />
                </View>
              </View>

              <TouchableOpacity
                style={[
                  styles.joinBtn,
                  { backgroundColor: colors.primary, marginTop: 16, opacity: isSaving ? 0.7 : 1 },
                ]}
                onPress={handleCompleteMatch}
                disabled={isSaving}
              >
                {isSaving ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={[styles.joinBtnText, { color: '#FFFFFF' }]}>
                    Maçı Tamamlandı İşaretle
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <ReportModal
        visible={reportVisible}
        targetType="MATCH"
        targetId={match.id}
        targetLabel={match.title}
        onClose={() => setReportVisible(false)}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xxxl,
  },
  notFoundContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroCard: {
    borderRadius: RADIUS.md,
    padding: SPACING.lg,
    borderWidth: 1,
    marginBottom: SPACING.md,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: SPACING.sm,
  },
  formatPill: {
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 4,
  },
  formatText: {
    fontSize: 11,
    fontWeight: '700',
  },
  pitchText: {
    fontSize: 11,
    fontWeight: '600',
  },
  feeNumber: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '800',
    ...NUMERIC_STYLE,
  },
  feePer: {
    fontSize: 11,
    fontWeight: '500',
  },
  title: {
    fontSize: FONT_SIZE.xl,
    fontWeight: '800',
    letterSpacing: -0.3,
    marginBottom: SPACING.sm,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
    gap: 6,
  },
  metaText: {
    fontSize: FONT_SIZE.xs,
    flex: 1,
  },
  requestStatusCard: {
    borderRadius: RADIUS.md,
    padding: SPACING.lg,
    borderWidth: 1,
    marginBottom: SPACING.md,
  },
  requestStatusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    gap: 5,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  requestStatusDesc: {
    fontSize: 12,
    lineHeight: 17,
  },
  requestNotePreview: {
    fontSize: 11,
    marginTop: 6,
  },
  requestStatusActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  cancelReqBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: RADIUS.sm,
  },
  cancelReqText: {
    fontSize: 12,
    fontWeight: '700',
  },
  demoToggleBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: RADIUS.sm,
  },
  demoToggleText: {
    fontSize: 12,
    fontWeight: '600',
  },
  rejectedNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: RADIUS.md,
    borderWidth: StyleSheet.hairlineWidth,
    padding: SPACING.md,
    gap: 8,
    marginBottom: SPACING.md,
  },
  rejectedText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 17,
  },
  organizerBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: SPACING.md,
  },
  orgAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
  },
  orgInitials: {
    fontSize: 12,
    fontWeight: '800',
  },
  orgLabel: {
    fontSize: 11,
  },
  orgName: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '700',
    marginTop: 1,
  },
  callBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: RADIUS.pill,
    gap: 5,
  },
  callBtnText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '700',
  },
  missingBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  readyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  missingBannerTitle: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '700',
  },
  posChips: {
    flexDirection: 'row',
    gap: 5,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginTop: SPACING.xs,
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
  },
  sectionHint: {
    fontSize: 11,
  },
  rosterCard: {
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    borderWidth: StyleSheet.hairlineWidth,
    marginTop: SPACING.sm,
  },
  rosterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.xs,
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingBottom: 8,
  },
  rosterTitle: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '700',
  },
  rosterCount: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '700',
  },
  rosterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 9,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  slotPos: {
    width: 60,
  },
  slotName: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '600',
  },
  pendingSlotBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  pendingSlotText: {
    fontSize: 11,
    fontWeight: '700',
  },
  miniJoinBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  miniJoinText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  notesBox: {
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginTop: SPACING.md,
    borderWidth: StyleSheet.hairlineWidth,
  },
  notesTitle: {
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 4,
  },
  notesBody: {
    fontSize: FONT_SIZE.xs,
    lineHeight: 18,
  },
  bottomBar: {
    marginTop: SPACING.xl,
  },
  joinBtn: {
    paddingVertical: 14,
    borderRadius: RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  joinBtnText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '700',
  },
  pendingCtaBtn: {
    paddingVertical: 14,
    borderRadius: RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pendingCtaText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '700',
  },
  leaveBtn: {
    paddingVertical: 14,
    borderRadius: RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  leaveBtnText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '700',
  },
  scoreBanner: {
    marginTop: SPACING.md,
    borderRadius: RADIUS.sm,
    paddingHorizontal: SPACING.md,
    paddingVertical: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  scoreBannerLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  scoreBannerValue: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '800',
    ...NUMERIC_STYLE,
  },
  organizerToolbar: {
    marginTop: SPACING.md,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  toolbarBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 14,
    borderRadius: RADIUS.sm,
  },
  toolbarBtnText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '700',
  },
  evalPendingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    padding: SPACING.md,
    marginTop: SPACING.lg,
  },
  evalPendingText: {
    flex: 1,
    fontSize: FONT_SIZE.xs,
    lineHeight: 18,
  },
  completedBar: {
    paddingVertical: 14,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  completedBarText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '700',
    ...NUMERIC_STYLE,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  modalSheet: {
    borderTopLeftRadius: RADIUS.lg,
    borderTopRightRadius: RADIUS.lg,
    borderTopWidth: 1,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: '800',
  },
  modalScroll: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xxl,
  },
  modalLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 8,
    marginBottom: 4,
  },
  modalInput: {
    borderRadius: RADIUS.sm,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: FONT_SIZE.sm,
  },
  modalArea: {
    height: 76,
    textAlignVertical: 'top',
  },
  modalRow: {
    flexDirection: 'row',
    gap: 10,
  },
  modalChoiceBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: RADIUS.sm,
    alignItems: 'center',
  },
  modalChoiceText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '700',
  },
  scoreInput: {
    textAlign: 'center',
    fontSize: FONT_SIZE.xl,
    fontWeight: '800',
    ...NUMERIC_STYLE,
  },
  venueScoreChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: RADIUS.xs,
  },
  venueScoreChipText: {
    fontSize: 11,
    fontWeight: '800',
    ...NUMERIC_STYLE,
  },
});
