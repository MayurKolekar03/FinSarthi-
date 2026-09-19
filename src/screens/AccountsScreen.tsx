import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AccountCard } from '../components/AccountCard';
import { TransactionItem } from '../components/TransactionItem';
import { Account, Transaction } from '../types';
import { Colors, Spacing, Typography, BorderRadius } from '../utils/theme';
import { formatINR } from '../utils/currency';
import { fetchAllFinanceData } from '../database/seeder';
import { Layers, Filter, Plus, ShieldCheck, ArrowRightLeft } from 'lucide-react-native';

export const AccountsScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [ledgerMode, setLedgerMode] = useState<'merged' | 'filtered'>('merged');
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const loadData = useCallback(async () => {
    try {
      const data = await fetchAllFinanceData();
      setAccounts(data.accounts);
      setAllTransactions(data.transactions);
      if (data.accounts.length > 0 && !selectedAccount) {
        setSelectedAccount(data.accounts[0]);
      }
    } catch (e) {
      console.error('Error fetching accounts data:', e);
    } finally {
      setRefreshing(false);
    }
  }, [selectedAccount]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  // Determine transactions to display
  const displayedTransactions = ledgerMode === 'merged'
    ? allTransactions
    : allTransactions.filter((tx) => tx.account_id === selectedAccount?.id);

  // Compute summary for displayed transactions
  const totalInflow = displayedTransactions
    .filter((t) => t.type === 'credit')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalOutflow = displayedTransactions
    .filter((t) => t.type === 'debit')
    .reduce((sum, t) => sum + t.amount, 0);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 80 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.emeraldGreen}
            colors={[Colors.emeraldGreen]}
          />
        }
      >
        {/* Screen Title */}
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.title}>Accounts & Wallets</Text>
            <Text style={styles.subtitle}>
              Zero-Cloud Aggregated Ledger
            </Text>
          </View>
          <TouchableOpacity
            style={styles.addAccountBtn}
            onPress={() =>
              Alert.alert(
                'Link Account',
                'Connect via AA (Account Aggregator) or add an offline ledger account.'
              )
            }
          >
            <Plus size={16} color={Colors.emeraldGreen} />
            <Text style={styles.addAccountText}>Add</Text>
          </TouchableOpacity>
        </View>

        {/* Horizontal Swipeable Account Cards */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.cardsScroll}
          decelerationRate="fast"
          snapToInterval={280}
        >
          {accounts.map((acc) => (
            <AccountCard
              key={acc.id}
              account={acc}
              isSelected={selectedAccount?.id === acc.id}
              onSelect={(account) => {
                setSelectedAccount(account);
                setLedgerMode('filtered');
              }}
            />
          ))}
        </ScrollView>

        {/* Ledger Mode Switcher Toggle */}
        <View style={styles.toggleContainer}>
          <View style={styles.toggleTrack}>
            <TouchableOpacity
              activeOpacity={0.8}
              style={[
                styles.toggleOption,
                ledgerMode === 'merged' && styles.toggleOptionActive,
              ]}
              onPress={() => setLedgerMode('merged')}
            >
              <Layers
                size={14}
                color={ledgerMode === 'merged' ? Colors.primaryNavy : Colors.slateSubtle}
              />
              <Text
                style={[
                  styles.toggleText,
                  ledgerMode === 'merged' && styles.toggleTextActive,
                ]}
              >
                Merged Master Ledger
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              style={[
                styles.toggleOption,
                ledgerMode === 'filtered' && styles.toggleOptionActive,
              ]}
              onPress={() => setLedgerMode('filtered')}
            >
              <Filter
                size={14}
                color={ledgerMode === 'filtered' ? Colors.primaryNavy : Colors.slateSubtle}
              />
              <Text
                style={[
                  styles.toggleText,
                  ledgerMode === 'filtered' && styles.toggleTextActive,
                ]}
              >
                Filtered Account Ledger
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Ledger Summary Stats */}
        <View style={styles.ledgerInfoCard}>
          <View style={styles.ledgerInfoHeader}>
            <Text style={styles.ledgerViewTitle}>
              {ledgerMode === 'merged'
                ? '🌐 Merged Master Ledger (All 3 Accounts)'
                : `🏦 Filtered: ${selectedAccount?.bank_name} (${selectedAccount?.account_number})`}
            </Text>
            <Text style={styles.recordCount}>
              {displayedTransactions.length} records
            </Text>
          </View>

          <View style={styles.inflowOutflowRow}>
            <View style={styles.statBox}>
              <Text style={styles.statBoxLabel}>Total Inflow</Text>
              <Text style={[styles.statBoxValue, { color: Colors.creditGreen }]}>
                +{formatINR(totalInflow)}
              </Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Text style={styles.statBoxLabel}>Total Outflow</Text>
              <Text style={[styles.statBoxValue, { color: Colors.debitRed }]}>
                -{formatINR(totalOutflow)}
              </Text>
            </View>
          </View>
        </View>

        {/* Transactions List */}
        <View style={styles.listSection}>
          {displayedTransactions.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyTitle}>No Transactions Recorded</Text>
              <Text style={styles.emptyDesc}>
                There are no ledger entries for this selected account yet.
              </Text>
            </View>
          ) : (
            displayedTransactions.map((tx) => (
              <TransactionItem
                key={tx.id}
                transaction={tx}
                onPress={() => {
                  Alert.alert(
                    tx.merchant,
                    `Amount: ₹${tx.amount}\nCategory: ${tx.category}\nDate: ${new Date(tx.date).toLocaleString('en-IN')}\nNotes: ${tx.notes || 'None'}`
                  );
                }}
              />
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.darkBg,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  title: {
    color: Colors.crispWhite,
    fontSize: Typography['2xl'],
    fontWeight: '800',
  },
  subtitle: {
    color: Colors.slateGray,
    fontSize: Typography.xs,
    marginTop: 2,
  },
  addAccountBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.cardBg,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.emeraldGreen,
    gap: 4,
  },
  addAccountText: {
    color: Colors.emeraldGreen,
    fontSize: Typography.xs,
    fontWeight: '700',
  },
  cardsScroll: {
    paddingLeft: Spacing.lg,
    paddingRight: Spacing.sm,
    paddingVertical: Spacing.md,
  },
  toggleContainer: {
    paddingHorizontal: Spacing.lg,
    marginTop: Spacing.sm,
    marginBottom: Spacing.md,
  },
  toggleTrack: {
    flexDirection: 'row',
    backgroundColor: Colors.cardBg,
    borderRadius: BorderRadius.xl,
    padding: 4,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  toggleOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    borderRadius: BorderRadius.lg,
    gap: 6,
  },
  toggleOptionActive: {
    backgroundColor: Colors.emeraldGreen,
  },
  toggleText: {
    color: Colors.slateSubtle,
    fontSize: Typography.xs,
    fontWeight: '600',
  },
  toggleTextActive: {
    color: Colors.primaryNavy,
    fontWeight: '800',
  },
  ledgerInfoCard: {
    backgroundColor: Colors.cardBg,
    borderRadius: BorderRadius.xl,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  ledgerInfoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  ledgerViewTitle: {
    color: Colors.crispWhite,
    fontSize: Typography.xs,
    fontWeight: '700',
    flexShrink: 1,
  },
  recordCount: {
    color: Colors.slateLight,
    fontSize: 11,
    fontWeight: '600',
  },
  inflowOutflowRow: {
    flexDirection: 'row',
    backgroundColor: Colors.cardBgLight,
    borderRadius: BorderRadius.md,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  statBox: {
    flex: 1,
  },
  statBoxLabel: {
    color: Colors.slateGray,
    fontSize: 10,
    fontWeight: '500',
  },
  statBoxValue: {
    fontSize: Typography.sm,
    fontWeight: '700',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    backgroundColor: Colors.borderDark,
    marginHorizontal: 10,
  },
  listSection: {
    marginTop: 2,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.xxl,
    paddingHorizontal: Spacing.lg,
  },
  emptyTitle: {
    color: Colors.crispWhite,
    fontSize: Typography.md,
    fontWeight: '700',
  },
  emptyDesc: {
    color: Colors.slateGray,
    fontSize: Typography.xs,
    textAlign: 'center',
    marginTop: 4,
  },
});
