import type { LucideIcon } from "lucide-react-native";
import {
  AlertTriangle,
  BookOpen,
  Building2,
  ClipboardList,
  FileCheck2,
  FileQuestion,
  FileText,
  Leaf,
  Receipt,
  ScrollText,
  Search,
  Shield,
  ShieldCheck,
  Tag,
  TrendingUp,
  Wrench,
} from "lucide-react-native";
import {
  coerceLedgerDocumentType,
  type LedgerDocumentType,
} from "@shared/lib/infer-document-type";

/** Use `FileText` in places that expect a “contract / agreement” file icon. */
const AgreementFile: LucideIcon = FileText;

const ROW_ICONS: Record<LedgerDocumentType, LucideIcon> = {
  invoice: Wrench,
  quote: Tag,
  receipt: Receipt,
  warranty: ShieldCheck,
  permit: ScrollText,
  maintenance: ClipboardList,
  contract: AgreementFile,
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

export function rowIconForLedgerDocumentType(
  t: string | null | undefined,
): LucideIcon {
  return ROW_ICONS[coerceLedgerDocumentType(t)] ?? Wrench;
}
