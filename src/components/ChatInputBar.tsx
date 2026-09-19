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
}

export const ChatInputBar: React.FC<ChatInputBarProps> = ({
  onSendMessage,
  onVoiceLogTrigger,
  isListening = false,
}) => {
  const [inputText, setInputText] = useState('');

  const handleSend = () => {
    if (!inputText.trim()) return;
    onSendMessage(inputText.trim());
    setInputText('');
  };

  const suggestions = [
    '₹350 Swiggy lunch',
    '📊 Monthly budget forecast',
    'किराना ₹1200 नगद (Cash)',
    'भाजीपाला ₹240 UPI (Marathi)',
  ];

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
          value={inputText}
          onChangeText={setInputText}
          placeholder="Type in Marathi, Hindi, or English..."
          placeholderTextColor={Colors.slateGray}
          multiline
          maxLength={300}
        />

        {/* Send Button */}
        <TouchableOpacity
          activeOpacity={0.8}
          style={[
            styles.sendButton,
            inputText.trim().length > 0 ? styles.sendButtonActive : styles.sendButtonDisabled,
          ]}
          onPress={handleSend}
          disabled={!inputText.trim()}
        >
          <Send
            size={18}
            color={inputText.trim().length > 0 ? Colors.crispWhite : Colors.slateGray}
          />
        </TouchableOpacity>
      </View>

      {isListening && (
        <View style={styles.listeningBanner}>
          <ActivityIndicator size="small" color={Colors.emeraldGreen} />
          <Text style={styles.listeningText}>
            Simulating multilingual speech recognition (Bhashini AI)...
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
