import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Globe, Bell, ShieldCheck } from 'lucide-react-native';
import { Colors, Spacing, Typography, BorderRadius } from '../utils/theme';
import { SupportedLanguage } from '../types';

interface HeaderProps {
  userName?: string;
  activeLanguage: SupportedLanguage;
  onLanguageChange: (lang: SupportedLanguage) => void;
}

export const Header: React.FC<HeaderProps> = ({
  userName = 'Mayur',
  activeLanguage,
  onLanguageChange,
}) => {
  const languages: SupportedLanguage[] = ['EN', 'HI', 'MR'];

  const getGreeting = () => {
    switch (activeLanguage) {
      case 'HI':
        return 'नमस्ते,';
      case 'MR':
        return 'नमस्कार,';
      default:
        return 'Welcome back,';
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.userInfoContainer}>
        <View style={styles.avatarBadge}>
          <Text style={styles.avatarText}>{userName.charAt(0)}</Text>
        </View>
        <View>
          <View style={styles.badgeRow}>
            <Text style={styles.greetingText}>{getGreeting()}</Text>
            <View style={styles.privacyPill}>
              <ShieldCheck size={11} color={Colors.emeraldGreen} />
              <Text style={styles.privacyText}>Zero-Cloud</Text>
            </View>
          </View>
          <Text style={styles.nameText}>{userName}</Text>
        </View>
      </View>

      <View style={styles.rightActions}>
        {/* Language Selector Chip */}
        <View style={styles.languageSelector}>
          <Globe size={13} color={Colors.slateSubtle} style={{ marginRight: 4 }} />
          {languages.map((lang, index) => {
            const isActive = activeLanguage === lang;
            return (
              <React.Fragment key={lang}>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => onLanguageChange(lang)}
                  style={[styles.langChip, isActive && styles.activeLangChip]}
                >
                  <Text
                    style={[styles.langText, isActive && styles.activeLangText]}
                  >
                    {lang}
                  </Text>
                </TouchableOpacity>
                {index < languages.length - 1 && (
                  <Text style={styles.divider}>|</Text>
                )}
              </React.Fragment>
            );
          })}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  userInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.cardBgLight,
    borderWidth: 1.5,
    borderColor: Colors.emeraldGreen,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
    shadowColor: Colors.emeraldGreen,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
  avatarText: {
    color: Colors.crispWhite,
    fontSize: Typography.lg,
    fontWeight: '700',
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  greetingText: {
    color: Colors.slateLight,
    fontSize: Typography.xs,
    fontWeight: '500',
    letterSpacing: 0.3,
  },
  privacyPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.emeraldLight,
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: BorderRadius.full,
    gap: 3,
  },
  privacyText: {
    color: Colors.emeraldGreen,
    fontSize: 9,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  nameText: {
    color: Colors.crispWhite,
    fontSize: Typography.lg,
    fontWeight: '700',
    marginTop: 1,
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  languageSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.cardBg,
    borderRadius: BorderRadius.full,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: Colors.borderDark,
  },
  langChip: {
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
  },
  activeLangChip: {
    backgroundColor: Colors.emeraldGreen,
  },
  langText: {
    color: Colors.slateSubtle,
    fontSize: Typography.xs,
    fontWeight: '600',
  },
  activeLangText: {
    color: Colors.primaryNavy,
    fontWeight: '800',
  },
  divider: {
    color: Colors.slateGray,
    fontSize: Typography.xs,
    marginHorizontal: 1,
  },
});
