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
import { EmptyState } from '../../components/EmptyState';
import { COLORS, FONT_SIZE, SPACING } from '../../constants/theme';

export default function GearDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { gearItems, currentUser, markGearSold } = useApp();

  const item = gearItems.find((g) => g.id === id);

  if (!item) {
    return (
      <View style={styles.notFoundContainer}>
        <EmptyState
          icon="alert-circle-outline"
          title="Ürün Bulunamadı"
          description="Bu ilan satıcı tarafından yayından kaldırılmış olabilir."
        />
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
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
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Product Hero Box */}
      <View style={styles.heroBox}>
        <View style={styles.iconCircle}>
          <Ionicons name={getCategoryIcon()} size={64} color={COLORS.primaryLight} />
        </View>

        {isSold && (
          <View style={styles.soldBadge}>
            <Text style={styles.soldBadgeText}>BU ÜRÜN SATILDI</Text>
          </View>
        )}

        <View style={styles.brandPill}>
          <Text style={styles.brandPillText}>{item.brand}</Text>
        </View>
      </View>

      {/* Title & Price Header */}
      <View style={styles.detailsCard}>
        <View style={styles.priceRow}>
          <Text style={styles.price}>₺{item.price.toLocaleString('tr-TR')}</Text>
          <View style={styles.conditionPill}>
            <Text style={styles.conditionText}>{item.condition}</Text>
          </View>
        </View>

        <Text style={styles.title}>{item.title}</Text>

        <View style={styles.locationRow}>
          <Ionicons name="location-sharp" size={15} color={COLORS.primaryLight} />
          <Text style={styles.locationText}>{item.location}</Text>
        </View>
      </View>

      {/* Specifications Grid */}
      <View style={styles.specsCard}>
        <Text style={styles.sectionTitle}>Ürün Özellikleri</Text>
        
        <View style={styles.specGrid}>
          <View style={styles.specItem}>
            <Text style={styles.specKey}>Kategori</Text>
            <Text style={styles.specVal}>
              {item.category === 'Boots' ? 'Krampon' : item.category === 'Jerseys' ? 'Forma' : item.category === 'Gloves' ? 'Kaleci Eldiveni' : 'Ekipman'}
            </Text>
          </View>

          <View style={styles.specItem}>
            <Text style={styles.specKey}>Beden / No</Text>
            <Text style={styles.specVal}>{item.size}</Text>
          </View>

          <View style={styles.specItem}>
            <Text style={styles.specKey}>Marka</Text>
            <Text style={styles.specVal}>{item.brand}</Text>
          </View>

          <View style={styles.specItem}>
            <Text style={styles.specKey}>Durum</Text>
            <Text style={[styles.specVal, { color: isSold ? COLORS.danger : COLORS.success }]}>
              {isSold ? 'Satıldı' : 'Satışta'}
            </Text>
          </View>
        </View>
      </View>

      {/* Description */}
      <View style={styles.descCard}>
        <Text style={styles.sectionTitle}>Satıcı Açıklaması</Text>
        <Text style={styles.descBody}>{item.description}</Text>
      </View>

      {/* Seller Profile Card */}
      <View style={styles.sellerCard}>
        <View style={styles.sellerAvatar}>
          <Ionicons name="person" size={24} color={COLORS.white} />
        </View>
        <View style={{ flex: 1, marginLeft: 10 }}>
          <Text style={styles.sellerSubtitle}>İlan Sahibi</Text>
          <Text style={styles.sellerName}>{item.sellerName}</Text>
          <Text style={styles.sellerPhone}>{item.sellerPhone}</Text>
        </View>
        {isSeller && (
          <View style={styles.myListingTag}>
            <Text style={styles.myListingText}>Senin İlanın</Text>
          </View>
        )}
      </View>

      {/* Action Buttons */}
      <View style={styles.actionContainer}>
        {isSeller ? (
          !isSold ? (
            <TouchableOpacity style={styles.soldActionBtn} onPress={handleMarkSold}>
              <Ionicons name="checkmark-done" size={20} color={COLORS.black} />
              <Text style={styles.soldActionText}>Satıldı Olarak İşaretle</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.alreadySoldBox}>
              <Ionicons name="lock-closed" size={18} color={COLORS.textTertiary} />
              <Text style={styles.alreadySoldText}>İlan tamamlandı ve kapandı.</Text>
            </View>
          )
        ) : (
          <View style={styles.buyerActionRow}>
            <TouchableOpacity
              style={[styles.contactBtn, styles.callBtn, isSold && styles.btnDisabled]}
              onPress={() => handleContact('CALL')}
              disabled={isSold}
            >
              <Ionicons name="call" size={18} color={COLORS.black} />
              <Text style={styles.contactBtnText}>Satıcıyı Ara</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.contactBtn, styles.wpBtn, isSold && styles.btnDisabled]}
              onPress={() => handleContact('WP')}
              disabled={isSold}
            >
              <Ionicons name="logo-whatsapp" size={18} color={COLORS.white} />
              <Text style={[styles.contactBtnText, { color: COLORS.white }]}>WhatsApp</Text>
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
    backgroundColor: COLORS.background,
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
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 16,
  },
  backButtonText: {
    color: COLORS.black,
    fontWeight: '700',
  },
  heroBox: {
    height: 190,
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    marginBottom: SPACING.md,
    position: 'relative',
  },
  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: COLORS.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  soldBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: COLORS.danger,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  soldBadgeText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: '900',
  },
  brandPill: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    backgroundColor: COLORS.surfaceLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  brandPillText: {
    color: COLORS.primaryLight,
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  detailsCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    marginBottom: SPACING.md,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  price: {
    color: COLORS.accent,
    fontSize: FONT_SIZE.title,
    fontWeight: '900',
  },
  conditionPill: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  conditionText: {
    color: COLORS.primaryLight,
    fontSize: FONT_SIZE.xs,
    fontWeight: '700',
  },
  title: {
    color: COLORS.text,
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
    color: COLORS.textSecondary,
    fontSize: FONT_SIZE.xs,
    marginLeft: 4,
  },
  specsCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    color: COLORS.text,
    fontSize: FONT_SIZE.md,
    fontWeight: '800',
    marginBottom: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
    paddingBottom: 6,
  },
  specGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  specItem: {
    width: '46%',
    backgroundColor: COLORS.surfaceLight,
    padding: 10,
    borderRadius: 8,
  },
  specKey: {
    color: COLORS.textTertiary,
    fontSize: 10,
    fontWeight: '600',
  },
  specVal: {
    color: COLORS.text,
    fontSize: FONT_SIZE.sm,
    fontWeight: '700',
    marginTop: 2,
  },
  descCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    marginBottom: SPACING.md,
  },
  descBody: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZE.sm,
    lineHeight: 22,
  },
  sellerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    marginBottom: SPACING.lg,
  },
  sellerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sellerSubtitle: {
    color: COLORS.textTertiary,
    fontSize: 10,
    fontWeight: '600',
  },
  sellerName: {
    color: COLORS.text,
    fontSize: FONT_SIZE.sm,
    fontWeight: '700',
  },
  sellerPhone: {
    color: COLORS.primaryLight,
    fontSize: FONT_SIZE.xs,
    fontWeight: '600',
  },
  myListingTag: {
    backgroundColor: 'rgba(6, 214, 160, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  myListingText: {
    color: COLORS.accent,
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
  callBtn: {
    backgroundColor: COLORS.accent,
  },
  wpBtn: {
    backgroundColor: '#25D366',
  },
  contactBtnText: {
    color: COLORS.black,
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
    backgroundColor: COLORS.warning,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  soldActionText: {
    color: COLORS.black,
    fontSize: FONT_SIZE.md,
    fontWeight: '800',
  },
  alreadySoldBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surfaceLight,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  alreadySoldText: {
    color: COLORS.textTertiary,
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
  },
});
