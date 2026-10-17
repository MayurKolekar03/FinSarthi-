/**
 * ============================================================================
 *  smsParser.ts — FinSarathi.AI SMS Financial Extraction & Processing Pipeline
 *  Author: FinSarathi Edge AI & Mobile Systems Team
 *  Purpose: End-to-end pipeline that connects:
 *           1. TRAI DLT Gatekeeper Validation (smsValidator)
 *           2. Financial Entity Extraction (Amount, Type, Merchant, Account)
 *           3. Edge ML Inference Categorization (mlService - SetFit ONNX)
 *           4. Zero-Cloud Local Persistence (expo-sqlite)
 * ============================================================================
 */

import { validateBankingSMS, SMSValidationResult } from './smsValidator';
import { predictCategory, mapModelLabelToCategory } from './mlService';
import { getDB } from '../database/db';
import { Transaction, TransactionCategory, TransactionType } from '../types';

export interface ParsedSMSResult {
  success: boolean;
  validation: SMSValidationResult;
  extracted?: {
    amount: number;
    type: TransactionType;
    merchant: string;
    predictedCategory: string;
    uiCategory: TransactionCategory;
    accountReference?: string;
  };
  transaction?: Transaction;
  error?: string;
}

/**
 * Extracts numeric transaction amount from the SMS body.
 * Matches: "Rs. 450", "INR 1,250.00", "₹ 890", "Rs 35", etc.
 */
export function extractAmount(body: string): number | null {
  // Pattern matches currency symbol followed by amount
  const patterns = [
    /(?:rs\.?|inr|₹)\s*([\d,]+(?:\.\d{1,2})?)/i,
    /([\d,]+(?:\.\d{1,2})?)\s*(?:rs\.?|inr|₹)/i,
    /(?:debited(?:\s+by|\s+with)?|credited(?:\s+by|\s+with)?|spent|paid)\s+(?:rs\.?|inr|₹)?\s*([\d,]+(?:\.\d{1,2})?)/i,
  ];

  for (const regex of patterns) {
    const match = body.match(regex);
    if (match && match[1]) {
      const cleanNum = match[1].replace(/,/g, '');
      const parsed = parseFloat(cleanNum);
      if (!isNaN(parsed) && parsed > 0) {
        return parsed;
      }
    }
  }

  // Fallback generic number extraction if keywords exist
  const genericMatch = body.match(/\b\d+(\.\d{1,2})?\b/);
  if (genericMatch) {
    const val = parseFloat(genericMatch[0]);
    if (!isNaN(val) && val > 0) return val;
  }

  return null;
}

/**
 * Determines whether the transaction is a credit or debit.
 */
export function extractTransactionType(body: string): TransactionType {
  const lower = body.toLowerCase();
  if (
    lower.includes('credit') ||
    lower.includes('credited') ||
    lower.includes('received') ||
    lower.includes('deposited')
  ) {
    return 'credit';
  }
  return 'debit';
}

/**
 * Extracts merchant / payee / payer name from banking SMS text.
 */
export function extractMerchant(body: string, senderBrand: string | null): string {
  // Pattern 1: "at <Merchant>", "to <Merchant>", "for <Merchant>", "info: <Merchant>"
  const merchantRegexes = [
    /(?:at|to|for|info:?|towards|vpa)\s+([A-Za-z0-9\s'&.-]{2,35}?)(?:\s+(?:on|via|ref|using|avlbl|bal|avl|upi|a\/c|successful|approved|completed|done|\.)|\s*$)/i,
    /(?:paid to|spent on|transferred to)\s+([A-Za-z0-9\s'&.-]{2,35}?)(?:\s+(?:via|ref|using|bal|successful|approved|completed|done|\.)|\s*$)/i,
    /(?:credited (?:by|from))\s+([A-Za-z0-9\s'&.-]{2,35}?)(?:\s+(?:via|ref|upi|successful|approved|completed|done|\.)|\s*$)/i,
  ];

  for (const reg of merchantRegexes) {
    const match = body.match(reg);
    if (match && match[1]) {
      const cleaned = match[1].trim();
      if (cleaned.length > 2 && !/^(rs|inr|the|your|ac|account)$/i.test(cleaned)) {
        return cleaned;
      }
    }
  }

  // If no merchant entity could be extracted, use sender brand as fallback
  if (senderBrand) {
    return `${senderBrand} Transaction`;
  }

  return 'Local Merchant';
}

/**
 * Extracts account number indicator if present (e.g. "a/c XX1234").
 */
export function extractAccountNumber(body: string): string | undefined {
  const match = body.match(/(?:a\/c|acct|ac)\s*(?:no\.?)?\s*([xX\d*]{3,10})/i);
  return match ? match[1] : undefined;
}

/**
 * End-to-end SMS Parser & Processor:
 * 1. Validates via TRAI DLT rules
 * 2. Extracts transaction details
 * 3. Categorizes via SetFit ONNX model (Edge ML inference)
 * 4. Saves to SQLite database (replaces 'Uncategorized')
 */
export async function parseAndProcessSMS(
  sender: string,
  body: string,
  accountId = 'acc_hdfc'
): Promise<ParsedSMSResult> {
  // 1. Strict TRAI DLT Validation Gatekeeper
  const validation = validateBankingSMS(sender, body);
  if (!validation.isValid) {
    return {
      success: false,
      validation,
      error: `SMS rejected at ${validation.rejectedAt}: ${validation.reason}`,
    };
  }

  // 2. Extract Financial Entities
  const amount = extractAmount(body);
  if (!amount) {
    return {
      success: false,
      validation,
      error: 'Could not extract a valid transaction amount from SMS body.',
    };
  }

  const type = extractTransactionType(body);
  const merchant = extractMerchant(body, validation.senderBrand);
  const accountRef = extractAccountNumber(body);

  // 3. Edge ML Inference: Predict Category using SetFit ONNX model
  // Instead of 'Uncategorized', we use the trained SetFit ONNX model prediction!
  const predictedCategory = await predictCategory(merchant);
  const uiCategory = mapModelLabelToCategory(predictedCategory);

  // 4. Save into SQLite Database
  let savedTx: Transaction | undefined;
  try {
    const db = getDB();
    savedTx = await db.addTransaction({
      account_id: accountId,
      amount,
      merchant,
      category: uiCategory, // Stored as categorized instead of 'Uncategorized'
      type,
      date: new Date().toISOString(),
      notes: `Auto-parsed SMS [${sender}] • Model Predicted: ${predictedCategory}`,
    });
  } catch (err) {
    console.error('[SMSParser] Error persisting to SQLite database:', err);
  }

  return {
    success: true,
    validation,
    extracted: {
      amount,
      type,
      merchant,
      predictedCategory,
      uiCategory,
      accountReference: accountRef,
    },
    transaction: savedTx,
  };
}
