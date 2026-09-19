import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Header } from '../components/Header';
import { NetWorthCard } from '../components/NetWorthCard';
import { SpendingChart } from '../components/SpendingChart';
import { TransactionItem } from '../components/TransactionItem';
import { Colors, Spacing, Typography, BorderRadius } from '../utils/theme';
import { fetchAllFinanceData } from '../database/seeder';
import { getDB } from '../database/db';
import { Account, Transaction, SupportedLanguage, TransactionCategory } from '../types';
import { Plus, X, ArrowUpDown, ChevronRight, Check } from 'lucide-react-native';

export const DashboardScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const [language, setLanguage] = useState<SupportedLanguage>('EN');
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [totalBalance, setTotalBalance] = useState<number>(0);
  const [mtdSpending, setMtdSpending] = useState<number>(0);
  const [categoryExpenses, setCategoryExpenses] = useState<Record<string, number>>({});

  // Quick Log Modal State
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [merchantInput, setMerchantInput] = useState('');
  const [amountInput, setAmountInput] = useState('');
  const [categoryInput, setCategoryInput] = useState<TransactionCategory>('Food & Dining');
  const [selectedAccountId, setSelectedAccountId] = useState('acc_hdfc');
  const [typeInput, setTypeInput] = useState<'debit' | 'credit'>('debit');

  const loadData = useCallback(async () => {
    try {
      const data = await fetchAllFinanceData();
      setAccounts(data.accounts);
      setTransactions(data.transactions);
      setTotalBalance(data.totalBalance);
      setMtdSpending(data.mtdSpending);
      setCategoryExpenses(data.categoryExpenses);
    } catch (e) {
      console.error('Error fetching finance data:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleCreateTransaction = async () => {
    const numAmount = parseFloat(amountInput);
    if (!merchantInput.trim() || isNaN(numAmount) || numAmount <= 0) {
      Alert.alert('Invalid Entry', 'Please enter a valid merchant name and positive amount.');
      return;
    }

    try {
      const db = getDB();
      await db.addTransaction({
        account_id: selectedAccountId,
        amount: numAmount,
        merchant: merchantInput.trim(),
        category: categoryInput,
        type: typeInput,
        date: new Date().toISOString(),
        notes: 'Manually logged via FinSarathi',
      });

      setIsModalVisible(false);
      setMerchantInput('');
      setAmountInput('');
      loadData();
    } catch (err) {
      console.error('Failed to save transaction:', err);
    }
  };

  const availableCategories: TransactionCategory[] = [
    'Food & Dining',
    'Groceries',
    'Fuel & Travel',
    'Utilities & Bills',
    'Shopping',
    'Health & Wellness',
    'Salary & Income',
  ];

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
        {/* Header with Multilingual Chip */}
        <Header
          userName="Mayur"
          activeLanguage={language}
          onLanguageChange={setLanguage}
        />

        {/* Net Worth Card */}
        <NetWorthCard
          totalBalance={totalBalance}
          mtdSpending={mtdSpending}
          onAddTransaction={() => setIsModalVisible(true)}
          onQuickAction={(action) => {
            if (action === 'budget') {
              Alert.alert(
                'September Forecast',
                'Your projected end-of-month savings: ₹1,42,000. Discretionary spending is 12% below budget limits.'
              );
            }
          }}
        />

        {/* Category Spending Donut Chart */}
        <SpendingChart categoryExpenses={categoryExpenses} />

        {/* Recent Transactions List Header */}
        <View style={styles.sectionHeaderRow}>
          <View>
            <Text style={styles.sectionTitle}>Recent Transactions</Text>
            <Text style={styles.sectionSubtitle}>
              Live Ledger • {transactions.length} Records
            </Text>
          </View>
          <TouchableOpacity
            style={styles.filterChip}
            onPress={() => onRefresh()}
          >
            <ArrowUpDown size={12} color={Colors.emeraldGreen} />
            <Text style={styles.filterChipText}>Sync</Text>
          </TouchableOpacity>
        </View>

        {/* Transactions List */}
        {transactions.slice(0, 8).map((tx) => (
          <TransactionItem
            key={tx.id}
            transaction={tx}
            onPress={() => {
              Alert.alert(
                tx.merchant,
                `Amount: ₹${tx.amount}\nCategory: ${tx.category}\nAccount: ${tx.account_name || tx.account_id}\nNotes: ${tx.notes || 'None'}`
              );
            }}
          />
        ))}
      </ScrollView>

      {/* Quick Add Transaction Modal */}
      <Modal
        visible={isModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Quick Expense / Income Log</Text>
              <TouchableOpacity
                onPress={() => setIsModalVisible(false)}
                style={styles.closeBtn}
              >
                <X size={20} color={Colors.slateLight} />
              </TouchableOpacity>
            </View>

            {/* Type selector (Debit vs Credit) */}
            <View style={styles.typeSelectorRow}>
              <TouchableOpacity
                style={[
                  styles.typeButton,
                  typeInput === 'debit' && styles.typeButtonDebitActive,
                ]}
                onPress={() => setTypeInput('debit')}
              >
                <Text
                  style={[
                    styles.typeText,
                    typeInput === 'debit' && styles.typeTextActive,
                  ]}
                >
                  Debit (Spend)
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.typeButton,
                  typeInput === 'credit' && styles.typeButtonCreditActive,
                ]}
                onPress={() => setTypeInput('credit')}
              >
                <Text
                  style={[
                    styles.typeText,
                    typeInput === 'credit' && styles.typeTextActive,
                  ]}
                >
                  Credit (Income)
                </Text>
              </TouchableOpacity>
            </View>

            {/* Merchant Input */}
            <Text style={styles.inputLabel}>Merchant / Title</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="e.g. Swiggy, DMart, Petrol"
              placeholderTextColor={Colors.slateGray}
              value={merchantInput}
              onChangeText={setMerchantInput}
            />

            {/* Amount Input */}
            <Text style={styles.inputLabel}>Amount (₹ INR)</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="e.g. 450"
              placeholderTextColor={Colors.slateGray}
              keyboardType="numeric"
              value={amountInput}
              onChangeText={setAmountInput}
            />

            {/* Account Selector */}
            <Text style={styles.inputLabel}>Select Account</Text>
            <View style={styles.accountChoiceRow}>
              {accounts.map((acc) => {
                const isSelected = selectedAccountId === acc.id;
                return (
                  <TouchableOpacity
                    key={acc.id}
                    style={[
                      styles.accountChoiceChip,
                      isSelected && styles.accountChoiceChipActive,
                    ]}
                    onPress={() => setSelectedAccountId(acc.id)}
                  >
                    <Text
                      style={[
                        styles.accountChoiceText,
                        isSelected && styles.accountChoiceTextActive,
                      ]}
                    >
                      {acc.bank_name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Category Selector */}
            <Text style={styles.inputLabel}>Category</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoryScroll}
            >
              {availableCategories.map((cat) => {
                const isSelected = categoryInput === cat;
                return (
                  <TouchableOpacity
                    key={cat}
                    style={[
                      styles.categoryChip,
                      isSelected && styles.categoryChipActive,
                    ]}
                    onPress={() => setCategoryInput(cat)}
                  >
                    <Text
                      style={[
                        styles.categoryChipText,
                        isSelected && styles.categoryChipTextActive,
                      ]}
                    >
                      {cat}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Submit Button */}
            <TouchableOpacity
              style={styles.submitBtn}
              activeOpacity={0.8}
              onPress={handleCreateTransaction}
            >
              <Check size={18} color={Colors.primaryNavy} />
              <Text style={styles.submitBtnText}>Save to Local SQLite Ledger</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.darkBg,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: Spacing.lg,
    marginTop: Spacing.xl,
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    color: Colors.crispWhite,
    fontSize: Typography.xl,
    fontWeight: '700',
  },
  sectionSubtitle: {
    color: Colors.slateGray,
    fontSize: Typography.xs,
    marginTop: 2,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.cardBg,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.borderDark,
  },
  filterChipText: {
    color: Colors.emeraldGreen,
    fontSize: Typography.xs,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(2, 12, 27, 0.85)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.cardBg,
    borderTopLeftRadius: BorderRadius['2xl'],
    borderTopRightRadius: BorderRadius['2xl'],
    padding: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  modalTitle: {
    color: Colors.crispWhite,
    fontSize: Typography.lg,
    fontWeight: '700',
  },
  closeBtn: {
    padding: 4,
  },
  typeSelectorRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: Spacing.md,
  },
  typeButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.cardBgLight,
    alignItems: 'center',
  },
  typeButtonDebitActive: {
    backgroundColor: Colors.debitRed,
  },
  typeButtonCreditActive: {
    backgroundColor: Colors.emeraldGreen,
  },
  typeText: {
    color: Colors.slateSubtle,
    fontSize: Typography.sm,
    fontWeight: '600',
  },
  typeTextActive: {
    color: Colors.crispWhite,
    fontWeight: '700',
  },
  inputLabel: {
    color: Colors.slateLight,
    fontSize: Typography.xs,
    fontWeight: '600',
    marginBottom: 6,
    marginTop: 6,
  },
  modalInput: {
    backgroundColor: Colors.darkBg,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    color: Colors.crispWhite,
    fontSize: Typography.md,
    borderWidth: 1,
    borderColor: Colors.borderDark,
    marginBottom: Spacing.xs,
  },
  accountChoiceRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: Spacing.xs,
  },
  accountChoiceChip: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.darkBg,
    borderWidth: 1,
    borderColor: Colors.borderDark,
    alignItems: 'center',
  },
  accountChoiceChipActive: {
    borderColor: Colors.emeraldGreen,
    backgroundColor: Colors.cardBgLight,
  },
  accountChoiceText: {
    color: Colors.slateSubtle,
    fontSize: 11,
    fontWeight: '600',
  },
  accountChoiceTextActive: {
    color: Colors.emeraldGreen,
  },
  categoryScroll: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 4,
  },
  categoryChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.darkBg,
    borderWidth: 1,
    borderColor: Colors.borderDark,
  },
  categoryChipActive: {
    backgroundColor: Colors.emeraldGreen,
  },
  categoryChipText: {
    color: Colors.slateSubtle,
    fontSize: Typography.xs,
    fontWeight: '600',
  },
  categoryChipTextActive: {
    color: Colors.primaryNavy,
    fontWeight: '700',
  },
  submitBtn: {
    backgroundColor: Colors.emeraldGreen,
    borderRadius: BorderRadius.xl,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.xl,
    gap: 8,
  },
  submitBtnText: {
    color: Colors.primaryNavy,
    fontSize: Typography.md,
    fontWeight: '700',
  },
});
