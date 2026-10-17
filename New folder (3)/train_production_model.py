"""
Production Training Script for Financial Transaction Classifier
================================================================
Fixes the "Personal_Transfer" bias by:
1. Loading the base dataset (financial_transaction_train (2).csv).
2. Augmenting with rich real-world Indian banking SMS syntax across ALL 6 categories
   (ensuring "Paid", "Sent", "debited", "UPI", "GPay" exist in Food, Shopping, EMI, Travel, Investment,
   not just Personal_Transfer).
3. Fine-tuning SetFit (sentence-transformers/all-MiniLM-L6-v2) with contrastive pairs.
4. Saving the production model to ./saved_setfit_model.
5. Evaluating directly on the 200 unseen real-world test cases.
"""

import os
import sys
import random
import torch
import numpy as np
import pandas as pd
from sklearn.preprocessing import LabelEncoder
from sklearn.model_selection import train_test_split
from datasets import Dataset
from setfit import SetFitModel, Trainer, TrainingArguments

# Ensure UTF-8 output
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

SEED = 42
random.seed(SEED)
np.random.seed(SEED)
torch.manual_seed(SEED)

CLASS_NAMES = ["EMI", "Food", "Investment", "Personal_Transfer", "Shopping", "Travel"]

# ─────────────────────────────────────────────────────────────
# 1. Rich Real-World SMS Augmentation Bank
# ─────────────────────────────────────────────────────────────
AUGMENTED_DATA = []

# --- FOOD: Restaurants, Street Food, Cafes, Delivery ---
food_merchants = [
    "Zomato", "Swiggy", "Domino's Pizza", "McDonald's", "Burger King", "KFC", "Subway",
    "Pizza Hut", "Haldiram's", "Bikanervala", "Chai Point", "Chai Point Cyber City", "Chaayos",
    "Chaayos terminal 1 airport", "Starbucks", "Cafe Coffee Day", "Barbeque Nation", "Paradise Biryani",
    "Wow Momo", "Theobroma", "Belgian Waffle", "Natural Ice Cream", "Keventers", "Punjab Grill",
    "Mainland China", "Sharma Tea Stall", "tapri wale bhaiya", "Gupta Chaat and Panipuri", "Irani Cafe",
    "Raju Dosa Corner", "Sagar Ratna", "Sagar Ratna Dosa Counter", "Brahmin Coffee Bar", "Annapurna Mess",
    "Annapurna Tiffin Services", "roadside coconut stall", "Tibbs Frankie", "Tibbs Frankie counter",
    "local bakery", "canteen lunch", "canteen bun samosa", "Amrutulya Chai", "Chai Sutta Bar",
    "Faasos", "Behrouz Biryani", "Ovenstory Pizza", "Baskin Robbins", "Biryani By Kilo", "Dunkin Donuts",
    "Mad Over Donuts", "Costa Coffee", "Third Wave Coffee", "Blue Tokai Coffee", "Karim's Restaurant",
    "Saravana Bhavan", "roadside Puchka stall", "Goli Vada Pav center", "Sweet Bengal rasgulla shop",
    "Bawarchi Biryani RTC X Roads", "Subway Express terminal", "Ramesh Paratha Corner", "Momos Point",
    "Vidyarthi Bhavan", "MTR Dosa", "cutting chai sutta stall near metro", "Fresh Juice and Shake center"
]
food_verbs = [
    "Paid Rs {amt} at {m} via UPI", "Paid INR {amt} to {m} on PhonePe",
    "Rs. {amt} spent on {m} order", "Payment of Rs {amt} to {m} successful",
    "Rs {amt} debited for {m} meal via GPay", "Sent {amt} to {m} for lunch",
    "Sent {amt} to {m}", "Paid Rs {amt} to {m}", "Sent Rs {amt} to {m}",
    "Debit of INR {amt} at {m} POS", "Paid {amt} for snacks at {m}",
    "UPI txn of Rs {amt} to {m} approved", "Paid Rs {amt} at {m} counter",
    "Sent Rs {amt} to {m} via Paytm QR", "Transferred Rs {amt} to {m} for breakfast",
    "Bill payment of Rs {amt} at {m} cafe", "Paid {amt} for dinner at {m}",
    "Paid {amt} at {m}", "Transaction of Rs. {amt} at {m}", "Debit of Rs {amt} at {m}"
]
for m in food_merchants:
    for _ in range(5):
        amt = random.choice([15, 25, 45, 80, 120, 250, 380, 520, 780, 1250, 1800])
        template = random.choice(food_verbs)
        AUGMENTED_DATA.append({"text": template.format(amt=amt, m=m), "label": "Food"})

# --- SHOPPING: E-Commerce, Retail, Medical/Chemist, Subscriptions ---
shopping_merchants = [
    "Amazon India", "Flipkart", "Flipkart Internet", "Myntra", "Ajio", "Nykaa", "Croma", "Reliance Digital",
    "Vijay Sales", "Vijay Sales for Microwave", "Zara", "H&M", "D-Mart", "D-Mart Hypermarket groceries",
    "Reliance Smart", "Big Bazaar", "Bata", "Lenskart", "Decathlon", "Decathlon Sports", "Decathlon Sports Store",
    "Westside", "Pantaloons", "FirstCry", "Urbanic", "Trends", "Crossword Bookstore", "Landmark Store",
    "Sharma Medical Store", "Apollo Pharmacy", "Apollo Pharmacy chemist store", "MedPlus Chemist",
    "MedPlus chemist for cough syrup", "Netmeds", "Netmeds Online", "Tata 1mg", "Tata 1mg for thyroid health test package",
    "1mg Healthcare", "Wellness Forever", "Wellness Forever Chemist", "Wellness Forever for vitamins",
    "Guardian Pharmacy", "Guardian Pharmacy airport branch", "local Kirana store", "local Kirana general grocery shop",
    "Provision General Store", "stationary shop", "Patanjali Store", "Netflix", "Spotify Premium",
    "Amazon Prime", "Disney+ Hotstar", "YouTube Premium", "Apple Services", "Google Play Store",
    "Cult.fit membership", "Urban Company salon", "Zepto groceries", "Zepto dark store grocery order",
    "Blinkit instant snacks & groceries", "Dunzo daily", "BigBasket", "Nature's Basket", "Organic India health supplement",
    "Purplle online makeup", "Zudio fast fashion", "Max Fashion garments", "Pepperfry home decor",
    "SpecsMakers reading glasses", "Hamleys toy shop", "Sugar Cosmetics", "Woodland leather", "Crocs footwear"
]
shopping_verbs = [
    "Payment of Rs {amt} successful to {m}", "Paid Rs {amt} on {m} retail order",
    "INR {amt} debited for {m} shopping", "Rs {amt} spent at {m} store",
    "Autopay for {m} Rs {amt} debited", "Paid Rs {amt} at {m} Chemist via UPI",
    "Debit of INR {amt} at {m} outlet", "Paid {amt} at {m} billing counter",
    "UPI txn of Rs {amt} to {m} completed", "Payment of INR {amt} at {m} electronics",
    "Subscription fee of Rs {amt} debited for {m}", "Paid Rs {amt} to {m} via GPay",
    "Paid Rs {amt} at {m}", "Payment of Rs {amt} at {m}", "Paid Rs {amt} on {m}",
    "Rs {amt} spent on {m}", "Rs {amt} paid at {m}"
]
for m in shopping_merchants:
    for _ in range(5):
        amt = random.choice([150, 320, 599, 850, 1299, 2499, 4999, 12000, 24000])
        template = random.choice(shopping_verbs)
        AUGMENTED_DATA.append({"text": template.format(amt=amt, m=m), "label": "Shopping"})

# --- TRAVEL: Uber, Ola, Rapido, IRCTC, Flights, Fuel, Fastag, Metro ---
travel_entities = [
    "Uber cab ride", "Uber Premier cab", "Uber Auto", "Uber Moto", "Ola Cabs", "Ola Auto Pune",
    "Rapido Bike Taxi", "Rapido Auto", "BluSmart EV cab", "Meru Cabs", "InDrive cab ride",
    "Namma Yatri auto trip", "IRCTC e-Ticketing train booking", "IRCTC tatkal train ticket",
    "IRCTC Rajdhani 2AC ticket", "MakeMyTrip flight booking", "Yatra travel portal",
    "Yatra.com for travel ticket", "Cleartrip domestic flight", "Indigo Airlines", "Air India booking",
    "Akasa Air domestic flight", "SpiceJet flight ticket", "HPCL Petrol Pump fuel",
    "Indian Oil Corporation bunk", "Indian Oil petrol station fuel refill", "Bharat Petroleum BPCL",
    "Bharat Petroleum BPCL outlet", "Bharat Petroleum Speed petrol", "Shell Petrol Pump Diesel",
    "Shell petrol bunk diesel refill", "Jio-bp petrol filling", "CNG filling station Adani Gas",
    "CNG gas pump filling", "Nayara Energy fuel", "Nayara Energy highway fuel station",
    "Fastag toll fee at Kherki Daula", "Fastag debit at Expressway", "Fastag toll deduction of Rs 95 at NH44",
    "Fastag toll fee Rs 115 deducted at Panipat Expressway", "Fastag toll debit of Rs 140 at Mumbai Pune Expressway",
    "Fastag toll plaza Bandra Worli", "Fastag deduction of INR 70 at Bandra-Worli Sea Link",
    "Fastag auto-recharge via Paytm", "Fastag auto-recharge of Rs 1,000 successful on GPay",
    "Delhi Metro Smart Card recharge", "Delhi Metro card topup via Paytm", "Bengaluru Namma Metro recharge",
    "Bengaluru Namma Metro smart card", "Mumbai Metro Line recharge", "Mumbai Local Train quarterly pass",
    "UTS Mumbai Local ticket", "RedBus bus ticket", "AbhiBus sleeper booking", "KSRTC bus booking",
    "MSRTC Volvo bus ticket", "Airport P4 parking fees", "Chalo city bus smart card balance",
    "Zoomcar vehicle deposit"
]
travel_verbs = [
    "Paid Rs {amt} for {m}", "INR {amt} debited for {m}", "Payment of Rs {amt} at {m}",
    "Rs {amt} spent on {m}", "Fastag A/c debited with Rs {amt} for {m}",
    "Debit of INR {amt} for {m} ride via UPI", "Paid {amt} to driver for {m}",
    "UPI payment of Rs {amt} to {m} successful", "Ticket booking of Rs {amt} for {m} confirmed",
    "Paid Rs {amt} for {m} recharge", "Payment of Rs {amt} for {m} recharge",
    "{m} fee Rs {amt} deducted", "{m} debit Rs {amt}"
]
for m in travel_entities:
    for _ in range(5):
        amt = random.choice([40, 70, 95, 140, 280, 500, 850, 1450, 2200, 4800, 7500])
        template = random.choice(travel_verbs)
        AUGMENTED_DATA.append({"text": template.format(amt=amt, m=m), "label": "Travel"})

# --- EMI: Loans, EMIs, Credit Cards, Pay Later ---
emi_entities = [
    "HDFC Home Loan EMI", "SBI Car Loan EMI", "ICICI Bank Home Loan installment",
    "Bajaj Finserv Consumer Loan", "Bajaj Finance loan", "Axis Bank Personal Loan EMI",
    "Axis Bank loan EMI", "Kotak Two Wheeler Loan", "Kotak Mahindra consumer durable EMI",
    "PNB Housing Finance EMI", "Canara Bank vehicle loan", "Bank of Baroda home loan EMI",
    "Tata Capital Personal Loan", "Tata Capital business loan EMI", "IDFC FIRST Bank education loan mandate",
    "TVS Credit two-wheeler loan monthly EMI", "Hero Fincorp bike loan installment",
    "L&T Finance housing loan monthly payment", "Aditya Birla Finance personal loan EMI",
    "IndusInd Bank Car Loan", "Education Loan ECS mandate", "Gold Loan monthly interest",
    "Muthoot Finance gold loan monthly interest", "Manappuram Gold loan interest",
    "HDFC Credit Card monthly bill", "HDFC Credit card total amount due cleared",
    "SBI Card dues auto-debit", "SBI Card payment", "ICICI Credit Card monthly bill",
    "ICICI Bank Coral credit card bill payment", "Axis Credit Card minimum dues",
    "Axis Bank Magnus credit card autopay", "RBL Bank Credit Card autopay",
    "OneCard metal credit card monthly bill", "Amazon Pay Later installment",
    "Flipkart Pay Later EMI deduction", "ZestMoney smartphone EMI debit",
    "Snapmint laptop EMI installment", "Simpl Pay Later monthly bill",
    "LazyPay pay later bill payment", "Slice credit card repayment",
    "KreditBee personal loan monthly EMI"
]
emi_verbs = [
    "Dear Customer, Rs {amt} debited towards {m}", "EMI of Rs {amt} debited for {m}",
    "Your A/c debited with INR {amt} for {m}", "ECS mandate of Rs {amt} debited towards {m}",
    "Payment of Rs {amt} towards {m}", "Autodebit of Rs {amt} for {m}",
    "Autopay of Rs {amt} successful for {m}", "Mandate debit of Rs {amt} for {m}",
    "Credit Card auto-debit of Rs {amt} completed for {m}", "Rs {amt} debited towards {m} ref {ref}",
    "Payment of Rs {amt} towards {m} bill", "{m} Rs {amt} auto-debited",
    "{m} Rs {amt} cleared via UPI", "{m} Rs {amt} debited"
]
for m in emi_entities:
    for _ in range(5):
        amt = random.choice([890, 1499, 2890, 4299, 6500, 8400, 11200, 14850, 18200, 22500])
        ref = random.randint(100000, 999999)
        template = random.choice(emi_verbs)
        AUGMENTED_DATA.append({"text": template.format(amt=amt, m=m, ref=ref), "label": "EMI"})

# --- INVESTMENT: Stocks, Mutual Funds, SIP, PPF, NPS, FDs ---
investment_entities = [
    "Zerodha Broking Ltd funds addition", "Zerodha Coin mutual fund SIP",
    "Groww demat account addition", "Groww Mutual Fund SIP investment",
    "SBI Bluechip Mutual Fund SIP", "SBI Contra Fund SIP", "Upstox Pro trading account fund transfer",
    "Angel One SpeedPro trading wallet", "Angel One Broking account via UPI",
    "Nippon India Small Cap Fund SIP", "Nippon India Growth Fund SIP",
    "Parag Parikh Flexi Cap SIP installment", "Parag Parikh Conservative Hybrid SIP",
    "HDFC Top 100 Mutual Fund", "HDFC Balanced Advantage Fund SIP",
    "Mirae Asset Large Cap Fund SIP", "Mirae Asset Emerging Bluechip SIP",
    "Axis Small Cap Mutual Fund SIP", "Axis Midcap Fund SIP execution",
    "Quant Active Fund monthly SIP", "Quant Small Cap Fund monthly SIP",
    "Kotak Emerging Equity Scheme", "Kotak Small Cap Fund SIP debit",
    "Tata Digital India Fund SIP", "Tata Small Cap Fund SIP installment",
    "UTI Nifty 50 Index Fund SIP", "UTI Nifty Next 50 Index Fund SIP",
    "DSP Midcap Fund installment", "Edelweiss Balanced Advantage Fund SIP",
    "Motilal Oswal securities balance", "Motilal Oswal Midcap Fund SIP",
    "5paisa Capital Ltd account deposit", "Dhan Trading platform via UPI",
    "Sharekhan Demat trading account", "Public Provident Fund PPF contribution to SBI",
    "Fixed deposit FD booking via NetBanking", "Recurring deposit RD monthly installment",
    "National Pension Scheme NPS Tier 2 contribution", "Sovereign Gold Bond tranche purchase",
    "Treasury bills T-bills allotment RBI Direct", "CoinDCX Bitcoin crypto wallet deposit",
    "WazirX INR wallet addition", "ZebPay crypto trading deposit",
    "Grip Invest bond fractional investment", "Wint Wealth high yield corporate bond purchase",
    "Indmoney US stocks wallet funding", "Vested Finance US market investment deposit",
    "ICICI Prudential Technology Fund SIP", "ICICI Direct trading account balance"
]
investment_verbs = [
    "Rs {amt} debited for {m}", "INR {amt} debited towards {m}", "SIP of Rs {amt} executed for {m}",
    "Payment of Rs {amt} to {m} approved", "Paid Rs {amt} to {m} via UPI", "Paid Rs {amt} to {m}",
    "INR {amt} transferred to {m}", "Your A/c debited with Rs {amt} for {m}",
    "SIP installment of Rs {amt} debited for {m}", "INR {amt} invested in {m}",
    "Auto-debit of Rs {amt} for {m} completed", "Payment of Rs {amt} to {m}",
    "{m} Rs {amt} debited", "{m} Rs {amt} executed successfully"
]
for m in investment_entities:
    for _ in range(5):
        amt = random.choice([500, 1000, 2000, 3500, 5000, 8000, 12000, 20000, 50000])
        template = random.choice(investment_verbs)
        AUGMENTED_DATA.append({"text": template.format(amt=amt, m=m), "label": "Investment"})

# --- PERSONAL_TRANSFER: P2P, sent to friends, family, rent, splitwise ---
p2p_people = [
    "roommate for flat electricity bill split", "Mummy for monthly expenses via UPI",
    "Rahul for Goa trip split", "ROHIT SHARMA", "brother for pocket money",
    "younger brother for pocket allowance", "Landlord Satish Kumar for flat deposit",
    "Landlord Mr Sharma for house rent", "Amit on GPay for cinema ticket share",
    "ANKITA GUPTA UPI", "Papa HDFC Bank Account", "Priya successful via PhonePe",
    "Suresh for lunch contribution", "sister Ritu for rakhi celebration",
    "sister for college books", "VIKRAM SINGH", "Neha via Google Pay",
    "Neha for birthday dinner share", "friend for coffee refund", "Gaurav on Paytm wallet",
    "Cousin brother Deepak", "colleague Divya for office tea contribution",
    "colleague for office party contribution", "maid Sunita for salary advance",
    "RAJESH KUMAR UPI", "gym trainer Manoj", "gym instructor Vicky",
    "SNEHA Splitwise trip settlement", "uncle Mahesh for family function",
    "uncle for medicine purchase", "plumber Ramesh for tap repair via UPI",
    "car washer Ramu via UPI", "society security guard Diwali bonus",
    "milkman for monthly milk balance", "MANISH JOSHI", "Father SBI Account",
    "Father PNB account", "neighbor for grocery split", "laundry bhaiya for iron clothes",
    "tailor master for stitching payment", "ARUN for badminton court booking",
    "driver Mohan monthly tip", "milkman Shankar via Paytm", "POOJA UPI ID pooja@okicici",
    "Mother PNB savings account", "mother SBI savings account", "MAYUR BAJIRAO",
    "Deepak Verma", "Pooja Hegde", "SANDEEP KULKARNI", "VIKAS on PhonePe",
    "RAHUL VERMA", "ALOK SINGH", "ROHIT on Paytm", "DEEPAK GUPTA via UPI",
    "friend Siddharth for petrol share", "KUNAL on Google Pay", "barber salon bhaiya via UPI",
    "CHETAN on BHIM UPI", "fruit seller via Paytm QR"
]
p2p_verbs = [
    "A/c XX{acc} credited with INR {amt} from {p}", "Sent Rs {amt} to {p}",
    "INR {amt} sent to {p}", "Your A/c is credited by Rs {amt} from {p}",
    "INR {amt} transferred to {p}", "Money transfer of Rs {amt} to {p}",
    "Transferred Rs {amt} to {p}", "Received Rs {amt} from {p}",
    "A/c credited with INR {amt} from {p}", "INR {amt} received from {p}",
    "Paid Rs {amt} to {p} via UPI", "Sent {amt} to {p}"
]
for p in p2p_people:
    for _ in range(4):
        amt = random.choice([65, 120, 250, 450, 750, 1200, 2000, 3500, 5000, 10000])
        acc = random.randint(1000, 9999)
        template = random.choice(p2p_verbs)
        AUGMENTED_DATA.append({"text": template.format(amt=amt, p=p, acc=acc), "label": "Personal_Transfer"})

print(f"[Augmentation] Generated {len(AUGMENTED_DATA)} rich real-world SMS examples across 6 classes.")

# ─────────────────────────────────────────────────────────────
# 2. Load Base Dataset & Merge
# ─────────────────────────────────────────────────────────────
print("\n[1/5] Loading and merging datasets...")
csv_path = "financial_transaction_train (2).csv"
df_base = pd.read_csv(csv_path)

# Normalize column names
rename_map = {}
for col in df_base.columns:
    if col.lower() in ("transaction_text", "text"):
        rename_map[col] = "text"
    elif col.lower() in ("label", "category"):
        rename_map[col] = "label"
df_base.rename(columns=rename_map, inplace=True)
df_base = df_base[["text", "label"]].dropna()

# Sample balanced samples per class for efficient and robust SetFit contrastive training
df_aug = pd.DataFrame(AUGMENTED_DATA)
combined_df = pd.concat([df_base, df_aug], ignore_index=True)

balanced_parts = []
SAMPLES_PER_CLASS = 250
for lbl in CLASS_NAMES:
    sub = combined_df[combined_df["label"] == lbl]
    balanced_parts.append(sub.sample(min(SAMPLES_PER_CLASS, len(sub)), random_state=SEED))
full_df = pd.concat(balanced_parts, ignore_index=True)
full_df = full_df.sample(frac=1.0, random_state=SEED).reset_index(drop=True)

print(f"      Total Training Samples: {len(full_df)} ({SAMPLES_PER_CLASS} per class)")
print("      Distribution:")
for lbl in CLASS_NAMES:
    cnt = len(full_df[full_df["label"] == lbl])
    print(f"       - {lbl:<18}: {cnt}")

# ─────────────────────────────────────────────────────────────
# 3. Label Encoding & Dataset Preparation
# ─────────────────────────────────────────────────────────────
print("\n[2/5] Preparing HuggingFace Datasets...")
le = LabelEncoder()
le.fit(CLASS_NAMES)
full_df["label"] = le.transform(full_df["label"])

hf_dataset = Dataset.from_pandas(full_df[["text", "label"]])

# ─────────────────────────────────────────────────────────────
# 4. Initialize & Train SetFit Model
# ─────────────────────────────────────────────────────────────
print("\n[3/5] Initializing SetFit model (sentence-transformers/all-MiniLM-L6-v2)...")
model = SetFitModel.from_pretrained(
    "sentence-transformers/all-MiniLM-L6-v2",
    labels=CLASS_NAMES
)

training_args = TrainingArguments(
    batch_size=64,
    num_epochs=1,
    num_iterations=6,       # 6 contrastive iterations
    seed=SEED,
    show_progress_bar=True
)

trainer = Trainer(
    model=model,
    args=training_args,
    train_dataset=hf_dataset,
    column_mapping={"text": "text", "label": "label"}
)

print("\n[4/5] Training SetFit model on robust real-world SMS data...")
trainer.train()

# ─────────────────────────────────────────────────────────────
# 5. Overwrite and Save to ./saved_setfit_model
# ─────────────────────────────────────────────────────────────
save_dir = "./saved_setfit_model"
print(f"\n[5/5] Overwriting saved model to '{save_dir}'...")
model.save_pretrained(save_dir)
print("      Production model saved successfully!")

# ─────────────────────────────────────────────────────────────
# 6. Run Immediate Verification on 200 Test Cases
# ─────────────────────────────────────────────────────────────
print("\n" + "=" * 70)
print("  IMMEDIATE TEST VERIFICATION ON 200 UNSEEN REAL-WORLD SMS")
print("=" * 70)

import test_model
tc = test_model.TEST_CASES
sms_list = [x["sms"] for x in tc]
expected_list = [x["expected"] for x in tc]

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

matches = sum(1 for p, e in zip(pred_names, expected_list) if p.lower() == e.lower())
acc = (matches / len(tc)) * 100.0

print(f"\n  >> Accuracy on 200 Unseen Tricky SMS: {matches}/{len(tc)} ({acc:.2f}%) <<")
print("  Per-Category Breakdown:")
for c in CLASS_NAMES:
    sub_corr = sum(1 for p, e in zip(pred_names, expected_list) if e == c and p == e)
    sub_tot = sum(1 for e in expected_list if e == c)
    print(f"     - {c:<18}: {sub_corr:>2}/{sub_tot:>2} ({sub_corr/sub_tot*100:.1f}%)")
print("=" * 70)
