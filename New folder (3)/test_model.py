import os
import sys

# Ensure UTF-8 output encoding on Windows console
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
if hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding='utf-8', errors='replace')

import torch
import numpy as np
import pandas as pd
from setfit import SetFitModel

# ─────────────────────────────────────────────────────────────
# 1. Class Mapping (Matching the trained model's 6 classes)
# ─────────────────────────────────────────────────────────────
CLASS_NAMES = [
    "EMI",                 # 0: Loans, EMI debits, credit card auto-debit, ECS mandates
    "Food",                # 1: Restaurants, food delivery, cafes, street vendors, tapri
    "Investment",          # 2: Stocks, mutual funds, SIP, Zerodha, Groww, PPF, FDs
    "Personal_Transfer",   # 3: P2P, sent to friends/family, credited by someone
    "Shopping",            # 4: E-commerce, retail, medical/pharmacy, electronics, clothing
    "Travel"               # 5: Uber, Ola, IRCTC, flights, petrol/fuel, Fastag, metro
]

# ─────────────────────────────────────────────────────────────
# 2. 200 Tricky, Unseen Real-World SMS Examples
# ─────────────────────────────────────────────────────────────
# Note on Real-World Mapping for 6-Class Taxonomy:
# - Medical/Pharmacy & Subscriptions map to 'Shopping' (retail goods/services)
# - Auto/Cabs/Fuel/Fastag map to 'Travel'
# - P2P transfers & money received map to 'Personal_Transfer'
TEST_CASES = [
    # --- 1-35: Food / Street Food / Dining / Cafes / Delivery (Target: Food) ---
    {"sms": "Rs. 890 spent on Swiggy Instamart UPI-12345", "expected": "Food"},
    {"sms": "Sent 50 to tapri wale bhaiya", "expected": "Food"},
    {"sms": "Paid Rs 35 at Sharma Tea Stall via PhonePe", "expected": "Food"},
    {"sms": "Rs 450 debited for Zomato order #99482 via Paytm UPI", "expected": "Food"},
    {"sms": "Paid INR 120 at Gupta Panipuri and Chaat Centre", "expected": "Food"},
    {"sms": "Transaction of Rs. 380 at Chai Point Cyber City approved", "expected": "Food"},
    {"sms": "Payment of Rs 740 to Domino's Pizza India Ltd successful", "expected": "Food"},
    {"sms": "INR 1,250 debited at Barbeque Nation Bangalore", "expected": "Food"},
    {"sms": "Paid Rs 45 for Bun Maska at Irani Cafe", "expected": "Food"},
    {"sms": "Rs 220 debited at McDonald's Drive Thru Vashi", "expected": "Food"},
    {"sms": "Paid 80 to Raju Dosa Corner via GooglePay", "expected": "Food"},
    {"sms": "Paid Rs 310 at Haldiram Sweets and Snacks Nagpur", "expected": "Food"},
    {"sms": "INR 650 spent on Starbucks Coffee Mumbai", "expected": "Food"},
    {"sms": "Rs 150 transferred to Momos Point via UPI QR", "expected": "Food"},
    {"sms": "Paid 90 INR at Sagar Ratna Dosa Counter", "expected": "Food"},
    {"sms": "Paid Rs. 140 for Biryani at Paradise Takeaway", "expected": "Food"},
    {"sms": "Debit of Rs 520 at Subway Express terminal", "expected": "Food"},
    {"sms": "Paid Rs 60 to Annapurna Tiffin Services", "expected": "Food"},
    {"sms": "Rs 180 paid to Natural Ice Cream Juhu", "expected": "Food"},
    {"sms": "Paid Rs 25 at roadside tender coconut stall", "expected": "Food"},
    {"sms": "INR 950 debited at Mainland China Restaurant", "expected": "Food"},
    {"sms": "Paid 110 at Chaayos T3 Delhi Airport", "expected": "Food"},
    {"sms": "Rs. 430 paid to Wow Momo Foods Pvt Ltd", "expected": "Food"},
    {"sms": "Payment of Rs 160 at Keventers Milkshakes", "expected": "Food"},
    {"sms": "INR 280 debited for Burger King order via GPay", "expected": "Food"},
    {"sms": "Paid Rs 75 to Ramesh Paratha Corner", "expected": "Food"},
    {"sms": "Rs 350 spent at Bikanervala Sweets Karol Bagh", "expected": "Food"},
    {"sms": "Paid 40 for Filter Coffee at Brahmin Coffee Bar", "expected": "Food"},
    {"sms": "Rs 820 debited for dinner at Punjab Grill", "expected": "Food"},
    {"sms": "Paid INR 95 at Tibbs Frankie stall", "expected": "Food"},
    {"sms": "Paid Rs 500 at Theobroma Patisserie Bandra", "expected": "Food"},
    {"sms": "Debit Rs 175 at Belgiam Waffle Co", "expected": "Food"},
    {"sms": "Paid 30 for cutting chai and samosa", "expected": "Food"},
    {"sms": "Payment of Rs 680 to Pizza Hut Delivery", "expected": "Food"},
    {"sms": "Paid INR 210 at Cafe Coffee Day Highway", "expected": "Food"},

    # --- 36-70: Personal Transfer / P2P / Friends / Family (Target: Personal_Transfer) ---
    {"sms": "A/c XX9988 credited with INR 65.00 from MAYUR BAJIRAO", "expected": "Personal_Transfer"},
    {"sms": "Sent Rs 2000 to roommate for flat electricity bill split", "expected": "Personal_Transfer"},
    {"sms": "INR 5,000 sent to Mummy for monthly expenses via UPI", "expected": "Personal_Transfer"},
    {"sms": "Sent Rs 1500 to Rahul for Goa trip split", "expected": "Personal_Transfer"},
    {"sms": "Your A/c 4819 is credited by Rs 2500.00 from ROHIT SHARMA", "expected": "Personal_Transfer"},
    {"sms": "Sent Rs 500 to brother for pocket money", "expected": "Personal_Transfer"},
    {"sms": "INR 12,000 transferred to Landlord Mr Sharma for house rent", "expected": "Personal_Transfer"},
    {"sms": "Paid Rs 300 to Amit on GPay for cinema ticket share", "expected": "Personal_Transfer"},
    {"sms": "A/c XX1029 credited with Rs 750 from ANKITA GUPTA UPI", "expected": "Personal_Transfer"},
    {"sms": "Sent Rs 1000 to Papa HDFC Bank Account", "expected": "Personal_Transfer"},
    {"sms": "Money transfer of Rs 400 to Priya successful via PhonePe", "expected": "Personal_Transfer"},
    {"sms": "Sent 250 to Suresh for lunch contribution", "expected": "Personal_Transfer"},
    {"sms": "INR 3,500 transferred to sister for college books", "expected": "Personal_Transfer"},
    {"sms": "A/c XX4021 credited with Rs 1200 from VIKRAM SINGH", "expected": "Personal_Transfer"},
    {"sms": "Sent Rs 800 to Neha via Google Pay ref 8472910", "expected": "Personal_Transfer"},
    {"sms": "Transferred Rs 150 to friend for coffee refund", "expected": "Personal_Transfer"},
    {"sms": "Received Rs 500 from Gaurav on Paytm wallet", "expected": "Personal_Transfer"},
    {"sms": "INR 2000 sent to Cousin brother Deepak", "expected": "Personal_Transfer"},
    {"sms": "Sent Rs 450 to colleague for office party contribution", "expected": "Personal_Transfer"},
    {"sms": "Transferred Rs 600 to maid Sunita for salary advance", "expected": "Personal_Transfer"},
    {"sms": "A/c credited with INR 3,000 from RAJESH KUMAR UPI", "expected": "Personal_Transfer"},
    {"sms": "Sent Rs 90 to auto driver via PhonePe QR", "expected": "Personal_Transfer"},
    {"sms": "Transferred Rs 1800 to gym trainer Manoj", "expected": "Personal_Transfer"},
    {"sms": "Received INR 850 from SNEHA Splitwise settlement", "expected": "Personal_Transfer"},
    {"sms": "Sent Rs 2200 to uncle for medicine purchase", "expected": "Personal_Transfer"},
    {"sms": "Paid Rs 350 to car washer Ramu via UPI", "expected": "Personal_Transfer"},
    {"sms": "A/c XX5544 credited with Rs 400 from MANISH JOSHI", "expected": "Personal_Transfer"},
    {"sms": "Transferred INR 10,000 to Father SBI Account", "expected": "Personal_Transfer"},
    {"sms": "Sent Rs 120 to neighbor for grocery split", "expected": "Personal_Transfer"},
    {"sms": "Sent 500 to tailor master for stitching payment", "expected": "Personal_Transfer"},
    {"sms": "Received Rs 1500 from ARUN for badminton court booking", "expected": "Personal_Transfer"},
    {"sms": "Transferred Rs 700 to driver Mohan monthly tip", "expected": "Personal_Transfer"},
    {"sms": "Sent Rs 250 to milkman Shankar via Paytm", "expected": "Personal_Transfer"},
    {"sms": "INR 400 received from POOJA UPI ID pooja@okicici", "expected": "Personal_Transfer"},
    {"sms": "Sent Rs 5000 to Mother PNB savings account", "expected": "Personal_Transfer"},

    # --- 71-105: Shopping / Medical / Pharmacy / Retail / Electronics (Target: Shopping) ---
    {"sms": "Payment of ₹1200 successful to Sharma Medical Store", "expected": "Shopping"},
    {"sms": "Autopeebill for Netflix Rs 649 debited", "expected": "Shopping"},
    {"sms": "Paid Rs 3,499 at Amazon India Retail order #402-91823", "expected": "Shopping"},
    {"sms": "INR 1,899 debited on Myntra Fashion Shopping", "expected": "Shopping"},
    {"sms": "Paid Rs 450 at Apollo Pharmacy Chemist Shop", "expected": "Shopping"},
    {"sms": "Payment of Rs 850 at Decathlon Sports Store", "expected": "Shopping"},
    {"sms": "Rs 2,100 spent at Croma Electronics Thane", "expected": "Shopping"},
    {"sms": "INR 620 debited at MedPlus Pharmacy store", "expected": "Shopping"},
    {"sms": "Paid Rs 4,999 on Flipkart Internet Pvt Ltd", "expected": "Shopping"},
    {"sms": "Rs 990 debited at Reliance Smart Supermarket", "expected": "Shopping"},
    {"sms": "Payment of Rs 1,450 at Zara Clothing Phoenix Mall", "expected": "Shopping"},
    {"sms": "Paid Rs 320 at Wellness Forever Chemist", "expected": "Shopping"},
    {"sms": "INR 799 debited for Spotify Premium Annual subscription", "expected": "Shopping"},
    {"sms": "Rs 1,299 spent on Ajio Online Fashion Store", "expected": "Shopping"},
    {"sms": "Paid Rs 550 at local Kirana Provision Store via UPI", "expected": "Shopping"},
    {"sms": "Payment of Rs 15,999 at Vijay Sales for Microwave", "expected": "Shopping"},
    {"sms": "Rs 420 paid at Netmeds Online Pharmacy", "expected": "Shopping"},
    {"sms": "INR 890 debited at Nykaa Beauty Cosmetics Store", "expected": "Shopping"},
    {"sms": "Paid Rs 2,200 at D-Mart Hypermarket groceries", "expected": "Shopping"},
    {"sms": "Paid Rs 350 at Crossword Bookstore Mumbai", "expected": "Shopping"},
    {"sms": "Payment of Rs 6,500 at H&M Apparel Store", "expected": "Shopping"},
    {"sms": "INR 499 debited for Amazon Prime Video Membership", "expected": "Shopping"},
    {"sms": "Paid Rs 1,850 at Bata Shoes and Footwear outlet", "expected": "Shopping"},
    {"sms": "Rs 280 paid at 1mg Healthcare medicine delivery", "expected": "Shopping"},
    {"sms": "Payment of Rs 750 at FirstCry Baby Store", "expected": "Shopping"},
    {"sms": "Paid INR 3,200 at Westside Retail Mall outlet", "expected": "Shopping"},
    {"sms": "Rs 1,100 debited at Lenskart Eyewear Store", "expected": "Shopping"},
    {"sms": "Paid Rs 450 for stationary items at Landmark Store", "expected": "Shopping"},
    {"sms": "INR 12,499 debited on Reliance Digital for tablet", "expected": "Shopping"},
    {"sms": "Paid Rs 650 at Guardian Pharmacy airport branch", "expected": "Shopping"},
    {"sms": "Rs 899 spent on Urbanic Fashion delivery", "expected": "Shopping"},
    {"sms": "Paid Rs 1,750 at Pantaloons Retail showroom", "expected": "Shopping"},
    {"sms": "Payment of Rs 390 at Skechers Footwear outlet", "expected": "Shopping"},
    {"sms": "INR 2,800 debited at Trends Footwear & Clothing", "expected": "Shopping"},
    {"sms": "Paid Rs 150 at local stationary xerox shop via UPI", "expected": "Shopping"},

    # --- 106-140: Travel / Cabs / IRCTC / Flights / Fuel / Fastag (Target: Travel) ---
    {"sms": "Paid Rs 280 for Uber trip ride to Indiranagar", "expected": "Travel"},
    {"sms": "INR 180 debited for Ola Auto ride Pune", "expected": "Travel"},
    {"sms": "Rs 1,450 paid to IRCTC e-Ticketing train booking", "expected": "Travel"},
    {"sms": "Payment of Rs 2,000 at HPCL Petrol Pump fuel station", "expected": "Travel"},
    {"sms": "Fastag A/c debited with Rs 85 at Kherki Daula Toll", "expected": "Travel"},
    {"sms": "Paid Rs 4,800 to MakeMyTrip for Indigo flight booking", "expected": "Travel"},
    {"sms": "INR 65 debited for Rapido Bike Taxi ride", "expected": "Travel"},
    {"sms": "Paid Rs 500 for Delhi Metro Smart Card recharge", "expected": "Travel"},
    {"sms": "Rs 1,200 spent on Indian Oil Corporation petrol bunk", "expected": "Travel"},
    {"sms": "Payment of Rs 350 to Meru Cabs Airport transfer", "expected": "Travel"},
    {"sms": "INR 2,500 debited at Bharat Petroleum BPCL outlet", "expected": "Travel"},
    {"sms": "Paid Rs 780 for RedBus bus ticket booking", "expected": "Travel"},
    {"sms": "Fastag toll fee of Rs 130 deducted at Panipat Expressway", "expected": "Travel"},
    {"sms": "Paid Rs 420 for Uber Premier ride from Terminal 2", "expected": "Travel"},
    {"sms": "Rs 1,890 paid on Yatra.com for hotel & travel", "expected": "Travel"},
    {"sms": "Payment of Rs 110 for Bengaluru Namma Metro recharge", "expected": "Travel"},
    {"sms": "INR 3,200 spent on Shell Petrol Pump Premium Diesel", "expected": "Travel"},
    {"sms": "Paid Rs 85 for Ola Mini ride to railway station", "expected": "Travel"},
    {"sms": "Rs 6,200 debited for Air India flight ticket", "expected": "Travel"},
    {"sms": "Paid Rs 450 for parking fees at Airport P4 Zone", "expected": "Travel"},
    {"sms": "Fastag auto-recharge of Rs 500 successful via Paytm", "expected": "Travel"},
    {"sms": "Paid Rs 95 to Rapido Auto ride in Koramangala", "expected": "Travel"},
    {"sms": "Payment of Rs 1,150 at CNG filling station Adani Gas", "expected": "Travel"},
    {"sms": "INR 840 debited on AbhiBus for sleeper bus ticket", "expected": "Travel"},
    {"sms": "Paid Rs 2,150 to IRCTC Tourism holiday package", "expected": "Travel"},
    {"sms": "Rs 310 paid for Mumbai Local Train Season Ticket UTS", "expected": "Travel"},
    {"sms": "Paid Rs 1,500 for Jio-bp diesel refill", "expected": "Travel"},
    {"sms": "Fastag deduction of INR 70 at Bandra-Worli Sea Link", "expected": "Travel"},
    {"sms": "INR 360 debited for Uber Go ride to hospital", "expected": "Travel"},
    {"sms": "Paid Rs 5,400 to Cleartrip for domestic flight", "expected": "Travel"},
    {"sms": "Rs 140 paid for Mumbai Metro Line 1 recharge", "expected": "Travel"},
    {"sms": "Payment of Rs 850 at Nayara Energy petrol pump", "expected": "Travel"},
    {"sms": "INR 55 debited for BluSmart EV cab ride", "expected": "Travel"},
    {"sms": "Paid Rs 1,320 on IRCTC for Rajdhani 2AC ticket", "expected": "Travel"},
    {"sms": "Fastag toll plaza debit Rs 95 at Eastern Peripheral Expressway", "expected": "Travel"},

    # --- 141-170: EMI / Loans / Credit Card Auto-Debit / ECS (Target: EMI) ---
    {"sms": "Dear Customer, Rs 14,850 debited towards HDFC Home Loan EMI", "expected": "EMI"},
    {"sms": "EMI of Rs 4,299 debited for Bajaj Finserv Consumer Loan", "expected": "EMI"},
    {"sms": "Your A/c debited with INR 8,400 for SBI Car Loan EMI", "expected": "EMI"},
    {"sms": "ECS mandate of Rs 2,500 debited towards Education Loan", "expected": "EMI"},
    {"sms": "Payment of Rs 18,200 towards ICICI Credit Card monthly bill", "expected": "EMI"},
    {"sms": "Rs 3,150 debited towards Personal Loan EMI ref 839201", "expected": "EMI"},
    {"sms": "Autodebit of Rs 1,899 for Amazon Pay Later installment", "expected": "EMI"},
    {"sms": "INR 6,500 debited towards Kotak Mahindra Two Wheeler Loan", "expected": "EMI"},
    {"sms": "Dear Customer, Rs 9,800 debited for Axis Bank Loan EMI", "expected": "EMI"},
    {"sms": "Autopay of Rs 5,420 successful for HDFC Credit Card dues", "expected": "EMI"},
    {"sms": "EMI of INR 1,650 deducted for Flipkart Pay Later EMI", "expected": "EMI"},
    {"sms": "Rs 12,000 debited towards PNB Housing Finance EMI", "expected": "EMI"},
    {"sms": "Mandate debit of Rs 4,750 for TVS Credit motorcycle loan", "expected": "EMI"},
    {"sms": "INR 22,500 debited towards ICICI Bank Home Loan installment", "expected": "EMI"},
    {"sms": "Credit Card auto-debit of Rs 7,850 completed for SBI Card", "expected": "EMI"},
    {"sms": "Dear Customer, Rs 3,999 debited for Gold Loan monthly interest", "expected": "EMI"},
    {"sms": "Auto-debit of INR 8,100 executed for Bank of Baroda EMI", "expected": "EMI"},
    {"sms": "Rs 2,890 debited towards IDFC First Bank consumer durable EMI", "expected": "EMI"},
    {"sms": "ECS debit of Rs 15,000 towards Tata Capital Personal Loan", "expected": "EMI"},
    {"sms": "Mandate of Rs 6,200 debited for Canara Bank vehicle loan", "expected": "EMI"},
    {"sms": "Payment of Rs 4,500 towards Axis Credit Card minimum dues", "expected": "EMI"},
    {"sms": "EMI deduction of Rs 1,499 for ZestMoney smartphone installment", "expected": "EMI"},
    {"sms": "INR 11,200 debited towards L&T Financial Services loan", "expected": "EMI"},
    {"sms": "Dear Customer, Rs 7,300 debited for Aditya Birla Housing EMI", "expected": "EMI"},
    {"sms": "Auto-debit of INR 5,800 for IndusInd Bank Car Loan", "expected": "EMI"},
    {"sms": "Rs 3,450 debited towards HDFC Personal Loan installment", "expected": "EMI"},
    {"sms": "ECS mandate of Rs 16,800 executed for Union Bank Home Loan", "expected": "EMI"},
    {"sms": "Credit card auto-payment of Rs 9,150 cleared for RBL Bank Card", "expected": "EMI"},
    {"sms": "EMI of Rs 2,199 debited for Snapmint consumer installment", "expected": "EMI"},
    {"sms": "INR 13,500 debited towards Hero Fincorp Loan account", "expected": "EMI"},

    # --- 171-200: Investment / Stocks / Mutual Funds / SIP / Crypto / FD (Target: Investment) ---
    {"sms": "Rs 5,000 debited for Zerodha Broking Ltd funds addition", "expected": "Investment"},
    {"sms": "INR 2,500 debited towards Groww Mutual Fund SIP investment", "expected": "Investment"},
    {"sms": "SIP of Rs 1,000 executed for SBI Bluechip Mutual Fund", "expected": "Investment"},
    {"sms": "Payment of Rs 10,000 to Upstox Securities approved", "expected": "Investment"},
    {"sms": "Rs 3,000 debited towards Nippon India Small Cap Fund SIP", "expected": "Investment"},
    {"sms": "INR 20,000 transferred to Public Provident Fund PPF Account", "expected": "Investment"},
    {"sms": "Your A/c debited with Rs 15,000 for Fixed Deposit FD creation", "expected": "Investment"},
    {"sms": "Paid Rs 5,000 to Angel One Broking account via UPI", "expected": "Investment"},
    {"sms": "SIP installment of Rs 2,000 debited for Parag Parikh Flexi Cap", "expected": "Investment"},
    {"sms": "INR 7,500 invested in HDFC Top 100 Mutual Fund", "expected": "Investment"},
    {"sms": "Rs 50,000 debited for Sovereign Gold Bond SGB application", "expected": "Investment"},
    {"sms": "Payment of Rs 4,000 to CoinDCX crypto trading wallet", "expected": "Investment"},
    {"sms": "SIP debit of INR 1,500 towards Mirae Asset Large Cap Fund", "expected": "Investment"},
    {"sms": "Rs 8,000 transferred to National Pension System NPS Tier-1", "expected": "Investment"},
    {"sms": "INR 12,000 debited for ICICI Direct trading account balance", "expected": "Investment"},
    {"sms": "SIP of Rs 2,500 executed for Axis Small Cap Mutual Fund", "expected": "Investment"},
    {"sms": "Rs 25,000 debited for Recurring Deposit RD monthly installment", "expected": "Investment"},
    {"sms": "Payment of Rs 6,000 to 5paisa Capital Ltd account", "expected": "Investment"},
    {"sms": "INR 3,500 debited towards Quant Active Fund SIP", "expected": "Investment"},
    {"sms": "Rs 10,000 transferred to Motilal Oswal securities balance", "expected": "Investment"},
    {"sms": "SIP debit of Rs 5,000 for Kotak Emerging Equity Scheme", "expected": "Investment"},
    {"sms": "INR 18,000 debited for Sukanya Samriddhi Yojana SSY deposit", "expected": "Investment"},
    {"sms": "Rs 4,500 transferred to Dhan Trading platform via UPI", "expected": "Investment"},
    {"sms": "Payment of Rs 1,000 towards Tata Digital India Fund SIP", "expected": "Investment"},
    {"sms": "INR 30,000 debited for Corporate Bond investment via Wint Wealth", "expected": "Investment"},
    {"sms": "Rs 2,000 debited for UTI Nifty 50 Index Fund SIP", "expected": "Investment"},
    {"sms": "SIP installment of INR 3,000 cleared for DSP Midcap Fund", "expected": "Investment"},
    {"sms": "Rs 15,000 invested in Treasury Bills T-Bills via RBI Retail Direct", "expected": "Investment"},
    {"sms": "Paid Rs 7,000 to Sharekhan Demat trading account", "expected": "Investment"},
    {"sms": "SIP of Rs 2,500 executed for Edelweiss Balanced Advantage Fund", "expected": "Investment"}
]

# ─────────────────────────────────────────────────────────────
# 3. Main Evaluation Runner
# ─────────────────────────────────────────────────────────────
def main():
    model_path = "./saved_setfit_model"
    if not os.path.exists(model_path):
        # Fallback to fold_1 if root saved_setfit_model is missing
        model_path = "./results/fold_1"

    print("=" * 78)
    print(f"  SETFIT REAL-WORLD OUT-OF-SAMPLE STRESS TEST (200 TRICKY UNSEEN SMS)")
    print(f"  Model Path: {model_path}")
    print("=" * 78)

    print("\n[1/3] Loading saved SetFit model...")
    model = SetFitModel.from_pretrained(model_path)
    print("      Model loaded successfully!")

    print(f"\n[2/3] Running inference on {len(TEST_CASES)} unseen real-world SMS examples...")
    sms_list = [tc["sms"] for tc in TEST_CASES]
    expected_list = [tc["expected"] for tc in TEST_CASES]

    # Predict in batch
    preds = model.predict(sms_list)
    if isinstance(preds, torch.Tensor):
        pred_indices = preds.cpu().numpy()
    elif isinstance(preds, np.ndarray):
        pred_indices = preds
    else:
        pred_indices = np.array(preds)

    # Convert numeric indices to category names if needed
    if np.issubdtype(pred_indices.dtype, np.integer):
        pred_names = [CLASS_NAMES[idx] for idx in pred_indices]
    else:
        pred_names = [str(p) for p in pred_indices]

    # Display test results
    print("\n[3/3] Prediction Results:\n")
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

    accuracy = (matches / len(TEST_CASES)) * 100.0

    print("\n" + "=" * 78)
    print("  EVALUATION SUMMARY ON 200 UNSEEN TRICKY REAL-WORLD SMS")
    print("=" * 78)
    print(f"  Total Test Cases   : {len(TEST_CASES)}")
    print(f"  Correct Matches    : {matches}")
    print(f"  Mismatches         : {len(TEST_CASES) - matches}")
    print(f"  Real-World Accuracy: {accuracy:.2f}%")
    print("-" * 78)
    print("  Per-Category Performance Breakdown on Unseen SMS:")
    for c in CLASS_NAMES:
        tot = class_total[c]
        corr = class_correct[c]
        acc_c = (corr / tot * 100.0) if tot > 0 else 0.0
        print(f"    - {c:<18}: {corr:>2}/{tot:>2} ({acc_c:>6.2f}%)")
    print("=" * 78)

    print("\n  OVERFITTING DIAGNOSTIC VERDICT:")
    if accuracy >= 90.0:
        print("  -> PASSED: Model is NOT overfitted!")
        print("     The model generalizes across unseen merchants (tapri, chai, Swiggy,")
        print("     Sharma Medical Store, Zerodha, HDFC EMI, Uber, etc.) with high semantic accuracy.")
    elif accuracy >= 80.0:
        print("  -> ACCEPTABLE: Strong generalization with minor boundary edge-cases.")
    else:
        print("  -> WARNING: High mismatch rate detected. Model may require broader vocabulary.")

    print("\nTest completed successfully.\n")

if __name__ == "__main__":
    main()
