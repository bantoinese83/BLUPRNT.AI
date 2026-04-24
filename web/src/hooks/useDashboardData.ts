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

  const {
    activeProjectId: _unused1,
    data: _unused2,
    load,
    handleProjectSelect,
    ...publicApi
  } = shared;
  void _unused1;
  void _unused2;

  return useMemo(
    () => ({
      ...publicApi,
      load,
      handleProjectSelect,
    }),
    [publicApi, load, handleProjectSelect],
  );
}
