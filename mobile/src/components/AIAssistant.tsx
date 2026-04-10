import React, { useState, useRef, useCallback } from "react";
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  type NativeSyntheticEvent,
  type NativeScrollEvent,
} from "react-native";
import { Send, Bot } from "lucide-react-native";
import Markdown from "react-native-markdown-display";
import * as Haptics from "expo-haptics";
import { MotiView } from "moti";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { invokeFunction } from "../lib/supabase";
import { Theme } from "../constants/Theme";
import { SnurraLoader, SnurraSize } from "./ui/SnurraLoader";
import { TAB_BAR_HEIGHT, TAB_BAR_MARGIN } from "../../app/(tabs)/_layout";

/** Space above the notched tab bar + FAB (matches scroll clearance scale). */
const TAB_BAR_BUFFER = TAB_BAR_HEIGHT + TAB_BAR_MARGIN + 28;

type Role = "user" | "assistant";

interface Message {
  id: string;
  role: Role;
  content: string;
}

let messageIdSeq = 0;
function nextMessageId(): string {
  messageIdSeq += 1;
  return `msg-${messageIdSeq}`;
}

interface Props {
  projectId: string;
}

export function AIAssistant({ projectId }: Props) {
  const insets = useSafeAreaInsets();
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      id: nextMessageId(),
      role: "assistant",
      content:
        "Hi! I'm your Project Assistant. Ask me anything about your renovation budget, scope, or next steps.",
    },
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const nearBottomRef = useRef(true);

  const SUGGESTIONS = [
    "Analyze my budget",
    "What's my next milestone?",
    "Check for invoice anomalies",
    "Maintenance tips for this stage",
  ];

  const scrollToEnd = useCallback(() => {
    requestAnimationFrame(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    });
  }, []);

  const onScroll = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { layoutMeasurement, contentOffset, contentSize } = e.nativeEvent;
    const padding = 48;
    nearBottomRef.current =
      layoutMeasurement.height + contentOffset.y >=
      contentSize.height - padding;
  }, []);

  const handleSend = async (text?: string) => {
    const msg = text || input.trim();
    if (!msg || isTyping) return;

    setInput("");
    nearBottomRef.current = true;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setMessages((prev) => [
      ...prev,
      { id: nextMessageId(), role: "user", content: msg },
    ]);
    setIsTyping(true);
    scrollToEnd();

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
          id: nextMessageId(),
          role: "assistant",
          content: data?.reply || "Sorry, I couldn't process that right now.",
        },
      ]);
    } catch (err) {
      console.error("Chat error:", err);
      setMessages((prev) => [
        ...prev,
        {
          id: nextMessageId(),
          role: "assistant",
          content: "Something went wrong. Please try again in a moment.",
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  /** Logo row (~56) + title block (~84) — iOS keyboard offset above tab system. */
  const keyboardOffset =
    Platform.OS === "ios" ? insets.top + 132 : insets.top + 24;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={keyboardOffset}
      style={styles.container}
    >
      <ScrollView
        ref={scrollViewRef}
        onScroll={onScroll}
        scrollEventThrottle={16}
        onContentSizeChange={() => {
          if (nearBottomRef.current) scrollToEnd();
        }}
        contentContainerStyle={styles.messagesContainer}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
      >
        {messages.map((m) => (
          <MotiView
            key={m.id}
            from={{ opacity: 0, scale: 0.97, translateY: 8 }}
            animate={{ opacity: 1, scale: 1, translateY: 0 }}
            transition={{
              type: "timing",
              duration: 280,
            }}
            style={[
              styles.messageWrapper,
              m.role === "user" ? styles.userWrapper : styles.assistantWrapper,
            ]}
          >
            {m.role === "assistant" && (
              <View style={styles.botAvatar} accessibilityLabel="Assistant">
                <Bot
                  size={14}
                  color={Theme.colors.brand.primary}
                  strokeWidth={2}
                />
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
            style={[styles.messageWrapper, styles.assistantWrapper]}
          >
            <View style={styles.botAvatar} accessibilityLabel="Assistant">
              <Bot size={14} color={Theme.colors.brand.primary} />
            </View>
            <View
              style={[
                styles.messageBubble,
                styles.assistantBubble,
                styles.assistantBubbleShape,
                styles.typingBubble,
              ]}
            >
              <SnurraLoader size={SnurraSize.inline} />
            </View>
          </MotiView>
        )}
      </ScrollView>

      <View
        style={[
          styles.inputDock,
          {
            paddingBottom:
              Platform.OS === "ios"
                ? TAB_BAR_BUFFER + insets.bottom
                : TAB_BAR_BUFFER,
          },
        ]}
      >
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.suggestionsScroll}
          contentContainerStyle={styles.suggestionsContainer}
          keyboardShouldPersistTaps="handled"
        >
          {SUGGESTIONS.map((label) => (
            <TouchableOpacity
              key={label}
              style={styles.chip}
              onPress={() => handleSend(label)}
              disabled={isTyping}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel={label}
            >
              <Text style={styles.chipText} numberOfLines={1}>
                {label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder="Ask about your project…"
            placeholderTextColor={Theme.colors.text.muted}
            multiline
            editable={!isTyping}
            accessibilityLabel="Message"
            accessibilityHint="Type a question about your project"
            maxLength={4000}
          />
          <TouchableOpacity
            onPress={() => void handleSend()}
            disabled={!input.trim() || isTyping}
            style={[
              styles.sendButton,
              (!input.trim() || isTyping) && styles.sendButtonDisabled,
            ]}
            accessibilityRole="button"
            accessibilityLabel="Send message"
          >
            <Send size={20} color="#ffffff" />
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  messagesContainer: {
    paddingHorizontal: Theme.spacing.xl,
    paddingTop: Theme.spacing.md,
    paddingBottom: Theme.spacing.xl,
  },
  messageWrapper: {
    marginBottom: Theme.spacing.lg,
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
    borderRadius: Theme.radius.md,
    backgroundColor: "rgba(13, 148, 136, 0.08)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
    marginBottom: 2,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(13, 148, 136, 0.15)",
  },
  messageBubble: {
    maxWidth: "85%",
    paddingVertical: Theme.spacing.md,
    paddingHorizontal: Theme.spacing.lg,
    borderRadius: Theme.radius.xl,
  },
  userBubble: {
    backgroundColor: Theme.colors.brand.primary,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255, 255, 255, 0.12)",
  },
  userBubbleShape: {
    borderBottomRightRadius: Theme.radius.sm,
  },
  assistantBubble: {
    backgroundColor: Theme.colors.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Theme.colors.border,
  },
  assistantBubbleShape: {
    borderBottomLeftRadius: Theme.radius.sm,
  },
  typingBubble: {
    paddingVertical: 14,
    paddingHorizontal: Theme.spacing.lg,
  },
  userText: {
    color: "#ffffff",
    fontSize: Theme.typography.size.lg,
    fontFamily: Theme.typography.family.medium,
    lineHeight: 24,
  },
  inputDock: {
    backgroundColor: Theme.colors.header,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Theme.colors.border,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
      },
      android: { elevation: 10 },
    }),
  },
  suggestionsScroll: {
    height: 64,
    flexGrow: 0,
  },
  suggestionsContainer: {
    paddingHorizontal: Theme.spacing.xl,
    paddingTop: Theme.spacing.sm,
    paddingBottom: Theme.spacing.xs,
    gap: Theme.spacing.md,
    alignItems: "center",
  },
  chip: {
    paddingHorizontal: Theme.spacing.lg,
    paddingVertical: 11,
    borderRadius: Theme.radius.full,
    backgroundColor: Theme.colors.inputBg,
    borderWidth: 1,
    borderColor: Theme.colors.inputBorder,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  chipText: {
    color: Theme.colors.brand.light,
    fontSize: Theme.typography.size.sm,
    fontFamily: Theme.typography.family.semibold,
    includeFontPadding: false,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: Theme.spacing.xl,
    paddingTop: Theme.spacing.xs,
    paddingBottom: Theme.spacing.sm,
  },
  input: {
    flex: 1,
    backgroundColor: Theme.colors.inputBg,
    borderRadius: Theme.radius.lg,
    paddingHorizontal: Theme.spacing.lg,
    paddingTop: 14,
    paddingBottom: 14,
    color: Theme.colors.text.primary,
    fontFamily: Theme.typography.family.regular,
    fontSize: Theme.typography.size.lg,
    maxHeight: 120,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Theme.colors.inputBorder,
    lineHeight: 22,
  },
  sendButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Theme.colors.brand.primary,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: Theme.spacing.sm,
  },
  sendButtonDisabled: {
    backgroundColor: "rgba(13, 148, 136, 0.35)",
  },
});

const markdownStyles = {
  body: {
    color: Theme.colors.text.secondary,
    fontSize: Theme.typography.size.lg,
    fontFamily: Theme.typography.family.regular,
    lineHeight: 24,
  },
  paragraph: {
    marginTop: 0,
    marginBottom: 0,
  },
  strong: {
    color: Theme.colors.text.primary,
    fontFamily: Theme.typography.family.bold,
  },
  heading1: {
    color: Theme.colors.text.primary,
    fontFamily: Theme.typography.family.bold,
    fontSize: Theme.typography.size.xxl,
    marginVertical: 6,
  },
  heading2: {
    color: Theme.colors.text.primary,
    fontFamily: Theme.typography.family.bold,
    fontSize: Theme.typography.size.lg,
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
    backgroundColor: Theme.colors.inputBg,
    color: Theme.colors.text.primary,
    borderRadius: Theme.radius.sm,
    paddingHorizontal: 4,
  },
};
