export const CHAT_PROJECT_ACTION_TYPES = [
  "add_scope",
  "update_scope",
  "suggest_photo",
] as const;

export type ChatProjectActionType = (typeof CHAT_PROJECT_ACTION_TYPES)[number];

export type ChatProjectAction = {
  type: ChatProjectActionType;
  data: Record<string, unknown>;
  reason: string;
};

function isActionType(value: unknown): value is ChatProjectActionType {
  return (
    value === "add_scope" ||
    value === "update_scope" ||
    value === "suggest_photo"
  );
}

/**
 * Parses the `actions` array from `chat-with-project` so clients only surface
 * well-shaped entries (Gemini may omit fields or drift types).
 */
export function normalizeChatProjectActions(raw: unknown): ChatProjectAction[] {
  if (!Array.isArray(raw)) return [];
  const out: ChatProjectAction[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const o = item as Record<string, unknown>;
    if (!isActionType(o.type)) continue;
    const reason =
      typeof o.reason === "string" && o.reason.trim().length > 0
        ? o.reason.trim()
        : "Suggested next step";
    let data: Record<string, unknown> = {};
    if (
      o.data !== null &&
      o.data !== undefined &&
      typeof o.data === "object" &&
      !Array.isArray(o.data)
    ) {
      data = { ...(o.data as Record<string, unknown>) };
    }
    out.push({ type: o.type, data, reason });
  }
  return out;
}

/** Short CTA for a primary button (reason string is shown as subtitle). */
export function chatActionButtonLabel(type: ChatProjectActionType): string {
  switch (type) {
    case "add_scope":
      return "Open scope";
    case "update_scope":
      return "Review scope";
    case "suggest_photo":
      return "Add photos";
  }
}
