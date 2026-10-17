/**
 * ============================================================
 *  smsValidator.ts — FinSarathi.AI SMS Gatekeeper
 *  Author: FinSarathi Engineering Team
 *  Purpose: Strict offline, zero-network validation layer that
 *           filters incoming SMS messages using TRAI DLT
 *           framework rules before any financial parsing.
 * ============================================================
 *
 *  TRAI Framework References:
 *  - TCCCPR 2018 (Telecom Commercial Communications Customer
 *    Preference Regulations) — base DLT header format.
 *  - TCCCPR Amendment 2025 — adds category suffix (-T/-S/-P/-G)
 *    to commercial sender headers.
 *
 *  Validation Pipeline (3 strict gates):
 *  ┌─────────────────────────────────────────────────────────┐
 *  │  Gate 1 → Block 10-digit mobile numbers (spam/personal) │
 *  │  Gate 2 → Validate TRAI DLT Sender ID format            │
 *  │  Gate 3 → Confirm financial intent via keyword matching │
 *  └─────────────────────────────────────────────────────────┘
 */

// ─────────────────────────────────────────────────────────────────────────────
// GATE 1 — REGEX: Block 10-digit personal/spam mobile numbers
// ─────────────────────────────────────────────────────────────────────────────
/**
 * Matches any standard Indian personal mobile number:
 *  - Optional country code prefix:  +91 | 0091 | 91
 *  - Followed by exactly 10 digits starting with 6–9
 *    (TRAI allocates 6xxx–9xxx range to mobile subscribers)
 *
 * These are NEVER valid commercial DLT senders.
 * Pattern:  ^(\+91|0091|91)?[6-9]\d{9}$
 */
const MOBILE_NUMBER_REGEX = /^(\+91|0091|91)?[6-9]\d{9}$/;

// ─────────────────────────────────────────────────────────────────────────────
// GATE 2 — REGEX: TRAI DLT Commercial Sender ID Header
// ─────────────────────────────────────────────────────────────────────────────
/**
 * TRAI DLT (Distributed Ledger Technology) mandates that every
 * commercial SMS must carry a registered alphanumeric Sender ID
 * (also called "Header") in one of two formats:
 *
 * Format A — Classic (TCCCPR 2018):
 *   XX-XXXXXX
 *   ├─ 2 uppercase letters  → Telecom Operator / Circle code
 *   │    e.g. AD (Airtel Delhi), VM (Vodafone Maharashtra)
 *   ├─ Hyphen separator  →  "-"
 *   └─ 6 alphanumeric chars → Brand/Entity identifier
 *        e.g. HDFCBK, ICICIB, SBIINB, PAYTMB
 *   Example: AD-HDFCBK, VM-ICICIB
 *
 * Format B — TCCCPR 2025 Amendment (with Category Suffix):
 *   XX-XXXXXX-C
 *   └─ All of Format A, plus:
 *      ├─ Another hyphen  →  "-"
 *      └─ Single category letter:
 *           T = Transactional (OTP, debit/credit alerts)
 *           S = Service       (account statements, KYC)
 *           P = Promotional   (offers, marketing — usually blocked)
 *           G = Government    (UIDAI, TRAI, Income Tax)
 *   Example: AD-HDFCBK-T, VM-ICICIB-S, AD-UIDAIN-G
 *
 * Pattern:  ^[A-Z]{2}-[A-Z0-9]{6}(-[TSPG])?$
 *            ─┬─────  ──┬───────  ──┬──────
 *             │         │           └─ Optional 2025 suffix
 *             │         └─ 6-char alphanumeric brand header
 *             └─ 2-letter operator/circle code
 */
const TRAI_DLT_HEADER_REGEX = /^[A-Z]{2}-[A-Z0-9]{6}(-[TSPG])?$/;

// ─────────────────────────────────────────────────────────────────────────────
// GATE 3A — Currency Keywords (at least ONE must be present)
// ─────────────────────────────────────────────────────────────────────────────
/**
 * Ensures the SMS body contains an Indian currency indicator.
 * Without a currency marker, even a valid bank header could
 * be sending a login OTP or promotional message — not a
 * financial transaction we need to process.
 *
 * Matches: ₹ | Rs | RS | INR | Inr (case-insensitive)
 */
const CURRENCY_KEYWORD_REGEX = /(\u20b9|rs\.?|inr)/i;

// ─────────────────────────────────────────────────────────────────────────────
// GATE 3B — Financial Action Keywords (at least ONE must be present)
// ─────────────────────────────────────────────────────────────────────────────
/**
 * Confirms that the message describes a real financial
 * transaction event — not just any message with a currency
 * symbol (e.g., a promotional "Get 50% off, save Rs.200!").
 *
 * Key terms covered:
 *   debited / credited        → Core debit/credit events (RBI mandate)
 *   paid / payment            → UPI, NEFT, IMPS outflow
 *   spent                     → Wallet and card spends
 *   txn / transaction         → Generic transaction reference
 *   withdrawn / deposited     → ATM and counter transactions
 *   transferred               → Fund transfer events
 *   received                  → Incoming funds (UPI/IMPS credit)
 *   balance                   → Account balance notifications
 *   purchase / autopay        → Card swipe / standing instruction
 *   refund / reversed         → Reversal & return events
 *   vpa                       → UPI Virtual Payment Address reference
 */
const FINANCIAL_ACTION_REGEX =
  /\b(debited|credited|paid|payment|spent|txn|transaction|withdrawn|deposited|transferred|received|balance|purchase|autopay|refund|reversed|vpa|bal|emi|auto-?debit)\b/i;

// ─────────────────────────────────────────────────────────────────────────────
// KNOWN FINANCIAL SENDER WHITELIST (supplementary, optional fast-path)
// ─────────────────────────────────────────────────────────────────────────────
/**
 * Well-known Indian banking & UPI sender brand codes.
 * If the 6-char brand section of a valid DLT header matches
 * one of these, the sender is pre-qualified as financial —
 * we still enforce keyword gate 3 for body verification.
 */
const KNOWN_FINANCIAL_SENDERS = new Set([
  'HDFCBK', // HDFC Bank
  'ICICIB', // ICICI Bank
  'SBIINB', // State Bank of India
  'AXISBK', // Axis Bank
  'KOTAKB', // Kotak Mahindra Bank
  'PAYTMB', // Paytm Payments Bank
  'BOIIND', // Bank of India
  'PNBSMS', // Punjab National Bank
  'CENTBK', // Central Bank of India
  'INDUSB', // IndusInd Bank
  'YESBNK', // Yes Bank
  'SCBKMS', // Standard Chartered Bank
  'IDFCBK', // IDFC First Bank
  'RBLBKL', // RBL Bank
  'BAJAJF', // Bajaj Finance
  'NPCIUP', // NPCI UPI
  'GPAYMS', // Google Pay
  'PHONEPE', // PhonePe (7 chars — header only, not strict DLT brand slot)
  'ATMSBI', // SBI ATM
]);

// ─────────────────────────────────────────────────────────────────────────────
// VALIDATION RESULT TYPE — rich output for logging and debugging
// ─────────────────────────────────────────────────────────────────────────────
export interface SMSValidationResult {
  /** Whether the SMS passed all 3 TRAI gates */
  isValid: boolean;
  /** The gate that caused rejection, or null if passed */
  rejectedAt: 'GATE_1_MOBILE_NUMBER' | 'GATE_2_INVALID_HEADER' | 'GATE_3_NOT_FINANCIAL' | null;
  /** Human-readable reason */
  reason: string;
  /** Whether the sender brand matched the known financial whitelist */
  isKnownFinancialSender: boolean;
  /** Extracted brand code from sender, if available */
  senderBrand: string | null;
  /** Detected category suffix from 2025 header format, if present */
  headerCategory: 'T' | 'S' | 'P' | 'G' | null;
}

// ─────────────────────────────────────────────────────────────────────────────
// PRIMARY EXPORT — isValidBankingSMS
// ─────────────────────────────────────────────────────────────────────────────
/**
 * Validates an incoming SMS against TRAI DLT framework rules.
 *
 * @param sender - Raw sender string from the SMS intent/reader
 *                 (e.g., "AD-HDFCBK", "AD-HDFCBK-T", "9876543210")
 * @param body   - Raw SMS body text
 * @returns      - boolean — true if the SMS is a valid banking SMS
 *
 * @example
 * isValidBankingSMS("AD-HDFCBK-T", "Your HDFC a/c XX1234 debited INR 345.00 for Uber")
 * // => true
 *
 * isValidBankingSMS("9876543210", "Hi, how are you?")
 * // => false
 */
export function isValidBankingSMS(sender: string, body: string): boolean {
  return validateBankingSMS(sender, body).isValid;
}

/**
 * Extended validation that returns a rich result object.
 * Useful for logging, debugging, and analytics within the app.
 *
 * @param sender - Raw sender/header string
 * @param body   - Raw SMS body text
 * @returns      - SMSValidationResult
 */
export function validateBankingSMS(sender: string, body: string): SMSValidationResult {
  const normalizedSender = sender.trim().toUpperCase();

  // ── GATE 1: Block standard 10-digit mobile numbers ────────────────────────
  // Standard personal/spam numbers like +919876543210 NEVER come from
  // registered DLT commercial senders. Instant reject.
  if (MOBILE_NUMBER_REGEX.test(sender.trim())) {
    return {
      isValid: false,
      rejectedAt: 'GATE_1_MOBILE_NUMBER',
      reason: 'Sender is a 10-digit mobile number — not a TRAI DLT registered commercial header.',
      isKnownFinancialSender: false,
      senderBrand: null,
      headerCategory: null,
    };
  }

  // ── GATE 2: Validate TRAI DLT Sender ID header format ────────────────────
  // Must match XX-XXXXXX or XX-XXXXXX-[TSPG] exactly.
  if (!TRAI_DLT_HEADER_REGEX.test(normalizedSender)) {
    return {
      isValid: false,
      rejectedAt: 'GATE_2_INVALID_HEADER',
      reason: `Sender "${sender}" does not conform to TRAI DLT header format (XX-XXXXXX or XX-XXXXXX-[T/S/P/G]).`,
      isKnownFinancialSender: false,
      senderBrand: null,
      headerCategory: null,
    };
  }

  // Parse the brand code (position 3–8) and category suffix if present
  const parts = normalizedSender.split('-');
  // parts[0] = operator code (e.g., "AD"), parts[1] = brand (e.g., "HDFCBK"), parts[2]? = category
  const senderBrand = parts[1] ?? null;
  const headerCategory = (parts[2] as 'T' | 'S' | 'P' | 'G') ?? null;
  const isKnownFinancialSender = senderBrand ? KNOWN_FINANCIAL_SENDERS.has(senderBrand) : false;

  // ── GATE 3: Financial keyword validation in body ──────────────────────────
  // Even a valid DLT header can send OTPs, promotional deals, or service
  // messages. We ONLY want actual monetary transaction events.
  const hasCurrencyKeyword = CURRENCY_KEYWORD_REGEX.test(body);
  const hasActionKeyword = FINANCIAL_ACTION_REGEX.test(body);

  if (!hasCurrencyKeyword || !hasActionKeyword) {
    const missingItems: string[] = [];
    if (!hasCurrencyKeyword) missingItems.push('currency keyword (₹ / Rs / INR)');
    if (!hasActionKeyword) missingItems.push('financial action keyword (debited / credited / paid / txn …)');

    return {
      isValid: false,
      rejectedAt: 'GATE_3_NOT_FINANCIAL',
      reason: `SMS body missing: ${missingItems.join(' and ')}. Not a financial transaction message.`,
      isKnownFinancialSender,
      senderBrand,
      headerCategory,
    };
  }

  // ── ALL GATES PASSED ──────────────────────────────────────────────────────
  return {
    isValid: true,
    rejectedAt: null,
    reason: 'SMS passed all 3 TRAI DLT validation gates. Safe to parse for financial data.',
    isKnownFinancialSender,
    senderBrand,
    headerCategory,
  };
}


// ─────────────────────────────────────────────────────────────────────────────
// Tests are located in: src/utils/smsValidator.test.ts
// Run with:  npx jest src/utils/smsValidator.test.ts
// ─────────────────────────────────────────────────────────────────────────────
