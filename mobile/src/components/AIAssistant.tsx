import React, { useState, useRef, useEffect } from "react";
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
import { MessageSquare, Send, Bot, User, Sparkles } from "lucide-react-native";
import Markdown from "react-native-markdown-display";
import * as Haptics from "expo-haptics";
import { MotiView } from "moti";
import { supabase } from "../lib/supabase";
import { GlassCard } from "./ui/GlassCard";
import { Theme } from "../constants/Theme";

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
      const { data, error } = await supabase.functions.invoke(
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
          content: data.reply || "Sorry, I couldn't process that right now.",
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
              delay: i === messages.length - 1 ? 0 : 0,
            }}
            style={[
              styles.messageWrapper,
              m.role === "user" ? styles.userWrapper : styles.assistantWrapper,
            ]}
          >
            {m.role === "assistant" && (
              <View style={styles.botAvatar}>
                <Sparkles size={14} color="white" />
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
              <Bot size={14} color="white" />
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
    backgroundColor: Theme.colors.background,
  },
  messagesContainer: {
    padding: 20,
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
    backgroundColor: "#6366f1",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
    marginBottom: 2,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
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
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    borderWidth: 1.2,
    borderColor: "rgba(255, 255, 255, 0.12)",
  },
  assistantBubbleShape: {
    borderBottomLeftRadius: 4,
  },
  userText: {
    color: "white",
    fontSize: 16,
    fontFamily: "Outfit_500Medium",
    lineHeight: 24,
  },
  inputArea: {
    backgroundColor: "rgba(15, 23, 42, 0.98)",
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.08)",
    paddingBottom: Platform.OS === "ios" ? 34 : 20, // Tab padding
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
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  chipText: {
    color: "#94a3b8",
    fontSize: 13,
    fontFamily: "Outfit_600SemiBold",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  input: {
    flex: 1,
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 14,
    color: "white",
    fontFamily: "Outfit_400Regular",
    fontSize: 16,
    maxHeight: 120,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.05)",
  },
  sendButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#4f46e5",
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
    color: "#cbd5e1",
    fontSize: 14,
    fontFamily: "Outfit_400Regular",
  },
  strong: {
    color: "white",
    fontFamily: "Outfit_700Bold",
  },
  heading1: {
    color: "white",
    fontFamily: "Outfit_700Bold",
    fontSize: 18,
    marginVertical: 8,
  },
  heading2: {
    color: "white",
    fontFamily: "Outfit_700Bold",
    fontSize: 16,
    marginVertical: 4,
  },
  bullet_list: {
    marginVertical: 4,
  },
  list_item: {
    marginVertical: 2,
  },
  code_inline: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 4,
    paddingHorizontal: 4,
  },
};
