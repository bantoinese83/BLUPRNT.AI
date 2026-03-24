export type EstimateRecoveryKind =
  | "network"
  | "rate_limit"
  | "input"
  | "safety"
  | "server"
  | "unknown";

export function classifyEstimateError(message: string): EstimateRecoveryKind {
  const m = message.toLowerCase();
  if (m.includes("429") || m.includes("too many requests")) return "rate_limit";
  if (m.includes("400") || m.includes("invalid")) return "input";
  if (m.includes("network") || m.includes("failed to fetch") || m.includes("connection")) return "network";
  if (m.includes("unsafe") || m.includes("safety") || m.includes("policy")) return "safety";
  if (m.includes("500") || m.includes("timed out") || m.includes("ai estimation failed")) return "server";
  return "unknown";
}

export function userFriendlyEstimateError(message: string): string {
  switch (classifyEstimateError(message)) {
    case "rate_limit":
      return "We’re getting a lot of requests right now. Please wait a moment and try again.";
    case "input":
      return "We need a little more detail to estimate this. Try adding a short description or clearer photos.";
    case "network":
      return "We couldn’t reach the estimator service. Check your connection and retry.";
    case "safety":
      return "Some photos could not be processed. Try another photo or continue with text-only details.";
    case "server":
      return "The estimate engine had trouble finishing. Retry now or continue with text-only details.";
    default:
      return "We couldn’t build your estimate yet. Please retry or continue with text-only details.";
  }
}
