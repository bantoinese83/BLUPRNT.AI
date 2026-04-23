import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useDashboardDataShared } from "@shared/hooks/use-dashboard-data";
import {
  buildWebDashboardAdapter,
  useWebDashboardDataInjected,
} from "./build-web-dashboard-adapter";
import { useWebDashboardAuthRedirect } from "./useWebDashboardAuthRedirect";
import { useWebDashboardProjectRealtime } from "./useWebDashboardProjectRealtime";

export function useDashboardData() {
  const navigate = useNavigate();
  const dashboardInjected = useWebDashboardDataInjected();
  const adapter = useMemo(
    () => buildWebDashboardAdapter(dashboardInjected),
    [dashboardInjected],
  );
  const shared = useDashboardDataShared(adapter);

  useWebDashboardAuthRedirect(shared.data, shared.data?.configured, navigate);
  useWebDashboardProjectRealtime(shared.activeProjectId);

  const { activeProjectId: _a, data: _d, ...publicApi } = shared;
  void _a;
  void _d;
  return publicApi;
}
