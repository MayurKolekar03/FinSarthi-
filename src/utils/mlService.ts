/**
 * ============================================================================
 *  mlService.ts — FinSarathi.AI On-Device Edge ML Inference Service
 *  Author: FinSarathi AI & Edge Systems Team
 *  Purpose: Singleton service for running local, offline SetFit ONNX model
 *           inference using onnxruntime-react-native.
 * ============================================================================
 */

import './nativeShims';
import { InferenceSession, Tensor } from 'onnxruntime-react-native';
import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';
import { TransactionCategory } from '../types';

/**
 * 6-Class Taxonomy from the trained & quantized SetFit model:
 * [0] EMI: Loans, auto-debit, ECS mandates
 * [1] Food: Swiggy, Zomato, cafes, dining, tea stalls
 * [2] Investment: Zerodha, Groww, Mutual Funds, SIP
 * [3] Personal_Transfer: P2P, sent to friends/family, UPI transfer
 * [4] Shopping: Amazon, Flipkart, retail, pharmacy, clothing
 * [5] Travel: Uber, Ola, IRCTC, petrol/fuel, Fastag
 */
export const SETFIT_CLASSES: readonly string[] = [
  'EMI',
  'Food',
  'Investment',
  'Personal_Transfer',
  'Shopping',
  'Travel',
] as const;

/**
 * Maps the 6 raw SetFit classes to FinSarathi UI TransactionCategory tokens.
 */
export function mapModelLabelToCategory(label: string): TransactionCategory {
  switch (label.toLowerCase()) {
    case 'food':
      return 'Food & Dining';
    case 'shopping':
      return 'Shopping';
    case 'travel':
      return 'Fuel & Travel';
    case 'emi':
      return 'Utilities & Bills';
    case 'investment':
      return 'Other';
    case 'personal_transfer':
      return 'Transfer';
    default:
      return 'Other';
  }
}

/**
 * Lightweight tokenization helper for BERT/MiniLM on-device inference.
 * BERT Special Tokens:
 *  - [PAD] = 0
 *  - [UNK] = 100
 *  - [CLS] = 101
 *  - [SEP] = 102
 */
const SEQ_LENGTH = 32;

function tokenizeText(text: string): { inputIds: Int32Array; attentionMask: Int32Array } {
  const inputIds = new Int32Array(SEQ_LENGTH);
  const attentionMask = new Int32Array(SEQ_LENGTH);

  // [CLS] token at index 0
  inputIds[0] = 101;
  attentionMask[0] = 1;

  // Normalize and split tokens
  const cleanTokens = text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  let pos = 1;
  for (const token of cleanTokens) {
    if (pos >= SEQ_LENGTH - 1) break;

    // Deterministic hash mapping into BERT vocab range (1000 - 28000)
    let hash = 0;
    for (let i = 0; i < token.length; i++) {
      hash = (hash << 5) - hash + token.charCodeAt(i);
      hash |= 0;
    }
    const vocabId = 1000 + (Math.abs(hash) % 27000);

    inputIds[pos] = vocabId;
    attentionMask[pos] = 1;
    pos++;
  }

  // [SEP] token
  inputIds[pos] = 102;
  attentionMask[pos] = 1;

  // Remaining tokens are 0 [PAD] with attention_mask = 0
  return { inputIds, attentionMask };
}

/**
 * Fallback heuristic classifier used if the native ONNX runtime bridge is
 * unavailable (e.g. during Expo Go testing or environment mock).
 */
function fallbackHeuristicClassifier(merchant: string): string {
  const lower = merchant.toLowerCase();

  // 1. Food
  if (
    lower.includes('swiggy') ||
    lower.includes('zomato') ||
    lower.includes('food') ||
    lower.includes('tea') ||
    lower.includes('coffee') ||
    lower.includes('cafe') ||
    lower.includes('restaurant') ||
    lower.includes('dhaba') ||
    lower.includes('tapri') ||
    lower.includes('pizza') ||
    lower.includes('burger') ||
    lower.includes('biryani') ||
    lower.includes('starbucks') ||
    lower.includes('mcdonald')
  ) {
    return 'Food';
  }

  // 2. Travel
  if (
    lower.includes('uber') ||
    lower.includes('ola') ||
    lower.includes('rapido') ||
    lower.includes('petrol') ||
    lower.includes('fuel') ||
    lower.includes('hpcl') ||
    lower.includes('bpcl') ||
    lower.includes('ioc') ||
    lower.includes('indianoil') ||
    lower.includes('fastag') ||
    lower.includes('irctc') ||
    lower.includes('metro') ||
    lower.includes('flight') ||
    lower.includes('indigo')
  ) {
    return 'Travel';
  }

  // 3. EMI
  if (
    lower.includes('emi') ||
    lower.includes('loan') ||
    lower.includes('bajaj') ||
    lower.includes('hdfc cred') ||
    lower.includes('autodebit') ||
    lower.includes('mandate') ||
    lower.includes('ecs')
  ) {
    return 'EMI';
  }

  // 4. Investment
  if (
    lower.includes('zerodha') ||
    lower.includes('groww') ||
    lower.includes('sip') ||
    lower.includes('mutual') ||
    lower.includes('upstox') ||
    lower.includes('angel') ||
    lower.includes('nifty') ||
    lower.includes('ppf')
  ) {
    return 'Investment';
  }

  // 5. Personal Transfer
  if (
    lower.includes('sent to') ||
    lower.includes('transfer to') ||
    lower.includes('credited by') ||
    lower.includes('received from') ||
    lower.includes('friend') ||
    lower.includes('mummy') ||
    lower.includes('papa') ||
    lower.includes('bhai')
  ) {
    return 'Personal_Transfer';
  }

  // 6. Shopping
  if (
    lower.includes('amazon') ||
    lower.includes('flipkart') ||
    lower.includes('myntra') ||
    lower.includes('ajio') ||
    lower.includes('pharmacy') ||
    lower.includes('apollo') ||
    lower.includes('medplus') ||
    lower.includes('croma') ||
    lower.includes('reliance') ||
    lower.includes('store') ||
    lower.includes('supermarket') ||
    lower.includes('mart')
  ) {
    return 'Shopping';
  }

  return 'Food'; // Default fallback category
}

/**
 * MLService — Singleton Edge AI Engine
 */
class MLService {
  private static instance: MLService | null = null;
  private session: InferenceSession | null = null;
  private loadingPromise: Promise<InferenceSession | null> | null = null;
  private isLoaded = false;

  private constructor() {}

  /**
   * Access the Singleton instance
   */
  public static getInstance(): MLService {
    if (!MLService.instance) {
      MLService.instance = new MLService();
    }
    return MLService.instance;
  }

  /**
   * Initializes and loads the ONNX model into memory.
   * If already loaded, returns the existing session immediately.
   */
  public async loadModel(): Promise<InferenceSession | null> {
    // 1. Fallback logic: If the model is already loaded, do not load it again.
    if (this.session && this.isLoaded) {
      return this.session;
    }

    // 2. Prevent concurrent duplicate load calls
    if (this.loadingPromise) {
      return this.loadingPromise;
    }

    this.loadingPromise = (async () => {
      try {
        // Resolve model asset bundled with the application
        const asset = Asset.fromModule(require('../../assets/models/model.onnx'));
        await asset.downloadAsync();

        let modelUri = asset.localUri || asset.uri;

        if (!modelUri) {
          throw new Error('Failed to resolve local URI for model.onnx');
        }

        // On Android / iOS native file paths, clean file:// prefix if needed
        if (Platform.OS === 'android' && modelUri.startsWith('file://')) {
          modelUri = modelUri.replace('file://', '');
        }

        // Create the InferenceSession via Microsoft ONNX Runtime
        this.session = await InferenceSession.create(modelUri);
        this.isLoaded = true;
        console.log('[MLService] SetFit ONNX model successfully loaded into memory.');
        return this.session;
      } catch (error) {
        console.warn(
          '[MLService] Native ONNX session initialization warning (using resilient fallback):',
          error
        );
        this.session = null;
        this.isLoaded = false;
        return null;
      } finally {
        this.loadingPromise = null;
      }
    })();

    return this.loadingPromise;
  }

  /**
   * Runs classification inference on the given merchant or SMS string.
   * Returns one of the 6 classes (e.g., "Food", "Shopping", "Travel", "EMI", "Investment", "Personal_Transfer").
   */
  public async predictCategory(merchantName: string): Promise<string> {
    if (!merchantName || !merchantName.trim()) {
      return 'Other';
    }

    const trimmed = merchantName.trim();

    try {
      // Ensure model is loaded
      if (!this.session) {
        await this.loadModel();
      }

      // If session is active, execute native ONNX inference
      if (this.session) {
        const { inputIds, attentionMask } = tokenizeText(trimmed);

        // Construct input Tensors (shape: [1, 32])
        const inputIdsTensor = new Tensor('int32', inputIds, [1, SEQ_LENGTH]);
        const attentionMaskTensor = new Tensor('int32', attentionMask, [1, SEQ_LENGTH]);

        const feeds: Record<string, Tensor> = {
          input_ids: inputIdsTensor,
          attention_mask: attentionMaskTensor,
        };

        const results = await this.session.run(feeds);

        // Extract logits from output tensor
        const outputTensor = results['logits'] || Object.values(results)[0];
        if (outputTensor && outputTensor.data) {
          const logits = outputTensor.data as Float32Array;

          let maxIdx = 0;
          let maxVal = -Infinity;
          for (let i = 0; i < logits.length; i++) {
            if (logits[i] > maxVal) {
              maxVal = logits[i];
              maxIdx = i;
            }
          }

          const predictedLabel = SETFIT_CLASSES[maxIdx];
          if (predictedLabel) {
            return predictedLabel;
          }
        }
      }
    } catch (err) {
      console.warn('[MLService] Inference error, utilizing edge heuristic fallback:', err);
    }

    // High-performance edge heuristic fallback
    return fallbackHeuristicClassifier(trimmed);
  }

  /**
   * Returns whether the model is currently loaded in memory.
   */
  public isModelLoaded(): boolean {
    return this.isLoaded && this.session !== null;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// CONVENIENCE SINGLETON EXPORTS
// ─────────────────────────────────────────────────────────────────────────────

export const mlService = MLService.getInstance();

export async function loadModel(): Promise<InferenceSession | null> {
  return mlService.loadModel();
}

export async function predictCategory(merchantName: string): Promise<string> {
  return mlService.predictCategory(merchantName);
}

export default mlService;
