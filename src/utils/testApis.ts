/**
 * API Integration Test Script
 * Tests both Groq LLM API and Translation API independently and end-to-end.
 * Run: npx tsx src/utils/testApis.ts
 */

import { translateText } from './translationService';

const GROQ_API_KEY = process.env.EXPO_PUBLIC_GROQ_API_KEY || '';
const GROQ_ENDPOINT = 'https://api.groq.com/openai/v1/chat/completions';

// ============================================================
// TEST 1: Groq LLM API (Financial Reasoning — English only)
// ============================================================
async function testGroqAPI() {
  console.log('\n' + '='.repeat(60));
  console.log('🧪 TEST 1: Groq LLM API (Cognitive Financial Reasoning)');
  console.log('='.repeat(60));

  const models = ['qwen/qwen3.8-27b', 'openai/gpt-oss-120b', 'openai/gpt-oss-20b'];
  let successfulModel: string | null = null;

  for (const model of models) {
    console.log(`\n  ▸ Trying model: ${model}`);
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 12000);

      const response = await fetch(GROQ_ENDPOINT, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${GROQ_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          messages: [
            {
              role: 'system',
              content: 'You are FinSarathi, a financial AI. Respond in English only. Be concise (1-2 sentences).',
            },
            {
              role: 'user',
              content: 'What is a good monthly budget for groceries in India?',
            },
          ],
          temperature: 0.1,
          max_tokens: 150,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      console.log(`    Status: ${response.status} ${response.statusText}`);

      if (response.ok) {
        const json = await response.json();
        const content = json?.choices?.[0]?.message?.content;
        console.log(`    ✅ Model "${model}" responded successfully!`);
        console.log(`    💬 Response: "${content?.trim()}"`);
        console.log(`    📊 Tokens: prompt=${json?.usage?.prompt_tokens}, completion=${json?.usage?.completion_tokens}`);
        successfulModel = model;
        break;
      } else {
        const errJson = await response.json().catch(() => ({}));
        console.log(`    ❌ Model "${model}" error:`, errJson?.error?.message || response.status);
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        console.log(`    ❌ Timeout (12s)`);
      } else {
        console.log(`    ❌ Network Error: ${err.message}`);
      }
    }
  }

  return { success: !!successfulModel, model: successfulModel };
}

// ============================================================
// TEST 2: Dedicated Translation REST API
// ============================================================
async function testTranslationAPI() {
  console.log('\n' + '='.repeat(60));
  console.log('🧪 TEST 2: Dedicated Translation REST API (Linguistic Layer)');
  console.log('='.repeat(60));

  const testCases = [
    { text: 'माझा एकूण खर्च किती आहे?', source: 'mr', target: 'en', label: 'Marathi → English' },
    { text: 'Your total spending is ₹42,889.', source: 'en', target: 'mr', label: 'English → Marathi' },
    { text: 'मेरा कुल खर्च कितना है?', source: 'hi', target: 'en', label: 'Hindi → English' },
    { text: 'Your balance is ₹2,85,500.', source: 'en', target: 'hi', label: 'English → Hindi' },
  ];

  let successCount = 0;

  for (const tc of testCases) {
    console.log(`\n  ▸ ${tc.label}: "${tc.text}"`);
    try {
      const translated = await translateText(tc.text, tc.source, tc.target);
      console.log(`    ✅ Translated: "${translated}"`);
      if (translated && translated !== tc.text) {
        successCount++;
      } else {
        console.log(`    ℹ️ Returned unchanged (passthrough fallback)`);
      }
    } catch (err: any) {
      console.log(`    ❌ Translation error: ${err.message}`);
    }
  }

  return { success: successCount > 0, count: successCount };
}

// ============================================================
// TEST 3: Simulated Full 3-Step Pipeline (Marathi Query)
// ============================================================
async function testFullPipeline() {
  console.log('\n' + '='.repeat(60));
  console.log('🧪 TEST 3: Full 3-Step Pipeline Simulation');
  console.log('='.repeat(60));

  const userInput = 'माझा स्विगीवरचा एकूण खर्च किती आहे?';
  console.log(`  User input (Marathi): "${userInput}"`);

  // Step 1: Translate to English
  console.log('\n  ── STEP 1: Translate Regional (mr) → English ──');
  const englishInput = await translateText(userInput, 'mr', 'en');
  console.log(`    → English translation: "${englishInput}"`);

  // Step 2: Groq LLM
  console.log('\n  ── STEP 2: Groq LLM Financial Reasoning (English) ──');
  let englishResponse = '';
  try {
    const response = await fetch(GROQ_ENDPOINT, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'qwen/qwen3.8-27b',
        messages: [
          {
            role: 'system',
            content:
              'You are FinSarathi, an Indian personal finance AI assistant. Answer in English only in 1-2 concise sentences. Assume user spent Rs 770 at Swiggy this month across 2 orders.',
          },
          { role: 'user', content: englishInput },
        ],
        temperature: 0.1,
        max_tokens: 150,
      }),
    });

    if (response.ok) {
      const json = await response.json();
      englishResponse = json?.choices?.[0]?.message?.content?.trim() || '';
      console.log(`    ✅ LLM Output: "${englishResponse}"`);
    } else {
      console.log(`    ❌ LLM Error: ${response.status}`);
      return { success: false };
    }
  } catch (err: any) {
    console.log(`    ❌ Error: ${err.message}`);
    return { success: false };
  }

  // Step 3: Translate back to Marathi
  console.log('\n  ── STEP 3: Translate English → Regional (mr) ──');
  const finalMarathiOutput = await translateText(englishResponse, 'en', 'mr');
  console.log(`    ✅ Final Output for User (Marathi): "${finalMarathiOutput}"`);

  return { success: true };
}

// ============================================================
// MAIN EXECUTION
// ============================================================
async function main() {
  console.log('\n🔬 FinSarathi API Integration Test Suite');
  console.log('📅 ' + new Date().toLocaleString());
  console.log('━'.repeat(60));

  const groqResult = await testGroqAPI();
  const translationResult = await testTranslationAPI();
  const pipelineResult = await testFullPipeline();

  console.log('\n' + '='.repeat(60));
  console.log('📋 SUMMARY RESULTS');
  console.log('='.repeat(60));
  console.log(`  1. Groq LLM API:       ${groqResult.success ? `✅ WORKING (${groqResult.model})` : '❌ FAILED'}`);
  console.log(`  2. Translation REST:   ${translationResult.success ? '✅ WORKING' : '⚠️ FALLBACK ACTIVE'}`);
  console.log(`  3. 3-Step Pipeline:    ${pipelineResult.success ? '✅ PASSED' : '❌ FAILED'}`);
  console.log('='.repeat(60) + '\n');
}

main().catch(console.error);
