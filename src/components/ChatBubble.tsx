import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ShieldCheck, Bot, User, CheckCircle2, ArrowDownRight, Tag } from 'lucide-react-native';
import { ChatMessage } from '../types';
import { Colors, Spacing, Typography, BorderRadius } from '../utils/theme';
import { formatINR } from '../utils/currency';

interface ChatBubbleProps {
  message: ChatMessage;
}

export const ChatBubble: React.FC<ChatBubbleProps> = ({ message }) => {
  const isUser = message.sender === 'user';

  return (
    <View
      style={[
        styles.messageContainer,
        isUser ? styles.userContainer : styles.assistantContainer,
      ]}
    >
      {/* Sender Icon */}
      {!isUser && (
        <View style={styles.assistantAvatar}>
          <Bot size={15} color={Colors.primaryNavy} />
        </View>
      )}

      <View
        style={[
          styles.bubbleWrapper,
          isUser ? styles.userBubble : styles.assistantBubble,
        ]}
      >
        {/* Main Text */}
        <Text
          style={[
            styles.messageText,
            isUser ? styles.userText : styles.assistantText,
          ]}
        >
          {message.text}
        </Text>

        {/* Structured Action / Transaction Card if categorized */}
        {message.metadata?.action === 'logged_transaction' && (
          <View style={styles.loggedCard}>
            <View style={styles.loggedHeader}>
              <CheckCircle2 size={13} color={Colors.emeraldGreen} />
              <Text style={styles.loggedTitle}>Offline Ledger Updated</Text>
            </View>
            <View style={styles.loggedDetails}>
              <View style={styles.loggedRow}>
                <Text style={styles.loggedLabel}>Merchant:</Text>
                <Text style={styles.loggedValue}>{message.metadata.merchant}</Text>
              </View>
              <View style={styles.loggedRow}>
                <Text style={styles.loggedLabel}>Category:</Text>
                <View style={styles.loggedBadge}>
                  <Tag size={10} color={Colors.primaryNavy} />
                  <Text style={styles.loggedBadgeText}>{message.metadata.category}</Text>
                </View>
              </View>
              <View style={styles.loggedRow}>
                <Text style={styles.loggedLabel}>Amount:</Text>
                <Text style={styles.loggedAmount}>
                  {formatINR(message.metadata.amount || 0)}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* RBI Guardrail Trust Badge (Mandatory for AI responses) */}
        {!isUser && (
          <View style={styles.trustBadge}>
            <ShieldCheck size={12} color={Colors.emeraldGreen} />
            <Text style={styles.trustBadgeText}>
              Verified by Local Engine / RBI Guardrail
            </Text>
          </View>
        )}

        {/* Timestamp */}
        <Text
          style={[
            styles.timestampText,
            isUser ? styles.userTimestamp : styles.assistantTimestamp,
          ]}
        >
          {message.timestamp}
        </Text>
      </View>

      {isUser && (
        <View style={styles.userAvatar}>
          <User size={15} color={Colors.crispWhite} />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  messageContainer: {
    flexDirection: 'row',
    marginVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
    alignItems: 'flex-end',
    gap: 8,
  },
  userContainer: {
    justifyContent: 'flex-end',
  },
  assistantContainer: {
    justifyContent: 'flex-start',
  },
  assistantAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.emeraldGreen,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  userAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.cardBgLight,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  bubbleWrapper: {
    maxWidth: '78%',
    borderRadius: BorderRadius['2xl'],
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  userBubble: {
    backgroundColor: Colors.primaryNavy,
    borderBottomRightRadius: 4,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  assistantBubble: {
    backgroundColor: Colors.slateBg,
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: Typography.md,
    lineHeight: 21,
  },
  userText: {
    color: Colors.crispWhite,
  },
  assistantText: {
    color: Colors.primaryNavy,
    fontWeight: '500',
  },
  trustBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
    marginTop: 8,
    alignSelf: 'flex-start',
    gap: 4,
    borderWidth: 0.8,
    borderColor: 'rgba(16, 185, 129, 0.25)',
  },
  trustBadgeText: {
    color: '#065F46',
    fontSize: 10,
    fontWeight: '700',
  },
  timestampText: {
    fontSize: 10,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  userTimestamp: {
    color: Colors.slateLight,
  },
  assistantTimestamp: {
    color: Colors.slateGray,
  },
  loggedCard: {
    backgroundColor: Colors.crispWhite,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    marginTop: Spacing.sm,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  loggedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  loggedTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.emeraldGreen,
    textTransform: 'uppercase',
  },
  loggedDetails: {
    gap: 2,
  },
  loggedRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  loggedLabel: {
    fontSize: 11,
    color: Colors.slateGray,
  },
  loggedValue: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.primaryNavy,
  },
  loggedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
    gap: 2,
  },
  loggedBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.primaryNavy,
  },
  loggedAmount: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.debitRed,
  },
});
