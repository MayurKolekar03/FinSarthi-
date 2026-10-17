/**
 * ============================================================================
 *  ChatScreen.tsx — FinSarathi.AI Multilingual Financial Copilot
 *  Author: FinSarathi AI & Mobile Systems Team
 *  Purpose:
 *    - Deep SQLite Ground Truth Querying (Specific Shops, Dates, Balances)
 *    - Accurate Intent Classifier (Strict separation between Question Queries vs Expense Logging)
 *    - Complete Multilingual UI Synchronization (English, Hindi, Marathi)
 *    - Live Bhashini ➔ Groq LLM Grand Pipeline with real-time status indicators
 *    - Multilingual Voice Recognition (mr-IN, hi-IN, en-IN)
 * ============================================================================
 */

import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChatBubble } from '../components/ChatBubble';
import { ChatInputBar } from '../components/ChatInputBar';
import { ChatMessage, SupportedLanguage, TransactionCategory } from '../types';
import { Colors, Spacing, BorderRadius } from '../utils/theme';
import { getDB } from '../database/db';
import { predictCategory, mapModelLabelToCategory } from '../utils/mlService';
import { parseAndProcessSMS } from '../utils/smsParser';
import { askFinSarathi } from '../utils/chatService';
import { translateText } from '../utils/translationService';
import { useVoiceRecognition, VoiceLocale } from '../hooks/useVoiceRecognition';
import { useLanguage } from '../context/LanguageContext';
import { TRANSLATIONS } from '../utils/i18n';
import { Bot, Sparkles, Languages } from 'lucide-react-native';

const LOCALE_MAP: Record<
  SupportedLanguage,
  { locale: VoiceLocale; code: string; label: string; name: string }
> = {
  EN: { locale: 'en-IN', code: 'en', label: 'English', name: 'EN' },
  HI: { locale: 'hi-IN', code: 'hi', label: 'हिन्दी', name: 'HI' },
  MR: { locale: 'mr-IN', code: 'mr', label: 'मराठी', name: 'MR' },
};

/**
 * Robust Intent Classifier:
 * Accurately determines if the user is asking a financial query/question
 * versus issuing an explicit command to log a new expense into the ledger.
 */
function isQuestionOrQuery(text: string): boolean {
  const trimmed = text.trim().toLowerCase();

  // 1. Explicit question mark
  if (trimmed.includes('?')) return true;

  // 2. Interrogative and search keywords across English, Hindi, and Marathi
  const queryTokens = [
    // English
    'what', 'how', 'when', 'where', 'which', 'who', 'why', 'did i', 'do i',
    'show', 'list', 'check', 'tell', 'can you', 'is there', 'any', 'balance',
    'total', 'history', 'spend on', 'spent on', 'spend at', 'spent at',
    // Hindi & Hinglish
    'क्या', 'कितना', 'कितने', 'कितनी', 'कब', 'कहाँ', 'किधर', 'किस', 'कौन',
    'बताओ', 'दिखाओ', 'चेक', 'बैलेंस', 'था', 'थी', 'थे', 'हुआ', 'हुई',
    'kya', 'kitna', 'kitne', 'kab', 'kahan', 'batao', 'dikhao', 'hua', 'tha',
    // Marathi & Marathinglish
    'काय', 'किती', 'केव्हा', 'कुठे', 'कोणता', 'कोणती', 'कोणाचे', 'सांगा',
    'दाखवा', 'शिल्लक', 'होता', 'होती', 'झाला', 'झाली', 'आहे का', 'होता का',
    'kay', 'kiti', 'koni', 'kute', 'sanga', 'dakhva', 'jhala', 'ahe ka'
  ];

  return queryTokens.some((token) => trimmed.includes(token));
}

export const ChatScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const scrollViewRef = useRef<ScrollView>(null);

  // Global Language Synchronization (EN, HI, MR)
  const { language, setLanguage, t } = useLanguage();
  const [inputText, setInputText] = useState<string>('');

  // Grand pipeline status indicator state
  const [pipelineStatus, setPipelineStatus] = useState<string | null>(null);

  // Multilingual Voice Recognition Hook
  const {
    isListening,
    startListening,
    stopListening,
  } = useVoiceRecognition({
    initialLanguage: LOCALE_MAP[language].locale,
    onTranscriptReceived: (transcribedText) => {
      // Populates the chat text input box so user can review before sending
      setInputText(transcribedText);
    },
  });

  // Welcome message based on active language
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  useEffect(() => {
    // Initialize or update welcome greeting when language changes if only 1 message
    setMessages((prev) => {
      if (prev.length <= 1) {
        return [
          {
            id: 'msg_welcome',
            sender: 'assistant',
            text: t('welcomeMessage'),
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            verifiedBadge: true,
          },
        ];
      }
      return prev;
    });
  }, [language]);

  useEffect(() => {
    // Auto-scroll to bottom on new message or status change
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages, pipelineStatus]);

  /**
   * Toggle Voice Recognition (Tap-to-Talk)
   */
  const handleVoiceToggle = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening(LOCALE_MAP[language].locale);
    }
  };

  /**
   * Grand Multilingual Pipeline & Accurate Query Handler
   */
  const handleSendMessage = async (userText: string) => {
    if (!userText.trim() || pipelineStatus !== null) return;

    if (isListening) {
      stopListening();
    }

    const timeNow = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userMsg: ChatMessage = {
      id: `user_${Date.now()}`,
      sender: 'user',
      text: userText.trim(),
      timestamp: timeNow,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');

    const sourceCode = LOCALE_MAP[language].code;
    const isQuestion = isQuestionOrQuery(userText);

    let loggedMerchant: string | undefined;
    let loggedCategory: TransactionCategory | undefined;
    let loggedAmount: number | undefined;

    // --- ONLY LOG EXPENSE IF NOT A QUESTION QUERY ---
    if (!isQuestion) {
      // 1. Check for incoming bank SMS format (e.g. "AD-HDFCBK: ...")
      const smsSenderMatch = userText.match(
        /^([A-Za-z]{2}-[A-Za-z0-9]{6}(?:-[TSPG])?)\s*[:\-]\s*(.*)$/i
      );

      if (smsSenderMatch) {
        const sender = smsSenderMatch[1];
        const body = smsSenderMatch[2];
        const parsed = await parseAndProcessSMS(sender, body);
        if (parsed.success && parsed.extracted) {
          loggedMerchant = parsed.extracted.merchant;
          loggedCategory = parsed.extracted.uiCategory;
          loggedAmount = parsed.extracted.amount;
        }
      } else {
        // 2. Check for explicit declarative logging (e.g. "Paid ₹450 at Swiggy", "₹120 चाय के लिए दिए")
        const explicitCurrencyMatch = userText.match(/(?:rs\.?|inr|₹)\s*(\d+(?:\.\d{1,2})?)/i) ||
          userText.match(/(\d+(?:\.\d{1,2})?)\s*(?:rs|rupees|रुपये|रूपये)/i);

        const lower = userText.toLowerCase();
        const hasSpendAction =
          lower.includes('paid') ||
          lower.includes('spent') ||
          lower.includes('खर्च किए') ||
          lower.includes('खर्च केले') ||
          lower.includes('दिला') ||
          lower.includes('दिए');

        if (explicitCurrencyMatch && hasSpendAction) {
          loggedAmount = parseFloat(explicitCurrencyMatch[1]);
          const merchantMatch = userText.match(/(?:at|to|for|se|par|var|वर)\s+([A-Za-z0-9\s'&.-]{2,25})/i);
          loggedMerchant = merchantMatch
            ? merchantMatch[1].trim()
            : (userText.length > 25 ? userText.substring(0, 25) : userText);

          // Edge AI SetFit ONNX classification
          const modelLabel = await predictCategory(loggedMerchant);
          loggedCategory = mapModelLabelToCategory(modelLabel);

          // Commit to local SQLite database
          try {
            const db = getDB();
            await db.addTransaction({
              account_id: lower.includes('cash') || lower.includes('नगद') ? 'acc_cash' : 'acc_hdfc',
              amount: loggedAmount,
              merchant: loggedMerchant,
              category: loggedCategory,
              type: lower.includes('credited') || lower.includes('received') ? 'credit' : 'debit',
              date: new Date().toISOString(),
              notes: `Manual Log • Edge ONNX (${modelLabel})`,
            });
          } catch (err) {
            console.warn('[ChatScreen] SQLite persist error:', err);
          }
        }
      }
    }

    try {
      // ====================================================================
      // STRICT 3-STEP PIPELINE: Translate → LLM Reasoning → Translate Back
      // ====================================================================

      // ── STEP 1: Translate user input to English ──
      // (If already English, translateText returns text as-is)
      setPipelineStatus(t('translatingToEnglish'));
      const englishInput = await translateText(userText.trim(), sourceCode, 'en');

      // ── STEP 2: Send English query to Groq LLM for financial reasoning ──
      setPipelineStatus(t('analyzingFinances'));
      const englishResponse = await askFinSarathi(englishInput);

      // ── STEP 3: Translate English response back to user's language ──
      // (If user is in English mode, this is a no-op passthrough)
      setPipelineStatus(t('translatingBack'));
      let finalReply = await translateText(englishResponse, 'en', sourceCode);

      // If an explicit expense was recorded, prepend localized confirmation badge
      if (loggedMerchant && loggedAmount) {
        const confirmText = t('loggedConfirmation')
          .replace('{amount}', String(loggedAmount))
          .replace('{merchant}', loggedMerchant)
          .replace('{category}', String(loggedCategory));
        finalReply = `${confirmText}\n\n${finalReply}`;
      }

      const aiMsg: ChatMessage = {
        id: `ai_${Date.now()}`,
        sender: 'assistant',
        text: finalReply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        verifiedBadge: true,
        metadata: loggedMerchant
          ? {
              action: 'logged_transaction',
              merchant: loggedMerchant,
              category: loggedCategory,
              amount: loggedAmount,
            }
          : undefined,
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      console.error('[ChatScreen] Error in 3-step pipeline:', err);
      const fallbackMsg: ChatMessage = {
        id: `ai_${Date.now()}`,
        sender: 'assistant',
        text:
          language === 'MR'
            ? 'माफ करा, विनंती पूर्ण करताना समस्या आली. कृपया पुन्हा प्रयत्न करा.'
            : language === 'HI'
            ? 'क्षमा करें, आपके अनुरोध को पूरा करने में समस्या आई। कृपया पुनः प्रयास करें।'
            : 'Sorry, I encountered an issue processing your query. Please try again.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        verifiedBadge: false,
      };
      setMessages((prev) => [...prev, fallbackMsg]);
    } finally {
      setPipelineStatus(null);
    }
  };

  const currentPrompts = useMemo(() => {
    return TRANSLATIONS[language]?.quickPrompts || TRANSLATIONS.EN.quickPrompts;
  }, [language]);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={[styles.container, { paddingTop: insets.top }]}
    >
      {/* Header Bar */}
      <View style={styles.chatHeader}>
        <View style={styles.assistantBadge}>
          <Bot size={20} color={Colors.emeraldGreen} />
        </View>
        <View style={styles.headerInfo}>
          <View style={styles.titleRow}>
            <Text style={styles.headerTitle}>{t('copilotTitle')}</Text>
            <View style={styles.onlineDot} />
          </View>
          <Text style={styles.headerSubtitle}>{t('copilotSubtitle')}</Text>
        </View>

        {/* Multilingual Synchronized Language Switcher */}
        <View style={styles.langSelectorRow}>
          {(['EN', 'HI', 'MR'] as SupportedLanguage[]).map((lang) => {
            const isSelected = language === lang;
            return (
              <TouchableOpacity
                key={lang}
                style={[styles.langChip, isSelected && styles.langChipActive]}
                onPress={() => setLanguage(lang)}
                activeOpacity={0.7}
              >
                <Text style={[styles.langChipText, isSelected && styles.langChipTextActive]}>
                  {LOCALE_MAP[lang].name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Messages Scroll Area */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.messagesList}
        contentContainerStyle={[
          styles.messagesContainer,
          { paddingBottom: Spacing.xl },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Multilingual Mode Banner */}
        <View style={styles.securityBanner}>
          <Languages size={14} color={Colors.emeraldGreen} />
          <Text style={styles.securityBannerText}>
            {t('groundTruthActive')}
          </Text>
        </View>

        {messages.map((msg) => (
          <ChatBubble key={msg.id} message={msg} />
        ))}

        {/* Real-time Step Pipeline Loading State Card */}
        {pipelineStatus && (
          <View style={styles.pipelineLoadingCard}>
            <ActivityIndicator size="small" color={Colors.emeraldGreen} />
            <View style={styles.pipelineTextWrap}>
              <Text style={styles.pipelineStatusTitle}>{pipelineStatus}</Text>
              <Text style={styles.pipelineStatusSub}>
                {t('privacyGuard')}
              </Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Input Bar with Localized Suggestions & Voice Transcription */}
      <ChatInputBar
        value={inputText}
        onChangeText={setInputText}
        onSendMessage={handleSendMessage}
        onVoiceLogTrigger={handleVoiceToggle}
        isListening={isListening}
        languageLabel={LOCALE_MAP[language].label}
        placeholder={t('inputPlaceholder')}
        suggestions={currentPrompts}
      />
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.darkBg,
  },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.cardBg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderDark,
    gap: 10,
  },
  assistantBadge: {
    width: 38,
    height: 38,
    borderRadius: BorderRadius.md,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.25)',
  },
  headerInfo: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.crispWhite,
  },
  onlineDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: Colors.emeraldGreen,
  },
  headerSubtitle: {
    fontSize: 12,
    color: Colors.slateGray,
    marginTop: 1,
  },
  langSelectorRow: {
    flexDirection: 'row',
    backgroundColor: Colors.darkBg,
    borderRadius: BorderRadius.full,
    padding: 3,
    borderWidth: 1,
    borderColor: Colors.borderDark,
    gap: 2,
  },
  langChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  langChipActive: {
    backgroundColor: Colors.emeraldGreen,
  },
  langChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.slateGray,
  },
  langChipTextActive: {
    color: Colors.crispWhite,
    fontWeight: '700',
  },
  messagesList: {
    flex: 1,
  },
  messagesContainer: {
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  securityBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.2)',
    marginBottom: Spacing.sm,
    gap: 8,
  },
  securityBannerText: {
    fontSize: 12,
    color: Colors.slateGray,
    flex: 1,
  },
  pipelineLoadingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: Colors.cardBg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    marginTop: Spacing.xs,
    gap: 12,
  },
  pipelineTextWrap: {
    flexDirection: 'column',
  },
  pipelineStatusTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.emeraldGreen,
  },
  pipelineStatusSub: {
    fontSize: 10,
    color: Colors.slateGray,
    marginTop: 1,
  },
});
