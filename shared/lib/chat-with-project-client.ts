import { CHAT_WITH_PROJECT_HISTORY_MAX } from "./validation.ts";

export type ChatProjectHistoryEntry = {
  role: "user" | "assistant";
  content: string;
};

/**
 * Builds the `history` payload for `chat-with-project`: prior turns only (not the message in `query`).
 * Truncates to the server-enforced max length.
 */
export function chatHistoryPayloadFromMessages(
  messages: readonly { role: "user" | "assistant"; content: string }[],
): ChatProjectHistoryEntry[] {
  return messages
    .map((m) => ({ role: m.role, content: m.content }))
    .slice(-CHAT_WITH_PROJECT_HISTORY_MAX);
}
