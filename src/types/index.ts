export type PlayerPosition = 'GK' | 'DEF' | 'MID' | 'FWD';

export type MatchFormat = '5v5' | '6v6' | '7v7' | '8v8';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  position: PlayerPosition;
  rating: number;
  matchesPlayed: number;
  preferredFoot: 'Right' | 'Left' | 'Both';
  city: string;
  district: string;
  avatarUrl?: string;
  bio?: string;
}

export interface RosterSlot {
  id: string;
  position: PlayerPosition;
  isFilled: boolean;
  assignedPlayer?: {
    id: string;
    name: string;
    phone?: string;
    rating?: number;
  };
  isOrganizer?: boolean;
}

export interface Match {
  id: string;
  title: string;
  organizerId: string;
  organizerName: string;
  organizerPhone: string;
  venueName: string;
  address: string;
  city: string;
  district: string;
  date: string; // e.g. "2026-10-18"
  time: string; // e.g. "21:00 - 22:00"
  format: MatchFormat;
  pitchType: 'Açık Saha' | 'Kapalı Saha';
  feePerPlayer: number;
  totalSlots: number;
  roster: RosterSlot[];
  missingPositions: PlayerPosition[];
  notes?: string;
  isJoined?: boolean;
  createdAt: string;
}

export type GearCategory = 'Boots' | 'Jerseys' | 'Gloves' | 'Equipment';
export type GearCondition = 'Sıfır (Etiketli)' | 'Çok İyi (Az Kullanılmış)' | 'İyi' | 'Kullanılmış';

export interface GearItem {
  id: string;
  sellerId: string;
  sellerName: string;
  sellerPhone: string;
  title: string;
  description: string;
  category: GearCategory;
  brand: string;
  size: string;
  price: number;
  condition: GearCondition;
  location: string;
  status: 'Available' | 'Sold';
  createdAt: string;
  iconName?: string;
}
