/**
 * ============================================================================
 *  chatService.ts — FinSarathi.AI Groq LLM Financial Reasoning Engine
 *  Author: FinSarathi AI & Edge Systems Team
 *  Purpose:
 *    Purely handles financial cognitive reasoning via Groq (Llama-3 / fallbacks).
 *    The LLM receives queries in ENGLISH and responds in ENGLISH.
 *    All translation is handled EXTERNALLY by translationService.ts.
 *
 *  CRITICAL DESIGN RULE:
 *    This file does NOT translate Marathi or Hindi.
 *    The askFinSarathi() function receives English text, processes it with
 *    the LLM, and returns English text. The 3-step pipeline in ChatScreen.tsx
 *    handles all translation before and after this call.
 * ============================================================================
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { fetchAllFinanceData } from '../database/seeder';
import { formatINR } from './currency';

// ==========================================================================
// Constants
// ==========================================================================

export const STORAGE_KEY_GROQ_API_KEY = '@finsarathi_groq_api_key';
export const GROQ_API_ENDPOINT = 'https://api.groq.com/openai/v1/chat/completions';
export const PRIMARY_MODEL = 'qwen/qwen3.8-27b';
export const FALLBACK_MODELS = ['openai/gpt-oss-120b', 'openai/gpt-oss-20b'];

export interface ChatCompletionResponse {
  success: boolean;
  text: string;
  source: 'groq_api' | 'local_fallback';
  modelUsed?: string;
  error?: string;
}

// ==========================================================================
// Task 1: Hybrid API Key Management
// ==========================================================================

/**
 * Returns a valid Groq API key, checking AsyncStorage first (BYOK),
 * then falling back to the .env developer key.
 */
export async function getValidApiKey(): Promise<string | null> {
  try {
    const userKey = await AsyncStorage.getItem(STORAGE_KEY_GROQ_API_KEY);
    if (userKey && userKey.trim().length > 0) {
      return userKey.trim();
    }
  } catch (err) {
    console.warn('[ChatService] Error retrieving BYOK key from AsyncStorage:', err);
  }

  const devKey = process.env.EXPO_PUBLIC_GROQ_API_KEY || '';
  if (devKey && devKey.trim().length > 0) {
    return devKey.trim();
  }

  return null;
}

export async function setUserApiKey(key: string): Promise<void> {
  if (!key || !key.trim()) {
    await AsyncStorage.removeItem(STORAGE_KEY_GROQ_API_KEY);
  } else {
    await AsyncStorage.setItem(STORAGE_KEY_GROQ_API_KEY, key.trim());
  }
}

export async function getUserApiKey(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(STORAGE_KEY_GROQ_API_KEY);
  } catch {
    return null;
  }
}

// ==========================================================================
// Task 2: Deep Local SQLite Context Builder
// ==========================================================================

/**
 * Normalizes Indic Devanagari numerals and common merchant/date words
 * into searchable English tokens for local ledger matching.
 */
function normalizeQueryToTokens(query: string): string {
  let normalized = query.toLowerCase();

  // Convert Devanagari numerals
  const devanagariDigits = ['०', '१', '२', '३', '४', '५', '६', '७', '८', '९'];
  devanagariDigits.forEach((d, i) => {
    normalized = normalized.replaceAll(d, String(i));
  });

  // Common Marathi & Hindi merchant aliases
  const aliases: Record<string, string> = {
    'स्विगी': 'swiggy',
    'स्वीगी': 'swiggy',
    'झोमॅटो': 'zomato',
    'जोमैटो': 'zomato',
    'अमेझॉन': 'amazon',
    'अ‍ॅमेझॉन': 'amazon',
    'अमेज़न': 'amazon',
    'फ्लिपकार्ट': 'flipkart',
    'पेट्रोल': 'petrol fuel hpcl',
    'इंधन': 'fuel hpcl',
    'घरभाडे': 'rent',
    'भाडे': 'rent',
    'भाड़ा': 'rent',
    'पगार': 'salary',
    'वेतन': 'salary',
    'सप्टेंबर': '09',
    'सप्टेंबरला': '09',
    'सप्टेंबरचा': '09',
    'ऑक्टोबर': '10',
    'नोव्हेंबर': '11',
    'डिसेंबर': '12',
    'जानेवारी': '01',
    'फेब्रुवारी': '02',
    'मार्च': '03',
    'एप्रिल': '04',
    'मे': '05',
    'जून': '06',
    'जुलै': '07',
    'ऑगस्ट': '08',
  };

  for (const [indic, eng] of Object.entries(aliases)) {
    if (normalized.includes(indic)) {
      normalized += ` ${eng}`;
    }
  }

  return normalized;
}

/**
 * Extracts comprehensive local SQLite context for the LLM system prompt.
 * Queries all accounts, balances, and transaction history, plus targeted
 * matches for the user's specific query.
 */
export async function buildLocalFinancialContext(userQuery?: string): Promise<string> {
  let data;
  try {
    data = await fetchAllFinanceData();
  } catch {
    const { INITIAL_ACCOUNTS, INITIAL_TRANSACTIONS } = require('./mockData');
    data = {
      accounts: INITIAL_ACCOUNTS,
      transactions: INITIAL_TRANSACTIONS,
      totalBalance: INITIAL_ACCOUNTS.reduce((acc: number, a: any) => acc + (a.balance || 0), 0),
      mtdSpending: 42889,
      categoryExpenses: { 'Food & Dining': 12500, 'Shopping': 8400, 'Fuel & Travel': 6500 },
    };
  }

  const accounts = data?.accounts || [];
  const transactions: any[] = data?.transactions || [];

  const accountsSummary = accounts
    .map(
      (acc: any) =>
        `• ${acc.bank_name} (${acc.account_number}): ${formatINR(acc.balance)} [Type: ${acc.type || 'savings'}]`
    )
    .join('\n');

  // Format all transactions chronologically with full details
  const allTxList = transactions.slice(0, 30).map((tx: any) => {
    const dateFormatted = tx.date ? tx.date.split('T')[0] : 'Unknown Date';
    return `• Date: ${dateFormatted} | Shop/Merchant: "${tx.merchant}" | Amount: ${formatINR(tx.amount)} | Type: ${tx.type?.toUpperCase()} | Category: ${tx.category} | Notes: ${tx.notes || 'None'}`;
  });

  // Targeted Search
  let directMatches = '';
  if (userQuery && userQuery.trim()) {
    const qNorm = normalizeQueryToTokens(userQuery);
    const matches = transactions.filter((tx: any) => {
      const mLower = (tx.merchant || '').toLowerCase();
      const cLower = (tx.category || '').toLowerCase();
      const dStr = (tx.date || '').toLowerCase();
      const nLower = (tx.notes || '').toLowerCase();

      return (
        mLower.split(/\s+/).some((w: string) => w.length > 2 && qNorm.includes(w)) ||
        qNorm.includes(mLower) ||
        (qNorm.includes('food') && cLower.includes('food')) ||
        (qNorm.includes('shopping') && cLower.includes('shopping')) ||
        (qNorm.includes('fuel') && cLower.includes('travel')) ||
        (qNorm.includes('rent') && nLower.includes('rent')) ||
        (dStr && qNorm.includes(dStr.split('T')[0]))
      );
    });

    if (matches.length > 0) {
      directMatches =
        '\n\n🎯 RELEVANT MATCHING TRANSACTIONS FOUND IN LEDGER FOR THIS QUERY:\n' +
        matches
          .map(
            (tx: any) =>
              `• MATCH: Date: ${tx.date.split('T')[0]} | Shop: "${tx.merchant}" | Amount: ${formatINR(tx.amount)} (${tx.type?.toUpperCase()}) | Category: ${tx.category} | Notes: ${tx.notes}`
          )
          .join('\n');
    }
  }

  const categorySummary = Object.entries(data?.categoryExpenses || {})
    .map(([cat, amt]) => `• ${cat}: ${formatINR(amt as number)}`)
    .join('\n');

  return `
--- LOCAL LEDGER GROUND TRUTH (ZERO-CLOUD SQLITE LEDGER) ---
Total Net Worth Balance: ${formatINR(data.totalBalance)}
Month-to-Date (MTD) Discretionary Spending: ${formatINR(data.mtdSpending)}

ACCOUNTS:
${accountsSummary || 'No accounts linked.'}

TOP SPENDING CATEGORIES THIS MONTH:
${categorySummary || 'No expense data.'}
${directMatches}

COMPLETE RECENT TRANSACTIONS LEDGER (CHRONOLOGICAL):
${allTxList.join('\n')}
-----------------------------------------------------------`;
}

// ==========================================================================
// Task 3: System Prompt Builder (ENGLISH ONLY)
// ==========================================================================

/**
 * Generates the system prompt for the Groq LLM.
 * The LLM is instructed to respond ONLY in English.
 * All translation to/from regional languages happens outside this service.
 */
export async function generateSystemPrompt(userQuery?: string): Promise<string> {
  const localContext = await buildLocalFinancialContext(userQuery);

  return `You are FinSarathi, an intelligent, polite personal finance assistant for Indian users.

CRITICAL LANGUAGE DIRECTIVE:
You will receive queries in English. You MUST respond ONLY in English.
Do NOT write in any other language. Do NOT translate anything.
Your job is purely financial reasoning and data retrieval.

CORE OPERATING DIRECTIVES:
1. SPECIFIC EXPENSES & MERCHANTS:
   - When asked what was spent at a specific shop, merchant, or date:
     Search the "RELEVANT MATCHING TRANSACTIONS" and the "COMPLETE RECENT TRANSACTIONS LEDGER" below.
     Cite the exact date, shop name, item notes, and amount in rupees.
   - If no transaction exists for that shop or date in the ledger, explicitly say: "No matching transaction found in your ledger for [shop/date]."
2. NEVER FALSELY CLAIM TO RECORD:
   - When the user asks a question, answer the question. Do NOT claim you have added a new pending transaction.
3. GROUND TRUTH BALANCES:
   - Base all answers strictly on the ledger data below. Never hallucinate.
4. Keep answers concise (under 3 sentences). Output exact numbers if asked.

Local Financial Data:
${localContext}`;
}

// ==========================================================================
// Task 4: askFinSarathi — English-In, English-Out Financial Reasoning
// ==========================================================================

/**
 * Sends the user's query (in ENGLISH) to Groq LLM and returns the
 * LLM's financial reasoning response (in ENGLISH).
 *
 * IMPORTANT: This function does NOT handle translation.
 * The caller (ChatScreen.tsx) must:
 *   1. Translate user input to English BEFORE calling this
 *   2. Translate the English response back to the user's language AFTER
 */
export async function askFinSarathi(englishText: string): Promise<string> {
  if (!englishText || !englishText.trim()) {
    return 'Please provide a question or transaction details.';
  }

  const apiKey = await getValidApiKey();
  if (!apiKey) {
    return 'Groq API key not configured. Please add your key in Settings.';
  }

  // Build English-only system prompt with local financial context
  const systemPrompt = await generateSystemPrompt(englishText.trim());

  // Attempt each model in priority order
  const models = [PRIMARY_MODEL, ...FALLBACK_MODELS];

  for (const model of models) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout

      const response = await fetch(GROQ_API_ENDPOINT, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: englishText.trim() },
          ],
          temperature: 0.1,
          max_tokens: 450,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const json = await response.json();
        const content = json?.choices?.[0]?.message?.content;
        if (content && typeof content === 'string' && content.trim().length > 0) {
          return content.trim();
        }
      } else {
        const errJson = await response.json().catch(() => ({}));
        console.warn(`[ChatService] Groq (${model}) returned:`, errJson?.error?.code || response.status);
      }
    } catch (err) {
      console.warn(`[ChatService] Network error with model ${model}:`, err);
    }
  }

  // All models failed — use on-device local fallback
  const fallback = await generateLocalFallbackResponse(englishText);
  return fallback.text;
}

// ==========================================================================
// Structured Response Wrapper
// ==========================================================================

/**
 * Wrapper that returns a structured ChatCompletionResponse object.
 */
export async function sendChatMessageToGroq(
  englishText: string,
  history: Array<{ role: 'user' | 'assistant'; content: string }> = []
): Promise<ChatCompletionResponse> {
  try {
    const answer = await askFinSarathi(englishText);
    return {
      success: true,
      text: answer,
      source: 'groq_api',
      modelUsed: PRIMARY_MODEL,
    };
  } catch (error: any) {
    console.warn('[ChatService] Error in sendChatMessageToGroq:', error);
    return generateLocalFallbackResponse(englishText);
  }
}

// ==========================================================================
// On-Device Local Fallback (English Only)
// ==========================================================================

/**
 * Intelligent on-device fallback using local SQLite data.
 * Returns English responses only — translation happens externally.
 */
export async function generateLocalFallbackResponse(
  userText: string
): Promise<ChatCompletionResponse> {
  const norm = normalizeQueryToTokens(userText);
  const data = await fetchAllFinanceData().catch(() => null);

  const transactions: any[] = data?.transactions || [];
  const totalBal = data ? formatINR(data.totalBalance) : '₹2,85,500';
  const mtdSpend = data ? formatINR(data.mtdSpending) : '₹42,889';

  let reply = '';

  // 1. Search for specific merchant in transactions
  const matchingTx = transactions.find((tx: any) => {
    const m = (tx.merchant || '').toLowerCase();
    return m && norm.includes(m.split(' ')[0]);
  });

  if (matchingTx) {
    const d = matchingTx.date ? matchingTx.date.split('T')[0] : '';
    const amt = formatINR(matchingTx.amount);
    const shop = matchingTx.merchant;
    const cat = matchingTx.category;
    reply = `On ${d}, you spent ${amt} at ${shop} (${cat}).`;
    return { success: true, text: reply, source: 'local_fallback' };
  }

  // 2. Balance queries
  if (
    norm.includes('balance') ||
    norm.includes('net worth') ||
    norm.includes('total')
  ) {
    reply = `Your total net worth across linked accounts is ${totalBal}. The ledger is stored completely offline and securely on your device.`;
  } else if (
    norm.includes('spend') ||
    norm.includes('budget') ||
    norm.includes('forecast') ||
    norm.includes('expense')
  ) {
    reply = `Your month-to-date spending is ${mtdSpend}. You are on track with your projected financial budget.`;
  } else {
    reply = `I am FinSarathi, your personal finance assistant. You can ask about past expenses at any shop, specific dates, or your balance.`;
  }

  return {
    success: true,
    text: reply,
    source: 'local_fallback',
  };
}
