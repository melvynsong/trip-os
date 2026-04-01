// lib/utils/englishDestination.ts
// Helper to normalize destination names to English, with safe fallback

export function getEnglishDestinationName(destination: string, fallback?: string): string {
  // If destination is already in English (basic check), return as is
  if (/^[\x00-\x7F\s,'-]+$/.test(destination)) {
    return destination.trim();
  }
  // TODO: Add more advanced logic or use a mapping/service if available
  // For now, fallback to provided fallback or original
  return fallback?.trim() || destination.trim();
}
