import { DashboardSubPage } from "@/components/dashboard/DashboardSubPage";

interface DashboardRecordProps {
  health: React.ReactNode;
  ledger: React.ReactNode;
}

export function DashboardRecord({ health, ledger }: DashboardRecordProps) {
  return <DashboardSubPage side={health}>{ledger}</DashboardSubPage>;
}
