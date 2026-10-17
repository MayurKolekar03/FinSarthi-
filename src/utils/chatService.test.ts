/**
 * ============================================================================
 *  chatService.test.ts — Unit Tests for Hybrid API Key & Groq LLM Engine
 * ============================================================================
 */

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  getValidApiKey,
  setUserApiKey,
  getUserApiKey,
  buildLocalFinancialContext,
  generateSystemPrompt,
  sendChatMessageToGroq,
  askFinSarathi,
  STORAGE_KEY_GROQ_API_KEY,
} from './chatService';

describe('FinSarathi Hybrid API Key Management (Task 1)', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    delete process.env.EXPO_PUBLIC_GROQ_API_KEY;
  });

  test('Falls back to process.env.EXPO_PUBLIC_GROQ_API_KEY when no user key exists', async () => {
    process.env.EXPO_PUBLIC_GROQ_API_KEY = 'gsk_dev_test_env_key';
    const key = await getValidApiKey();
    expect(key).toBe('gsk_dev_test_env_key');
  });

  test('Prefers user BYOK key from AsyncStorage over process.env developer key', async () => {
    process.env.EXPO_PUBLIC_GROQ_API_KEY = 'gsk_dev_test_env_key';
    await AsyncStorage.setItem(STORAGE_KEY_GROQ_API_KEY, 'gsk_user_byok_key_123');

    const key = await getValidApiKey();
    expect(key).toBe('gsk_user_byok_key_123');
  });

  test('setUserApiKey stores key and getUserApiKey retrieves it', async () => {
    await setUserApiKey('gsk_custom_user_key');
    const key = await getUserApiKey();
    expect(key).toBe('gsk_custom_user_key');

    // Passing empty string clears the key
    await setUserApiKey('');
    const cleared = await getUserApiKey();
    expect(cleared).toBeNull();
  });
});

describe('Local Financial Context Injection & System Prompt (Task 4)', () => {
  test('buildLocalFinancialContext returns enriched ground truth from SQLite', async () => {
    const context = await buildLocalFinancialContext();
    expect(context).toContain('LOCAL LEDGER GROUND TRUTH');
    expect(context).toContain('Total Net Worth Balance');
  });

  test('generateSystemPrompt produces zero-hallucination financial instructions', async () => {
    const prompt = await generateSystemPrompt('What is my balance?');
    expect(prompt).toContain('FinSarathi');
    expect(prompt).toContain('English');
  });

  test('sendChatMessageToGroq delivers reliable responses with context fallback', async () => {
    const res = await sendChatMessageToGroq('What is my total spending?', []);
    expect(res.success).toBe(true);
    expect(res.text.length).toBeGreaterThan(10);
  });

  test('askFinSarathi handles English queries and provides coherent response', async () => {
    const res = await askFinSarathi('What is my total account balance?');
    expect(typeof res).toBe('string');
    expect(res.length).toBeGreaterThan(5);
  });

  test('askFinSarathi handles empty queries gracefully', async () => {
    const res = await askFinSarathi('');
    expect(res).toContain('Please provide a question');
  });
});
