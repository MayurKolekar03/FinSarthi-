/**
 * ============================================================================
 *  translationService.test.ts — Unit Tests for Multilingual Translation Service
 * ============================================================================
 */

import { translateText, normalizeLanguageCode } from './translationService';

describe('Translation Service (Task 1)', () => {
  beforeEach(() => {
    // Reset global fetch mock
    global.fetch = jest.fn();
  });

  test('normalizeLanguageCode normalizes regional tags correctly', () => {
    expect(normalizeLanguageCode('mr-IN')).toBe('mr');
    expect(normalizeLanguageCode('MR')).toBe('mr');
    expect(normalizeLanguageCode('hi-IN')).toBe('hi');
    expect(normalizeLanguageCode('en-IN')).toBe('en');
  });

  test('Returns identical text immediately when source and target language match', async () => {
    const text = 'Swiggy ₹450 spent';
    const result = await translateText(text, 'en', 'en');
    expect(result).toBe(text);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  test('Gracefully falls back to original text when API fails or is unreachable', async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

    const originalText = 'माझा शिल्लक किती आहे?';
    const result = await translateText(originalText, 'mr', 'en');

    // Resilient fallback: does not throw, returns original text
    expect(result).toBe(originalText);
  });

  test('Extracts translated text from successful API response', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        translated_text: 'What is my current balance?',
      }),
    });

    const result = await translateText('माझा शिल्लक किती आहे?', 'mr', 'en');
    expect(result).toBe('What is my current balance?');
  });
});
