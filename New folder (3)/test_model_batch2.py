"""
Test Suite Batch 2: 200 Brand New, Unseen Tricky Real-World SMS Examples
========================================================================
Stress-testing the fine-tuned SetFit model in ./saved_setfit_model
to diagnose overfitting across real-world Indian banking SMS variations.
"""

import os
import sys

# Ensure UTF-8 output encoding on Windows console
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
if hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding='utf-8', errors='replace')

import torch
import numpy as np
from setfit import SetFitModel

CLASS_NAMES = [
    "EMI",                 # 0: Loans, EMI debits, credit card auto-debit, ECS mandates
    "Food",                # 1: Restaurants, food delivery, cafes, street vendors, tapri, sweets
    "Investment",          # 2: Stocks, mutual funds, SIP, Zerodha, Groww, PPF, FDs, Demat
    "Personal_Transfer",   # 3: P2P, sent to friends/family, credited by someone, rent, split
    "Shopping",            # 4: E-commerce, retail, medical/pharmacy, electronics, subscriptions
    "Travel"               # 5: Uber, Ola, IRCTC, flights, petrol/fuel, Fastag, metro, bus
]

# ─────────────────────────────────────────────────────────────
# 200 BRAND NEW, UNSEEN TRICKY REAL-WORLD SMS EXAMPLES (BATCH 2)
# ─────────────────────────────────────────────────────────────
TEST_CASES_BATCH2 = [
    # --- 1-35: Food / Street Vendors / Sweets / Cafes / Cloud Kitchens ---
    {"sms": "Paid Rs 30 for bun samosa at station canteen", "expected": "Food"},
    {"sms": "INR 240 debited for Behrouz Biryani order on GPay", "expected": "Food"},
    {"sms": "Paid 20 to roadside Puchka stall via PhonePe QR", "expected": "Food"},
    {"sms": "Payment of Rs 180 to Goli Vada Pav center", "expected": "Food"},
    {"sms": "Rs 420 spent at Anand Sweets thali Bangalore", "expected": "Food"},
    {"sms": "Paid Rs 55 for cutting chai sutta stall near metro", "expected": "Food"},
    {"sms": "Payment of Rs 890 at Barbeque Nation buffet", "expected": "Food"},
    {"sms": "Rs 130 paid to Faasos roll delivery via Paytm", "expected": "Food"},
    {"sms": "Paid INR 75 at MTR Dosa Counter Lalbagh", "expected": "Food"},
    {"sms": "Debit of Rs 350 at Sweet Bengal rasgulla shop", "expected": "Food"},
    {"sms": "Paid Rs 40 for Filter Kaapi at Vidyarthi Bhavan", "expected": "Food"},
    {"sms": "Rs 650 debited for Bawarchi Biryani RTC X Roads", "expected": "Food"},
    {"sms": "Paid Rs 85 to Fresh Juice and Shake center", "expected": "Food"},
    {"sms": "Payment of Rs 1,450 at Karim's Jama Masjid", "expected": "Food"},
    {"sms": "Rs 280 paid for Ovenstory Pizza slice combo", "expected": "Food"},
    {"sms": "Paid Rs 45 at Sharma Ji Bhojnalaya for lunch", "expected": "Food"},
    {"sms": "INR 320 debited at Mad Over Donuts Phoenix Mall", "expected": "Food"},
    {"sms": "Paid 15 for masala chai at office tapri", "expected": "Food"},
    {"sms": "Payment of Rs 520 to Biryani By Kilo via UPI", "expected": "Food"},
    {"sms": "Rs 190 spent at Baskin Robbins ice cream parlor", "expected": "Food"},
    {"sms": "Paid Rs 35 at south indian idli vada cart", "expected": "Food"},
    {"sms": "Debit of Rs 780 for Mainland China family dinner", "expected": "Food"},
    {"sms": "Paid INR 90 at Tibbs Frankie counter via GPay", "expected": "Food"},
    {"sms": "Paid Rs 60 to Annapurna mess for evening tiffin", "expected": "Food"},
    {"sms": "Rs 210 debited for Dunkin Donuts coffee and donut", "expected": "Food"},
    {"sms": "Paid 50 to Chole Bhature stall Chandni Chowk", "expected": "Food"},
    {"sms": "Payment of Rs 340 at Third Wave Coffee Roasters", "expected": "Food"},
    {"sms": "Paid Rs 110 at Chaayos terminal 1 airport", "expected": "Food"},
    {"sms": "Rs 450 paid to Behrouz royal biryani meal", "expected": "Food"},
    {"sms": "Paid INR 25 at roadside coconut water stall", "expected": "Food"},
    {"sms": "Payment of Rs 880 at Punjab Grill express", "expected": "Food"},
    {"sms": "Paid Rs 140 for shawarma at Al Bake outlet", "expected": "Food"},
    {"sms": "Rs 75 debited at Amrutulya Chai counter", "expected": "Food"},
    {"sms": "Paid 120 for momos at roadside Chinese corner", "expected": "Food"},
    {"sms": "Payment of Rs 400 to Saravana Bhavan for lunch", "expected": "Food"},

    # --- 36-70: Personal Transfer / P2P / Friends / Family / Landlord ---
    {"sms": "A/c XX4820 credited with Rs 4,500 from SANDEEP KULKARNI", "expected": "Personal_Transfer"},
    {"sms": "Sent Rs 1,800 to Neha for birthday dinner share", "expected": "Personal_Transfer"},
    {"sms": "Transferred Rs 3,000 to mom for temple puja expenses", "expected": "Personal_Transfer"},
    {"sms": "Sent Rs 700 to roommate Ankit for wifi bill split", "expected": "Personal_Transfer"},
    {"sms": "Received Rs 2,200 from VIKAS on PhonePe ref 938210", "expected": "Personal_Transfer"},
    {"sms": "A/c XX1940 credited with INR 15,000 from RAHUL VERMA", "expected": "Personal_Transfer"},
    {"sms": "Sent Rs 500 to younger brother for pocket allowance", "expected": "Personal_Transfer"},
    {"sms": "Transferred Rs 20,000 to Landlord Satish Kumar for flat deposit", "expected": "Personal_Transfer"},
    {"sms": "Paid Rs 350 to plumber Ramesh for tap repair via UPI", "expected": "Personal_Transfer"},
    {"sms": "Sent Rs 850 to Priya on GPay for movie tickets split", "expected": "Personal_Transfer"},
    {"sms": "A/c credited by Rs 1,200 from ALOK SINGH VPA alok@oksbi", "expected": "Personal_Transfer"},
    {"sms": "Transferred Rs 5,000 to sister Ritu for rakhi celebration", "expected": "Personal_Transfer"},
    {"sms": "Sent Rs 400 to colleague Divya for office tea contribution", "expected": "Personal_Transfer"},
    {"sms": "Received Rs 800 from ROHIT on Paytm wallet", "expected": "Personal_Transfer"},
    {"sms": "Sent Rs 150 to auto driver via PhonePe QR code", "expected": "Personal_Transfer"},
    {"sms": "Transferred Rs 1,500 to gym instructor Vicky", "expected": "Personal_Transfer"},
    {"sms": "Sent Rs 2,500 to uncle Mahesh for family function", "expected": "Personal_Transfer"},
    {"sms": "A/c XX8219 credited with Rs 6,000 from MANOJ TIWARI", "expected": "Personal_Transfer"},
    {"sms": "Transferred Rs 800 to society security guard Diwali bonus", "expected": "Personal_Transfer"},
    {"sms": "Sent Rs 300 to milkman for monthly milk balance", "expected": "Personal_Transfer"},
    {"sms": "Received INR 3,400 from SNEHA Splitwise trip settlement", "expected": "Personal_Transfer"},
    {"sms": "Sent Rs 1,000 to cousin Pooja for wedding gift contribution", "expected": "Personal_Transfer"},
    {"sms": "Transferred Rs 12,000 to Father PNB account", "expected": "Personal_Transfer"},
    {"sms": "A/c credited with Rs 750 from DEEPAK GUPTA via UPI", "expected": "Personal_Transfer"},
    {"sms": "Sent Rs 600 to laundry bhaiya for iron clothes", "expected": "Personal_Transfer"},
    {"sms": "Transferred Rs 450 to friend Siddharth for petrol share", "expected": "Personal_Transfer"},
    {"sms": "Received Rs 1,000 from KUNAL on Google Pay", "expected": "Personal_Transfer"},
    {"sms": "Sent Rs 2,000 to mother SBI savings account", "expected": "Personal_Transfer"},
    {"sms": "Transferred Rs 350 to car washer for monthly cleaning", "expected": "Personal_Transfer"},
    {"sms": "A/c XX3109 credited with INR 8,500 from AMITABH JOSHI", "expected": "Personal_Transfer"},
    {"sms": "Sent Rs 500 to barber salon bhaiya via UPI", "expected": "Personal_Transfer"},
    {"sms": "Transferred Rs 1,800 to badminton court partner for booking", "expected": "Personal_Transfer"},
    {"sms": "Received Rs 500 from CHETAN on BHIM UPI", "expected": "Personal_Transfer"},
    {"sms": "Sent Rs 7,000 to brother for college tuition fee", "expected": "Personal_Transfer"},
    {"sms": "Transferred Rs 250 to fruit seller via Paytm QR", "expected": "Personal_Transfer"},

    # --- 71-105: Shopping / Medical / Pharmacy / Retail / Subscriptions ---
    {"sms": "Paid Rs 680 at Tata 1mg for thyroid health test package", "expected": "Shopping"},
    {"sms": "Payment of Rs 1,299 at Zudio fast fashion clothing", "expected": "Shopping"},
    {"sms": "INR 450 debited at Pharmeasy medicine order #9948", "expected": "Shopping"},
    {"sms": "Paid Rs 3,200 at Shoppers Stop retail mall invoice", "expected": "Shopping"},
    {"sms": "Rs 890 spent on Blinkit instant snacks & groceries", "expected": "Shopping"},
    {"sms": "Payment of Rs 14,999 at IKEA furniture Hyderabad", "expected": "Shopping"},
    {"sms": "Paid Rs 540 at MedPlus chemist for cough syrup", "expected": "Shopping"},
    {"sms": "INR 1,199 debited on Max Fashion garments store", "expected": "Shopping"},
    {"sms": "Paid Rs 2,400 at Pepperfry home decor purchase", "expected": "Shopping"},
    {"sms": "Rs 380 paid at Apollo Pharmacy chemist store", "expected": "Shopping"},
    {"sms": "Payment of Rs 1,850 at Poorvika Mobiles for powerbank", "expected": "Shopping"},
    {"sms": "Paid Rs 499 for Disney+ Hotstar annual VIP subscription", "expected": "Shopping"},
    {"sms": "INR 950 debited on Zepto dark store grocery order", "expected": "Shopping"},
    {"sms": "Paid Rs 1,400 at SpecsMakers for reading glasses", "expected": "Shopping"},
    {"sms": "Payment of Rs 850 at Hamleys toy retail shop", "expected": "Shopping"},
    {"sms": "Rs 320 paid at Wellness Forever for vitamins", "expected": "Shopping"},
    {"sms": "Paid Rs 2,999 on Myntra festive clothing sale", "expected": "Shopping"},
    {"sms": "INR 650 debited at local Kirana general grocery shop", "expected": "Shopping"},
    {"sms": "Payment of Rs 1,100 at Purplle online makeup store", "expected": "Shopping"},
    {"sms": "Paid Rs 420 for novel books at Crossword bookstore", "expected": "Shopping"},
    {"sms": "Rs 129 debited for YouTube Premium individual plan", "expected": "Shopping"},
    {"sms": "Paid Rs 2,100 at Croma store for wireless mouse", "expected": "Shopping"},
    {"sms": "Payment of Rs 750 at Mamaearth organic skincare", "expected": "Shopping"},
    {"sms": "INR 3,499 debited at Titan Watch retail showroom", "expected": "Shopping"},
    {"sms": "Paid Rs 280 at Gupta Hardware for electrical switch", "expected": "Shopping"},
    {"sms": "Payment of Rs 890 at Woodland leather belt counter", "expected": "Shopping"},
    {"sms": "Paid Rs 1,650 at Bata footwear for school shoes", "expected": "Shopping"},
    {"sms": "Rs 450 debited for Cult.fit gym monthly session pass", "expected": "Shopping"},
    {"sms": "Payment of Rs 920 at Sugar Cosmetics outlet", "expected": "Shopping"},
    {"sms": "Paid Rs 3,800 on Flipkart Internet for air fryer", "expected": "Shopping"},
    {"sms": "INR 150 debited for photocopy and stationary printout", "expected": "Shopping"},
    {"sms": "Payment of Rs 1,750 at Crocs retail footwear store", "expected": "Shopping"},
    {"sms": "Paid Rs 550 at Organic India health supplement store", "expected": "Shopping"},
    {"sms": "Rs 2,800 spent at Raymond showroom for shirt fabric", "expected": "Shopping"},
    {"sms": "Payment of Rs 620 at Netmeds pharmacy for prescription", "expected": "Shopping"},

    # --- 106-140: Travel / Cabs / IRCTC / Flights / Fuel / Fastag / Metro ---
    {"sms": "Paid Rs 140 for InDrive cab ride to railway station", "expected": "Travel"},
    {"sms": "INR 85 debited for Namma Yatri auto trip Bangalore", "expected": "Travel"},
    {"sms": "Rs 1,280 paid to IRCTC tatkal train ticket booking", "expected": "Travel"},
    {"sms": "Payment of Rs 2,500 at Hindustan Petroleum fuel pump", "expected": "Travel"},
    {"sms": "Fastag toll deduction of Rs 95 at NH44 toll plaza", "expected": "Travel"},
    {"sms": "Paid Rs 5,200 to SpiceJet for flight ticket Delhi-Goa", "expected": "Travel"},
    {"sms": "INR 55 debited for Uber Moto bike ride in Noida", "expected": "Travel"},
    {"sms": "Paid Rs 300 for Bengaluru Namma Metro smart card recharge", "expected": "Travel"},
    {"sms": "Rs 1,800 spent on Bharat Petroleum Speed petrol bunk", "expected": "Travel"},
    {"sms": "Payment of Rs 750 to KSRTC bus booking for Mysore", "expected": "Travel"},
    {"sms": "Fastag toll debit of Rs 140 at Mumbai Pune Expressway", "expected": "Travel"},
    {"sms": "Paid Rs 380 for BluSmart EV cab ride to airport T3", "expected": "Travel"},
    {"sms": "INR 6,100 debited for Akasa Air domestic flight", "expected": "Travel"},
    {"sms": "Paid Rs 80 for parking fee at Terminal 1 airport", "expected": "Travel"},
    {"sms": "Payment of Rs 1,150 at Shell petrol bunk diesel refill", "expected": "Travel"},
    {"sms": "Rs 65 paid for Rapido bike taxi ride in Pune", "expected": "Travel"},
    {"sms": "Paid Rs 950 to MSRTC Volvo bus ticket booking", "expected": "Travel"},
    {"sms": "Fastag toll plaza fee Rs 80 deducted at Gurgaon toll", "expected": "Travel"},
    {"sms": "INR 220 debited for Ola Auto ride to office", "expected": "Travel"},
    {"sms": "Paid Rs 450 for Zoomcar hourly vehicle deposit", "expected": "Travel"},
    {"sms": "Payment of Rs 1,420 for IRCTC Rajdhani train journey", "expected": "Travel"},
    {"sms": "Rs 500 paid for Delhi Metro card topup via Paytm", "expected": "Travel"},
    {"sms": "Paid Rs 2,100 at Indian Oil petrol station fuel refill", "expected": "Travel"},
    {"sms": "INR 180 debited for Meru Cabs airport drop", "expected": "Travel"},
    {"sms": "Payment of Rs 4,800 to MakeMyTrip flight booking", "expected": "Travel"},
    {"sms": "Fastag auto-recharge of Rs 1,000 successful on GPay", "expected": "Travel"},
    {"sms": "Paid Rs 120 for Mumbai Local Train quarterly pass", "expected": "Travel"},
    {"sms": "INR 850 debited for Nayara Energy highway fuel station", "expected": "Travel"},
    {"sms": "Paid Rs 40 for railway station two wheeler parking", "expected": "Travel"},
    {"sms": "Payment of Rs 310 for Uber Premier cab ride", "expected": "Travel"},
    {"sms": "Rs 1,650 paid on Yatra.com for travel ticket", "expected": "Travel"},
    {"sms": "Paid Rs 250 for Chalo city bus smart card balance", "expected": "Travel"},
    {"sms": "INR 70 debited for Rapido Auto ride in Hyderabad", "expected": "Travel"},
    {"sms": "Payment of Rs 1,300 at CNG gas pump filling", "expected": "Travel"},
    {"sms": "Fastag toll fee Rs 115 deducted at Panipat Expressway", "expected": "Travel"},

    # --- 141-170: EMI / Loans / Credit Card Auto-Debit / ECS / Pay Later ---
    {"sms": "Dear Customer, ECS debit of Rs 9,200 for Bajaj Finance loan", "expected": "EMI"},
    {"sms": "HDFC Bank auto-debit of Rs 21,500 for home loan account", "expected": "EMI"},
    {"sms": "SBI auto-debit of Rs 7,800 towards car loan account", "expected": "EMI"},
    {"sms": "ICICI Bank personal loan installment Rs 4,120 debited", "expected": "EMI"},
    {"sms": "Kotak Mahindra consumer durable EMI Rs 1,899 debited", "expected": "EMI"},
    {"sms": "Axis Bank loan EMI of Rs 13,400 deducted from account", "expected": "EMI"},
    {"sms": "IDFC FIRST Bank education loan mandate Rs 5,600 debited", "expected": "EMI"},
    {"sms": "Tata Capital business loan EMI Rs 18,000 debited", "expected": "EMI"},
    {"sms": "Hero Fincorp bike loan installment Rs 3,250 debited", "expected": "EMI"},
    {"sms": "TVS Credit two-wheeler loan monthly EMI Rs 2,990 deducted", "expected": "EMI"},
    {"sms": "Canara Bank vehicle loan auto-debit Rs 6,700 completed", "expected": "EMI"},
    {"sms": "Bank of Baroda home loan EMI of Rs 16,800 debited", "expected": "EMI"},
    {"sms": "L&T Finance housing loan monthly payment Rs 14,200 cleared", "expected": "EMI"},
    {"sms": "Aditya Birla Finance personal loan EMI Rs 5,300 debited", "expected": "EMI"},
    {"sms": "Muthoot Finance gold loan monthly interest Rs 2,400 debited", "expected": "EMI"},
    {"sms": "Manappuram Gold loan interest Rs 1,850 debited from A/c", "expected": "EMI"},
    {"sms": "Credit card minimum amount due Rs 3,500 auto-debited", "expected": "EMI"},
    {"sms": "HDFC Credit card total amount due Rs 24,800 cleared", "expected": "EMI"},
    {"sms": "SBI Card payment Rs 11,200 credited to card ending 4019", "expected": "EMI"},
    {"sms": "ICICI Bank Coral credit card bill payment Rs 9,450 cleared", "expected": "EMI"},
    {"sms": "Axis Bank Magnus credit card autopay Rs 18,900 successful", "expected": "EMI"},
    {"sms": "OneCard metal credit card monthly bill Rs 6,320 debited", "expected": "EMI"},
    {"sms": "Amazon Pay Later installment Rs 1,499 auto-debited", "expected": "EMI"},
    {"sms": "Flipkart Pay Later EMI deduction Rs 890 completed", "expected": "EMI"},
    {"sms": "ZestMoney smartphone EMI debit Rs 1,699 cleared", "expected": "EMI"},
    {"sms": "Snapmint laptop EMI installment Rs 2,499 debited", "expected": "EMI"},
    {"sms": "Simpl Pay Later monthly bill Rs 1,280 cleared via UPI", "expected": "EMI"},
    {"sms": "LazyPay pay later bill payment Rs 890 completed", "expected": "EMI"},
    {"sms": "Slice credit card repayment Rs 3,100 executed", "expected": "EMI"},
    {"sms": "KreditBee personal loan monthly EMI Rs 2,150 debited", "expected": "EMI"},

    # --- 171-200: Investment / Stocks / Mutual Funds / SIP / PPF / NPS / FDs ---
    {"sms": "Rs 4,000 debited for Zerodha Coin mutual fund SIP", "expected": "Investment"},
    {"sms": "Groww demat account addition Rs 7,500 via UPI", "expected": "Investment"},
    {"sms": "Upstox Pro trading account fund transfer Rs 12,000", "expected": "Investment"},
    {"sms": "Angel One SpeedPro trading wallet Rs 5,000 added", "expected": "Investment"},
    {"sms": "Nippon India Growth Fund SIP Rs 2,500 debited", "expected": "Investment"},
    {"sms": "Mirae Asset Emerging Bluechip SIP Rs 3,000 cleared", "expected": "Investment"},
    {"sms": "Parag Parikh Conservative Hybrid SIP Rs 1,500 executed", "expected": "Investment"},
    {"sms": "Quant Small Cap Fund monthly SIP Rs 2,000 debited", "expected": "Investment"},
    {"sms": "SBI Contra Fund SIP of Rs 4,500 executed successfully", "expected": "Investment"},
    {"sms": "HDFC Balanced Advantage Fund SIP Rs 5,000 debited", "expected": "Investment"},
    {"sms": "ICICI Prudential Technology Fund SIP Rs 1,000 debited", "expected": "Investment"},
    {"sms": "Tata Small Cap Fund SIP installment Rs 2,500 cleared", "expected": "Investment"},
    {"sms": "UTI Nifty Next 50 Index Fund SIP Rs 3,000 debited", "expected": "Investment"},
    {"sms": "Axis Midcap Fund SIP execution Rs 2,000 completed", "expected": "Investment"},
    {"sms": "Kotak Small Cap Fund SIP debit Rs 3,500 executed", "expected": "Investment"},
    {"sms": "Motilal Oswal Midcap Fund SIP Rs 4,000 debited", "expected": "Investment"},
    {"sms": "Public Provident Fund PPF contribution Rs 10,000 to SBI", "expected": "Investment"},
    {"sms": "National Pension Scheme NPS Tier 2 contribution Rs 5,000", "expected": "Investment"},
    {"sms": "Fixed deposit FD booking Rs 50,000 via NetBanking", "expected": "Investment"},
    {"sms": "Recurring deposit RD monthly installment Rs 5,000 debited", "expected": "Investment"},
    {"sms": "Sovereign Gold Bond tranche purchase Rs 28,000 debited", "expected": "Investment"},
    {"sms": "Treasury bills T-bills allotment Rs 20,000 RBI Direct", "expected": "Investment"},
    {"sms": "CoinDCX Bitcoin crypto wallet deposit Rs 3,000 approved", "expected": "Investment"},
    {"sms": "WazirX INR wallet addition Rs 2,500 via IMPS", "expected": "Investment"},
    {"sms": "ZebPay crypto trading deposit Rs 1,500 successful", "expected": "Investment"},
    {"sms": "Grip Invest bond fractional investment Rs 15,000 debited", "expected": "Investment"},
    {"sms": "Wint Wealth high yield corporate bond purchase Rs 25,000", "expected": "Investment"},
    {"sms": "Indmoney US stocks wallet funding Rs 8,000 via UPI", "expected": "Investment"},
    {"sms": "Vested Finance US market investment deposit Rs 10,000", "expected": "Investment"},
    {"sms": "Edelweiss Balanced Advantage Fund SIP Rs 3,000 executed", "expected": "Investment"}
]

def main():
    model_path = "./saved_setfit_model"
    print("=" * 78)
    print("  STRESS TEST BATCH 2: 200 BRAND NEW TRICKY UNSEEN REAL-WORLD SMS")
    print(f"  Evaluating Model from: {model_path}")
    print("=" * 78)

    print("\n[1/3] Loading SetFit model...")
    model = SetFitModel.from_pretrained(model_path)
    print("      Model loaded successfully!")

    print(f"\n[2/3] Predicting categories for {len(TEST_CASES_BATCH2)} unseen SMS...\n")
    sms_list = [tc["sms"] for tc in TEST_CASES_BATCH2]
    expected_list = [tc["expected"] for tc in TEST_CASES_BATCH2]

    # Predict in batch
    preds = model.predict(sms_list)
    if isinstance(preds, torch.Tensor):
        raw_preds = preds.cpu().numpy()
    elif isinstance(preds, np.ndarray):
        raw_preds = preds
    else:
        raw_preds = np.array(preds)

    if np.issubdtype(raw_preds.dtype, np.integer):
        pred_names = [CLASS_NAMES[int(idx)] for idx in raw_preds]
    else:
        pred_names = [str(idx) for idx in raw_preds]

    print(f"{'#':<4} | {'Predicted':<18} | {'Expected':<18} | {'Status':<6} | {'SMS Narration Text'}")
    print("-" * 105)

    matches = 0
    class_correct = {c: 0 for c in CLASS_NAMES}
    class_total = {c: 0 for c in CLASS_NAMES}

    for i, (sms, pred, exp) in enumerate(zip(sms_list, pred_names, expected_list), start=1):
        is_match = (pred.strip().lower() == exp.strip().lower())
        status_icon = "[OK]" if is_match else "[DIFF]"
        if is_match:
            matches += 1
            class_correct[exp] += 1
        class_total[exp] += 1

        print(f"{i:<4} | {pred:<18} | {exp:<18} | {status_icon:<6} | {sms[:55]}")

    accuracy = (matches / len(TEST_CASES_BATCH2)) * 100.0

    print("\n" + "=" * 78)
    print("  EVALUATION SUMMARY ON 200 BRAND NEW UNSEEN SMS (BATCH 2)")
    print("=" * 78)
    print(f"  Total Test Cases   : {len(TEST_CASES_BATCH2)}")
    print(f"  Correct Matches    : {matches}")
    print(f"  Mismatches         : {len(TEST_CASES_BATCH2) - matches}")
    print(f"  Real-World Accuracy: {accuracy:.2f}%")
    print("-" * 78)
    print("  Per-Category Performance Breakdown:")
    for c in CLASS_NAMES:
        tot = class_total[c]
        corr = class_correct[c]
        acc_c = (corr / tot * 100.0) if tot > 0 else 0.0
        print(f"    - {c:<18}: {corr:>2}/{tot:>2} ({acc_c:>6.2f}%)")
    print("=" * 78)

    print("\n  OVERFITTING DIAGNOSTIC VERDICT:")
    if accuracy >= 90.0:
        print("  -> PASSED: Model is robustly generalized and NOT overfitted!")
        print("     High precision across completely unseen real-world SMS entities.")
    elif accuracy >= 80.0:
        print("  -> ACCEPTABLE: Strong generalization with expected linguistic edge cases.")
    else:
        print("  -> WARNING: Review vocabulary coverage.")

    print("\nTest completed successfully.\n")

if __name__ == "__main__":
    main()
