"""
Test Suite Batch 3: 200 Completely Fresh, Tricky Real-World SMS Examples
========================================================================
Stress-testing the fine-tuned SetFit model in ./saved_setfit_model
against unseen real-world Indian banking SMS, UPI alerts, and notifications.
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
# 200 BRAND NEW, UNSEEN TRICKY REAL-WORLD SMS EXAMPLES (BATCH 3)
# ─────────────────────────────────────────────────────────────
TEST_CASES_BATCH3 = [
    # --- 1-35: Food / Dining / Street Food / Cafes / Midnight Snacks (Target: Food) ---
    {"sms": "Paid Rs 40 for butter toast and tea at roadside stall", "expected": "Food"},
    {"sms": "INR 350 debited for Behrouz Biryani feast via Swiggy", "expected": "Food"},
    {"sms": "Paid Rs 25 at Gupchup panipuri stall via UPI QR", "expected": "Food"},
    {"sms": "Payment of Rs 1,120 at Barbeque Nation lunch buffet", "expected": "Food"},
    {"sms": "Rs 80 paid to Anna Dosa Corner via PhonePe", "expected": "Food"},
    {"sms": "Paid Rs 65 for cold coffee at university canteen", "expected": "Food"},
    {"sms": "Payment of Rs 540 to Domino's Pizza order #8392", "expected": "Food"},
    {"sms": "Rs 140 spent at Haldiram for raj kachori & lassi", "expected": "Food"},
    {"sms": "Paid INR 35 to tapri for adrak chai and biscuits", "expected": "Food"},
    {"sms": "Debit of Rs 720 for dinner at Mainland China restaurant", "expected": "Food"},
    {"sms": "Paid Rs 180 at Natural Ice Cream outlet for waffle cone", "expected": "Food"},
    {"sms": "Rs 290 debited for Burger King meal order on GPay", "expected": "Food"},
    {"sms": "Paid 45 to Sharma Omelette centre near station", "expected": "Food"},
    {"sms": "Payment of Rs 1,650 at Punjab Grill family dinner", "expected": "Food"},
    {"sms": "Paid Rs 110 at Chaayos cafe for kulhad chai", "expected": "Food"},
    {"sms": "INR 450 debited for Ovenstory Pizza cheese burst", "expected": "Food"},
    {"sms": "Paid Rs 30 at roadside tender coconut counter", "expected": "Food"},
    {"sms": "Rs 85 paid to Tibbs Frankie joint via Paytm QR", "expected": "Food"},
    {"sms": "Paid Rs 50 for poha jalebi at Indore breakfast point", "expected": "Food"},
    {"sms": "Payment of Rs 380 at Chai Point for green tea flask", "expected": "Food"},
    {"sms": "Debit of Rs 220 at McDonald's drive thru burger meal", "expected": "Food"},
    {"sms": "Paid Rs 150 for chicken momos at Tibetan food van", "expected": "Food"},
    {"sms": "Rs 310 spent at Bikanervala sweets for samosas", "expected": "Food"},
    {"sms": "Paid 90 at Sagar Ratna restaurant for masala dosa", "expected": "Food"},
    {"sms": "Payment of Rs 1,200 at Bawarchi Biryani RTC X Roads", "expected": "Food"},
    {"sms": "Paid Rs 60 to Annapurna mess for veg thali", "expected": "Food"},
    {"sms": "INR 550 debited for Subway sandwich sub of the day", "expected": "Food"},
    {"sms": "Paid Rs 40 for hot filter coffee at Brahmin cafe", "expected": "Food"},
    {"sms": "Rs 680 paid to Pizza Hut home delivery on Zomato", "expected": "Food"},
    {"sms": "Paid INR 125 at Keventers for thick butterscotch shake", "expected": "Food"},
    {"sms": "Paid Rs 450 at Theobroma for chocolate brownie box", "expected": "Food"},
    {"sms": "Payment of Rs 210 at Mad Over Donuts for box of 3", "expected": "Food"},
    {"sms": "Paid 70 for paratha curd at highway dhaba", "expected": "Food"},
    {"sms": "Rs 340 debited for Faasos paneer wrap meal", "expected": "Food"},
    {"sms": "Paid Rs 25 at street vendor for roasted sweet corn", "expected": "Food"},

    # --- 36-70: Personal Transfer / P2P / Friends / Family / Roommates (Target: Personal_Transfer) ---
    {"sms": "A/c XX8810 credited with Rs 3,500 from VIKRAM DESHMUKH", "expected": "Personal_Transfer"},
    {"sms": "Sent Rs 1,200 to roommate Saurabh for grocery bill split", "expected": "Personal_Transfer"},
    {"sms": "Transferred Rs 4,000 to Mom for medical checkup via UPI", "expected": "Personal_Transfer"},
    {"sms": "Sent Rs 650 to Rahul on GPay for movie tickets split", "expected": "Personal_Transfer"},
    {"sms": "Received Rs 1,800 from ANANYA on PhonePe ref 847291", "expected": "Personal_Transfer"},
    {"sms": "A/c XX2941 credited with INR 8,000 from SURESH PATIL", "expected": "Personal_Transfer"},
    {"sms": "Sent Rs 400 to younger sister for pocket money", "expected": "Personal_Transfer"},
    {"sms": "Transferred Rs 15,000 to Landlord Ramesh Kumar for rent", "expected": "Personal_Transfer"},
    {"sms": "Paid Rs 250 to plumber for bathroom pipe repair via UPI", "expected": "Personal_Transfer"},
    {"sms": "Sent Rs 900 to Priya for weekend cafe party split", "expected": "Personal_Transfer"},
    {"sms": "A/c credited by Rs 2,500 from ROHIT SHARMA VPA rohit@oksbi", "expected": "Personal_Transfer"},
    {"sms": "Transferred Rs 3,000 to brother for college stationery", "expected": "Personal_Transfer"},
    {"sms": "Sent Rs 350 to colleague for office snacks contribution", "expected": "Personal_Transfer"},
    {"sms": "Received Rs 500 from DEEPAK on Paytm wallet transfer", "expected": "Personal_Transfer"},
    {"sms": "Sent Rs 120 to auto driver via PhonePe QR code", "expected": "Personal_Transfer"},
    {"sms": "Transferred Rs 1,200 to gym instructor for personal training", "expected": "Personal_Transfer"},
    {"sms": "Sent Rs 5,000 to Father SBI savings bank account", "expected": "Personal_Transfer"},
    {"sms": "A/c XX9012 credited with Rs 4,200 from KAVITA NAIR", "expected": "Personal_Transfer"},
    {"sms": "Transferred Rs 500 to security guard for festival gift", "expected": "Personal_Transfer"},
    {"sms": "Sent Rs 280 to milkman for remaining milk balance", "expected": "Personal_Transfer"},
    {"sms": "Received INR 2,800 from AMIT Splitwise trip share", "expected": "Personal_Transfer"},
    {"sms": "Sent Rs 1,500 to cousin Neha for wedding gift share", "expected": "Personal_Transfer"},
    {"sms": "Transferred Rs 10,000 to Mother PNB bank account", "expected": "Personal_Transfer"},
    {"sms": "A/c credited with Rs 850 from MANISH JOSHI via UPI", "expected": "Personal_Transfer"},
    {"sms": "Sent Rs 450 to laundry bhaiya for dry cleaning payment", "expected": "Personal_Transfer"},
    {"sms": "Transferred Rs 300 to friend for cab fare share", "expected": "Personal_Transfer"},
    {"sms": "Received Rs 750 from POOJA on Google Pay UPI", "expected": "Personal_Transfer"},
    {"sms": "Sent Rs 2,500 to uncle for family medical emergency", "expected": "Personal_Transfer"},
    {"sms": "Transferred Rs 350 to car washer Ramu monthly cleaning", "expected": "Personal_Transfer"},
    {"sms": "A/c XX6721 credited with INR 6,500 from SANDEEP KUMAR", "expected": "Personal_Transfer"},
    {"sms": "Sent Rs 500 to barber salon stylist via UPI QR", "expected": "Personal_Transfer"},
    {"sms": "Transferred Rs 1,500 to tennis court partner for booking", "expected": "Personal_Transfer"},
    {"sms": "Received Rs 600 from KUNAL on BHIM UPI app", "expected": "Personal_Transfer"},
    {"sms": "Sent Rs 6,000 to brother for college exam fee deposit", "expected": "Personal_Transfer"},
    {"sms": "Transferred Rs 180 to vegetable vendor via Paytm QR", "expected": "Personal_Transfer"},

    # --- 71-105: Shopping / E-Commerce / Pharmacy / Retail / Electronics (Target: Shopping) ---
    {"sms": "Payment of Rs 1,499 at Amazon India retail order #402-192", "expected": "Shopping"},
    {"sms": "Paid Rs 850 at Apollo Pharmacy chemist for cough syrup", "expected": "Shopping"},
    {"sms": "INR 2,299 debited on Myntra fashion clothes shopping", "expected": "Shopping"},
    {"sms": "Paid Rs 3,400 at Croma store for wireless keyboard", "expected": "Shopping"},
    {"sms": "Payment of Rs 649 debited for Netflix subscription plan", "expected": "Shopping"},
    {"sms": "Rs 920 paid at Blinkit instant grocery delivery", "expected": "Shopping"},
    {"sms": "Paid Rs 1,850 at Decathlon Sports Store for shoes", "expected": "Shopping"},
    {"sms": "Payment of Rs 480 at Tata 1mg online medicine delivery", "expected": "Shopping"},
    {"sms": "INR 4,999 debited on Flipkart Internet for smart watch", "expected": "Shopping"},
    {"sms": "Paid Rs 1,100 at Reliance Smart supermarket groceries", "expected": "Shopping"},
    {"sms": "Payment of Rs 1,750 at Zara clothing store Phoenix Mall", "expected": "Shopping"},
    {"sms": "Paid Rs 340 at Wellness Forever Chemist for vitamins", "expected": "Shopping"},
    {"sms": "INR 799 debited for Spotify Premium family plan", "expected": "Shopping"},
    {"sms": "Payment of Rs 12,499 at Vijay Sales for Microwave oven", "expected": "Shopping"},
    {"sms": "Paid Rs 550 at local Kirana general grocery shop", "expected": "Shopping"},
    {"sms": "Rs 890 spent on Nykaa beauty cosmetics lipstick order", "expected": "Shopping"},
    {"sms": "Paid Rs 2,500 at D-Mart Hypermarket monthly groceries", "expected": "Shopping"},
    {"sms": "Payment of Rs 380 at Crossword bookstore for fiction novel", "expected": "Shopping"},
    {"sms": "Paid Rs 6,200 at H&M apparel showroom for winter jacket", "expected": "Shopping"},
    {"sms": "INR 179 debited for YouTube Premium individual plan", "expected": "Shopping"},
    {"sms": "Paid Rs 1,450 at Bata footwear for formal leather shoes", "expected": "Shopping"},
    {"sms": "Payment of Rs 420 at MedPlus chemist for prescription pills", "expected": "Shopping"},
    {"sms": "Rs 1,299 spent on Ajio online fashion clothing app", "expected": "Shopping"},
    {"sms": "Paid Rs 750 at FirstCry baby clothes and diaper shop", "expected": "Shopping"},
    {"sms": "Payment of Rs 15,999 at Reliance Digital for tablet", "expected": "Shopping"},
    {"sms": "Paid Rs 650 at Guardian Pharmacy airport counter", "expected": "Shopping"},
    {"sms": "INR 1,150 debited at Lenskart eyewear frame order", "expected": "Shopping"},
    {"sms": "Paid Rs 450 for stationary books at Landmark Store", "expected": "Shopping"},
    {"sms": "Payment of Rs 2,800 at Westside retail mall showroom", "expected": "Shopping"},
    {"sms": "Rs 890 debited on Zepto dark store quick commerce grocery", "expected": "Shopping"},
    {"sms": "Paid Rs 1,600 at Pantaloons showroom for denim jeans", "expected": "Shopping"},
    {"sms": "Payment of Rs 390 at Netmeds pharmacy for skin ointment", "expected": "Shopping"},
    {"sms": "INR 2,400 debited at Trends apparel and clothing store", "expected": "Shopping"},
    {"sms": "Paid Rs 150 for photocopy printout at local Xerox shop", "expected": "Shopping"},
    {"sms": "Payment of Rs 599 for Amazon Prime Video annual membership", "expected": "Shopping"},

    # --- 106-140: Travel / Cabs / IRCTC / Flights / Petrol / Fastag / Metro (Target: Travel) ---
    {"sms": "Paid Rs 240 for Uber cab ride to city railway station", "expected": "Travel"},
    {"sms": "INR 95 debited for Ola Auto ride from office to home", "expected": "Travel"},
    {"sms": "Rs 1,480 paid to IRCTC e-Ticketing train reservation", "expected": "Travel"},
    {"sms": "Payment of Rs 2,000 at HPCL Petrol Pump fuel station", "expected": "Travel"},
    {"sms": "Fastag toll deduction of Rs 95 at NH44 toll plaza", "expected": "Travel"},
    {"sms": "Paid Rs 4,500 to MakeMyTrip for Indigo flight booking", "expected": "Travel"},
    {"sms": "INR 55 debited for Rapido Bike Taxi ride in Whitefield", "expected": "Travel"},
    {"sms": "Paid Rs 400 for Delhi Metro Smart Card topup recharge", "expected": "Travel"},
    {"sms": "Rs 1,600 spent on Indian Oil Corporation petrol bunk", "expected": "Travel"},
    {"sms": "Payment of Rs 320 to Meru Cabs airport terminal drop", "expected": "Travel"},
    {"sms": "INR 2,200 debited at Bharat Petroleum BPCL fuel outlet", "expected": "Travel"},
    {"sms": "Paid Rs 750 for RedBus intercity sleeper bus ticket", "expected": "Travel"},
    {"sms": "Fastag toll fee of Rs 140 deducted at Mumbai Pune Expressway", "expected": "Travel"},
    {"sms": "Paid Rs 380 for Uber Premier ride from Airport Terminal 2", "expected": "Travel"},
    {"sms": "Rs 1,890 paid on Yatra.com for domestic travel booking", "expected": "Travel"},
    {"sms": "Payment of Rs 100 for Bengaluru Namma Metro recharge", "expected": "Travel"},
    {"sms": "INR 2,800 spent on Shell Petrol Pump Power diesel refill", "expected": "Travel"},
    {"sms": "Paid Rs 75 for Ola Mini cab ride to bus terminal", "expected": "Travel"},
    {"sms": "Rs 5,800 debited for Air India domestic flight ticket", "expected": "Travel"},
    {"sms": "Paid Rs 90 for railway station two wheeler parking lot", "expected": "Travel"},
    {"sms": "Fastag auto-recharge of Rs 500 successful via Paytm", "expected": "Travel"},
    {"sms": "Paid Rs 85 to Rapido Auto ride in Koramangala", "expected": "Travel"},
    {"sms": "Payment of Rs 1,100 at CNG filling station Adani Gas", "expected": "Travel"},
    {"sms": "INR 820 debited on AbhiBus for AC Volvo bus travel", "expected": "Travel"},
    {"sms": "Paid Rs 1,320 on IRCTC for Rajdhani 2AC tatkal ticket", "expected": "Travel"},
    {"sms": "Rs 280 paid for Mumbai Local Train monthly UTS pass", "expected": "Travel"},
    {"sms": "Paid Rs 1,500 for Jio-bp highway petrol bunk refill", "expected": "Travel"},
    {"sms": "Fastag deduction of INR 70 at Bandra-Worli Sea Link", "expected": "Travel"},
    {"sms": "INR 310 debited for BluSmart EV cab ride to airport", "expected": "Travel"},
    {"sms": "Paid Rs 5,100 to Cleartrip for flight ticket Mumbai-Delhi", "expected": "Travel"},
    {"sms": "Rs 150 paid for Mumbai Metro Line 1 smart card recharge", "expected": "Travel"},
    {"sms": "Payment of Rs 850 at Nayara Energy petrol pump station", "expected": "Travel"},
    {"sms": "INR 60 debited for InDrive taxi ride across city", "expected": "Travel"},
    {"sms": "Fastag toll plaza debit Rs 95 at Eastern Peripheral Expressway", "expected": "Travel"},
    {"sms": "Paid Rs 250 for Chalo city bus smart card balance recharge", "expected": "Travel"},

    # --- 141-170: EMI / Loans / Credit Card Bills / Pay Later (Target: EMI) ---
    {"sms": "Dear Customer, Rs 15,400 debited towards HDFC Home Loan EMI", "expected": "EMI"},
    {"sms": "EMI of Rs 3,899 debited for Bajaj Finserv Consumer Loan", "expected": "EMI"},
    {"sms": "Your A/c debited with INR 7,900 for SBI Car Loan EMI", "expected": "EMI"},
    {"sms": "ECS mandate of Rs 2,800 debited towards Education Loan", "expected": "EMI"},
    {"sms": "Payment of Rs 16,500 towards ICICI Credit Card monthly bill", "expected": "EMI"},
    {"sms": "Rs 3,250 debited towards Personal Loan EMI ref 839210", "expected": "EMI"},
    {"sms": "Autodebit of Rs 1,499 for Amazon Pay Later installment", "expected": "EMI"},
    {"sms": "INR 6,100 debited towards Kotak Mahindra Two Wheeler Loan", "expected": "EMI"},
    {"sms": "Dear Customer, Rs 9,200 debited for Axis Bank Loan EMI", "expected": "EMI"},
    {"sms": "Autopay of Rs 4,800 successful for HDFC Credit Card dues", "expected": "EMI"},
    {"sms": "EMI of INR 1,250 deducted for Flipkart Pay Later installment", "expected": "EMI"},
    {"sms": "Rs 11,500 debited towards PNB Housing Finance EMI", "expected": "EMI"},
    {"sms": "Mandate debit of Rs 4,200 for TVS Credit motorcycle loan", "expected": "EMI"},
    {"sms": "INR 21,000 debited towards ICICI Bank Home Loan installment", "expected": "EMI"},
    {"sms": "Credit Card auto-debit of Rs 6,950 completed for SBI Card", "expected": "EMI"},
    {"sms": "Dear Customer, Rs 3,450 debited for Gold Loan monthly interest", "expected": "EMI"},
    {"sms": "Auto-debit of INR 7,800 executed for Bank of Baroda EMI", "expected": "EMI"},
    {"sms": "Rs 2,490 debited towards IDFC First Bank consumer durable EMI", "expected": "EMI"},
    {"sms": "ECS debit of Rs 14,000 towards Tata Capital Personal Loan", "expected": "EMI"},
    {"sms": "Mandate of Rs 5,900 debited for Canara Bank vehicle loan", "expected": "EMI"},
    {"sms": "Payment of Rs 4,200 towards Axis Credit Card minimum dues", "expected": "EMI"},
    {"sms": "EMI deduction of Rs 1,699 for ZestMoney smartphone installment", "expected": "EMI"},
    {"sms": "INR 10,800 debited towards L&T Financial Services loan", "expected": "EMI"},
    {"sms": "Dear Customer, Rs 6,900 debited for Aditya Birla Housing EMI", "expected": "EMI"},
    {"sms": "Auto-debit of INR 5,400 for IndusInd Bank Car Loan account", "expected": "EMI"},
    {"sms": "Rs 3,100 debited towards HDFC Personal Loan installment", "expected": "EMI"},
    {"sms": "ECS mandate of Rs 15,200 executed for Union Bank Home Loan", "expected": "EMI"},
    {"sms": "Credit card auto-payment of Rs 8,450 cleared for RBL Bank Card", "expected": "EMI"},
    {"sms": "EMI of Rs 1,999 debited for Snapmint consumer installment", "expected": "EMI"},
    {"sms": "INR 12,500 debited towards Hero Fincorp Loan account", "expected": "EMI"},

    # --- 171-200: Investment / Stocks / Mutual Funds / SIP / Demat / PPF (Target: Investment) ---
    {"sms": "Rs 5,000 debited for Zerodha Broking Ltd funds addition", "expected": "Investment"},
    {"sms": "INR 2,500 debited towards Groww Mutual Fund SIP investment", "expected": "Investment"},
    {"sms": "SIP of Rs 1,000 executed for SBI Bluechip Mutual Fund", "expected": "Investment"},
    {"sms": "Payment of Rs 8,000 to Upstox Securities trading funds", "expected": "Investment"},
    {"sms": "Rs 3,000 debited towards Nippon India Small Cap Fund SIP", "expected": "Investment"},
    {"sms": "INR 15,000 transferred to Public Provident Fund PPF Account", "expected": "Investment"},
    {"sms": "Your A/c debited with Rs 25,000 for Fixed Deposit FD creation", "expected": "Investment"},
    {"sms": "Paid Rs 4,000 to Angel One Broking account via UPI", "expected": "Investment"},
    {"sms": "SIP installment of Rs 2,000 debited for Parag Parikh Flexi Cap", "expected": "Investment"},
    {"sms": "INR 6,000 invested in HDFC Top 100 Mutual Fund", "expected": "Investment"},
    {"sms": "Rs 40,000 debited for Sovereign Gold Bond SGB application", "expected": "Investment"},
    {"sms": "Payment of Rs 3,500 to CoinDCX crypto trading wallet", "expected": "Investment"},
    {"sms": "SIP debit of INR 1,500 towards Mirae Asset Large Cap Fund", "expected": "Investment"},
    {"sms": "Rs 7,000 transferred to National Pension System NPS Tier-1", "expected": "Investment"},
    {"sms": "INR 10,000 debited for ICICI Direct trading account balance", "expected": "Investment"},
    {"sms": "SIP of Rs 2,500 executed for Axis Small Cap Mutual Fund", "expected": "Investment"},
    {"sms": "Rs 20,000 debited for Recurring Deposit RD monthly installment", "expected": "Investment"},
    {"sms": "Payment of Rs 5,000 to 5paisa Capital Ltd account deposit", "expected": "Investment"},
    {"sms": "INR 3,000 debited towards Quant Active Fund monthly SIP", "expected": "Investment"},
    {"sms": "Rs 8,000 transferred to Motilal Oswal securities balance", "expected": "Investment"},
    {"sms": "SIP debit of Rs 4,000 for Kotak Emerging Equity Scheme", "expected": "Investment"},
    {"sms": "INR 12,000 debited for Sukanya Samriddhi Yojana SSY deposit", "expected": "Investment"},
    {"sms": "Rs 3,500 transferred to Dhan Trading platform via UPI", "expected": "Investment"},
    {"sms": "Payment of Rs 1,000 towards Tata Digital India Fund SIP", "expected": "Investment"},
    {"sms": "INR 25,000 debited for Corporate Bond investment Wint Wealth", "expected": "Investment"},
    {"sms": "Rs 2,000 debited for UTI Nifty 50 Index Fund SIP", "expected": "Investment"},
    {"sms": "SIP installment of INR 3,000 cleared for DSP Midcap Fund", "expected": "Investment"},
    {"sms": "Rs 15,000 invested in Treasury Bills T-Bills via RBI Direct", "expected": "Investment"},
    {"sms": "Paid Rs 6,000 to Sharekhan Demat trading account", "expected": "Investment"},
    {"sms": "SIP of Rs 2,500 executed for Edelweiss Balanced Advantage Fund", "expected": "Investment"}
]

def main():
    model_path = "./saved_setfit_model"
    print("=" * 78)
    print("  STRESS TEST BATCH 3: 200 BRAND NEW TRICKY UNSEEN REAL-WORLD SMS")
    print(f"  Evaluating Model from: {model_path}")
    print("=" * 78)

    print("\n[1/3] Loading SetFit model...")
    model = SetFitModel.from_pretrained(model_path)
    print("      Model loaded successfully!")

    print(f"\n[2/3] Predicting categories for {len(TEST_CASES_BATCH3)} unseen SMS...\n")
    sms_list = [tc["sms"] for tc in TEST_CASES_BATCH3]
    expected_list = [tc["expected"] for tc in TEST_CASES_BATCH3]

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

    accuracy = (matches / len(TEST_CASES_BATCH3)) * 100.0

    print("\n" + "=" * 78)
    print("  EVALUATION SUMMARY ON 200 BRAND NEW UNSEEN SMS (BATCH 3)")
    print("=" * 78)
    print(f"  Total Test Cases   : {len(TEST_CASES_BATCH3)}")
    print(f"  Correct Matches    : {matches}")
    print(f"  Mismatches         : {len(TEST_CASES_BATCH3) - matches}")
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
    if accuracy >= 95.0:
        print("  -> OUTSTANDING: Model achieved 95%+ out-of-sample accuracy!")
    elif accuracy >= 90.0:
        print("  -> PASSED: Model is robustly generalized and NOT overfitted!")
    elif accuracy >= 80.0:
        print("  -> ACCEPTABLE: Strong generalization with expected linguistic edge cases.")
    else:
        print("  -> WARNING: Review vocabulary coverage.")

    print("\nTest completed successfully.\n")

if __name__ == "__main__":
    main()
