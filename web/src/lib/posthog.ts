import posthog from "posthog-js";

const POSTHOG_KEY = import.meta.env.VITE_PUBLIC_POSTHOG_PROJECT_TOKEN;
const POSTHOG_HOST =
  import.meta.env.VITE_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com";

export const initPostHog = () => {
  if (typeof window !== "undefined") {
    posthog.init(POSTHOG_KEY, {
      api_host: POSTHOG_HOST,
      autocapture: true,
      capture_pageview: true,
      persistence: "localStorage",
      loaded: (ph) => {
        ph.capture("app_initialized", { platform: "web" });
      },
    });
  }
};

export const captureEvent = (
  event: string,
  properties?: Record<string, string | number | boolean | null | undefined>,
) => {
  if (localStorage.getItem("bluprnt_analytics_opt_in") === "false") return;
  posthog.capture(event, properties);
};

export const identifyUser = (userId: string, email?: string, name?: string) => {
  if (localStorage.getItem("bluprnt_analytics_opt_in") === "false") return;
  posthog.identify(userId, {
    email,
    name,
  });
};

export const setAnalyticsEnabled = (enabled: boolean) => {
  localStorage.setItem("bluprnt_analytics_opt_in", enabled ? "true" : "false");
  if (enabled) {
    posthog.opt_in_capturing();
  } else {
    posthog.opt_out_capturing();
  }
};
