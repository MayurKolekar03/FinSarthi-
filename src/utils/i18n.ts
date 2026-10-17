/**
 * ============================================================================
 *  i18n.ts — Complete Multilingual Dictionary for FinSarathi.AI
 *  Author: FinSarathi AI & UX Localization Team
 *  Supported Languages:
 *    - 'EN': English
 *    - 'HI': हिन्दी (Hindi)
 *    - 'MR': मराठी (Marathi)
 * ============================================================================
 */

import { SupportedLanguage } from '../types';

export const TRANSLATIONS = {
  EN: {
    // Navigation & App
    appName: 'FinSarathi.AI',
    appSubtitle: 'Privacy-First Multilingual Financial Copilot',
    zeroCloud: 'Zero-Cloud',
    rbiCompliant: 'RBI Compliant Local Storage',
    privacyGuard: '100% Private Ledger',

    // Greetings
    greeting: 'Welcome back,',
    namaste: 'Namaste',

    // Dashboard
    netWorth: 'Total Net Worth',
    monthlySpending: 'This Month Spending',
    linkedAccounts: 'Linked Accounts',
    savingsAccount: 'Savings Account',
    cashWallet: 'Cash in Hand',
    recentTransactions: 'Recent Transactions',
    viewAll: 'View All',
    monthlyBreakdown: 'Monthly Expense Breakdown',
    topCategories: 'Top Spending Categories',
    quickActions: 'Quick Actions',
    logExpense: 'Log Expense',
    testSmsAi: 'Test SMS AI',
    voiceAssistant: 'Voice Copilot',
    noTransactions: 'No transactions found.',
    allAccounts: 'All Accounts',

    // Transaction Types & Categories
    debit: 'DEBIT',
    credit: 'CREDIT',
    'Food & Dining': 'Food & Dining',
    'Shopping': 'Shopping',
    'Fuel & Travel': 'Fuel & Travel',
    'Utilities & Bills': 'Utilities & Bills',
    'Salary & Income': 'Salary & Income',
    'Transfer': 'Transfer',
    'Groceries': 'Groceries',
    'Health & Wellness': 'Health & Wellness',
    'Entertainment': 'Entertainment',
    'Other': 'Other',

    // Chat Screen
    copilotTitle: 'FinSarathi AI Copilot',
    copilotSubtitle: 'Zero-Cloud Offline Financial Intelligence',
    groundTruthActive: 'Local SQLite ground truth active. Verified against authentic ledger.',
    translating: 'Translating...',
    thinking: 'FinSarathi is thinking...',
    formulating: 'Formulating response...',
    translatingToEnglish: 'Translating to English...',
    analyzingFinances: 'Analyzing your finances...',
    translatingBack: 'Translating response...',
    inputPlaceholder: 'Ask about spending, dates, balances or speak (🎤)...',
    quickPrompts: [
      'Total Bank Balance',
      'How much did I spend at Swiggy?',
      'Spending on 18 Sep?',
      'Top Expenses This Month',
    ],
    welcomeMessage:
      'Namaste! I am FinSarathi, your personal financial copilot. You can ask about any past transaction, specific shop, date, or your total balance. How can I help you today?',
    loggedConfirmation: '⚡ Logged ₹{amount} for {merchant} [{category}] into your offline ledger.',

    // Modals & Actions
    addTransactionTitle: 'Log New Transaction',
    merchantName: 'Merchant / Shop Name',
    amount: 'Amount (₹)',
    category: 'Category',
    account: 'Account',
    save: 'Save Transaction',
    cancel: 'Cancel',
    smsSimulationTitle: 'Simulate Bank SMS',
    smsBody: 'SMS Body Text',
    processSms: 'Validate & Process with SetFit AI',
  },

  HI: {
    // Navigation & App
    appName: 'फिनसारथी.AI',
    appSubtitle: 'गोपनीयता-प्रथम बहुभाषी वित्तीय साथी',
    zeroCloud: 'जीरो-क्लाउड',
    rbiCompliant: 'आरबीआई अनुपालन स्थानीय स्टोरेज',
    privacyGuard: '१००% सुरक्षित निजी खाता',

    // Greetings
    greeting: 'नमस्ते,',
    namaste: 'नमस्ते',

    // Dashboard
    netWorth: 'कुल संपत्ति (नेट वर्थ)',
    monthlySpending: 'इस महीने का खर्च',
    linkedAccounts: 'जुड़े हुए बैंक खाते',
    savingsAccount: 'बचत खाता',
    cashWallet: 'नकद (वॉलेट)',
    recentTransactions: 'हाल के लेनदेन',
    viewAll: 'सभी देखें',
    monthlyBreakdown: 'मासिक खर्च विवरण',
    topCategories: 'प्रमुख खर्च श्रेणियां',
    quickActions: 'त्वरित कार्य',
    logExpense: 'खर्च दर्ज करें',
    testSmsAi: 'एसएमएस AI परीक्षण',
    voiceAssistant: 'वॉयस साथी',
    noTransactions: 'कोई लेनदेन उपलब्ध नहीं है।',
    allAccounts: 'सभी खाते',

    // Transaction Types & Categories
    debit: 'डेबिट (निकासी)',
    credit: 'क्रेडिट (जमा)',
    'Food & Dining': 'भोजन एवं रेस्टोरेंट',
    'Shopping': 'खरीदारी',
    'Fuel & Travel': 'पेट्रोल एवं यात्रा',
    'Utilities & Bills': 'बिल एवं उपयोगिताएं',
    'Salary & Income': 'वेतन एवं आय',
    'Transfer': 'स्थानांतरण (ट्रांसफर)',
    'Groceries': 'किराना सामान',
    'Health & Wellness': 'स्वास्थ्य एवं दवाएं',
    'Entertainment': 'मनोरंजन',
    'Other': 'अन्य',

    // Chat Screen
    copilotTitle: 'फिनसारथी AI साथी',
    copilotSubtitle: 'जीरो-क्लाउड ऑफलाइन वित्तीय बुद्धिमत्ता',
    groundTruthActive: 'स्थानीय डेटाबेस सक्रिय। आपके असली बहीखाते से सत्यापित।',
    translating: 'अनुवाद हो रहा है...',
    thinking: 'फिनसारथी सोच रहा है...',
    formulating: 'उत्तर तैयार हो रहा है...',
    translatingToEnglish: 'अंग्रेजी में अनुवाद हो रहा है...',
    analyzingFinances: 'आपके वित्त का विश्लेषण हो रहा है...',
    translatingBack: 'हिंदी में अनुवाद हो रहा है...',
    inputPlaceholder: 'खर्च, तारीख, दुकान या बैलेंस पूछें या बोलें (🎤)...',
    quickPrompts: [
      'कुल बैंक बैलेंस',
      'स्विगी पर कितना खर्च हुआ?',
      '१८ सितंबर का खर्च क्या था?',
      'इस महीने के शीर्ष खर्च',
    ],
    welcomeMessage:
      'नमस्ते! मैं फिनसारथी हूँ, आपका निजी वित्तीय साथी। आप किसी भी दुकान, तारीख, खर्च या बैंक बैलेंस के बारे में पूछ सकते हैं। आज मैं आपकी क्या सहायता करूँ?',
    loggedConfirmation: '⚡ आपके स्थानीय बहीखाते में {merchant} के लिए ₹{amount} [{category}] दर्ज किया गया।',

    // Modals & Actions
    addTransactionTitle: 'नया लेनदेन दर्ज करें',
    merchantName: 'दुकान / व्यापारी का नाम',
    amount: 'राशि (₹)',
    category: 'श्रेणी',
    account: 'बैंक खाता',
    save: 'सहेजें (Save)',
    cancel: 'रद्द करें',
    smsSimulationTitle: 'बैंक एसएमएस अनुकरण',
    smsBody: 'एसएमएस विवरण',
    processSms: 'SetFit AI से सत्यापित करें',
  },

  MR: {
    // Navigation & App
    appName: 'फिनसारथी.AI',
    appSubtitle: 'गोपनीयता-प्रथम बहुभाषिक वित्तीय सहाय्यक',
    zeroCloud: 'झिरो-क्लाउड',
    rbiCompliant: 'आरबीआय सुसंगत स्थानिक साठवणूक',
    privacyGuard: '१००% खाजगी स्थानिक खातेवही',

    // Greetings
    greeting: 'नमस्कार,',
    namaste: 'नमस्कार',

    // Dashboard
    netWorth: 'एकूण संपत्ती (नेट वर्थ)',
    monthlySpending: 'या महिन्यातील खर्च',
    linkedAccounts: 'जोडलेली बँक खाती',
    savingsAccount: 'बचत खाते',
    cashWallet: 'हातातील रोख रक्कम',
    recentTransactions: 'अलीकडील व्यवहार',
    viewAll: 'सर्व पहा',
    monthlyBreakdown: 'मासिक खर्चाचे वर्गीकरण',
    topCategories: 'प्रमुख खर्च श्रेणी',
    quickActions: 'त्वरित कृती',
    logExpense: 'खर्च नोंदवा',
    testSmsAi: 'एसएमएस AI चाचणी',
    voiceAssistant: 'व्हॉइस सहाय्यक',
    noTransactions: 'कोणताही व्यवहार आढळला नाही.',
    allAccounts: 'सर्व खाती',

    // Transaction Types & Categories
    debit: 'नावे (डेबिट)',
    credit: 'जमा (क्रेडिट)',
    'Food & Dining': 'खाद्यपदार्थ आणि भोजन',
    'Shopping': 'खरेदी',
    'Fuel & Travel': 'इंधन आणि प्रवास',
    'Utilities & Bills': 'बिले आणि सुविधा',
    'Salary & Income': 'पगार आणि उत्पन्न',
    'Transfer': 'हस्तांतरण (ट्रान्सफर)',
    'Groceries': 'किराणा माल',
    'Health & Wellness': 'आरोग्य आणि औषधे',
    'Entertainment': 'मनोरंजन',
    'Other': 'इतर',

    // Chat Screen
    copilotTitle: 'फिनसारथी AI सहाय्यक',
    copilotSubtitle: 'झिरो-क्लाउड ऑफलाइन वित्तीय बुद्धिमत्ता',
    groundTruthActive: 'स्थानिक डेटाबेस सक्रिय. तुमच्या अस्सल खातेवहीवरून पडताळणी.',
    translating: 'भाषांतर करत आहे...',
    thinking: 'फिनसारथी विचार करत आहे...',
    formulating: 'उत्तर तयार करत आहे...',
    translatingToEnglish: 'इंग्रजीमध्ये भाषांतर करत आहे...',
    analyzingFinances: 'तुमच्या आर्थिक माहितीचे विश्लेषण करत आहे...',
    translatingBack: 'मराठीमध्ये भाषांतर करत आहे...',
    inputPlaceholder: 'खर्च, तारीख, दुकान किंवा शिल्लक विचारा किंवा बोला (🎤)...',
    quickPrompts: [
      'एकूण बँक शिल्लक',
      'स्विगीवर किती खर्च झाला?',
      '१८ सप्टेंबरचा खर्च काय होता?',
      'या महिन्यातील मोठे खर्च',
    ],
    welcomeMessage:
      'नमस्कार! मी फिनसारथी आहे, तुमचा वैयक्तिक वित्तीय सहाय्यक. तुम्ही कोणत्याही दुकानाचा, तारखेचा, खर्चाचा किंवा बँक शिलकीचा तपशील विचारू शकता. आज मी तुम्हाला कशी मदत करू?',
    loggedConfirmation: '⚡ तुमच्या स्थानिक खातेवहीत {merchant} साठी ₹{amount} [{category}] नोंदवले गेले.',

    // Modals & Actions
    addTransactionTitle: 'नवीन व्यवहार नोंदवा',
    merchantName: 'दुकान / व्यापाऱ्याचे नाव',
    amount: 'रक्कम (₹)',
    category: 'वर्गवारी',
    account: 'बँक खाते',
    save: 'जतन करा (Save)',
    cancel: 'रद्द करा',
    smsSimulationTitle: 'बँक एसएमएस चाचणी',
    smsBody: 'एसएमएस मजकूर',
    processSms: 'SetFit AI द्वारे तपासा',
  },
};

/**
 * Returns translated string for the active language.
 */
export function t(key: keyof typeof TRANSLATIONS['EN'], lang: SupportedLanguage = 'EN'): string {
  const dict = TRANSLATIONS[lang] || TRANSLATIONS.EN;
  return (dict as any)[key] || TRANSLATIONS.EN[key] || String(key);
}

/**
 * Returns category label in user's language.
 */
export function getCategoryLabel(category: string, lang: SupportedLanguage = 'EN'): string {
  const dict = TRANSLATIONS[lang] || TRANSLATIONS.EN;
  return (dict as any)[category] || category;
}
