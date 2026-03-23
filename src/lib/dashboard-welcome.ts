const STORAGE_KEY = "bluprnt_dashboard_welcome";

/** Call after first signup so dashboard can show next-step banner. */
export function setDashboardWelcomeFlag() {
  try {
    sessionStorage.setItem(STORAGE_KEY, "1");
  } catch {
    /* ignore */
  }
}

export function readDashboardWelcomeFlag(): boolean {
  try {
    return sessionStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

export function clearDashboardWelcomeFlag() {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}
