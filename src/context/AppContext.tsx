import React, { createContext, useContext, useState, useEffect } from 'react';
import { Match, GearItem, User, PlayerPosition, MatchFormat, GearCategory, GearCondition, RosterSlot } from '../types';
import { storageService } from '../services/storageService';

interface CreateMatchInput {
  title: string;
  venueName: string;
  address: string;
  district: string;
  date: string;
  time: string;
  format: MatchFormat;
  pitchType: 'Açık Saha' | 'Kapalı Saha';
  feePerPlayer: number;
  missingPositions: PlayerPosition[];
  notes?: string;
}

interface CreateGearInput {
  title: string;
  description: string;
  category: GearCategory;
  brand: string;
  size: string;
  price: number;
  condition: GearCondition;
  location: string;
}

interface AppContextType {
  matches: Match[];
  gearItems: GearItem[];
  currentUser: User;
  isLoading: boolean;
  createMatch: (data: CreateMatchInput) => Promise<void>;
  joinMatchSlot: (matchId: string, slotId: string) => Promise<boolean>;
  leaveMatch: (matchId: string) => Promise<boolean>;
  createGearItem: (data: CreateGearInput) => Promise<void>;
  markGearSold: (gearId: string) => Promise<void>;
  updateUser: (updates: Partial<User>) => Promise<void>;
  resetDemoData: () => Promise<void>;
  refreshData: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [matches, setMatches] = useState<Match[]>([]);
  const [gearItems, setGearItems] = useState<GearItem[]>([]);
  const [currentUser, setCurrentUser] = useState<User>({} as User);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const loadAllData = async () => {
    setIsLoading(true);
    try {
      const [storedMatches, storedGear, storedUser] = await Promise.all([
        storageService.getMatches(),
        storageService.getGearItems(),
        storageService.getUser(),
      ]);
      setMatches(storedMatches);
      setGearItems(storedGear);
      setCurrentUser(storedUser);
    } catch (err) {
      console.error('Failed to load initial data', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  const createMatch = async (data: CreateMatchInput) => {
    const totalSlots = data.format === '5v5' ? 10 : data.format === '6v6' ? 12 : 14;
    
    // Generate tactical lineup roster
    const halfSlots = totalSlots / 2;
    const roster: RosterSlot[] = [];

    // Team 1 slots
    roster.push({
      id: `slot_1`,
      position: 'GK',
      isFilled: !data.missingPositions.includes('GK'),
      assignedPlayer: !data.missingPositions.includes('GK') ? { id: 'bot_gk1', name: 'Kaan (Kaleci)', rating: 4.8 } : undefined,
    });

    const defNeeded = data.missingPositions.filter((p) => p === 'DEF').length;
    let defAssigned = 0;
    for (let i = 2; i <= (halfSlots === 7 ? 4 : 3); i++) {
      const isMissing = defAssigned < defNeeded;
      if (isMissing) defAssigned++;
      roster.push({
        id: `slot_${i}`,
        position: 'DEF',
        isFilled: !isMissing,
        assignedPlayer: !isMissing ? { id: `bot_def_${i}`, name: `Oyuncu DEF ${i}`, rating: 4.6 } : undefined,
      });
    }

    const midNeeded = data.missingPositions.filter((p) => p === 'MID').length;
    let midAssigned = 0;
    for (let i = (halfSlots === 7 ? 5 : 4); i <= halfSlots - 1; i++) {
      const isMissing = midAssigned < midNeeded;
      if (isMissing) midAssigned++;
      roster.push({
        id: `slot_${i}`,
        position: 'MID',
        isFilled: !isMissing,
        assignedPlayer: !isMissing ? { id: `bot_mid_${i}`, name: `Oyuncu MID ${i}`, rating: 4.7 } : undefined,
      });
    }

    // FWD
    const fwdNeeded = data.missingPositions.includes('FWD');
    roster.push({
      id: `slot_${halfSlots}`,
      position: 'FWD',
      isFilled: !fwdNeeded,
      assignedPlayer: !fwdNeeded
        ? { id: currentUser.id, name: `${currentUser.name} (Kaptan)`, rating: currentUser.rating }
        : undefined,
      isOrganizer: !fwdNeeded,
    });

    // Team 2 (opponents - pre-filled)
    for (let i = halfSlots + 1; i <= totalSlots; i++) {
      const pos: PlayerPosition = i === halfSlots + 1 ? 'GK' : i <= halfSlots + 3 ? 'DEF' : i <= totalSlots - 1 ? 'MID' : 'FWD';
      roster.push({
        id: `slot_${i}`,
        position: pos,
        isFilled: true,
        assignedPlayer: { id: `opp_${i}`, name: `Rakip #${i - halfSlots}`, rating: 4.7 },
      });
    }

    const newMatch: Match = {
      id: `match_${Date.now()}`,
      title: data.title,
      organizerId: currentUser.id,
      organizerName: currentUser.name,
      organizerPhone: currentUser.phone,
      venueName: data.venueName,
      address: data.address,
      city: 'İstanbul',
      district: data.district,
      date: data.date,
      time: data.time,
      format: data.format,
      pitchType: data.pitchType,
      feePerPlayer: data.feePerPlayer,
      totalSlots,
      roster,
      missingPositions: data.missingPositions,
      notes: data.notes,
      createdAt: new Date().toISOString(),
    };

    const updated = [newMatch, ...matches];
    setMatches(updated);
    await storageService.saveMatches(updated);
  };

  const joinMatchSlot = async (matchId: string, slotId: string): Promise<boolean> => {
    let success = false;
    const updated = matches.map((m) => {
      if (m.id !== matchId) return m;

      const updatedRoster = m.roster.map((slot) => {
        if (slot.id === slotId && !slot.isFilled) {
          success = true;
          return {
            ...slot,
            isFilled: true,
            assignedPlayer: {
              id: currentUser.id,
              name: currentUser.name,
              phone: currentUser.phone,
              rating: currentUser.rating,
            },
          };
        }
        return slot;
      });

      // Recalculate remaining missing positions
      const remainingMissing: PlayerPosition[] = [];
      const halfCount = m.totalSlots / 2;
      for (let i = 0; i < halfCount; i++) {
        const slot = updatedRoster[i];
        if (!slot.isFilled) {
          remainingMissing.push(slot.position);
        }
      }

      return {
        ...m,
        roster: updatedRoster,
        missingPositions: remainingMissing,
        isJoined: true,
      };
    });

    if (success) {
      setMatches(updated);
      await storageService.saveMatches(updated);
    }
    return success;
  };

  const leaveMatch = async (matchId: string): Promise<boolean> => {
    let success = false;
    const updated = matches.map((m) => {
      if (m.id !== matchId) return m;

      const updatedRoster = m.roster.map((slot) => {
        if (slot.assignedPlayer?.id === currentUser.id) {
          success = true;
          return {
            ...slot,
            isFilled: false,
            assignedPlayer: undefined,
          };
        }
        return slot;
      });

      const remainingMissing: PlayerPosition[] = [];
      const halfCount = m.totalSlots / 2;
      for (let i = 0; i < halfCount; i++) {
        const slot = updatedRoster[i];
        if (!slot.isFilled) {
          remainingMissing.push(slot.position);
        }
      }

      return {
        ...m,
        roster: updatedRoster,
        missingPositions: remainingMissing,
        isJoined: false,
      };
    });

    if (success) {
      setMatches(updated);
      await storageService.saveMatches(updated);
    }
    return success;
  };

  const createGearItem = async (data: CreateGearInput) => {
    const newItem: GearItem = {
      id: `gear_${Date.now()}`,
      sellerId: currentUser.id,
      sellerName: currentUser.name,
      sellerPhone: currentUser.phone,
      title: data.title,
      description: data.description,
      category: data.category,
      brand: data.brand,
      size: data.size,
      price: data.price,
      condition: data.condition,
      location: data.location || `${currentUser.city} / ${currentUser.district}`,
      status: 'Available',
      createdAt: new Date().toISOString(),
      iconName: data.category === 'Boots' ? 'football' : data.category === 'Jerseys' ? 'shirt' : data.category === 'Gloves' ? 'hand-left' : 'shield',
    };

    const updated = [newItem, ...gearItems];
    setGearItems(updated);
    await storageService.saveGearItems(updated);
  };

  const markGearSold = async (gearId: string) => {
    const updated = gearItems.map((item) =>
      item.id === gearId ? { ...item, status: 'Sold' as const } : item
    );
    setGearItems(updated);
    await storageService.saveGearItems(updated);
  };

  const updateUser = async (updates: Partial<User>) => {
    const updated = { ...currentUser, ...updates };
    setCurrentUser(updated);
    await storageService.saveUser(updated);
  };

  const resetDemoData = async () => {
    setIsLoading(true);
    const res = await storageService.resetToDemoData();
    setMatches(res.matches);
    setGearItems(res.gear);
    setCurrentUser(res.user);
    setIsLoading(false);
  };

  return (
    <AppContext.Provider
      value={{
        matches,
        gearItems,
        currentUser,
        isLoading,
        createMatch,
        joinMatchSlot,
        leaveMatch,
        createGearItem,
        markGearSold,
        updateUser,
        resetDemoData,
        refreshData: loadAllData,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
