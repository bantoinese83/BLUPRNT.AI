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
import { MessageSquare, Send, Bot, User } from "lucide-react-native";
import Markdown from "react-native-markdown-display";
import { supabase } from "../lib/supabase";
import { GlassCard } from "./ui/GlassCard";

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
          <View
            key={i}
            style={[
              styles.messageWrapper,
              m.role === "user" ? styles.userWrapper : styles.assistantWrapper,
            ]}
          >
            {m.role === "assistant" && (
              <View style={styles.botAvatar}>
                <Bot size={14} color="white" />
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
          </View>
        ))}
        {isTyping && (
          <View style={styles.assistantWrapper}>
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
              <ActivityIndicator size="small" color="#4f46e5" />
            </View>
          </View>
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
    backgroundColor: "#0f172a",
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
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#4f46e5",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
    marginBottom: 4,
  },
  messageBubble: {
    maxWidth: "80%",
    padding: 16,
    borderRadius: 20,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  userBubble: {
    backgroundColor: "#4f46e5",
  },
  userBubbleShape: {
    borderBottomRightRadius: 4,
  },
  assistantBubble: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  assistantBubbleShape: {
    borderBottomLeftRadius: 4,
  },
  userText: {
    color: "white",
    fontSize: 15,
    fontFamily: "Outfit_500Medium",
    lineHeight: 22,
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
