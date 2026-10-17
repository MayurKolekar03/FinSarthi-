/**
 * ============================================================================
 *  translationService.ts — Pure REST Linguistic Translation Layer
 *  Author: FinSarathi AI & Language Systems Team
 *  Purpose:
 *    Provides real-time machine translation between Indic regional languages
 *    (Marathi 'mr', Hindi 'hi') and English ('en') using a DEDICATED
 *    translation REST API (Bhashini / LibreTranslate).
 *
 *  CRITICAL DESIGN RULE:
 *    This file does NOT import or use Groq, OpenAI, or any LLM service.
 *    It is strictly a linguistic translation bridge — NO cognitive processing.
 *    The LLM layer lives in chatService.ts and handles financial reasoning.
 * ============================================================================
 */

// ==========================================================================
// Translation API Configuration
// ==========================================================================

/**
 * Primary translation endpoint.
 * Set EXPO_PUBLIC_BHASHINI_URL in .env to override with your Bhashini/MahaNLP URL.
 * Default points to Bhashini gov API — swap to LibreTranslate if needed.
 */
export const TRANSLATION_API_URL =
  process.env.EXPO_PUBLIC_BHASHINI_URL || 'https://api.bhashini.gov.in/v1/translate';

/**
 * API key/token for the translation service.
 * Set EXPO_PUBLIC_BHASHINI_API_KEY in .env.
 */
const TRANSLATION_API_KEY = process.env.EXPO_PUBLIC_BHASHINI_API_KEY || '';

// ==========================================================================
// Helpers
// ==========================================================================

/**
 * Normalizes language codes to standard 2-letter ISO codes.
 * Examples: 'mr-IN' → 'mr', 'hi-IN' → 'hi', 'EN' → 'en'
 */
export function normalizeLanguageCode(lang: string): string {
  if (!lang) return 'en';
  const clean = lang.trim().toLowerCase().split('-')[0];
  return clean || 'en';
}

// ==========================================================================
// Core Translation Function
// ==========================================================================

/**
 * Translates text between source and target languages using a dedicated
 * translation REST API endpoint (Bhashini / LibreTranslate).
 *
 * @param text       The input text to translate.
 * @param sourceLang Source language code (e.g. 'mr', 'hi', 'en', 'mr-IN').
 * @param targetLang Target language code (e.g. 'en', 'mr', 'hi').
 * @returns          Translated text string, or original text if translation fails.
 */
export async function translateText(
  text: string,
  sourceLang: string,
  targetLang: string
): Promise<string> {
  // Guard: empty input
  if (!text || !text.trim()) {
    return '';
  }

  const source = normalizeLanguageCode(sourceLang);
  const target = normalizeLanguageCode(targetLang);

  // No-op: source and target are the same language
  if (source === target) {
    return text.trim();
  }

  // 1. Try Primary Translation API (e.g. Bhashini / MahaNLP) if configured
  if (TRANSLATION_API_KEY && TRANSLATION_API_KEY.trim().length > 0) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

      const response = await fetch(TRANSLATION_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': TRANSLATION_API_KEY,
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          source_language: source,
          target_language: target,
          text: text.trim(),
          content: text.trim(),
          q: text.trim(),
          source: source,
          target: target,
          format: 'text',
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        const translated =
          data?.translated_text ||
          data?.translatedText ||
          data?.data?.target_text ||
          data?.pipelineResponse?.[0]?.output?.[0]?.target ||
          data?.translation ||
          data?.result;

        if (translated && typeof translated === 'string' && translated.trim().length > 0) {
          return translated.trim();
        }
      }
    } catch (primaryErr) {
      console.warn('[TranslationService] Primary Bhashini API error, falling back to REST bridge:', primaryErr);
    }
  }

  // 2. Dedicated REST Translation Fallback (Standard public translation REST API)
  try {
    const fallbackUrl = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text.trim())}&langpair=${source}|${target}`;
    const fbController = new AbortController();
    const fbTimeout = setTimeout(() => fbController.abort(), 6000);
    const fbRes = await fetch(fallbackUrl, { signal: fbController.signal });
    clearTimeout(fbTimeout);

    if (fbRes.ok) {
      const fbData = await fbRes.json();
      const fbText = fbData?.responseData?.translatedText;
      if (fbText && typeof fbText === 'string' && fbText.trim().length > 0 && !fbText.includes('QUERY LENGTH LIMIT')) {
        return fbText.trim();
      }
    }
  } catch (fallbackErr) {
    console.warn('[TranslationService] REST fallback error:', fallbackErr);
  }

  // 3. Final Fallback: Gracefully return original text (never crashes)
  return text.trim();
}
