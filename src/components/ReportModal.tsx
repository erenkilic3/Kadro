import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useApp } from '../context/AppContext';
import { FONT_SIZE, RADIUS, SPACING } from '../constants/theme';
import { ReportTargetType } from '../types';

const REPORT_REASONS = [
  'Yanıltıcı veya Sahte İlan',
  'Uygunsuz Davranış / Fair-Play İhlali',
  'Mükerrer veya Spam İçerik',
  'Hatalı Konum / Fiyat Bilgisi',
];

interface ReportModalProps {
  visible: boolean;
  targetType: ReportTargetType;
  targetId: string;
  targetLabel: string;
  onClose: () => void;
}

export const ReportModal: React.FC<ReportModalProps> = ({
  visible,
  targetType,
  targetId,
  targetLabel,
  onClose,
}) => {
  const { colors } = useTheme();
  const { submitReport } = useApp();

  const [selectedReason, setSelectedReason] = useState(REPORT_REASONS[0]);
  const [details, setDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      await submitReport({
        targetType,
        targetId,
        reason: selectedReason,
        details: details.trim() || undefined,
      });
      setDetails('');
      onClose();
      Alert.alert('Bildiriminiz Alındı', 'İnceleme ekibimiz bildiriminizi değerlendirecektir.');
    } catch (err) {
      const msg =
        err instanceof Error && err.message.includes('duplicate')
          ? 'Bu içerik için zaten aktif bir bildiriminiz bulunuyor.'
          : err instanceof Error
          ? err.message
          : 'Bildirim gönderilemedi.';
      Alert.alert('Bilgi', msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View
          style={[
            styles.sheet,
            { backgroundColor: colors.surface, borderTopColor: colors.surfaceBorder },
          ]}
        >
          <View style={[styles.header, { borderBottomColor: colors.surfaceBorder }]}>
            <View style={{ flex: 1, paddingRight: 12 }}>
              <Text style={[styles.title, { color: colors.text }]}>İçeriği Bildir</Text>
              <Text style={[styles.subtitle, { color: colors.textSecondary }]} numberOfLines={1}>
                {targetLabel}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} hitSlop={14}>
              <Ionicons name="close" size={22} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <View style={styles.body}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Neden</Text>
            <View style={styles.reasonsWrap}>
              {REPORT_REASONS.map((reason) => {
                const selected = selectedReason === reason;
                return (
                  <TouchableOpacity
                    key={reason}
                    style={[
                      styles.reasonItem,
                      {
                        backgroundColor: selected ? `${colors.danger}14` : colors.surfaceLight,
                        borderColor: selected ? colors.danger : colors.surfaceBorder,
                      },
                    ]}
                    onPress={() => setSelectedReason(reason)}
                  >
                    <Text
                      style={[
                        styles.reasonText,
                        { color: selected ? colors.danger : colors.text },
                      ]}
                    >
                      {reason}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={[styles.label, { color: colors.textSecondary }]}>
              Ek Açıklama (İsteğe bağlı)
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.surfaceLight,
                  borderColor: colors.surfaceBorder,
                  color: colors.text,
                },
              ]}
              placeholder="Detay ekleyebilirsiniz..."
              placeholderTextColor={colors.textTertiary}
              multiline
              value={details}
              onChangeText={setDetails}
            />

            <TouchableOpacity
              style={[styles.submitBtn, { backgroundColor: colors.danger }]}
              onPress={handleSubmit}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.submitText}>Bildirimi Gönder</Text>
              )}
            </TouchableOpacity>
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
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    borderTopWidth: 1,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
  },
  title: { fontSize: FONT_SIZE.md, fontWeight: '700' },
  subtitle: { fontSize: 12, marginTop: 2 },
  body: { padding: SPACING.lg },
  label: { fontSize: 12, fontWeight: '600', marginBottom: 6, marginTop: 10 },
  reasonsWrap: { gap: 8 },
  reasonItem: {
    borderWidth: 1,
    borderRadius: RADIUS.sm,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  reasonText: { fontSize: 12, fontWeight: '600' },
  input: {
    borderWidth: 1,
    borderRadius: RADIUS.sm,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: FONT_SIZE.sm,
    height: 76,
    textAlignVertical: 'top',
  },
  submitBtn: {
    marginTop: SPACING.lg,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: RADIUS.md,
    paddingVertical: 14,
  },
  submitText: { color: '#FFFFFF', fontSize: FONT_SIZE.sm, fontWeight: '700' },
});
