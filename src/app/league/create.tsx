import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useApp } from '../../context/AppContext';
import { useTheme } from '../../context/ThemeContext';
import { LeagueForm } from '../../components/LeagueForm';
import { FONT_SIZE, RADIUS, SPACING } from '../../constants/theme';

export default function CreateLeagueScreen() {
  const { createLeague, currentUser } = useApp();
  const { colors } = useTheme();

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: colors.background }]}
      edges={['top']}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.headerRow}>
            <TouchableOpacity
              style={[styles.backBtn, { backgroundColor: colors.surfaceLight }]}
              onPress={() => router.back()}
              hitSlop={14}
            >
              <Ionicons name="arrow-back" size={18} color={colors.text} />
            </TouchableOpacity>
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={[styles.screenTitle, { color: colors.text }]}>Yeni Bölgesel Lig</Text>
              <Text style={[styles.screenSub, { color: colors.textSecondary }]}>
                Turnuva detaylarını ve kurallarını belirleyin
              </Text>
            </View>
          </View>

          <LeagueForm
            initialValues={{
              city: currentUser.city || 'İstanbul',
              district: currentUser.district || 'Kadıköy',
            }}
            submitLabel="Bölgesel Ligi Başlat"
            onSubmit={async (values) => {
              const newLeague = await createLeague(values);
              Alert.alert('Lig Kuruldu', `"${newLeague.title}" bölgesel ligi oluşturuldu.`, [
                {
                  text: 'Lige Git',
                  onPress: () => router.replace(`/league/${newLeague.id}` as any),
                },
              ]);
            }}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.lg,
    paddingBottom: 40,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  screenTitle: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  screenSub: {
    fontSize: FONT_SIZE.sm,
    marginTop: 2,
  },
});
