import { AwarenessProvider } from "@/contexts/AwarenessProvider";
import { useDashboardData } from "@/hooks/useDashboardData";
import { isSupabaseConfigured } from "@/lib/supabase";
import { DashboardContent } from "@/pages/dashboard/DashboardContent";
import {
  DashboardFatalLoadErrorView,
  DashboardLoadingView,
  DashboardNoProjectView,
  DashboardSupabaseNotConfiguredView,
} from "@/pages/dashboard/DashboardEarlyViews";

export default function Dashboard() {
  const {
    loading,
    refreshing,
    loadError,
    clearLoadError,
    projects,
    project,
    scopeItems,
    invoices,
    spendByCategory,
    isArchitect,
    subscription,
    hasProjectPass,
    load,
    handleProjectSelect,
    setProjects,
    setProject,
    setScopeItems,
    setInvoices,
  } = useDashboardData();

  if (!isSupabaseConfigured()) {
    return <DashboardSupabaseNotConfiguredView />;
  }

  if (loading && !project) {
    return <DashboardLoadingView />;
  }

  if (loadError && !project && projects.length === 0) {
    return (
      <DashboardFatalLoadErrorView
        message={loadError}
        onRetry={() => {
          void load();
        }}
      />
    );
  }

  if (!project) {
    return <DashboardNoProjectView />;
  }

  return (
    <AwarenessProvider
      project={project}
      scopeItems={scopeItems}
      invoices={invoices}
      spendByCategory={spendByCategory}
    >
      <DashboardContent
        projects={projects}
        project={project}
        scopeItems={scopeItems}
        invoices={invoices}
        isArchitect={isArchitect}
        subscription={subscription}
        hasProjectPass={hasProjectPass}
        load={load}
        loadError={loadError}
        refreshing={refreshing}
        clearLoadError={clearLoadError}
        handleProjectSelect={handleProjectSelect}
        setProjects={setProjects}
        setProject={setProject}
        setScopeItems={setScopeItems}
        setInvoices={setInvoices}
      />
    </AwarenessProvider>
  );
}
