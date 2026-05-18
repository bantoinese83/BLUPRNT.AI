import { useState, useCallback, useRef, useEffect } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { invokeSharedFunction } from "../lib/supabase-client.ts";
import { EDGE_FUNCTIONS } from "../lib/backend-routing.ts";
import {
  normalizeChatProjectActions,
  type ChatProjectAction,
} from "../lib/chat-project-actions.ts";
import { chatHistoryPayloadFromMessages } from "../lib/chat-with-project-client.ts";

export type MessageRole = "user" | "assistant";

export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  actions?: ChatProjectAction[];
  /** Set when the assistant could not complete a request. */
  tone?: "default" | "error";
}

const MAX_SUGGESTED_ACTIONS = 4;

export const INITIAL_ASSISTANT_MESSAGE: Message = {
  id: "initial",
  role: "assistant",
  content:
    "Hi! I'm your Project Assistant. Ask about **budget vs. your ledger**, **scope**, **documents**, or **next steps** — I keep context across messages in this chat.",
};

export interface UseAIAssistantOptions {
  projectId: string;
  supabase: SupabaseClient;
  onError?: (error: unknown) => void;
  formatErrorMessage?: (error: unknown) => string;
}

export function useAIAssistant({
  projectId,
  supabase,
  onError,
  formatErrorMessage = (err) =>
    err instanceof Error
      ? err.message
      : "Something went wrong. Please try again.",
}: UseAIAssistantOptions) {
  const [messages, setMessages] = useState<Message[]>([
    INITIAL_ASSISTANT_MESSAGE,
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const resetConversation = useCallback(() => {
    setMessages([INITIAL_ASSISTANT_MESSAGE]);
  }, []);

  const handleSend = useCallback(
    async (text: string) => {
      const msg = text.trim();
      if (!msg || isTyping || !projectId.trim()) return;

      const history = chatHistoryPayloadFromMessages(messages);

      setIsTyping(true);
      const userMsg: Message = {
        id: Date.now().toString(),
        role: "user",
        content: msg,
      };
      setMessages((prev) => [...prev, userMsg]);

      try {
        const { data, error } = await invokeSharedFunction<{
          reply?: string;
          actions?: unknown;
        }>(supabase, EDGE_FUNCTIONS.CHAT_WITH_PROJECT, {
          body: { query: msg, projectId, history },
        });

        if (error) throw error;

        if (!isMountedRef.current) return;

        const actions = normalizeChatProjectActions(data?.actions).slice(
          0,
          MAX_SUGGESTED_ACTIONS,
        );

        setMessages((prev) => [
          ...prev,
          {
            id: (Date.now() + 1).toString(),
            role: "assistant",
            content:
              data?.reply?.trim() ||
              "I couldn't process that. Please try again.",
            ...(actions.length > 0 ? { actions } : {}),
          },
        ]);
      } catch (err) {
        onError?.(err);
        if (!isMountedRef.current) return;
        setMessages((prev) => [
          ...prev,
          {
            id: (Date.now() + 1).toString(),
            role: "assistant",
            content: formatErrorMessage(err),
            tone: "error",
          },
        ]);
      } finally {
        if (isMountedRef.current) setIsTyping(false);
      }
    },
    [messages, isTyping, projectId, supabase, onError, formatErrorMessage],
  );

  return {
    messages,
    isTyping,
    handleSend,
    resetConversation,
  };
}
