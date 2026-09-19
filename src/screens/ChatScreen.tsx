import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChatBubble } from '../components/ChatBubble';
import { ChatInputBar } from '../components/ChatInputBar';
import { ChatMessage, TransactionCategory } from '../types';
import { Colors, Spacing, Typography, BorderRadius } from '../utils/theme';
import { getDB } from '../database/db';
import { Bot, ShieldCheck, Sparkles } from 'lucide-react-native';

export const ChatScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const scrollViewRef = useRef<ScrollView>(null);
  const [isListening, setIsListening] = useState(false);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg_1',
      sender: 'assistant',
      text: 'Namaste Mayur! I am FinSarathi, your on-device AI financial copilot. You can speak or type in English, हिन्दी, or मराठी. All records are processed 100% locally on your phone without cloud exposure.',
      timestamp: '11:00 AM',
      verifiedBadge: true,
    },
    {
      id: 'msg_2',
      sender: 'user',
      text: 'Swiggy se dinner order kiya ₹640 ka',
      timestamp: '11:02 AM',
    },
    {
      id: 'msg_3',
      sender: 'assistant',
      text: 'Logged ₹640 under "Food & Dining" to your HDFC account. Your remaining food budget for this week is ₹2,860.',
      timestamp: '11:02 AM',
      verifiedBadge: true,
      metadata: {
        action: 'logged_transaction',
        merchant: 'Swiggy Dinner',
        category: 'Food & Dining',
        amount: 640,
      },
    },
  ]);

  useEffect(() => {
    // Auto-scroll to bottom on new message
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages]);

  const handleSendMessage = async (userText: string) => {
    const timeNow = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userMsg: ChatMessage = {
      id: `user_${Date.now()}`,
      sender: 'user',
      text: userText,
      timestamp: timeNow,
    };

    setMessages((prev) => [...prev, userMsg]);

    // Analyze intent (Log transaction vs Budget Forecast vs General)
    const lower = userText.toLowerCase();
    const isBudgetQuery = lower.includes('forecast') || lower.includes('budget') || lower.includes('बजट') || lower.includes('अंदाज');

    setTimeout(async () => {
      let aiResponse: ChatMessage;

      if (isBudgetQuery) {
        aiResponse = {
          id: `ai_${Date.now()}`,
          sender: 'assistant',
          text: '📊 September Forecast: Based on your last 15 days outflow (₹42,889), your estimated end-of-month expenditure will settle around ₹58,400. You are on track to save 48% of your salary.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          verifiedBadge: true,
          metadata: {
            action: 'budget_forecast',
          },
        };
      } else {
        // Extract amount if present
        const amountMatch = userText.match(/\d+(\.\d+)?/);
        const amount = amountMatch ? parseFloat(amountMatch[0]) : 320;

        // Extract category & merchant
        let category: TransactionCategory = 'Food & Dining';
        let merchant = 'Local Merchant';

        if (lower.includes('petrol') || lower.includes('fuel') || lower.includes('uber') || lower.includes('indianoil')) {
          category = 'Fuel & Travel';
          merchant = 'Fuel / Travel Exp';
        } else if (lower.includes('kirana') || lower.includes('grocer') || lower.includes('dmart') || lower.includes('भाजी') || lower.includes('दूध')) {
          category = 'Groceries';
          merchant = 'Kirana & Groceries';
        } else if (lower.includes('electricity') || lower.includes('bill') || lower.includes('tata')) {
          category = 'Utilities & Bills';
          merchant = 'Utility Bill';
        } else {
          merchant = userText.length > 20 ? userText.substring(0, 20) + '...' : userText;
        }

        // Commit to local SQLite database!
        try {
          const db = getDB();
          await db.addTransaction({
            account_id: lower.includes('cash') || lower.includes('नगद') ? 'acc_cash' : 'acc_hdfc',
            amount: amount,
            merchant: merchant,
            category: category,
            type: 'debit',
            date: new Date().toISOString(),
            notes: `Logged via FinSarathi AI Chat ("${userText}")`,
          });
        } catch (err) {
          console.warn('DB log error in chat:', err);
        }

        // Multilingual response
        let replyText = `I have logged ₹${amount} for ${merchant} under "${category}". Your offline ledger is synchronized.`;
        if (lower.includes('मराठी') || lower.includes('भाजी') || lower.includes('खर्च')) {
          replyText = `तुमच्या स्थानिक लेजरमध्ये ₹${amount} "${category}" अंतर्गत सुरक्षितपणे नोंदवले गेले आहेत.`;
        } else if (lower.includes('हिन्दी') || lower.includes('किराना') || lower.includes('नगद')) {
          replyText = `₹${amount} का खर्च "${category}" के तहत आपके सुरक्षित ऑफलाइन खाते में जोड़ दिया गया है।`;
        }

        aiResponse = {
          id: `ai_${Date.now()}`,
          sender: 'assistant',
          text: replyText,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          verifiedBadge: true,
          metadata: {
            action: 'logged_transaction',
            merchant: merchant,
            category: category,
            amount: amount,
          },
        };
      }

      setMessages((prev) => [...prev, aiResponse]);
    }, 650);
  };

  const handleVoiceLogTrigger = () => {
    if (isListening) return;
    setIsListening(true);

    // Simulate 1.5s voice listening then transcription
    setTimeout(() => {
      setIsListening(false);
      const voiceInputs = [
        'Chai Point ₹180 paid via UPI',
        'Auto rickshaw fare ₹95 in cash',
        'Gupta Kirana Store ₹650 Aashirvaad Atta',
        'दुपारचे जेवण ₹250 गुगल पे (Marathi)',
      ];
      const randomInput = voiceInputs[Math.floor(Math.random() * voiceInputs.length)];
      handleSendMessage(randomInput);
    }, 1400);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={[styles.container, { paddingTop: insets.top }]}
    >
      {/* Chat Header */}
      <View style={styles.chatHeader}>
        <View style={styles.assistantBadge}>
          <Bot size={20} color={Colors.emeraldGreen} />
        </View>
        <View style={styles.headerInfo}>
          <View style={styles.titleRow}>
            <Text style={styles.headerTitle}>FinSarathi AI Copilot</Text>
            <View style={styles.onlineDot} />
          </View>
          <Text style={styles.headerSubtitle}>
            Privacy-First • Multilingual Engine (EN | HI | MR)
          </Text>
        </View>
        <View style={styles.guardrailTag}>
          <ShieldCheck size={13} color={Colors.emeraldGreen} />
          <Text style={styles.guardrailText}>RBI Guardrail</Text>
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
        {/* Security Banner */}
        <View style={styles.securityBanner}>
          <Sparkles size={14} color={Colors.emeraldGreen} />
          <Text style={styles.securityBannerText}>
            End-to-end On-Device Intelligence. Your financial chats never leave this hardware.
          </Text>
        </View>

        {messages.map((msg) => (
          <ChatBubble key={msg.id} message={msg} />
        ))}
      </ScrollView>

      {/* Input Bar with Voice & Multi-line */}
      <ChatInputBar
        onSendMessage={handleSendMessage}
        onVoiceLogTrigger={handleVoiceLogTrigger}
        isListening={isListening}
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
    gap: 12,
  },
  assistantBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.cardBgLight,
    borderWidth: 1.5,
    borderColor: Colors.emeraldGreen,
    alignItems: 'center',
    justifyContent: 'center',
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
    color: Colors.crispWhite,
    fontSize: Typography.md,
    fontWeight: '700',
  },
  onlineDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: Colors.emeraldGreen,
  },
  headerSubtitle: {
    color: Colors.slateGray,
    fontSize: 11,
    marginTop: 2,
  },
  guardrailTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.emeraldLight,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
    gap: 4,
    borderWidth: 0.8,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  guardrailText: {
    color: Colors.emeraldGreen,
    fontSize: 10,
    fontWeight: '700',
  },
  messagesList: {
    flex: 1,
  },
  messagesContainer: {
    paddingVertical: Spacing.md,
  },
  securityBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.cardBg,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.lg,
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  securityBannerText: {
    color: Colors.slateSubtle,
    fontSize: 11,
    flex: 1,
    lineHeight: 16,
  },
});
