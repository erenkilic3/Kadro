/**
 * Returns up to two uppercase initials for a team or player name.
 */
export function getInitials(name: string): string {
  const words = name
    .replace(/[^\p{L}\p{N}\s]/gu, '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (words.length === 0) return 'KD';
  if (words.length === 1) return words[0].slice(0, 2).toLocaleUpperCase('tr-TR');
  return `${words[0][0]}${words[1][0]}`.toLocaleUpperCase('tr-TR');
}

/**
 * Strips leading decorative emoji/symbol prefixes from stored strings.
 */
export function stripLeadingSymbols(text: string): string {
  return text.replace(/^[\p{Extended_Pictographic}\p{Emoji_Presentation}\u200d\ufe0f\s]+/gu, '').trim();
}

