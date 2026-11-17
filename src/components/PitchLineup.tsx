import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { RosterSlot } from '../types';
import { COLORS, POSITION_COLORS } from '../constants/theme';
import { getInitials } from '../utils/formatters';

interface PitchLineupProps {
  roster: RosterSlot[];
  onSelectSlot?: (slot: RosterSlot) => void;
  currentUserId?: string;
  pendingSlotIds?: string[];
}

export const PitchLineup: React.FC<PitchLineupProps> = ({
  roster,
  onSelectSlot,
  currentUserId,
  pendingSlotIds = [],
}) => {
  const teamSlots = roster.slice(0, Math.ceil(roster.length / 2));

  const gkSlots = teamSlots.filter((s) => s.position === 'GK');
  const defSlots = teamSlots.filter((s) => s.position === 'DEF');
  const midSlots = teamSlots.filter((s) => s.position === 'MID');
  const fwdSlots = teamSlots.filter((s) => s.position === 'FWD');

  const renderSlot = (slot: RosterSlot) => {
    const isCurrentUser = slot.assignedPlayer?.id === currentUserId;
    const isPending = !slot.isFilled && pendingSlotIds.includes(slot.id);
    const posColor = POSITION_COLORS[slot.position] || COLORS.primary;
    const playerName = slot.assignedPlayer?.name || '';

    return (
      <TouchableOpacity
        key={slot.id}
        style={styles.playerNode}
        onPress={() => onSelectSlot && onSelectSlot(slot)}
        activeOpacity={0.8}
        disabled={slot.isFilled && !isCurrentUser}
      >
        <View
          style={[
            styles.avatarCircle,
            {
              backgroundColor: slot.isFilled
                ? isCurrentUser
                  ? '#FFFFFF'
                  : posColor
                : isPending
                ? 'rgba(234, 179, 8, 0.25)'
                : 'rgba(17, 24, 39, 0.45)',
              borderColor: slot.isFilled
                ? isCurrentUser
                  ? COLORS.primary
                  : 'rgba(255,255,255,0.8)'
                : isPending
                ? COLORS.warning
                : 'rgba(255,255,255,0.6)',
              borderStyle: slot.isFilled ? 'solid' : 'dashed',
            },
          ]}
        >
          {slot.isFilled ? (
            <Text
              style={[
                styles.avatarInitials,
                { color: isCurrentUser ? '#111315' : '#FFFFFF' },
              ]}
            >
              {isCurrentUser ? 'SEN' : getInitials(playerName)}
            </Text>
          ) : (
            <Ionicons
              name={isPending ? 'time-outline' : 'add'}
              size={18}
              color={isPending ? COLORS.warning : '#FFFFFF'}
            />
          )}
        </View>

        <View style={styles.namePill}>
          <Text style={styles.playerName} numberOfLines={1}>
            {slot.isFilled
              ? isCurrentUser
                ? 'Sen'
                : playerName.split(' ')[0]
              : isPending
              ? 'Bekliyor'
              : slot.position}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.pitchContainer}>
      <View style={styles.pitch}>
        <View style={styles.grassStripeTop} />
        <View style={styles.grassStripeMiddle} />

        <View style={styles.pitchBorder}>
          <View style={styles.goalBoxTop} />
          <View style={styles.penaltyAreaTop} />

          <View style={styles.halfwayLine}>
            <View style={styles.centerCircle} />
          </View>

          <View style={styles.formationContainer}>
            <View style={styles.lineRow}>{gkSlots.map(renderSlot)}</View>
            <View style={styles.lineRow}>{defSlots.map(renderSlot)}</View>
            <View style={styles.lineRow}>{midSlots.map(renderSlot)}</View>
            <View style={styles.lineRow}>{fwdSlots.map(renderSlot)}</View>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  pitchContainer: {
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#154D2F',
    marginVertical: 10,
  },
  pitch: {
    height: 356,
    backgroundColor: '#154D2F',
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
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.28)',
    borderRadius: 6,
    position: 'relative',
    justifyContent: 'space-between',
  },
  goalBoxTop: {
    position: 'absolute',
    top: 0,
    left: '36%',
    width: '28%',
    height: 22,
    borderBottomWidth: 1.5,
    borderLeftWidth: 1.5,
    borderRightWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.28)',
  },
  penaltyAreaTop: {
    position: 'absolute',
    top: 0,
    left: '22%',
    width: '56%',
    height: 54,
    borderBottomWidth: 1.5,
    borderLeftWidth: 1.5,
    borderRightWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.28)',
  },
  halfwayLine: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 1.5,
    backgroundColor: 'rgba(255, 255, 255, 0.28)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.28)',
    position: 'absolute',
    top: -34,
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
    width: 66,
  },
  avatarCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitials: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  namePill: {
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 5,
    marginTop: 4,
    maxWidth: 66,
  },
  playerName: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
  },
});
