import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Globe, ShieldCheck } from 'lucide-react-native';
import { Colors, Spacing, Typography, BorderRadius } from '../utils/theme';
import { SupportedLanguage } from '../types';
import { useLanguage } from '../context/LanguageContext';

interface HeaderProps {
  userName?: string;
  activeLanguage?: SupportedLanguage;
  onLanguageChange?: (lang: SupportedLanguage) => void;
}

export const Header: React.FC<HeaderProps> = ({
  userName = 'Mayur',
  activeLanguage: propLang,
  onLanguageChange: propOnChange,
}) => {
  const { language, setLanguage, t } = useLanguage();
  const currentLang = propLang || language;
  const languages: SupportedLanguage[] = ['EN', 'HI', 'MR'];

  const handleLanguageSelect = (lang: SupportedLanguage) => {
    setLanguage(lang);
    if (propOnChange) {
      propOnChange(lang);
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
            <Text style={styles.greetingText}>{t('greeting')}</Text>
            <View style={styles.privacyPill}>
              <ShieldCheck size={11} color={Colors.emeraldGreen} />
              <Text style={styles.privacyText}>{t('zeroCloud')}</Text>
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
            const isActive = currentLang === lang;
            return (
              <React.Fragment key={lang}>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => handleLanguageSelect(lang)}
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.md,
    backgroundColor: Colors.darkBg,
  },
  userInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarBadge: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.cardBg,
    borderWidth: 1.5,
    borderColor: Colors.emeraldGreen,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  avatarText: {
    color: Colors.crispWhite,
    fontSize: Typography.lg,
    fontWeight: '700',
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  greetingText: {
    color: Colors.slateGray,
    fontSize: Typography.xs,
    fontWeight: '500',
    marginRight: Spacing.xs,
  },
  privacyPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.emeraldLight,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: BorderRadius.full,
    borderWidth: 0.5,
    borderColor: 'rgba(16, 185, 129, 0.4)',
  },
  privacyText: {
    color: Colors.emeraldGreen,
    fontSize: 9,
    fontWeight: '700',
    marginLeft: 3,
  },
  nameText: {
    color: Colors.crispWhite,
    fontSize: Typography.lg,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  languageSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.cardBg,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: Colors.borderDark,
  },
  langChip: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
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
    color: Colors.crispWhite,
    fontWeight: '700',
  },
  divider: {
    color: Colors.borderDark,
    fontSize: Typography.xs,
    marginHorizontal: 1,
  },
});
