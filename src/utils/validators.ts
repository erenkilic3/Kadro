import {
  CreateLeagueInput,
  GearCategory,
  GearCondition,
  MatchFormat,
  PlayerPosition,
  SubmitEvaluationInput,
  SubmitVenueEvaluationInput,
} from '../types';

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

export interface MatchFormValidationInput {
  title: string;
  venueName: string;
  district: string;
  city?: string;
  date: string;
  time: string;
  format: MatchFormat;
  feePerPlayer: number;
  missingPositions: PlayerPosition[];
}

export interface GearFormValidationInput {
  title: string;
  brand: string;
  size: string;
  price: number;
  description: string;
  category: GearCategory;
  condition: GearCondition;
}

const VALID_POSITIONS: PlayerPosition[] = ['GK', 'DEF', 'MID', 'FWD'];
const VALID_FORMATS: MatchFormat[] = ['5v5', '6v6', '7v7', '8v8'];
const VALID_CATEGORIES: GearCategory[] = ['Boots', 'Jerseys', 'Gloves', 'Equipment'];
const VALID_CONDITIONS: GearCondition[] = [
  'Sıfır (Etiketli)',
  'Çok İyi (Az Kullanılmış)',
  'İyi',
  'Kullanılmış',
];

export function formatToTotalSlots(format: MatchFormat): number {
  switch (format) {
    case '5v5':
      return 10;
    case '6v6':
      return 12;
    case '7v7':
      return 14;
    case '8v8':
      return 16;
  }
}

export function validateEmail(email: string): ValidationResult {
  const trimmed = email.trim().toLowerCase();
  if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
    return { valid: false, error: 'Geçerli bir e-posta adresi giriniz.' };
  }
  return { valid: true };
}

export function validatePassword(password: string): ValidationResult {
  if (!password || password.length < 6) {
    return { valid: false, error: 'Şifre en az 6 karakter olmalıdır.' };
  }
  return { valid: true };
}

export function validateProfileInput(name: string, position: PlayerPosition): ValidationResult {
  if (name.trim().length < 2) {
    return { valid: false, error: 'Ad Soyad en az 2 karakter olmalıdır.' };
  }
  if (!VALID_POSITIONS.includes(position)) {
    return { valid: false, error: 'Geçersiz mevki seçimi.' };
  }
  return { valid: true };
}

export function validateMatchInput(input: MatchFormValidationInput): ValidationResult {
  if (input.title.trim().length < 3) {
    return { valid: false, error: 'Maç başlığı en az 3 karakter olmalıdır.' };
  }
  if (!input.venueName.trim()) {
    return { valid: false, error: 'Lütfen halı saha tesis adını giriniz.' };
  }
  if (!input.district.trim()) {
    return { valid: false, error: 'Lütfen ilçe bilgisini giriniz.' };
  }
  if (!input.date.trim() || !input.time.trim()) {
    return { valid: false, error: 'Lütfen tarih ve saat aralığını giriniz.' };
  }
  if (!VALID_FORMATS.includes(input.format)) {
    return { valid: false, error: 'Geçersiz maç formatı.' };
  }
  if (!Number.isFinite(input.feePerPlayer) || input.feePerPlayer < 0) {
    return { valid: false, error: 'Lütfen geçerli bir kişi başı ücret giriniz (0 veya pozitif).' };
  }
  if (input.missingPositions.length === 0) {
    return { valid: false, error: 'Lütfen en az bir aranan eksik mevki seçiniz.' };
  }
  return { valid: true };
}

export function validateMatchScores(score1: number, score2: number): ValidationResult {
  if (
    !Number.isInteger(score1) ||
    !Number.isInteger(score2) ||
    score1 < 0 ||
    score2 < 0
  ) {
    return { valid: false, error: 'Skorlar 0 veya pozitif tam sayı olmalıdır.' };
  }
  return { valid: true };
}

export function validateLeagueInput(input: CreateLeagueInput): ValidationResult {
  if (input.title.trim().length < 3) {
    return { valid: false, error: 'Lig adı en az 3 karakter olmalıdır.' };
  }
  if (!input.venueName.trim()) {
    return { valid: false, error: 'Lütfen tesis adını giriniz.' };
  }
  if (!input.district.trim()) {
    return { valid: false, error: 'Lütfen ilçe bilgisini giriniz.' };
  }
  if (!input.prize.trim()) {
    return { valid: false, error: 'Lütfen şampiyonluk ödülünü belirtiniz.' };
  }
  if (!VALID_FORMATS.includes(input.format)) {
    return { valid: false, error: 'Geçersiz lig formatı.' };
  }
  if (!Number.isInteger(input.maxTeams) || input.maxTeams < 2 || input.maxTeams > 64) {
    return { valid: false, error: 'Takım sayısı 2 ile 64 arasında olmalıdır.' };
  }
  if (!Number.isFinite(input.entryFee) || input.entryFee < 0) {
    return { valid: false, error: 'Katılım ücreti negatif olamaz.' };
  }
  return { valid: true };
}

export function validateTeamName(teamName: string, captainName?: string): ValidationResult {
  if (teamName.trim().length < 2) {
    return { valid: false, error: 'Takım adı en az 2 karakter olmalıdır.' };
  }
  if (captainName !== undefined && captainName.trim().length < 2) {
    return { valid: false, error: 'Kaptan adı en az 2 karakter olmalıdır.' };
  }
  return { valid: true };
}

export function validateGearInput(input: GearFormValidationInput): ValidationResult {
  if (input.title.trim().length < 3) {
    return { valid: false, error: 'Ürün başlığı en az 3 karakter olmalıdır.' };
  }
  if (!input.brand.trim()) {
    return { valid: false, error: 'Lütfen marka bilgisini giriniz.' };
  }
  if (!input.size.trim()) {
    return { valid: false, error: 'Lütfen beden veya numara bilgisini giriniz.' };
  }
  if (!Number.isFinite(input.price) || input.price <= 0) {
    return { valid: false, error: 'Satış fiyatı 0 TL’den büyük olmalıdır.' };
  }
  if (input.description.trim().length < 5) {
    return { valid: false, error: 'Lütfen en az 5 karakterlik ürün açıklaması giriniz.' };
  }
  if (!VALID_CATEGORIES.includes(input.category)) {
    return { valid: false, error: 'Geçersiz kategori.' };
  }
  if (!VALID_CONDITIONS.includes(input.condition)) {
    return { valid: false, error: 'Geçersiz ürün durumu.' };
  }
  return { valid: true };
}

export function validateEvaluationInput(
  input: SubmitEvaluationInput,
  evaluatorId: string
): ValidationResult {
  if (!evaluatorId || evaluatorId === input.targetPlayerId) {
    return { valid: false, error: 'Kendi profilinizi değerlendiremezsiniz.' };
  }
  if (
    !Number.isInteger(input.skillRating) ||
    input.skillRating < 1 ||
    input.skillRating > 5
  ) {
    return { valid: false, error: 'Yetenek puanı 1 ile 5 arasında olmalıdır.' };
  }
  if (
    !Number.isInteger(input.fairPlayRating) ||
    input.fairPlayRating < 1 ||
    input.fairPlayRating > 5
  ) {
    return { valid: false, error: 'Fair-Play puanı 1 ile 5 arasında olmalıdır.' };
  }
  return { valid: true };
}

export function validateReportReason(reason: string): ValidationResult {
  if (reason.trim().length < 3) {
    return { valid: false, error: 'Bildirim nedeni en az 3 karakter olmalıdır.' };
  }
  return { valid: true };
}

function isValidStarRating(value: number): boolean {
  return Number.isInteger(value) && value >= 1 && value <= 5;
}

export function validateVenueEvaluationInput(
  input: SubmitVenueEvaluationInput
): ValidationResult {
  if (!input.matchId || !input.matchId.trim()) {
    return { valid: false, error: 'Geçersiz maç referansı.' };
  }
  if (!isValidStarRating(input.turfRating)) {
    return { valid: false, error: 'Zemin kalitesi puanı 1 ile 5 arasında olmalıdır.' };
  }
  if (!isValidStarRating(input.lightingRating)) {
    return { valid: false, error: 'Işıklandırma puanı 1 ile 5 arasında olmalıdır.' };
  }
  if (!isValidStarRating(input.lockerRoomRating)) {
    return { valid: false, error: 'Soyunma odası & duş puanı 1 ile 5 arasında olmalıdır.' };
  }
  if (!isValidStarRating(input.organizationRating)) {
    return { valid: false, error: 'Tesis işletmesi puanı 1 ile 5 arasında olmalıdır.' };
  }
  if (input.comment && input.comment.trim().length > 500) {
    return { valid: false, error: 'Yorum en fazla 500 karakter olabilir.' };
  }
  return { valid: true };
}
