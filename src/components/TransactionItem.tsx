import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import {
  Utensils,
  Zap,
  Car,
  ShoppingCart,
  ShoppingBag,
  HeartPulse,
  Film,
  Building2,
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
} from 'lucide-react-native';
import { Transaction } from '../types';
import { Colors, Spacing, Typography, BorderRadius } from '../utils/theme';
import { formatINR, formatFriendlyDate } from '../utils/currency';
import { useLanguage } from '../context/LanguageContext';
import { getCategoryLabel } from '../utils/i18n';

interface TransactionItemProps {
  transaction: Transaction;
  onPress?: () => void;
}

export const TransactionItem: React.FC<TransactionItemProps> = ({
  transaction,
  onPress,
}) => {
  const { language } = useLanguage();
  const isDebit = transaction.type === 'debit';
  const categoryColor = Colors.categories[transaction.category] || Colors.slateGray;

  const getCategoryIcon = () => {
    const iconColor = categoryColor;
    const size = 18;

    switch (transaction.category) {
      case 'Food & Dining':
        return <Utensils size={size} color={iconColor} />;
      case 'Utilities & Bills':
        return <Zap size={size} color={iconColor} />;
      case 'Fuel & Travel':
        return <Car size={size} color={iconColor} />;
      case 'Groceries':
        return <ShoppingCart size={size} color={iconColor} />;
      case 'Shopping':
        return <ShoppingBag size={size} color={iconColor} />;
      case 'Health & Wellness':
        return <HeartPulse size={size} color={iconColor} />;
      case 'Entertainment':
        return <Film size={size} color={iconColor} />;
      case 'Salary & Income':
        return <Building2 size={size} color={Colors.emeraldGreen} />;
      default:
        return <Wallet size={size} color={iconColor} />;
    }
  };

  const getBankBadge = () => {
    if (transaction.account_name && transaction.account_number) {
      return `${transaction.account_name.replace(' Bank', '').replace(' Savings', '')} ${transaction.account_number}`;
    }
    if (transaction.account_id === 'acc_hdfc') return 'HDFC XX1234';
    if (transaction.account_id === 'acc_sbi') return 'SBI XX5678';
    return 'Cash Wallet';
  };

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      style={styles.card}
    >
      <View style={styles.leftSection}>
        {/* Category Icon Badge */}
        <View style={[styles.iconBadge, { backgroundColor: `${categoryColor}1F` }]}>
          {getCategoryIcon()}
        </View>

        {/* Merchant & Bank details */}
        <View style={styles.detailsColumn}>
          <Text style={styles.merchantText} numberOfLines={1}>
            {transaction.merchant}
          </Text>

          <View style={styles.metaRow}>
            {/* Bank Badge */}
            <View style={styles.bankBadge}>
              <Text style={styles.bankBadgeText}>{getBankBadge()}</Text>
            </View>

            {/* Category tag */}
            <Text style={styles.categoryTag} numberOfLines={1}>
              • {getCategoryLabel(transaction.category, language)}
            </Text>
          </View>
        </View>
      </View>

      {/* Amount and Timestamp */}
      <View style={styles.rightSection}>
        <View style={styles.amountRow}>
          {isDebit ? (
            <ArrowUpRight size={13} color={Colors.debitRed} style={{ marginRight: 2 }} />
          ) : (
            <ArrowDownLeft size={13} color={Colors.creditGreen} style={{ marginRight: 2 }} />
          )}
          <Text
            style={[
              styles.amountText,
              { color: isDebit ? Colors.debitRed : Colors.creditGreen },
            ]}
          >
            {isDebit ? '-' : '+'}
            {formatINR(transaction.amount)}
          </Text>
        </View>

        <Text style={styles.timestampText}>
          {formatFriendlyDate(transaction.date)}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.cardBg,
    borderRadius: BorderRadius.xl,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: Spacing.sm,
  },
  iconBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  detailsColumn: {
    flex: 1,
  },
  merchantText: {
    color: Colors.crispWhite,
    fontSize: Typography.md,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 6,
  },
  bankBadge: {
    backgroundColor: Colors.cardBgLight,
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: Colors.borderDark,
  },
  bankBadgeText: {
    color: Colors.slateLight,
    fontSize: 10,
    fontWeight: '700',
  },
  categoryTag: {
    color: Colors.slateGray,
    fontSize: Typography.xs,
    fontWeight: '500',
    flexShrink: 1,
  },
  rightSection: {
    alignItems: 'flex-end',
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  amountText: {
    fontSize: Typography.md,
    fontWeight: '700',
    letterSpacing: 0.1,
  },
  timestampText: {
    color: Colors.slateGray,
    fontSize: Typography.xs,
    fontWeight: '500',
    marginTop: 4,
  },
});
