import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
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
import { EmptyState } from '../../components/EmptyState';
import { ReportModal } from '../../components/ReportModal';
import { FONT_SIZE, NUMERIC_STYLE, RADIUS, SPACING } from '../../constants/theme';
import { GearCategory, GearCondition } from '../../types';
import { getInitials } from '../../utils/formatters';
import {
  PickedImageAsset,
  pickImageFromLibrary,
  uploadImageToBucket,
} from '../../services/mediaService';
import { validateGearInput } from '../../utils/validators';

export default function GearDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { gearItems, currentUser, markGearSold, updateGearItem, deleteGearItem } = useApp();
  const { colors } = useTheme();

  const item = gearItems.find((g) => g.id === id);

  const [editModalVisible, setEditModalVisible] = useState(false);
  const [reportVisible, setReportVisible] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editCategory, setEditCategory] = useState<GearCategory>('Boots');
  const [editBrand, setEditBrand] = useState('');
  const [editSize, setEditSize] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [editCondition, setEditCondition] = useState<GearCondition>('Çok İyi (Az Kullanılmış)');
  const [editCity, setEditCity] = useState('');
  const [editDistrict, setEditDistrict] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [pickedAsset, setPickedAsset] = useState<PickedImageAsset | null>(null);

  if (!item) {
    return (
      <View style={[styles.notFoundContainer, { backgroundColor: colors.background }]}>
        <EmptyState
          icon="alert-circle-outline"
          title="Ürün bulunamadı"
          description="Bu ilan satıcı tarafından yayından kaldırılmış olabilir."
          buttonText="Pazara Dön"
          onPress={() => router.back()}
        />
      </View>
    );
  }

  const isSeller = item.sellerId === currentUser.id;
  const isSold = item.status === 'Sold';

  const openEditModal = () => {
    setEditTitle(item.title);
    setEditCategory(item.category);
    setEditBrand(item.brand);
    setEditSize(item.size);
    setEditPrice(String(item.price));
    setEditCondition(item.condition);
    setEditCity(item.city || 'İstanbul');
    setEditDistrict(item.district || item.location.split('/').pop()?.trim() || 'Kadıköy');
    setEditDescription(item.description);
    setPickedAsset(null);
    setEditModalVisible(true);
  };

  const handlePickImage = async () => {
    const res = await pickImageFromLibrary();
    if (res.error) {
      Alert.alert('Galeri Hatası', res.error);
      return;
    }
    if (res.asset) setPickedAsset(res.asset);
  };

  const handleSaveEdit = async () => {
    const parsedPrice = Number(editPrice);
    const validation = validateGearInput({
      title: editTitle,
      brand: editBrand,
      size: editSize,
      price: parsedPrice,
      description: editDescription,
      category: editCategory,
      condition: editCondition,
    });
    if (!validation.valid) {
      Alert.alert('Geçersiz Bilgi', validation.error || 'Lütfen tüm alanları kontrol edin.');
      return;
    }

    const cityVal = editCity.trim() || 'İstanbul';
    const districtVal = editDistrict.trim() || 'Kadıköy';

    try {
      setIsSaving(true);
      let imageUrl = item.imageUrl;
      if (pickedAsset) {
        imageUrl = await uploadImageToBucket('gear-images', currentUser.id, pickedAsset);
      }
      await updateGearItem(item.id, {
        title: editTitle.trim(),
        category: editCategory,
        brand: editBrand.trim(),
        size: editSize.trim(),
        price: parsedPrice,
        condition: editCondition,
        city: cityVal,
        district: districtVal,
        location: `${cityVal} / ${districtVal}`,
        description: editDescription.trim(),
        imageUrl,
      });
      setEditModalVisible(false);
      Alert.alert('Güncellendi', 'İlan bilgileri güncellendi.');
    } catch (err) {
      Alert.alert(
        'Hata',
        err instanceof Error ? err.message : 'İlan güncellenirken hata oluştu.'
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = () => {
    const performDelete = async () => {
      try {
        await deleteGearItem(item.id);
        router.back();
      } catch (err) {
        Alert.alert('Hata', err instanceof Error ? err.message : 'İlan silinemedi.');
      }
    };

    if (Platform.OS === 'web') {
      void performDelete();
      return;
    }
    Alert.alert('İlanı Sil', 'Bu ekipman ilanını kalıcı olarak kaldırmak istiyor musunuz?', [
      { text: 'Vazgeç', style: 'cancel' },
      { text: 'İlanı Sil', style: 'destructive', onPress: () => void performDelete() },
    ]);
  };

  const getCategoryIcon = () => {
    switch (item.category) {
      case 'Boots':
        return 'football-outline';
      case 'Jerseys':
        return 'shirt-outline';
      case 'Gloves':
        return 'hand-left-outline';
      default:
        return 'shield-outline';
    }
  };

  const handleContact = (type: 'CALL' | 'WP') => {
    if (isSold) {
      Alert.alert('Ürün Satıldı', 'Bu ürün satılmıştır.');
      return;
    }

    if (type === 'CALL') {
      Alert.alert('Satıcıyı Ara', `${item.sellerName} (${item.sellerPhone})`);
    } else {
      Alert.alert(
        'WhatsApp',
        `${item.sellerName} kişisine "${item.title}" ilanı hakkında mesaj gönderiliyor.`
      );
    }
  };

  const handleMarkSold = () => {
    Alert.alert('Satıldı Olarak İşaretle', 'Bu ilanı satıldı olarak güncellemek istiyor musunuz?', [
      { text: 'Vazgeç', style: 'cancel' },
      {
        text: 'Onayla',
        onPress: async () => {
          await markGearSold(item.id);
          Alert.alert('Güncellendi', 'İlan durumu satıldı olarak güncellendi.');
        },
      },
    ]);
  };

  const categoryLabel =
    item.category === 'Boots'
      ? 'Krampon'
      : item.category === 'Jerseys'
      ? 'Forma'
      : item.category === 'Gloves'
      ? 'Kaleci Eldiveni'
      : 'Ekipman';

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
    >
      {/* Hero */}
      <View
        style={[
          styles.heroBox,
          { backgroundColor: colors.surface, borderColor: colors.surfaceBorder },
        ]}
      >
        {item.imageUrl ? (
          <Image source={{ uri: item.imageUrl }} style={styles.heroImage} resizeMode="cover" />
        ) : (
          <View style={[styles.iconCircle, { backgroundColor: colors.surfaceLight }]}>
            <Ionicons name={getCategoryIcon()} size={48} color={colors.textSecondary} />
          </View>
        )}

        {isSold && (
          <View style={[styles.soldBadge, { backgroundColor: colors.danger }]}>
            <Text style={styles.soldBadgeText}>SATILDI</Text>
          </View>
        )}

        <View style={[styles.brandPill, { backgroundColor: colors.surfaceLight }]}>
          <Text style={[styles.brandPillText, { color: colors.textSecondary }]}>{item.brand}</Text>
        </View>
      </View>

      {/* Price & Title */}
      <View
        style={[
          styles.detailsCard,
          { backgroundColor: colors.surface, borderColor: colors.surfaceBorder },
        ]}
      >
        <View style={styles.priceRow}>
          <Text style={[styles.price, { color: colors.text }]}>
            ₺{item.price.toLocaleString('tr-TR')}
          </Text>
          <View style={[styles.conditionPill, { backgroundColor: `${colors.primary}18` }]}>
            <Text style={[styles.conditionText, { color: colors.primary }]}>
              {item.condition}
            </Text>
          </View>
        </View>

        <Text style={[styles.title, { color: colors.text }]}>{item.title}</Text>

        <View style={styles.locationRow}>
          <Ionicons name="location-outline" size={14} color={colors.textTertiary} />
          <Text style={[styles.locationText, { color: colors.textSecondary }]}>
            {item.location}
          </Text>
        </View>
      </View>

      {/* Specs */}
      <View
        style={[
          styles.specsCard,
          { backgroundColor: colors.surface, borderColor: colors.surfaceBorder },
        ]}
      >
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Ürün Özellikleri</Text>

        <View style={styles.specGrid}>
          {[
            { key: 'Kategori', val: categoryLabel },
            { key: 'Beden / No', val: item.size },
            { key: 'Marka', val: item.brand },
            {
              key: 'Durum',
              val: isSold ? 'Satıldı' : 'Satışta',
              color: isSold ? colors.danger : colors.success,
            },
          ].map((spec) => (
            <View
              key={spec.key}
              style={[styles.specItem, { backgroundColor: colors.surfaceLight }]}
            >
              <Text style={[styles.specKey, { color: colors.textTertiary }]}>{spec.key}</Text>
              <Text style={[styles.specVal, { color: spec.color || colors.text }]}>
                {spec.val}
              </Text>
            </View>
          ))}
        </View>
      </View>

      {/* Description */}
      <View
        style={[
          styles.descCard,
          { backgroundColor: colors.surface, borderColor: colors.surfaceBorder },
        ]}
      >
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Açıklama</Text>
        <Text style={[styles.descBody, { color: colors.textSecondary }]}>{item.description}</Text>
      </View>

      {/* Seller */}
      <View
        style={[
          styles.sellerCard,
          { backgroundColor: colors.surface, borderColor: colors.surfaceBorder },
        ]}
      >
        <View style={[styles.sellerAvatar, { backgroundColor: colors.surfaceLight }]}>
          <Text style={[styles.sellerInitials, { color: colors.text }]}>
            {getInitials(item.sellerName)}
          </Text>
        </View>
        <View style={{ flex: 1, marginLeft: 10 }}>
          <Text style={[styles.sellerSubtitle, { color: colors.textTertiary }]}>Satıcı</Text>
          <Text style={[styles.sellerName, { color: colors.text }]}>{item.sellerName}</Text>
          <Text style={[styles.sellerPhone, { color: colors.textSecondary }]}>
            {item.sellerPhone}
          </Text>
        </View>
        {isSeller && (
          <View style={[styles.myListingTag, { backgroundColor: `${colors.primary}18` }]}>
            <Text style={[styles.myListingText, { color: colors.primary }]}>Senin İlanın</Text>
          </View>
        )}
      </View>

      {/* Actions */}
      <View style={styles.actionContainer}>
        {isSeller ? (
          <View style={styles.sellerActionCol}>
            {!isSold ? (
              <TouchableOpacity
                style={[styles.soldActionBtn, { backgroundColor: colors.primary }]}
                onPress={handleMarkSold}
              >
                <Text style={styles.soldActionText}>Satıldı Olarak İşaretle</Text>
              </TouchableOpacity>
            ) : (
              <View style={[styles.alreadySoldBox, { backgroundColor: colors.surfaceLight }]}>
                <Text style={[styles.alreadySoldText, { color: colors.textTertiary }]}>
                  İlan tamamlandı
                </Text>
              </View>
            )}

            <View style={styles.buyerActionRow}>
              {!isSold && (
                <TouchableOpacity
                  style={[
                    styles.contactBtn,
                    {
                      backgroundColor: colors.surface,
                      borderWidth: 1,
                      borderColor: colors.surfaceBorder,
                    },
                  ]}
                  onPress={openEditModal}
                >
                  <Ionicons name="create-outline" size={17} color={colors.text} />
                  <Text style={[styles.contactBtnText, { color: colors.text }]}>Düzenle</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={[styles.contactBtn, { backgroundColor: `${colors.danger}16` }]}
                onPress={handleDelete}
              >
                <Ionicons name="trash-outline" size={17} color={colors.danger} />
                <Text style={[styles.contactBtnText, { color: colors.danger }]}>İlanı Sil</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.sellerActionCol}>
            <View style={styles.buyerActionRow}>
              <TouchableOpacity
                style={[
                  styles.contactBtn,
                  { backgroundColor: colors.surfaceLight },
                  isSold && styles.btnDisabled,
                ]}
                onPress={() => handleContact('CALL')}
                disabled={isSold}
              >
                <Ionicons name="call-outline" size={17} color={colors.text} />
                <Text style={[styles.contactBtnText, { color: colors.text }]}>Ara</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.contactBtn,
                  { backgroundColor: colors.primary },
                  isSold && styles.btnDisabled,
                ]}
                onPress={() => handleContact('WP')}
                disabled={isSold}
              >
                <Ionicons name="logo-whatsapp" size={17} color="#FFFFFF" />
                <Text style={[styles.contactBtnText, { color: '#FFFFFF' }]}>WhatsApp</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[
                styles.reportLinkBtn,
                { borderColor: colors.surfaceBorder, backgroundColor: colors.surface },
              ]}
              onPress={() => setReportVisible(true)}
            >
              <Ionicons name="flag-outline" size={15} color={colors.textSecondary} />
              <Text style={[styles.reportLinkText, { color: colors.textSecondary }]}>
                İlanı Bildir
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Edit Modal */}
      <Modal
        visible={editModalVisible}
        animationType="slide"
        transparent
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
              <Text style={[styles.modalTitle, { color: colors.text }]}>İlanı Düzenle</Text>
              <TouchableOpacity onPress={() => setEditModalVisible(false)} hitSlop={14}>
                <Ionicons name="close" size={22} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.modalScroll}>
              <TouchableOpacity
                style={[
                  styles.photoRowBtn,
                  { backgroundColor: colors.surfaceLight, borderColor: colors.surfaceBorder },
                ]}
                onPress={handlePickImage}
              >
                {pickedAsset?.uri || item.imageUrl ? (
                  <Image
                    source={{ uri: pickedAsset?.uri || item.imageUrl }}
                    style={styles.modalThumb}
                  />
                ) : (
                  <Ionicons name="camera-outline" size={20} color={colors.textSecondary} />
                )}
                <Text style={[styles.photoRowText, { color: colors.text }]}>
                  {pickedAsset || item.imageUrl ? 'Fotoğrafı Değiştir' : 'Fotoğraf Ekle'}
                </Text>
              </TouchableOpacity>

              <Text style={[styles.editLabel, { color: colors.textSecondary }]}>Başlık *</Text>
              <TextInput
                style={[
                  styles.editInput,
                  { backgroundColor: colors.surfaceLight, color: colors.text },
                ]}
                value={editTitle}
                onChangeText={setEditTitle}
              />

              <View style={styles.buyerActionRow}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.editLabel, { color: colors.textSecondary }]}>Marka *</Text>
                  <TextInput
                    style={[
                      styles.editInput,
                      { backgroundColor: colors.surfaceLight, color: colors.text },
                    ]}
                    value={editBrand}
                    onChangeText={setEditBrand}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.editLabel, { color: colors.textSecondary }]}>Beden *</Text>
                  <TextInput
                    style={[
                      styles.editInput,
                      { backgroundColor: colors.surfaceLight, color: colors.text },
                    ]}
                    value={editSize}
                    onChangeText={setEditSize}
                  />
                </View>
              </View>

              <View style={styles.buyerActionRow}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.editLabel, { color: colors.textSecondary }]}>Fiyat (₺) *</Text>
                  <TextInput
                    style={[
                      styles.editInput,
                      { backgroundColor: colors.surfaceLight, color: colors.text },
                    ]}
                    keyboardType="numeric"
                    value={editPrice}
                    onChangeText={setEditPrice}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.editLabel, { color: colors.textSecondary }]}>İlçe</Text>
                  <TextInput
                    style={[
                      styles.editInput,
                      { backgroundColor: colors.surfaceLight, color: colors.text },
                    ]}
                    value={editDistrict}
                    onChangeText={setEditDistrict}
                  />
                </View>
              </View>

              <Text style={[styles.editLabel, { color: colors.textSecondary }]}>Durum</Text>
              <View style={styles.condRow}>
                {(
                  [
                    'Sıfır (Etiketli)',
                    'Çok İyi (Az Kullanılmış)',
                    'İyi',
                    'Kullanılmış',
                  ] as GearCondition[]
                ).map((cond) => (
                  <TouchableOpacity
                    key={cond}
                    style={[
                      styles.condChip,
                      {
                        backgroundColor:
                          editCondition === cond ? colors.primary : colors.surfaceLight,
                      },
                    ]}
                    onPress={() => setEditCondition(cond)}
                  >
                    <Text
                      style={[
                        styles.condChipText,
                        { color: editCondition === cond ? '#FFFFFF' : colors.textSecondary },
                      ]}
                    >
                      {cond}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={[styles.editLabel, { color: colors.textSecondary }]}>Açıklama *</Text>
              <TextInput
                style={[
                  styles.editInput,
                  styles.editArea,
                  { backgroundColor: colors.surfaceLight, color: colors.text },
                ]}
                multiline
                value={editDescription}
                onChangeText={setEditDescription}
              />

              <TouchableOpacity
                style={[
                  styles.soldActionBtn,
                  { backgroundColor: colors.primary, marginTop: 14, opacity: isSaving ? 0.7 : 1 },
                ]}
                onPress={handleSaveEdit}
                disabled={isSaving}
              >
                {isSaving ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.soldActionText}>Değişiklikleri Kaydet</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <ReportModal
        visible={reportVisible}
        targetType="GEAR"
        targetId={item.id}
        targetLabel={item.title}
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
  heroBox: {
    height: 200,
    borderRadius: RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    marginBottom: SPACING.md,
    position: 'relative',
    overflow: 'hidden',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  soldBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  soldBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  brandPill: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  brandPillText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  detailsCard: {
    borderRadius: RADIUS.md,
    padding: SPACING.lg,
    borderWidth: 1,
    marginBottom: SPACING.md,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  price: {
    fontSize: FONT_SIZE.xxl,
    fontWeight: '800',
    ...NUMERIC_STYLE,
  },
  conditionPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  conditionText: {
    fontSize: 11,
    fontWeight: '700',
  },
  title: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '700',
    lineHeight: 24,
    marginBottom: SPACING.sm,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationText: {
    fontSize: FONT_SIZE.xs,
  },
  specsCard: {
    borderRadius: RADIUS.md,
    padding: SPACING.lg,
    borderWidth: 1,
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '700',
    marginBottom: SPACING.md,
  },
  specGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  specItem: {
    width: '48%',
    padding: 10,
    borderRadius: RADIUS.sm,
  },
  specKey: {
    fontSize: 10,
    fontWeight: '600',
  },
  specVal: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '700',
    marginTop: 2,
  },
  descCard: {
    borderRadius: RADIUS.md,
    padding: SPACING.lg,
    borderWidth: 1,
    marginBottom: SPACING.md,
  },
  descBody: {
    fontSize: FONT_SIZE.xs,
    lineHeight: 20,
  },
  sellerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: RADIUS.md,
    padding: SPACING.lg,
    borderWidth: 1,
    marginBottom: SPACING.lg,
  },
  sellerAvatar: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sellerInitials: {
    fontSize: 13,
    fontWeight: '800',
  },
  sellerSubtitle: {
    fontSize: 10,
    fontWeight: '600',
  },
  sellerName: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '700',
  },
  sellerPhone: {
    fontSize: FONT_SIZE.xs,
  },
  myListingTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  myListingText: {
    fontSize: 11,
    fontWeight: '700',
  },
  actionContainer: {
    marginTop: SPACING.xs,
  },
  buyerActionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  contactBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: RADIUS.md,
    gap: 7,
  },
  contactBtnText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '700',
  },
  btnDisabled: {
    opacity: 0.45,
  },
  soldActionBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: RADIUS.md,
  },
  soldActionText: {
    color: '#FFFFFF',
    fontSize: FONT_SIZE.sm,
    fontWeight: '700',
  },
  alreadySoldBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: RADIUS.md,
  },
  alreadySoldText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
  },
  sellerActionCol: {
    gap: 10,
  },
  reportLinkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: RADIUS.md,
    paddingVertical: 14,
  },
  reportLinkText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '600',
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
  photoRowBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderRadius: RADIUS.sm,
    padding: 10,
    marginBottom: 8,
  },
  modalThumb: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.xs,
  },
  photoRowText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '700',
  },
  editLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 8,
    marginBottom: 4,
  },
  editInput: {
    borderRadius: RADIUS.sm,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: FONT_SIZE.sm,
  },
  editArea: {
    height: 76,
    textAlignVertical: 'top',
  },
  condRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 2,
  },
  condChip: {
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: RADIUS.sm,
  },
  condChipText: {
    fontSize: 11,
    fontWeight: '600',
  },
});
