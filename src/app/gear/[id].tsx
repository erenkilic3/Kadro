import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../../context/AppContext';
import { useTheme } from '../../context/ThemeContext';
import { EmptyState } from '../../components/EmptyState';
import { FONT_SIZE, SPACING } from '../../constants/theme';

export default function GearDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { gearItems, currentUser, markGearSold } = useApp();
  const { colors, isDark } = useTheme();

  const item = gearItems.find((g) => g.id === id);

  if (!item) {
    return (
      <View style={[styles.notFoundContainer, { backgroundColor: colors.background }]}>
        <EmptyState
          icon="alert-circle-outline"
          title="Ürün Bulunamadı"
          description="Bu ilan satıcı tarafından yayından kaldırılmış olabilir."
        />
        <TouchableOpacity
          style={[styles.backButton, { backgroundColor: colors.primary }]}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>Pazara Dön</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const isSeller = item.sellerId === currentUser.id;
  const isSold = item.status === 'Sold';

  const getCategoryIcon = () => {
    switch (item.category) {
      case 'Boots':
        return 'football';
      case 'Jerseys':
        return 'shirt';
      case 'Gloves':
        return 'hand-left';
      default:
        return 'shield-checkmark';
    }
  };

  const handleContact = (type: 'CALL' | 'WP') => {
    if (isSold) {
      Alert.alert('Ürün Satıldı', 'Bu ürün satılmıştır, yeni bir alıcı kabul edilmiyor.');
      return;
    }

    if (type === 'CALL') {
      Alert.alert(
        'Satıcıyı Ara',
        `${item.sellerName} ile görüşmek için ${item.sellerPhone} numarası aranıyor.`
      );
    } else {
      Alert.alert(
        'WhatsApp İletişimi',
        `${item.sellerName} kişisine "${item.title}" ilanı için WhatsApp mesaj şablonu oluşturuluyor.`
      );
    }
  };

  const handleMarkSold = () => {
    Alert.alert(
      'Satıldı Olarak İşaretle',
      'Bu ilanı satıldı olarak güncellemek istiyor musunuz?',
      [
        { text: 'Vazgeç', style: 'cancel' },
        {
          text: 'Satıldı Olarak İşaretle',
          onPress: async () => {
            await markGearSold(item.id);
            Alert.alert('✅ Güncellendi', 'İlan durumu satıldı olarak güncellendi.');
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
      {/* Product Hero Box */}
      <View
        style={[
          styles.heroBox,
          {
            backgroundColor: isDark ? colors.surface : '#FFFFFF',
            borderColor: colors.surfaceBorder,
          },
        ]}
      >
        <View
          style={[
            styles.iconCircle,
            { backgroundColor: isDark ? colors.surfaceLight : '#F1F5F9' },
          ]}
        >
          <Ionicons name={getCategoryIcon()} size={64} color={colors.primary} />
        </View>

        {isSold && (
          <View style={styles.soldBadge}>
            <Text style={styles.soldBadgeText}>BU ÜRÜN SATILDI</Text>
          </View>
        )}

        <View
          style={[
            styles.brandPill,
            { backgroundColor: isDark ? colors.surfaceLight : '#EEF2F6' },
          ]}
        >
          <Text style={[styles.brandPillText, { color: colors.primary }]}>{item.brand}</Text>
        </View>
      </View>

      {/* Title & Price Header */}
      <View
        style={[
          styles.detailsCard,
          {
            backgroundColor: isDark ? colors.surface : '#FFFFFF',
            borderColor: colors.surfaceBorder,
          },
        ]}
      >
        <View style={styles.priceRow}>
          <Text style={[styles.price, { color: colors.accent }]}>
            ₺{item.price.toLocaleString('tr-TR')}
          </Text>
          <View
            style={[
              styles.conditionPill,
              {
                backgroundColor: `${colors.primary}15`,
                borderColor: colors.primary,
              },
            ]}
          >
            <Text style={[styles.conditionText, { color: colors.primary }]}>
              {item.condition}
            </Text>
          </View>
        </View>

        <Text style={[styles.title, { color: colors.text }]}>{item.title}</Text>

        <View style={styles.locationRow}>
          <Ionicons name="location-sharp" size={15} color={colors.primary} />
          <Text style={[styles.locationText, { color: colors.textSecondary }]}>
            {item.location}
          </Text>
        </View>
      </View>

      {/* Specifications Grid */}
      <View
        style={[
          styles.specsCard,
          {
            backgroundColor: isDark ? colors.surface : '#FFFFFF',
            borderColor: colors.surfaceBorder,
          },
        ]}
      >
        <Text
          style={[
            styles.sectionTitle,
            {
              color: colors.text,
              borderBottomColor: isDark ? 'rgba(255,255,255,0.06)' : '#E2E8F0',
            },
          ]}
        >
          Ürün Özellikleri
        </Text>

        <View style={styles.specGrid}>
          <View
            style={[
              styles.specItem,
              { backgroundColor: isDark ? colors.surfaceLight : '#F8FAFC' },
            ]}
          >
            <Text style={[styles.specKey, { color: colors.textTertiary }]}>Kategori</Text>
            <Text style={[styles.specVal, { color: colors.text }]}>
              {item.category === 'Boots'
                ? 'Krampon'
                : item.category === 'Jerseys'
                ? 'Forma'
                : item.category === 'Gloves'
                ? 'Kaleci Eldiveni'
                : 'Ekipman'}
            </Text>
          </View>

          <View
            style={[
              styles.specItem,
              { backgroundColor: isDark ? colors.surfaceLight : '#F8FAFC' },
            ]}
          >
            <Text style={[styles.specKey, { color: colors.textTertiary }]}>Beden / No</Text>
            <Text style={[styles.specVal, { color: colors.text }]}>{item.size}</Text>
          </View>

          <View
            style={[
              styles.specItem,
              { backgroundColor: isDark ? colors.surfaceLight : '#F8FAFC' },
            ]}
          >
            <Text style={[styles.specKey, { color: colors.textTertiary }]}>Marka</Text>
            <Text style={[styles.specVal, { color: colors.text }]}>{item.brand}</Text>
          </View>

          <View
            style={[
              styles.specItem,
              { backgroundColor: isDark ? colors.surfaceLight : '#F8FAFC' },
            ]}
          >
            <Text style={[styles.specKey, { color: colors.textTertiary }]}>Durum</Text>
            <Text
              style={[
                styles.specVal,
                { color: isSold ? colors.danger : colors.success },
              ]}
            >
              {isSold ? 'Satıldı' : 'Satışta'}
            </Text>
          </View>
        </View>
      </View>

      {/* Description */}
      <View
        style={[
          styles.descCard,
          {
            backgroundColor: isDark ? colors.surface : '#FFFFFF',
            borderColor: colors.surfaceBorder,
          },
        ]}
      >
        <Text style={[styles.sectionTitle, { color: colors.text, borderBottomColor: isDark ? 'rgba(255,255,255,0.06)' : '#E2E8F0' }]}>
          Satıcı Açıklaması
        </Text>
        <Text style={[styles.descBody, { color: colors.textSecondary }]}>
          {item.description}
        </Text>
      </View>

      {/* Seller Profile Card */}
      <View
        style={[
          styles.sellerCard,
          {
            backgroundColor: isDark ? colors.surface : '#FFFFFF',
            borderColor: colors.surfaceBorder,
          },
        ]}
      >
        <View
          style={[
            styles.sellerAvatar,
            { backgroundColor: isDark ? colors.surfaceLight : '#EDF2F7' },
          ]}
        >
          <Ionicons name="person" size={24} color={colors.primary} />
        </View>
        <View style={{ flex: 1, marginLeft: 10 }}>
          <Text style={[styles.sellerSubtitle, { color: colors.textTertiary }]}>İlan Sahibi</Text>
          <Text style={[styles.sellerName, { color: colors.text }]}>{item.sellerName}</Text>
          <Text style={[styles.sellerPhone, { color: colors.primary }]}>{item.sellerPhone}</Text>
        </View>
        {isSeller && (
          <View style={[styles.myListingTag, { backgroundColor: `${colors.primary}20` }]}>
            <Text style={[styles.myListingText, { color: colors.primary }]}>Senin İlanın</Text>
          </View>
        )}
      </View>

      {/* Action Buttons */}
      <View style={styles.actionContainer}>
        {isSeller ? (
          !isSold ? (
            <TouchableOpacity style={styles.soldActionBtn} onPress={handleMarkSold}>
              <Ionicons name="checkmark-done" size={20} color="#FFFFFF" />
              <Text style={styles.soldActionText}>Satıldı Olarak İşaretle</Text>
            </TouchableOpacity>
          ) : (
            <View
              style={[
                styles.alreadySoldBox,
                { backgroundColor: isDark ? colors.surfaceLight : '#EDF2F7' },
              ]}
            >
              <Ionicons name="lock-closed" size={18} color={colors.textTertiary} />
              <Text style={[styles.alreadySoldText, { color: colors.textTertiary }]}>
                İlan tamamlandı ve kapandı.
              </Text>
            </View>
          )
        ) : (
          <View style={styles.buyerActionRow}>
            <TouchableOpacity
              style={[
                styles.contactBtn,
                styles.callBtn,
                { backgroundColor: colors.accent },
                isSold && styles.btnDisabled,
              ]}
              onPress={() => handleContact('CALL')}
              disabled={isSold}
            >
              <Ionicons name="call" size={18} color="#FFFFFF" />
              <Text style={styles.contactBtnText}>Satıcıyı Ara</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.contactBtn, styles.wpBtn, isSold && styles.btnDisabled]}
              onPress={() => handleContact('WP')}
              disabled={isSold}
            >
              <Ionicons name="logo-whatsapp" size={18} color="#FFFFFF" />
              <Text style={[styles.contactBtnText, { color: '#FFFFFF' }]}>WhatsApp</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
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
    padding: SPACING.xl,
  },
  backButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 16,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  heroBox: {
    height: 190,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    marginBottom: SPACING.md,
    position: 'relative',
  },
  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  soldBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#EF4444',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  soldBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '900',
  },
  brandPill: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  brandPillText: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  detailsCard: {
    borderRadius: 16,
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
    fontSize: FONT_SIZE.title,
    fontWeight: '900',
  },
  conditionPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  conditionText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '700',
  },
  title: {
    fontSize: FONT_SIZE.xl,
    fontWeight: '800',
    lineHeight: 26,
    marginBottom: SPACING.sm,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationText: {
    fontSize: FONT_SIZE.xs,
    marginLeft: 4,
  },
  specsCard: {
    borderRadius: 16,
    padding: SPACING.lg,
    borderWidth: 1,
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: '800',
    marginBottom: SPACING.md,
    borderBottomWidth: 1,
    paddingBottom: 6,
  },
  specGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  specItem: {
    width: '46%',
    padding: 10,
    borderRadius: 8,
  },
  specKey: {
    fontSize: 10,
    fontWeight: '600',
  },
  specVal: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '700',
    marginTop: 2,
  },
  descCard: {
    borderRadius: 16,
    padding: SPACING.lg,
    borderWidth: 1,
    marginBottom: SPACING.md,
  },
  descBody: {
    fontSize: FONT_SIZE.sm,
    lineHeight: 22,
  },
  sellerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    padding: SPACING.lg,
    borderWidth: 1,
    marginBottom: SPACING.lg,
  },
  sellerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
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
    fontWeight: '600',
  },
  myListingTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  myListingText: {
    fontSize: 10,
    fontWeight: '800',
  },
  actionContainer: {
    marginTop: SPACING.xs,
  },
  buyerActionRow: {
    flexDirection: 'row',
    gap: 12,
  },
  contactBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  callBtn: {},
  wpBtn: {
    backgroundColor: '#25D366',
  },
  contactBtnText: {
    color: '#FFFFFF',
    fontSize: FONT_SIZE.sm,
    fontWeight: '800',
  },
  btnDisabled: {
    opacity: 0.4,
  },
  soldActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F59E0B',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  soldActionText: {
    color: '#FFFFFF',
    fontSize: FONT_SIZE.md,
    fontWeight: '800',
  },
  alreadySoldBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  alreadySoldText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
  },
});

