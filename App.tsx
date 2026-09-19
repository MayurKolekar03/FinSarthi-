import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { RootNavigator } from './src/navigation/RootNavigator';
import { seedDatabase } from './src/database/seeder';
import { Colors, Typography, BorderRadius } from './src/utils/theme';
import { ShieldCheck, Sparkles } from 'lucide-react-native';

export default function App() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    async function prepareApp() {
      try {
        await seedDatabase();
      } catch (e) {
        console.warn('Database initialization warning:', e);
      } finally {
        setIsReady(true);
      }
    }

    prepareApp();
  }, []);

  if (!isReady) {
    return (
      <View style={styles.splashContainer}>
        <StatusBar style="light" />
        <View style={styles.splashCard}>
          <View style={styles.logoBadge}>
            <Sparkles size={32} color={Colors.emeraldGreen} />
          </View>
          <Text style={styles.brandTitle}>FinSarathi.AI</Text>
          <Text style={styles.brandSubtitle}>
            Privacy-First Multilingual Financial Copilot
          </Text>

          <View style={styles.loaderRow}>
            <ActivityIndicator size="small" color={Colors.emeraldGreen} />
            <Text style={styles.loadingText}>Mounting Zero-Cloud SQLite Ledger...</Text>
          </View>

          <View style={styles.guardrailRow}>
            <ShieldCheck size={14} color={Colors.emeraldGreen} />
            <Text style={styles.guardrailText}>RBI Compliant On-Device Storage</Text>
          </View>
        </View>
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <NavigationContainer>
        <RootNavigator />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  splashContainer: {
    flex: 1,
    backgroundColor: Colors.darkBg,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  splashCard: {
    alignItems: 'center',
    backgroundColor: Colors.cardBg,
    paddingVertical: 36,
    paddingHorizontal: 28,
    borderRadius: BorderRadius['2xl'],
    width: '100%',
    maxWidth: 360,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 8,
  },
  logoBadge: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: Colors.cardBgLight,
    borderWidth: 2,
    borderColor: Colors.emeraldGreen,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  brandTitle: {
    color: Colors.crispWhite,
    fontSize: Typography['3xl'],
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  brandSubtitle: {
    color: Colors.slateLight,
    fontSize: Typography.xs,
    fontWeight: '500',
    textAlign: 'center',
    marginTop: 6,
  },
  loaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 32,
  },
  loadingText: {
    color: Colors.slateSubtle,
    fontSize: Typography.xs,
    fontWeight: '600',
  },
  guardrailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 24,
    backgroundColor: Colors.emeraldLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    borderWidth: 0.8,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  guardrailText: {
    color: Colors.emeraldGreen,
    fontSize: 10,
    fontWeight: '700',
  },
});
