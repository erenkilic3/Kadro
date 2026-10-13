import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { RosterSlot, PlayerPosition } from '../types';
import { COLORS, POSITION_COLORS, FONT_SIZE } from '../constants/theme';

interface PitchLineupProps {
  roster: RosterSlot[];
  onSelectSlot?: (slot: RosterSlot) => void;
  currentUserId?: string;
}

export const PitchLineup: React.FC<PitchLineupProps> = ({
  roster,
  onSelectSlot,
  currentUserId,
}) => {
  // Take team 1 slots (first half of roster, typically 6 or 7 slots)
  const teamSlots = roster.slice(0, Math.ceil(roster.length / 2));

  const gkSlots = teamSlots.filter((s) => s.position === 'GK');
  const defSlots = teamSlots.filter((s) => s.position === 'DEF');
  const midSlots = teamSlots.filter((s) => s.position === 'MID');
  const fwdSlots = teamSlots.filter((s) => s.position === 'FWD');

  const renderSlot = (slot: RosterSlot) => {
    const isCurrentUser = slot.assignedPlayer?.id === currentUserId;
    const posColor = POSITION_COLORS[slot.position] || COLORS.primary;

    return (
      <TouchableOpacity
        key={slot.id}
        style={[
          styles.playerNode,
          slot.isFilled ? styles.playerFilled : styles.playerVacant,
          isCurrentUser && styles.playerCurrentUser,
        ]}
        onPress={() => onSelectSlot && onSelectSlot(slot)}
        activeOpacity={0.8}
        disabled={slot.isFilled && !isCurrentUser}
      >
        <View
          style={[
            styles.avatarCircle,
            { backgroundColor: slot.isFilled ? (isCurrentUser ? COLORS.accent : posColor) : 'rgba(239, 68, 68, 0.2)' },
            !slot.isFilled && styles.vacantBorder,
          ]}
        >
          {slot.isFilled ? (
            <Ionicons
              name={isCurrentUser ? 'person' : 'shirt'}
              size={18}
              color={COLORS.white}
            />
          ) : (
            <Ionicons name="add" size={20} color={COLORS.danger} />
          )}
        </View>

        <Text style={styles.playerName} numberOfLines={1}>
          {slot.isFilled
            ? isCurrentUser
              ? 'SEN'
              : slot.assignedPlayer?.name.split(' ')[0]
            : `EKSİK`}
        </Text>

        <View style={[styles.posTag, { backgroundColor: posColor }]}>
          <Text style={styles.posText}>{slot.position}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.pitchContainer}>
      {/* Field Background & Markings */}
      <View style={styles.pitch}>
        {/* Grass lines pattern */}
        <View style={styles.grassStripeTop} />
        <View style={styles.grassStripeMiddle} />

        {/* Pitch boundary and lines */}
        <View style={styles.pitchBorder}>
          {/* Goal Box (Top) */}
          <View style={styles.goalBoxTop} />
          <View style={styles.penaltyAreaTop} />

          {/* Halfway Line & Center Circle */}
          <View style={styles.halfwayLine}>
            <View style={styles.centerCircle} />
          </View>

          {/* Tactical Formation Layout */}
          <View style={styles.formationContainer}>
            {/* GK Line */}
            <View style={styles.lineRow}>{gkSlots.map(renderSlot)}</View>

            {/* DEF Line */}
            <View style={styles.lineRow}>{defSlots.map(renderSlot)}</View>

            {/* MID Line */}
            <View style={styles.lineRow}>{midSlots.map(renderSlot)}</View>

            {/* FWD Line */}
            <View style={styles.lineRow}>{fwdSlots.map(renderSlot)}</View>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  pitchContainer: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: '#1E4620',
    backgroundColor: '#0D381E',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
    marginVertical: 12,
  },
  pitch: {
    height: 380,
    backgroundColor: '#0B3319',
    position: 'relative',
    overflow: 'hidden',
  },
  grassStripeTop: {
    position: 'absolute',
    top: '25%',
    left: 0,
    right: 0,
    height: '25%',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
  grassStripeMiddle: {
    position: 'absolute',
    top: '75%',
    left: 0,
    right: 0,
    height: '25%',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
  pitchBorder: {
    flex: 1,
    margin: 12,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.45)',
    borderRadius: 8,
    position: 'relative',
    justifyContent: 'space-between',
  },
  goalBoxTop: {
    position: 'absolute',
    top: 0,
    left: '35%',
    width: '30%',
    height: 24,
    borderBottomWidth: 1.5,
    borderLeftWidth: 1.5,
    borderRightWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  penaltyAreaTop: {
    position: 'absolute',
    top: 0,
    left: '20%',
    width: '60%',
    height: 60,
    borderBottomWidth: 1.5,
    borderLeftWidth: 1.5,
    borderRightWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  halfwayLine: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 1.5,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    position: 'absolute',
    top: -35,
  },
  formationContainer: {
    flex: 1,
    justifyContent: 'space-around',
    paddingVertical: 14,
  },
  lineRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  playerNode: {
    alignItems: 'center',
    width: 68,
  },
  playerFilled: {},
  playerVacant: {},
  playerCurrentUser: {
    transform: [{ scale: 1.05 }],
  },
  avatarCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 4,
  },
  vacantBorder: {
    borderWidth: 2,
    borderColor: COLORS.danger,
    borderStyle: 'dashed',
  },
  playerName: {
    color: COLORS.white,
    fontSize: FONT_SIZE.xs,
    fontWeight: '700',
    marginTop: 3,
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  posTag: {
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 1,
    marginTop: 2,
  },
  posText: {
    color: COLORS.white,
    fontSize: 9,
    fontWeight: '800',
  },
});
