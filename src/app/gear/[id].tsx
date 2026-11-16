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
import { FONT_SIZE, RADIUS, SPACING } from '../../constants/theme';
import { getInitials } from '../../utils/formatters';

export default function GearDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { gearItems, currentUser, markGearSold } = useApp();
  const { colors } = useTheme();

  const item = gearItems.find((g) => g.id === id);

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
        <View style={[styles.iconCircle, { backgroundColor: colors.surfaceLight }]}>
          <Ionicons name={getCategoryIcon()} size={48} color={colors.textSecondary} />
        </View>

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
          !isSold ? (
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
          )
        ) : (
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
  },
  heroBox: {
    height: 180,
    borderRadius: RADIUS.lg,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: SPACING.md,
    position: 'relative',
  },
  iconCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  soldBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
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
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  brandPillText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  detailsCard: {
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    borderWidth: StyleSheet.hairlineWidth,
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
  },
  conditionPill: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 6,
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
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    borderWidth: StyleSheet.hairlineWidth,
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
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: SPACING.md,
  },
  descBody: {
    fontSize: FONT_SIZE.xs,
    lineHeight: 20,
  },
  sellerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: SPACING.lg,
  },
  sellerAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
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
});
