import type { LucideIcon } from "lucide-react";
import {
  AlertTriangle,
  BookOpen,
  Building2,
  ClipboardList,
  FileCheck2,
  FileQuestion,
  FileSignature,
  FileText,
  Leaf,
  Receipt,
  ScrollText,
  Search,
  Shield,
  ShieldCheck,
  Tag,
  TrendingUp,
} from "lucide-react";
import {
  coerceLedgerDocumentType,
  type LedgerDocumentType,
} from "@shared/lib/infer-document-type";

const REVIEW_MODAL_ICONS: Record<LedgerDocumentType, LucideIcon> = {
  invoice: FileText,
  quote: Tag,
  receipt: Receipt,
  warranty: ShieldCheck,
  permit: ScrollText,
  maintenance: ClipboardList,
  contract: FileSignature,
  insurance: Shield,
  inspection: Search,
  appraisal: TrendingUp,
  hoa: Building2,
  lien_waiver: FileCheck2,
  manual: BookOpen,
  energy: Leaf,
  disclosure: AlertTriangle,
  other: FileQuestion,
};

export function reviewModalIconForDocumentType(
  t: string | null | undefined,
): LucideIcon {
  return REVIEW_MODAL_ICONS[coerceLedgerDocumentType(t)] ?? FileText;
}

export function cardIconForDocumentType(
  t: string | null | undefined,
): LucideIcon {
  return REVIEW_MODAL_ICONS[coerceLedgerDocumentType(t)] ?? FileText;
}
