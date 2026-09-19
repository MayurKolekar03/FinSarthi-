import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { CreditCard, Wallet, Landmark, CheckCircle2, ShieldCheck } from 'lucide-react-native';
import { Account } from '../types';
import { Colors, Spacing, Typography, BorderRadius } from '../utils/theme';
import { formatINR } from '../utils/currency';

interface AccountCardProps {
  account: Account;
  isSelected: boolean;
  onSelect: (account: Account) => void;
}

const { width } = Dimensions.get('window');
const CARD_WIDTH = Math.min(width * 0.76, 310);

export const AccountCard: React.FC<AccountCardProps> = ({
  account,
  isSelected,
  onSelect,
}) => {
  const isCash = account.type === 'cash' || account.bank_name.toLowerCase().includes('cash');
  const isSBI = account.bank_name.toLowerCase().includes('sbi');

  const getBankBackground = () => {
    if (isCash) return ['#064E3B', '#022C22']; // Forest emerald
    if (isSBI) return ['#1E3A8A', '#0F172A'];  // SBI Royal Blue
    return ['#0F2B5C', '#07162C'];             // HDFC Classic Navy
  };

  const [gradTop, gradBot] = getBankBackground();

  return (
    <TouchableOpacity
      activeOpacity={0.88}
      onPress={() => onSelect(account)}
      style={[
        styles.cardContainer,
        { backgroundColor: gradTop },
        isSelected && styles.cardSelected,
      ]}
    >
      {/* Top row: Bank name + Icon + Selected Badge */}
      <View style={styles.headerRow}>
        <View style={styles.bankNameGroup}>
          <View style={styles.bankIconCircle}>
            {isCash ? (
              <Wallet size={16} color={Colors.emeraldGreen} />
            ) : isSBI ? (
              <Landmark size={16} color={Colors.blueAccent} />
            ) : (
              <CreditCard size={16} color={Colors.amberWarn} />
            )}
          </View>
          <View>
            <Text style={styles.bankName}>{account.bank_name}</Text>
            <Text style={styles.accountType}>
              {isCash ? 'Physical Wallet' : 'Savings Account'}
            </Text>
          </View>
        </View>

        {isSelected && (
          <View style={styles.selectedBadge}>
            <CheckCircle2 size={12} color={Colors.primaryNavy} />
            <Text style={styles.selectedText}>Active</Text>
          </View>
        )}
      </View>

      {/* Chip and Contactless simulation */}
      <View style={styles.chipRow}>
        <View style={styles.simChip}>
          <View style={styles.chipInner} />
        </View>
        <ShieldCheck size={16} color="rgba(255,255,255,0.4)" />
      </View>

      {/* Balance */}
      <View style={styles.balanceSection}>
        <Text style={styles.balanceLabel}>AVAILABLE BALANCE</Text>
        <Text style={styles.balanceAmount}>{formatINR(account.balance)}</Text>
      </View>

      {/* Footer: Account Number & Status */}
      <View style={styles.footerRow}>
        <Text style={styles.accountNumber}>
          {isCash ? 'OFFLINE SECURE' : `•••• •••• •••• ${account.account_number.replace('XX', '')}`}
        </Text>
        <Text style={styles.encryptedTag}>Zero-Cloud</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    width: CARD_WIDTH,
    height: 180,
    borderRadius: BorderRadius['2xl'],
    padding: Spacing.lg,
    marginRight: Spacing.md,
    justifyContent: 'space-between',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  cardSelected: {
    borderColor: Colors.emeraldGreen,
    shadowColor: Colors.emeraldGreen,
    shadowOpacity: 0.4,
    shadowRadius: 15,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bankNameGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  bankIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bankName: {
    color: Colors.crispWhite,
    fontSize: Typography.md,
    fontWeight: '700',
  },
  accountType: {
    color: Colors.slateSubtle,
    fontSize: Typography.xs,
  },
  selectedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.emeraldGreen,
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: BorderRadius.full,
    gap: 3,
  },
  selectedText: {
    color: Colors.primaryNavy,
    fontSize: 10,
    fontWeight: '800',
  },
  chipRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 4,
  },
  simChip: {
    width: 32,
    height: 24,
    borderRadius: 5,
    backgroundColor: '#D4AF37', // Gold chip
    borderWidth: 1,
    borderColor: '#F59E0B',
    padding: 3,
    justifyContent: 'center',
  },
  chipInner: {
    width: '100%',
    height: '60%',
    borderWidth: 0.8,
    borderColor: '#92400E',
    borderRadius: 2,
  },
  balanceSection: {
    marginTop: 2,
  },
  balanceLabel: {
    color: Colors.slateSubtle,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1,
  },
  balanceAmount: {
    color: Colors.crispWhite,
    fontSize: Typography['2xl'],
    fontWeight: '800',
    marginTop: 2,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  accountNumber: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: Typography.xs,
    fontFamily: 'monospace',
    letterSpacing: 1.5,
  },
  encryptedTag: {
    color: Colors.emeraldGreen,
    fontSize: 9,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
});
