export const DEFAULT_ESTIMATE_MIN = 24000;
export const DEFAULT_ESTIMATE_MAX = 31000;
export const DEFAULT_ESTIMATE_CONFIDENCE = 4.5;

export type ProjectTypeOption =
  | "Kitchen"
  | "Bathroom"
  | "Painting"
  | "Roof"
  | "Flooring"
  | "Something else";

export type StageOption =
  | "Just planning"
  | "Collecting quotes"
  | "Already started work";

/** Migrate drafts saved before stage labels were aligned with web. */
export function normalizeStageFromDraft(
  raw: string | null | undefined,
): StageOption | null {
  if (!raw) return null;
  if (raw === "Planning & budgeting") return "Just planning";
  const valid: StageOption[] = [
    "Just planning",
    "Collecting quotes",
    "Already started work",
  ];
  return valid.includes(raw as StageOption) ? (raw as StageOption) : null;
}

export function projectTypeToRoomType(t: ProjectTypeOption | null): string {
  if (t === "Kitchen") return "kitchen";
  if (t === "Bathroom") return "bathroom";
  return "other";
}

export function projectTypeToDb(
  t: ProjectTypeOption | null,
): "kitchen" | "bath" | "paint" | "roof" | "flooring" | "other" {
  const m: Record<
    string,
    "kitchen" | "bath" | "paint" | "roof" | "flooring" | "other"
  > = {
    Kitchen: "kitchen",
    Bathroom: "bath",
    Painting: "paint",
    Roof: "roof",
    Flooring: "flooring",
    "Something else": "other",
  };
  return t ? (m[t] ?? "other") : "other";
}

export function stageToDb(
  s: StageOption | null,
): "planning" | "collecting_quotes" | "in_progress" | "completed" {
  if (s === "Collecting quotes") return "collecting_quotes";
  if (s === "Already started work") return "in_progress";
  return "planning";
}

export function projectDisplayName(t: ProjectTypeOption | null): string {
  if (!t || t === "Something else") return "My project";
  return `${t} project`;
}
