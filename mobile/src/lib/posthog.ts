import PostHog from "posthog-react-native";

const POSTHOG_KEY = process.env.EXPO_PUBLIC_POSTHOG_PROJECT_TOKEN;
const POSTHOG_HOST =
  process.env.EXPO_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com";

export const posthog = new PostHog(POSTHOG_KEY, {
  host: POSTHOG_HOST,
  autocapture: true,
});

// Fire a test event to clear "Waiting for events"
posthog.capture("app_initialized", { platform: "mobile" });

export const captureEvent = (
  event: string,
  properties?: Record<string, any>,
) => {
  posthog.capture(event, properties);
};

export const identifyUser = (userId: string, email?: string, name?: string) => {
  posthog.identify(userId, {
    email,
    name,
  });
};

export const resetPostHog = () => {
  posthog.reset();
};
