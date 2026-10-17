import React, { useState } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Mic, Send, Sparkles, MicOff } from 'lucide-react-native';
import { Colors, Spacing, Typography, BorderRadius } from '../utils/theme';

interface ChatInputBarProps {
  onSendMessage: (text: string) => void;
  onVoiceLogTrigger: () => void;
  isListening?: boolean;
  value?: string;
  onChangeText?: (text: string) => void;
  languageLabel?: string;
  placeholder?: string;
  suggestions?: string[];
}

export const ChatInputBar: React.FC<ChatInputBarProps> = ({
  onSendMessage,
  onVoiceLogTrigger,
  isListening = false,
  value,
  onChangeText,
  languageLabel = 'English, Hindi, Marathi',
  placeholder,
  suggestions = [
    'Total Bank Balance',
    'How much did I spend at Swiggy?',
    'Spending on 18 Sep?',
  ],
}) => {
  const [internalText, setInternalText] = useState('');
  const currentText = value !== undefined ? value : internalText;

  const handleTextChange = (text: string) => {
    if (onChangeText) {
      onChangeText(text);
    } else {
      setInternalText(text);
    }
  };

  const handleSend = () => {
    if (!currentText.trim()) return;
    onSendMessage(currentText.trim());
    if (onChangeText) {
      onChangeText('');
    } else {
      setInternalText('');
    }
  };

  return (
    <View style={styles.outerContainer}>
      {/* Quick Suggestions Chips */}
      <View style={styles.chipsScroll}>
        {suggestions.map((sug, i) => (
          <TouchableOpacity
            key={`sug-${i}`}
            style={styles.suggestionChip}
            activeOpacity={0.7}
            onPress={() => onSendMessage(sug)}
          >
            <Sparkles size={11} color={Colors.emeraldGreen} />
            <Text style={styles.suggestionText}>{sug}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Input Bar */}
      <View style={styles.inputContainer}>
        {/* Prominent Voice / Mic Button */}
        <TouchableOpacity
          activeOpacity={0.8}
          style={[styles.micButton, isListening && styles.micButtonActive]}
          onPress={onVoiceLogTrigger}
        >
          {isListening ? (
            <MicOff size={20} color={Colors.crispWhite} />
          ) : (
            <Mic size={20} color={Colors.primaryNavy} />
          )}
        </TouchableOpacity>

        {/* Text Input */}
        <TextInput
          style={styles.textInput}
          value={currentText}
          onChangeText={handleTextChange}
          placeholder={placeholder || `Type or speak in ${languageLabel}...`}
          placeholderTextColor={Colors.slateGray}
          multiline
          maxLength={300}
        />

        {/* Send Button */}
        <TouchableOpacity
          activeOpacity={0.8}
          style={[
            styles.sendButton,
            currentText.trim().length > 0 ? styles.sendButtonActive : styles.sendButtonDisabled,
          ]}
          onPress={handleSend}
          disabled={!currentText.trim()}
        >
          <Send
            size={18}
            color={currentText.trim().length > 0 ? Colors.crispWhite : Colors.slateGray}
          />
        </TouchableOpacity>
      </View>

      {isListening && (
        <View style={styles.listeningBanner}>
          <ActivityIndicator size="small" color={Colors.emeraldGreen} />
          <Text style={styles.listeningText}>
            🎤 Listening in {languageLabel}... Speak now
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  outerContainer: {
    backgroundColor: Colors.darkBg,
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.xs,
    paddingBottom: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.borderDark,
  },
  chipsScroll: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 8,
    flexWrap: 'wrap',
  },
  suggestionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.cardBg,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    gap: 4,
  },
  suggestionText: {
    color: Colors.slateSubtle,
    fontSize: 11,
    fontWeight: '500',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.cardBg,
    borderRadius: BorderRadius['2xl'],
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    gap: 6,
  },
  micButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.emeraldGreen,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.emeraldGreen,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 3,
  },
  micButtonActive: {
    backgroundColor: Colors.debitRed,
  },
  textInput: {
    flex: 1,
    color: Colors.crispWhite,
    fontSize: Typography.sm,
    paddingHorizontal: 8,
    maxHeight: 80,
  },
  sendButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonActive: {
    backgroundColor: Colors.emeraldGreen,
  },
  sendButtonDisabled: {
    backgroundColor: Colors.cardBgLight,
  },
  listeningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
    gap: 8,
  },
  listeningText: {
    color: Colors.emeraldGreen,
    fontSize: 11,
    fontWeight: '600',
  },
});
