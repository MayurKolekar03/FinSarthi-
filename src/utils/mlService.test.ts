/**
 * ============================================================================
 *  mlService.test.ts — Unit Tests for ML Service & SMS Parser Pipeline
 * ============================================================================
 */

// Mock native onnxruntime module in Node.js/Jest environment
jest.mock('onnxruntime-react-native', () => ({
  InferenceSession: {
    create: jest.fn().mockResolvedValue({
      run: jest.fn().mockImplementation((feeds: any) => {
        return Promise.resolve({
          logits: {
            data: new Float32Array([0.05, 0.95, 0.05, 0.05, 0.1, 0.05]), // 1 = Food
          },
        });
      }),
    }),
  },
  Tensor: jest.fn().mockImplementation((type: string, data: any, dims: number[]) => ({
    type,
    data,
    dims,
  })),
}));

jest.mock('expo-asset', () => ({
  Asset: {
    fromModule: jest.fn().mockReturnValue({
      downloadAsync: jest.fn().mockResolvedValue(true),
      localUri: 'file:///assets/models/model.onnx',
      uri: 'file:///assets/models/model.onnx',
    }),
  },
}));

import { mlService, predictCategory, mapModelLabelToCategory, SETFIT_CLASSES } from './mlService';
import { parseAndProcessSMS, extractAmount, extractMerchant, extractTransactionType } from './smsParser';

describe('FinSarathi Edge AI ML Service (SetFit ONNX)', () => {
  test('Singleton instance integrity: mlService returns same instance', () => {
    const s1 = mlService;
    const s2 = mlService;
    expect(s1).toBe(s2);
  });

  test('predictCategory classifies Food merchants correctly', async () => {
    const category = await predictCategory('Swiggy Instamart');
    expect(category).toBe('Food');
  });

  test('predictCategory classifies Travel merchants correctly', async () => {
    const category = await predictCategory('Uber India');
    expect(category).toBe('Travel');
  });

  test('predictCategory classifies Shopping merchants correctly', async () => {
    const category = await predictCategory('Amazon India Retail');
    expect(category).toBe('Shopping');
  });

  test('predictCategory classifies EMI & Loan correctly', async () => {
    const category = await predictCategory('Bajaj Finserv EMI');
    expect(category).toBe('EMI');
  });

  test('predictCategory classifies Investment merchants correctly', async () => {
    const category = await predictCategory('Zerodha Broking Limited');
    expect(category).toBe('Investment');
  });

  test('predictCategory classifies Personal_Transfer correctly', async () => {
    const category = await predictCategory('sent to Mummy monthly expenses');
    expect(category).toBe('Personal_Transfer');
  });

  test('mapModelLabelToCategory maps SetFit classes to UI categories', () => {
    expect(mapModelLabelToCategory('Food')).toBe('Food & Dining');
    expect(mapModelLabelToCategory('Shopping')).toBe('Shopping');
    expect(mapModelLabelToCategory('Travel')).toBe('Fuel & Travel');
    expect(mapModelLabelToCategory('EMI')).toBe('Utilities & Bills');
    expect(mapModelLabelToCategory('Personal_Transfer')).toBe('Transfer');
    expect(mapModelLabelToCategory('Investment')).toBe('Other');
  });

  test('SETFIT_CLASSES contains all 6 trained classes', () => {
    expect(SETFIT_CLASSES).toEqual([
      'EMI',
      'Food',
      'Investment',
      'Personal_Transfer',
      'Shopping',
      'Travel',
    ]);
  });
});

describe('FinSarathi SMS Financial Parser & Edge Pipeline', () => {
  test('extractAmount parses different currency formats correctly', () => {
    expect(extractAmount('INR 1,250.00 debited')).toBe(1250);
    expect(extractAmount('Paid Rs. 450 at Sharma Tea Stall')).toBe(450);
    expect(extractAmount('₹890 spent on Swiggy')).toBe(890);
    expect(extractAmount('Txn of Rs 2,340.50 approved')).toBe(2340.5);
  });

  test('extractTransactionType detects debit vs credit correctly', () => {
    expect(extractTransactionType('A/c debited INR 500')).toBe('debit');
    expect(extractTransactionType('A/c credited with INR 25,000')).toBe('credit');
    expect(extractTransactionType('Received INR 1,500 from Rohit')).toBe('credit');
  });

  test('extractMerchant extracts merchant names accurately', () => {
    expect(extractMerchant('Paid Rs 450 at Sharma Tea Stall via PhonePe', 'HDFCBK')).toBe('Sharma Tea Stall');
    expect(extractMerchant('Payment of Rs 740 to Domino Pizza India Ltd successful', 'HDFCBK')).toBe('Domino Pizza India Ltd');
    expect(extractMerchant('Spent INR 1,899 on your ICICI Card for Myntra Shopping', 'ICICIB')).toBe('Myntra Shopping');
  });

  test('parseAndProcessSMS rejects personal phone numbers at Gate 1', async () => {
    const res = await parseAndProcessSMS('9876543210', 'Bhai kal 500 rupaye de dena');
    expect(res.success).toBe(false);
    expect(res.validation.rejectedAt).toBe('GATE_1_MOBILE_NUMBER');
  });

  test('parseAndProcessSMS rejects non-compliant commercial header at Gate 2', async () => {
    const res = await parseAndProcessSMS('PROMO_DISCOUNT', 'Flat Rs 500 off on shopping today!');
    expect(res.success).toBe(false);
    expect(res.validation.rejectedAt).toBe('GATE_2_INVALID_HEADER');
  });

  test('parseAndProcessSMS rejects OTP/non-transactional messages at Gate 3', async () => {
    const res = await parseAndProcessSMS('AD-HDFCBK-T', 'Your OTP for NetBanking transaction is 748192. Valid for 10 mins.');
    expect(res.success).toBe(false);
    expect(res.validation.rejectedAt).toBe('GATE_3_NOT_FINANCIAL');
  });

  test('parseAndProcessSMS parses valid HDFC debit SMS and assigns Food category instead of Uncategorized', async () => {
    const res = await parseAndProcessSMS(
      'AD-HDFCBK-T',
      'Your HDFC Bank a/c XX1234 debited INR 450.00 at Sharma Tea Stall via UPI. Avl Bal: INR 1,84,050.'
    );

    expect(res.success).toBe(true);
    expect(res.extracted?.merchant).toBe('Sharma Tea Stall');
    expect(res.extracted?.amount).toBe(450);
    expect(res.extracted?.predictedCategory).toBe('Food');
    expect(res.extracted?.uiCategory).toBe('Food & Dining');
    expect(res.extracted?.uiCategory).not.toBe('Uncategorized');
  });

  test('parseAndProcessSMS parses valid ICICI shopping card SMS and assigns Shopping category', async () => {
    const res = await parseAndProcessSMS(
      'VM-ICICIB-T',
      'Spent INR 1,899 on your ICICI Card for Myntra Shopping on 12-Oct-26. Avl Lmt: INR 85,000.'
    );

    expect(res.success).toBe(true);
    expect(res.extracted?.merchant).toBe('Myntra Shopping');
    expect(res.extracted?.amount).toBe(1899);
    expect(res.extracted?.predictedCategory).toBe('Shopping');
    expect(res.extracted?.uiCategory).toBe('Shopping');
  });

  test('parseAndProcessSMS parses valid SBI travel SMS and assigns Fuel & Travel category', async () => {
    const res = await parseAndProcessSMS(
      'VK-SBIINB-T',
      'Paid Rs. 340 to Uber India via UPI ref 492019. Balance: Rs. 42,100.'
    );

    expect(res.success).toBe(true);
    expect(res.extracted?.merchant).toBe('Uber India');
    expect(res.extracted?.amount).toBe(340);
    expect(res.extracted?.predictedCategory).toBe('Travel');
    expect(res.extracted?.uiCategory).toBe('Fuel & Travel');
  });

  test('parseAndProcessSMS parses valid Axis EMI auto-debit SMS and assigns Utilities & Bills category', async () => {
    const res = await parseAndProcessSMS(
      'AD-AXISBK-T',
      'Auto-debit of INR 4,500 for HDFC Home Loan EMI completed on 12-Oct-26. Avl Bal: INR 92,000.'
    );

    expect(res.success).toBe(true);
    expect(res.extracted?.amount).toBe(4500);
    expect(res.extracted?.predictedCategory).toBe('EMI');
    expect(res.extracted?.uiCategory).toBe('Utilities & Bills');
  });
});
