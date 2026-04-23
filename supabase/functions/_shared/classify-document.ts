import { callGemini, type GeminiPart } from "./gemini.ts";
import {
  LEDGER_DOCUMENT_TYPES,
  type LedgerDocumentType,
} from "../../../shared/lib/infer-document-type.ts";

export type { LedgerDocumentType } from "../../../shared/lib/infer-document-type.ts";

const TYPE_SET = new Set<string>(LEDGER_DOCUMENT_TYPES);

/**
 * Vision classification when filename heuristics are inconclusive.
 * Returns null on API failure — caller may default to "other".
 */
export async function classifyLedgerDocumentType(
  fileBase64: string,
  mimeType: string,
): Promise<LedgerDocumentType | null> {
  const systemInstruction = `You classify documents for a home renovation / resale / homeowner project vault.

Return JSON with exactly one field document_type, using exactly one of these values:
${LEDGER_DOCUMENT_TYPES.join(", ")}.

Definitions (pick the best single fit):
- **invoice** — vendor bill, final charges, B2B invoice.
- **quote** — estimate, bid, proposal, or pre-approval pricing.
- **receipt** — point-of-sale receipt, proof of purchase, register receipt, store slip (not a full itemized bill).
- **warranty** — product/install warranty, registration, service contract for equipment.
- **permit** — building permit, CO, code inspection sign-off from a jurisdiction, zoning, plan check approval.
- **maintenance** — homeowner log of recurring care/tasks (not a warranty card).
- **contract** — construction/repair agreement, SOW, AIA-style contract, retainer, subcontract.
- **insurance** — COI, policy declarations, claim, loss notice.
- **inspection** — home inspection, buyer or quality inspection, photo reports (not a government code permit by itself; if it is a jurisdiction permit, use **permit**).
- **appraisal** — property valuation, appraiser report, FMV.
- **hoa** — HOA, ARC, design review, condo board approval, covenant/association letters.
- **lien_waiver** — mechanics lien waiver, final/progress waiver, release of claim.
- **manual** — product manual, spec sheet, installation guide, data sheet.
- **energy** — HERS, Energy Star, blower door, energy code compliance, rating report.
- **disclosure** — lead paint, seller disclosure, material safety, TILA-style notices.
- **other** — anything that does not fit above (general letter, ID scan, unlabeled scan).

Heuristics: maintenance log ≠ warranty. Receipt ≠ full invoice. Ambiguous between quote and invoice → **invoice** if it looks like money already transacted.`;

  const responseSchema = {
    type: "object",
    properties: {
      document_type: {
        type: "string",
        enum: [...LEDGER_DOCUMENT_TYPES],
      },
    },
    required: ["document_type"],
  };

  const parts: GeminiPart[] = [
    { text: "What single document_type best describes this file?" },
    {
      inline_data: {
        mime_type: mimeType || "application/pdf",
        data: fileBase64,
      },
    },
  ];

  try {
    const result = await callGemini({
      parts,
      systemInstruction,
      responseSchema,
      temperature: 0.1,
      maxOutputTokens: 512,
      timeoutMs: 28_000,
    });
    if (!result) return null;
    const raw =
      (result.data?.document_type as string | undefined) ||
      (() => {
        try {
          const j = JSON.parse(result.text) as { document_type?: string };
          return j.document_type;
        } catch {
          return undefined;
        }
      })();
    const t = (raw || "").toLowerCase().trim();
    if (TYPE_SET.has(t)) {
      return t as LedgerDocumentType;
    }
    return null;
  } catch (e) {
    console.error("[classifyLedgerDocumentType]", e);
    return null;
  }
}
