import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Eye, EyeOff, TrendingDown, ArrowUpRight, Plus, Sparkles, Shield } from 'lucide-react-native';
import { Colors, Spacing, Typography, BorderRadius } from '../utils/theme';
import { formatINR } from '../utils/currency';

interface NetWorthCardProps {
  totalBalance: number;
  mtdSpending: number;
  onAddTransaction?: () => void;
  onQuickAction?: (action: string) => void;
}

export const NetWorthCard: React.FC<NetWorthCardProps> = ({
  totalBalance,
  mtdSpending,
  onAddTransaction,
  onQuickAction,
}) => {
  const [showBalance, setShowBalance] = useState<boolean>(true);

  return (
    <View style={styles.cardWrapper}>
      {/* Decorative gradient glowing accent lines */}
      <View style={styles.cardHeader}>
        <View style={styles.netWorthLabelGroup}>
          <Text style={styles.label}>TOTAL NET WORTH</Text>
          <View style={styles.statusDot} />
          <Text style={styles.subStatus}>3 Accounts Linked</Text>
        </View>

        <TouchableOpacity
          onPress={() => setShowBalance(!showBalance)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          style={styles.eyeButton}
        >
          {showBalance ? (
            <Eye size={18} color={Colors.slateSubtle} />
          ) : (
            <EyeOff size={18} color={Colors.slateGray} />
          )}
        </TouchableOpacity>
      </View>

      {/* Main Amount */}
      <View style={styles.amountContainer}>
        <Text style={styles.amountText}>
          {showBalance ? formatINR(totalBalance) : '₹ • • • • • •'}
        </Text>
        <View style={styles.offlinePill}>
          <Shield size={12} color={Colors.emeraldGreen} />
          <Text style={styles.offlineText}>Offline Encrypted</Text>
        </View>
      </View>

      {/* Month to Date Spend Bar */}
      <View style={styles.divider} />

      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <View style={styles.statIconBadge}>
            <TrendingDown size={14} color={Colors.debitRed} />
          </View>
          <View>
            <Text style={styles.statLabel}>Month-to-Date Spend</Text>
            <Text style={styles.statValue}>
              {showBalance ? formatINR(mtdSpending) : '₹ • • • •'}
            </Text>
          </View>
        </View>

        <View style={styles.statItem}>
          <View style={[styles.statIconBadge, { backgroundColor: Colors.emeraldLight }]}>
            <Sparkles size={14} color={Colors.emeraldGreen} />
          </View>
          <View>
            <Text style={styles.statLabel}>Monthly Savings Pace</Text>
            <Text style={[styles.statValue, { color: Colors.emeraldGreen }]}>
              +68.4% On Track
            </Text>
          </View>
        </View>
      </View>

      {/* Action Chips */}
      <View style={styles.actionsRow}>
        <TouchableOpacity
          style={styles.primaryActionButton}
          activeOpacity={0.8}
          onPress={onAddTransaction}
        >
          <Plus size={16} color={Colors.primaryNavy} />
          <Text style={styles.primaryActionText}>Quick Log</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryActionButton}
          activeOpacity={0.8}
          onPress={() => onQuickAction && onQuickAction('budget')}
        >
          <ArrowUpRight size={15} color={Colors.crispWhite} />
          <Text style={styles.secondaryActionText}>September Budget</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  cardWrapper: {
    backgroundColor: Colors.cardBg,
    borderRadius: BorderRadius['2xl'],
    padding: Spacing.xl,
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 18,
    elevation: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  netWorthLabelGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  label: {
    color: Colors.slateLight,
    fontSize: Typography.xs,
    fontWeight: '700',
    letterSpacing: 1.2,
  },
  statusDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.emeraldGreen,
  },
  subStatus: {
    color: Colors.slateGray,
    fontSize: 11,
    fontWeight: '500',
  },
  eyeButton: {
    padding: 4,
  },
  amountContainer: {
    marginTop: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 8,
  },
  amountText: {
    color: Colors.crispWhite,
    fontSize: Typography['4xl'],
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  offlinePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
    gap: 4,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.25)',
  },
  offlineText: {
    color: Colors.emeraldGreen,
    fontSize: Typography.xs,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: Colors.borderLight,
    marginVertical: Spacing.md,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
  statItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  statIconBadge: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: Colors.debitLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statLabel: {
    color: Colors.slateGray,
    fontSize: Typography.xs,
    fontWeight: '500',
  },
  statValue: {
    color: Colors.crispWhite,
    fontSize: Typography.sm,
    fontWeight: '700',
    marginTop: 1,
  },
  actionsRow: {
    flexDirection: 'row',
    marginTop: Spacing.lg,
    gap: Spacing.md,
  },
  primaryActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.emeraldGreen,
    paddingVertical: 10,
    borderRadius: BorderRadius.lg,
    gap: 6,
  },
  primaryActionText: {
    color: Colors.primaryNavy,
    fontSize: Typography.sm,
    fontWeight: '700',
  },
  secondaryActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.cardBgLight,
    paddingVertical: 10,
    borderRadius: BorderRadius.lg,
    gap: 6,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  secondaryActionText: {
    color: Colors.crispWhite,
    fontSize: Typography.sm,
    fontWeight: '600',
  },
});
