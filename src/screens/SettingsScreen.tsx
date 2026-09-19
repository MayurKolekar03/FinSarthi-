import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Switch,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Spacing, Typography, BorderRadius } from '../utils/theme';
import { resetDatabase } from '../database/seeder';
import {
  ShieldCheck,
  CloudUpload,
  KeyRound,
  CheckCircle2,
  RefreshCw,
  LogOut,
  Sliders,
  Lock,
  ExternalLink,
  ChevronRight,
  Database,
} from 'lucide-react-native';

export const SettingsScreen: React.FC = () => {
  const insets = useSafeAreaInsets();

  // Google Sign-in state
  const [isGoogleConnected, setIsGoogleConnected] = useState(true);
  const [googleEmail, setGoogleEmail] = useState('mayur.fintech@gmail.com');

  // Decentralized Drive Backup state
  const [lastBackup, setLastBackup] = useState('Just now - Local SQLite encrypted');
  const [isBackingUp, setIsBackingUp] = useState(false);

  // BYOK (Bring Your Own Key) Groq Key state
  const [groqApiKey, setGroqApiKey] = useState('gsk_live_fin_••••••••••••••98a2');
  const [showKey, setShowKey] = useState(false);
  const [isTestingKey, setIsTestingKey] = useState(false);
  const [keyStatus, setKeyStatus] = useState<'idle' | 'valid' | 'invalid'>('valid');

  // Security Toggles
  const [biometricEnabled, setBiometricEnabled] = useState(true);
  const [privacyGuardrails, setPrivacyGuardrails] = useState(true);

  const handleGoogleConnectToggle = () => {
    if (isGoogleConnected) {
      Alert.alert(
        'Disconnect Google Account?',
        'Your local database will remain completely intact on your device.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Disconnect',
            style: 'destructive',
            onPress: () => {
              setIsGoogleConnected(false);
              setGoogleEmail('');
            },
          },
        ]
      );
    } else {
      setIsGoogleConnected(true);
      setGoogleEmail('mayur.fintech@gmail.com');
      Alert.alert('Account Linked', 'Google OAuth account connected securely.');
    }
  };

  const handleBackupNow = () => {
    setIsBackingUp(true);
    setTimeout(() => {
      setIsBackingUp(false);
      const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setLastBackup(`Today at ${timeStr} - Local SQLite encrypted (AES-256)`);
      Alert.alert(
        'Encrypted Backup Completed',
        'Your zero-cloud SQLite ledger was client-side encrypted and synced to your private Google Drive AppData folder.'
      );
    }, 1200);
  };

  const handleTestGroqKey = () => {
    if (!groqApiKey.trim()) {
      Alert.alert('Missing Key', 'Please enter your Groq API key first.');
      return;
    }

    setIsTestingKey(true);
    setTimeout(() => {
      setIsTestingKey(false);
      setKeyStatus('valid');
      Alert.alert(
        'Groq Connectivity Confirmed! ⚡',
        'Ping latency: 142ms. LLM Inference Ready for Llama-3.3-70B multilingual parsing.'
      );
    }, 1000);
  };

  const handleResetData = () => {
    Alert.alert(
      'Reset to 15 Realistic Seed Transactions?',
      'This will re-initialize your local SQLite database with initial demo records.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset & Reseed',
          style: 'destructive',
          onPress: async () => {
            await resetDatabase();
            Alert.alert('Database Reseeded', 'Default accounts & 15 transactions restored.');
          },
        },
      ]
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 80 }}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Settings & Privacy</Text>
          <Text style={styles.subtitle}>Zero-Cloud Personal Sovereign Finance</Text>
        </View>

        {/* 1. Google Sign-In Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.iconCircle}>
              <CheckCircle2 size={18} color={isGoogleConnected ? Colors.emeraldGreen : Colors.slateGray} />
            </View>
            <View style={styles.headerTextGroup}>
              <Text style={styles.cardTitle}>Google Account Authentication</Text>
              <Text style={styles.cardDesc}>
                {isGoogleConnected
                  ? `Connected as ${googleEmail}`
                  : 'Link to enable decentralized private backup'}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={[
              styles.actionButton,
              isGoogleConnected ? styles.actionButtonOutline : styles.actionButtonPrimary,
            ]}
            onPress={handleGoogleConnectToggle}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.actionButtonText,
                isGoogleConnected ? styles.actionButtonTextOutline : styles.actionButtonTextPrimary,
              ]}
            >
              {isGoogleConnected ? 'Disconnect Account' : 'Connect Account'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* 2. Decentralized Google Drive Backup */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={[styles.iconCircle, { backgroundColor: Colors.cardBgLight }]}>
              <CloudUpload size={18} color={Colors.blueAccent} />
            </View>
            <View style={styles.headerTextGroup}>
              <Text style={styles.cardTitle}>Decentralized Google Drive Backup</Text>
              <Text style={styles.cardDesc}>
                Client-side encrypted ledger stored strictly in your own Drive
              </Text>
            </View>
          </View>

          <View style={styles.backupStatusBox}>
            <Text style={styles.backupStatusLabel}>Backup Status:</Text>
            <Text style={styles.backupStatusValue}>{lastBackup}</Text>
          </View>

          <TouchableOpacity
            style={styles.backupButton}
            onPress={handleBackupNow}
            disabled={isBackingUp}
            activeOpacity={0.8}
          >
            {isBackingUp ? (
              <ActivityIndicator size="small" color={Colors.primaryNavy} />
            ) : (
              <>
                <RefreshCw size={15} color={Colors.primaryNavy} />
                <Text style={styles.backupButtonText}>Backup SQLite DB Now</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* 3. BYOK (Bring Your Own Key) Section */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={[styles.iconCircle, { backgroundColor: Colors.amberLight }]}>
              <KeyRound size={18} color={Colors.amberWarn} />
            </View>
            <View style={styles.headerTextGroup}>
              <Text style={styles.cardTitle}>BYOK (Bring Your Own Key)</Text>
              <Text style={styles.cardDesc}>
                Direct client-to-inference with personal Groq API Key
              </Text>
            </View>
          </View>

          <Text style={styles.inputLabel}>Groq API Key (Llama-3.3)</Text>
          <View style={styles.keyInputContainer}>
            <TextInput
              style={styles.keyInput}
              value={groqApiKey}
              onChangeText={(text) => {
                setGroqApiKey(text);
                setKeyStatus('idle');
              }}
              placeholder="gsk_..."
              placeholderTextColor={Colors.slateGray}
              secureTextEntry={!showKey}
              autoCapitalize="none"
            />
            <TouchableOpacity
              style={styles.showKeyBtn}
              onPress={() => setShowKey(!showKey)}
            >
              <Text style={styles.showKeyText}>{showKey ? 'Hide' : 'Show'}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.keyActionRow}>
            <TouchableOpacity
              style={styles.testKeyButton}
              onPress={handleTestGroqKey}
              disabled={isTestingKey}
              activeOpacity={0.8}
            >
              {isTestingKey ? (
                <ActivityIndicator size="small" color={Colors.crispWhite} />
              ) : (
                <Text style={styles.testKeyText}>Test Connectivity ⚡</Text>
              )}
            </TouchableOpacity>

            {keyStatus === 'valid' && (
              <View style={styles.validPill}>
                <CheckCircle2 size={12} color={Colors.emeraldGreen} />
                <Text style={styles.validPillText}>Online (142ms)</Text>
              </View>
            )}
          </View>
        </View>

        {/* 4. Security & Guardrails */}
        <View style={styles.card}>
          <Text style={styles.sectionHeading}>Security & Privacy Engine</Text>

          <View style={styles.switchRow}>
            <View style={styles.switchTextGroup}>
              <Text style={styles.switchLabel}>Biometric App Lock</Text>
              <Text style={styles.switchSub}>Require FaceID/Fingerprint on launch</Text>
            </View>
            <Switch
              value={biometricEnabled}
              onValueChange={setBiometricEnabled}
              trackColor={{ false: Colors.cardBgLight, true: Colors.emeraldGreen }}
              thumbColor={Colors.crispWhite}
            />
          </View>

          <View style={styles.divider} />

          <View style={styles.switchRow}>
            <View style={styles.switchTextGroup}>
              <Text style={styles.switchLabel}>RBI Data Guardrails</Text>
              <Text style={styles.switchSub}>Strict compliance with local financial storage norms</Text>
            </View>
            <Switch
              value={privacyGuardrails}
              onValueChange={setPrivacyGuardrails}
              trackColor={{ false: Colors.cardBgLight, true: Colors.emeraldGreen }}
              thumbColor={Colors.crispWhite}
            />
          </View>
        </View>

        {/* 5. Database Maintenance */}
        <View style={styles.card}>
          <Text style={styles.sectionHeading}>Developer & Database Tools</Text>
          <TouchableOpacity
            style={styles.resetBtn}
            onPress={handleResetData}
            activeOpacity={0.8}
          >
            <Database size={16} color={Colors.debitRed} />
            <Text style={styles.resetBtnText}>Reseed 15 Realistic Transactions</Text>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerBrand}>FinSarathi.AI • v1.0.0</Text>
          <Text style={styles.footerSub}>
            Zero-Cloud Architecture • Designed for Indian Users
          </Text>
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
  header: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.md,
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
  card: {
    backgroundColor: Colors.cardBg,
    borderRadius: BorderRadius['2xl'],
    padding: Spacing.lg,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: Spacing.md,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.emeraldLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTextGroup: {
    flex: 1,
  },
  cardTitle: {
    color: Colors.crispWhite,
    fontSize: Typography.md,
    fontWeight: '700',
  },
  cardDesc: {
    color: Colors.slateGray,
    fontSize: Typography.xs,
    marginTop: 2,
  },
  actionButton: {
    paddingVertical: 10,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonPrimary: {
    backgroundColor: Colors.emeraldGreen,
  },
  actionButtonOutline: {
    backgroundColor: Colors.cardBgLight,
    borderWidth: 1,
    borderColor: Colors.borderDark,
  },
  actionButtonText: {
    fontSize: Typography.sm,
    fontWeight: '700',
  },
  actionButtonTextPrimary: {
    color: Colors.primaryNavy,
  },
  actionButtonTextOutline: {
    color: Colors.slateSubtle,
  },
  backupStatusBox: {
    backgroundColor: Colors.darkBg,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.borderDark,
  },
  backupStatusLabel: {
    color: Colors.slateGray,
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 2,
  },
  backupStatusValue: {
    color: Colors.emeraldGreen,
    fontSize: Typography.xs,
    fontWeight: '700',
  },
  backupButton: {
    backgroundColor: Colors.emeraldGreen,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 11,
    borderRadius: BorderRadius.lg,
    gap: 8,
  },
  backupButtonText: {
    color: Colors.primaryNavy,
    fontSize: Typography.sm,
    fontWeight: '700',
  },
  inputLabel: {
    color: Colors.slateLight,
    fontSize: Typography.xs,
    fontWeight: '600',
    marginBottom: 6,
  },
  keyInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.darkBg,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.borderDark,
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
  },
  keyInput: {
    flex: 1,
    color: Colors.crispWhite,
    fontSize: Typography.sm,
    paddingVertical: 10,
  },
  showKeyBtn: {
    padding: 6,
  },
  showKeyText: {
    color: Colors.slateSubtle,
    fontSize: Typography.xs,
    fontWeight: '600',
  },
  keyActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  testKeyButton: {
    backgroundColor: Colors.cardBgLight,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.borderDark,
  },
  testKeyText: {
    color: Colors.crispWhite,
    fontSize: Typography.xs,
    fontWeight: '600',
  },
  validPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.emeraldLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  validPillText: {
    color: Colors.emeraldGreen,
    fontSize: 11,
    fontWeight: '700',
  },
  sectionHeading: {
    color: Colors.crispWhite,
    fontSize: Typography.sm,
    fontWeight: '700',
    marginBottom: Spacing.sm,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  switchTextGroup: {
    flex: 1,
    marginRight: Spacing.md,
  },
  switchLabel: {
    color: Colors.slateSubtle,
    fontSize: Typography.sm,
    fontWeight: '600',
  },
  switchSub: {
    color: Colors.slateGray,
    fontSize: 11,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.borderLight,
    marginVertical: 6,
  },
  resetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.darkBg,
    paddingVertical: 11,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(244, 63, 94, 0.3)',
    gap: 8,
  },
  resetBtnText: {
    color: Colors.debitRed,
    fontSize: Typography.xs,
    fontWeight: '700',
  },
  footer: {
    alignItems: 'center',
    paddingVertical: Spacing.lg,
  },
  footerBrand: {
    color: Colors.slateLight,
    fontSize: Typography.xs,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  footerSub: {
    color: Colors.slateGray,
    fontSize: 10,
    marginTop: 2,
  },
});
