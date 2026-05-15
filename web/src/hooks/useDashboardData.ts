import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useDashboardDataShared } from "@shared/hooks/use-dashboard-data.js";
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
  useWebDashboardProjectRealtime(shared.project?.id ?? null);

  return useMemo(() => {
    const { activeProjectId: _unused1, data: _unused2, ...publicApi } = shared;
    void _unused1;
    void _unused2;
    return publicApi;
  }, [shared]);
}
