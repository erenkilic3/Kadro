import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { PositionBadge } from './PositionBadge';
import { FONT_SIZE, RADIUS, SPACING } from '../constants/theme';
import { PlayerPosition } from '../types';

interface JoinRequestModalProps {
  visible: boolean;
  matchTitle: string;
  captainName: string;
  feePerPlayer: number;
  position: PlayerPosition | null;
  onClose: () => void;
  onSubmit: (message?: string) => Promise<void>;
}

export const JoinRequestModal: React.FC<JoinRequestModalProps> = ({
  visible,
  matchTitle,
  captainName,
  feePerPlayer,
  position,
  onClose,
  onSubmit,
}) => {
  const { colors } = useTheme();
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!position) return null;

  const handleSend = async () => {
    try {
      setIsSubmitting(true);
      await onSubmit(message.trim() || undefined);
      setMessage('');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View
          style={[
            styles.sheet,
            { backgroundColor: colors.surface, borderColor: colors.surfaceBorder },
          ]}
        >
          <View style={[styles.header, { borderBottomColor: colors.surfaceBorder }]}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.title, { color: colors.text }]}>Katılma İsteği Gönder</Text>
              <Text style={[styles.subtitle, { color: colors.textSecondary }]} numberOfLines={1}>
                {matchTitle}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} hitSlop={14}>
              <Ionicons name="close" size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <View style={styles.body}>
            <View style={[styles.infoBox, { backgroundColor: colors.surfaceLight }]}>
              <View style={styles.infoRow}>
                <Text style={[styles.infoKey, { color: colors.textTertiary }]}>Seçilen Mevki</Text>
                <PositionBadge position={position} size="sm" />
              </View>
              <View style={[styles.infoRow, { marginTop: 8 }]}>
                <Text style={[styles.infoKey, { color: colors.textTertiary }]}>Takım Kaptanı</Text>
                <Text style={[styles.infoVal, { color: colors.text }]}>{captainName}</Text>
              </View>
              <View style={[styles.infoRow, { marginTop: 8 }]}>
                <Text style={[styles.infoKey, { color: colors.textTertiary }]}>Kişi Başı Ücret</Text>
                <Text style={[styles.infoVal, { color: colors.text }]}>₺{feePerPlayer}</Text>
              </View>
            </View>

            <Text style={[styles.label, { color: colors.textSecondary }]}>
              Kaptana Not (Opsiyonel)
            </Text>
            <TextInput
              style={[
                styles.input,
                { backgroundColor: colors.surfaceLight, color: colors.text },
              ]}
              placeholder="Örn: Mevkimde düzenli oynuyorum, maç saatinden 15 dk önce sahadayım."
              placeholderTextColor={colors.textTertiary}
              multiline
              numberOfLines={3}
              value={message}
              onChangeText={setMessage}
            />

            <Text style={[styles.helperText, { color: colors.textTertiary }]}>
              İsteğiniz takım kaptanına iletilir. Kaptan onayladığında kadroya dahil olursunuz.
            </Text>

            <View style={styles.actions}>
              <TouchableOpacity
                style={[styles.cancelBtn, { backgroundColor: colors.surfaceLight }]}
                onPress={onClose}
                disabled={isSubmitting}
              >
                <Text style={[styles.cancelText, { color: colors.textSecondary }]}>Vazgeç</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.submitBtn, { backgroundColor: colors.primary }]}
                onPress={handleSend}
                disabled={isSubmitting}
                activeOpacity={0.85}
              >
                <Text style={styles.submitText}>
                  {isSubmitting ? 'Gönderiliyor...' : 'İstek Gönder'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  title: {
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  body: {
    padding: SPACING.lg,
  },
  infoBox: {
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoKey: {
    fontSize: 12,
    fontWeight: '500',
  },
  infoVal: {
    fontSize: 12,
    fontWeight: '700',
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
  },
  input: {
    borderRadius: RADIUS.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: FONT_SIZE.sm,
    height: 78,
    textAlignVertical: 'top',
  },
  helperText: {
    fontSize: 11,
    lineHeight: 16,
    marginTop: 8,
    marginBottom: SPACING.lg,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
  },
  cancelBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: RADIUS.md,
  },
  cancelText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '700',
  },
  submitBtn: {
    flex: 2,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: RADIUS.md,
  },
  submitText: {
    color: '#FFFFFF',
    fontSize: FONT_SIZE.sm,
    fontWeight: '700',
  },
});
