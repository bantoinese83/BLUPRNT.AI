import React, { useState, useRef } from "react";
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { Send, Bot, Sparkles } from "lucide-react-native";
import Markdown from "react-native-markdown-display";
import * as Haptics from "expo-haptics";
import { MotiView } from "moti";
import { invokeFunction } from "../lib/supabase";
import { Theme } from "../constants/Theme";
import { TAB_BAR_HEIGHT, TAB_BAR_MARGIN } from "../../app/(tabs)/_layout";

const TAB_BAR_BUFFER = TAB_BAR_HEIGHT + TAB_BAR_MARGIN + 32;

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface Props {
  projectId: string;
}

export function AIAssistant({ projectId }: Props) {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Hi! I'm your Project Assistant. Ask me anything about your renovation budget, scope, or next steps.",
    },
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  const SUGGESTIONS = [
    "Analyze my budget",
    "What's my next milestone?",
    "Check for invoice anomalies",
    "Maintenance tips for this stage",
  ];

  const handleSend = async (text?: string) => {
    const msg = text || input.trim();
    if (!msg || isTyping) return;

    setInput("");
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setMessages((prev) => [...prev, { role: "user", content: msg }]);
    setIsTyping(true);

    try {
      const { data, error } = await invokeFunction<{ reply?: string }>(
        "chat-with-project",
        {
          body: { query: msg, projectId },
        },
      );

      if (error) throw error;

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data?.reply || "Sorry, I couldn't process that right now.",
        },
      ]);
    } catch (err) {
      console.error("Chat error:", err);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Something went wrong. Please try again later.",
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 100 : 0}
      style={styles.container}
    >
      <ScrollView
        ref={scrollViewRef}
        onContentSizeChange={() =>
          scrollViewRef.current?.scrollToEnd({ animated: true })
        }
        contentContainerStyle={styles.messagesContainer}
        showsVerticalScrollIndicator={false}
      >
        {messages.map((m, i) => (
          <MotiView
            key={i}
            from={{ opacity: 0, scale: 0.9, translateY: 10 }}
            animate={{ opacity: 1, scale: 1, translateY: 0 }}
            transition={{
              type: "timing",
              duration: 300,
              delay: 0,
            }}
            style={[
              styles.messageWrapper,
              m.role === "user" ? styles.userWrapper : styles.assistantWrapper,
            ]}
          >
            {m.role === "assistant" && (
              <View style={styles.botAvatar}>
                <Sparkles size={14} color="#6366f1" />
              </View>
            )}
            <View
              style={[
                styles.messageBubble,
                m.role === "user" ? styles.userBubble : styles.assistantBubble,
                m.role === "user"
                  ? styles.userBubbleShape
                  : styles.assistantBubbleShape,
              ]}
            >
              {m.role === "assistant" ? (
                <Markdown style={markdownStyles}>{m.content}</Markdown>
              ) : (
                <Text style={styles.userText}>{m.content}</Text>
              )}
            </View>
          </MotiView>
        ))}
        {isTyping && (
          <MotiView
            from={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={styles.assistantWrapper}
          >
            <View style={styles.botAvatar}>
              <Bot size={14} color="#6366f1" />
            </View>
            <View
              style={[
                styles.messageBubble,
                styles.assistantBubble,
                styles.assistantBubbleShape,
                { paddingVertical: 12, paddingHorizontal: 16 },
              ]}
            >
              <ActivityIndicator size="small" color="#818cf8" />
            </View>
          </MotiView>
        )}
      </ScrollView>

      <View style={styles.inputArea}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.suggestionsScroll}
          contentContainerStyle={styles.suggestionsContainer}
        >
          {SUGGESTIONS.map((s, i) => (
            <TouchableOpacity
              key={i}
              style={styles.chip}
              onPress={() => handleSend(s)}
            >
              <Text style={styles.chipText}>{s}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder="Ask about your project..."
            placeholderTextColor="#64748b"
            multiline
          />
          <TouchableOpacity
            onPress={() => handleSend()}
            disabled={!input.trim() || isTyping}
            style={[
              styles.sendButton,
              (!input.trim() || isTyping) && styles.sendButtonDisabled,
            ]}
          >
            <Send size={20} color="white" />
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  messagesContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },
  messageWrapper: {
    marginBottom: 20,
    flexDirection: "row",
    alignItems: "flex-end",
  },
  userWrapper: {
    justifyContent: "flex-end",
  },
  assistantWrapper: {
    justifyContent: "flex-start",
  },
  botAvatar: {
    width: 32,
    height: 32,
    borderRadius: 12,
    backgroundColor: "#f5f3ff",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
    marginBottom: 2,
    borderWidth: 1,
    borderColor: "#e0e7ff",
  },
  messageBubble: {
    maxWidth: "85%",
    padding: 18,
    borderRadius: 22,
  },
  userBubble: {
    backgroundColor: Theme.colors.brand.primary,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  userBubbleShape: {
    borderBottomRightRadius: 4,
  },
  assistantBubble: {
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  assistantBubbleShape: {
    borderBottomLeftRadius: 4,
  },
  userText: {
    color: "white",
    fontSize: 16,
    fontFamily: Theme.typography.family.medium,
    lineHeight: 24,
  },
  inputArea: {
    backgroundColor: "#ffffff",
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
    paddingBottom: Platform.OS === "ios" ? TAB_BAR_BUFFER : 20,
  },
  suggestionsScroll: {
    maxHeight: 50,
  },
  suggestionsContainer: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    gap: 8,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 100,
    backgroundColor: "#f1f5f9",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  chipText: {
    color: Theme.colors.text.secondary,
    fontSize: 13,
    fontFamily: Theme.typography.family.semibold,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  input: {
    flex: 1,
    backgroundColor: "#f8fafc",
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 14,
    color: Theme.colors.text.primary,
    fontFamily: Theme.typography.family.regular,
    fontSize: 16,
    maxHeight: 120,
    borderWidth: 1,
    borderColor: Theme.colors.divider,
  },
  sendButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Theme.colors.brand.primary,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 12,
  },
  sendButtonDisabled: {
    backgroundColor: "rgba(79, 70, 229, 0.3)",
  },
});

const markdownStyles = {
  body: {
    color: Theme.colors.text.secondary,
    fontSize: 14,
    fontFamily: Theme.typography.family.regular,
  },
  strong: {
    color: Theme.colors.text.primary,
    fontFamily: Theme.typography.family.bold,
  },
  heading1: {
    color: Theme.colors.text.primary,
    fontFamily: Theme.typography.family.bold,
    fontSize: 18,
    marginVertical: 8,
  },
  heading2: {
    color: Theme.colors.text.primary,
    fontFamily: Theme.typography.family.bold,
    fontSize: 16,
    marginVertical: 4,
  },
  bullet_list: {
    marginVertical: 4,
  },
  list_item: {
    marginVertical: 2,
    color: Theme.colors.text.secondary,
  },
  code_inline: {
    backgroundColor: "#f1f5f9",
    color: "#0f172a",
    borderRadius: 4,
    paddingHorizontal: 4,
  },
};
