/**
 * ============================================================
 *  smsValidator.test.ts — Jest Test Suite
 *  Tests for FinSarathi SMS Gatekeeper Utility
 *
 *  Run:  npx jest src/utils/smsValidator.test.ts
 * ============================================================
 */
import { isValidBankingSMS, validateBankingSMS } from './smsValidator';

describe('FinSarathi SMS Gatekeeper — TRAI DLT Validation', () => {

  // ── TEST 1: Personal 10-digit mobile number → Gate 1 must block ───────────
  // Any SMS arriving from a 10-digit number is from a personal phone,
  // never a TRAI-registered commercial entity. Instant reject.
  test('GATE 1 — Rejects a standard 10-digit personal mobile number', () => {
    const result = validateBankingSMS(
      '9876543210',
      'Bhai kal milte hain, paise de dena'
    );
    expect(result.isValid).toBe(false);
    expect(result.rejectedAt).toBe('GATE_1_MOBILE_NUMBER');

    // Simplified API should also return false
    expect(isValidBankingSMS('9876543210', 'Bhai kal milte hain')).toBe(false);
  });

  // ── TEST 2: +91 prefix mobile number → Gate 1 should still block ──────────
  test('GATE 1 — Rejects +91 country-code prefixed mobile number', () => {
    const result = validateBankingSMS(
      '+919876543210',
      'Rs.2000 sent to your number. Please confirm.'
    );
    expect(result.isValid).toBe(false);
    expect(result.rejectedAt).toBe('GATE_1_MOBILE_NUMBER');
  });

  // ── TEST 3: Classic TRAI DLT header (2018 format) + valid financial body ──
  // AD-HDFCBK → 2-letter telecom code "AD" (Airtel Delhi),
  //              6-char brand "HDFCBK" (HDFC Bank)
  test('GATE 2 PASS — Accepts valid classic DLT header (AD-HDFCBK) with debit alert', () => {
    const result = validateBankingSMS(
      'AD-HDFCBK',
      'Your HDFC Bank a/c XX1234 is debited INR 2,500 on 19-Sep-26. Available balance: INR 1,84,000'
    );
    expect(result.isValid).toBe(true);
    expect(result.rejectedAt).toBeNull();
    expect(result.senderBrand).toBe('HDFCBK');
    expect(result.isKnownFinancialSender).toBe(true);
    // No 2025 suffix on this classic format
    expect(result.headerCategory).toBeNull();
  });

  // ── TEST 4: TCCCPR 2025 amendment — header with Transactional suffix -T ───
  // VM-ICICIB-T → Vodafone Maharashtra, ICICI Bank, Transactional category
  test('GATE 2 PASS — Accepts 2025-compliant DLT header with -T suffix (VM-ICICIB-T)', () => {
    const result = validateBankingSMS(
      'VM-ICICIB-T',
      'ICICI Bank: Rs.649 paid to NETFLIX via UPI on 24-Sep-2026. VPA: netflix@icici. Ref: 8823471199'
    );
    expect(result.isValid).toBe(true);
    expect(result.rejectedAt).toBeNull();
    expect(result.senderBrand).toBe('ICICIB');
    expect(result.headerCategory).toBe('T');  // Transactional confirmed
    expect(result.isKnownFinancialSender).toBe(true);
  });

  // ── TEST 5: Valid DLT header but fully promotional spam body → Gate 3 ──────
  // A bank sender can legitimately send promotional messages (credit card offers,
  // reward alerts). These should NOT pass through to the financial parser.
  test('GATE 3 — Rejects promo spam from a valid DLT bank header (no financial keywords)', () => {
    const result = validateBankingSMS(
      'AD-HDFCBK',
      'Apply now for HDFC Regalia Credit Card! Get 5x rewards and free airport lounge access. Visit hdfc.in/apply'
    );
    expect(result.isValid).toBe(false);
    expect(result.rejectedAt).toBe('GATE_3_NOT_FINANCIAL');
    // Both currency and action keywords are missing
    expect(result.reason).toContain('currency keyword');
    expect(result.reason).toContain('financial action keyword');
  });

  // ── TEST 6: Valid DLT header, OTP body (currency present but no action) ────
  // OTP messages from banks sometimes include account numbers but no action verb.
  // "₹" may appear in promotional text inside OTP messages — must not pass.
  test('GATE 3 — Rejects OTP message with no financial action keyword', () => {
    const result = validateBankingSMS(
      'JK-SBIOTP',
      'Your SBI Internet Banking OTP is 847321. Valid for 5 mins. Do NOT share with anyone.'
    );
    // Header format is valid (JK-SBIOTP → XX-XXXXXX)
    // Body has no ₹/Rs/INR AND no debited/credited/paid keywords
    expect(result.isValid).toBe(false);
    expect(result.rejectedAt).toBe('GATE_3_NOT_FINANCIAL');
  });

  // ── TEST 7: NPCI UPI credit — Government category header (-G) ─────────────
  // NPCI sends UPI credit alerts with a Government DLT suffix in 2025 format
  test('GATE 2 PASS — Accepts Government header (-G) NPCI UPI credit alert (with ₹)', () => {
    const result = validateBankingSMS(
      'AD-NPCIUP-G',
      '₹22,000.00 credited to your SBI a/c XX5678 via UPI on 12-Sep-2026. VPA: freelance@sbi. Ref: 90112234567'
    );
    expect(result.isValid).toBe(true);
    expect(result.senderBrand).toBe('NPCIUP');
    expect(result.headerCategory).toBe('G');
  });

  // ── TEST 8: Malformed header — wrong structure → Gate 2 must block ─────────
  // "HDFC-BANK" looks like a name but fails the XX-XXXXXX pattern:
  // operator code has 4 chars, brand slot has 4 chars — both invalid.
  test('GATE 2 — Rejects malformed header "HDFC-BANK" that breaks DLT format', () => {
    const result = validateBankingSMS(
      'HDFC-BANK',
      'Your account XX1234 debited INR 500 for Swiggy'
    );
    expect(result.isValid).toBe(false);
    expect(result.rejectedAt).toBe('GATE_2_INVALID_HEADER');
  });

  // ── TEST 9: Service category header (-S) — bank statement notification ─────
  test('GATE 2 PASS — Accepts Service category header (-S) for bank statement notification', () => {
    const result = validateBankingSMS(
      'MH-AXISBK-S',
      'Dear Customer, your Axis Bank account XX9876 balance is INR 54,320.00 as of 24-Sep-2026.'
    );
    expect(result.isValid).toBe(true);
    expect(result.senderBrand).toBe('AXISBK');
    expect(result.headerCategory).toBe('S');
  });

  // ── TEST 10: isValidBankingSMS simplified boolean API ────────────────────
  test('API — isValidBankingSMS returns true for valid HDFC debit SMS', () => {
    expect(
      isValidBankingSMS(
        'AD-HDFCBK-T',
        'Rs.1,999 debited from your HDFC account XX1234 for Cult.fit via UPI. Ref: 77123456789'
      )
    ).toBe(true);
  });

  test('API — isValidBankingSMS returns false for personal number', () => {
    expect(
      isValidBankingSMS('8800112233', 'Aaj kya plan hai yaar?')
    ).toBe(false);
  });
});
