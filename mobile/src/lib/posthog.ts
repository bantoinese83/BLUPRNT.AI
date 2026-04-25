import PostHog from "posthog-react-native";

const POSTHOG_KEY = process.env.EXPO_PUBLIC_POSTHOG_PROJECT_TOKEN;
const POSTHOG_HOST =
  process.env.EXPO_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com";

export const posthog = new PostHog(POSTHOG_KEY || "", {
  host: POSTHOG_HOST,
});

// Fire a test event to clear "Waiting for events"
posthog.capture("app_initialized", { platform: "mobile" });

export const captureEvent = (
  event: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  properties?: any,
) => {
  posthog.capture(event, properties);
};

export const identifyUser = (userId: string, email?: string, name?: string) => {
  posthog.identify(userId, {
    email: email ?? null,
    name: name ?? null,
  });
};
