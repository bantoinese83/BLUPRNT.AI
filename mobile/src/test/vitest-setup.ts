import { vi } from "vitest";

process.env.EXPO_OS = "ios";

vi.mock("react-native-url-polyfill/auto", () => ({}));

vi.mock("expo-image-manipulator", () => ({
  manipulateAsync: vi.fn(),
  SaveFormat: { JPEG: "jpeg" },
}));

vi.mock("../lib/sentry", () => ({
  captureEdgeInvokeFailure: vi.fn(),
}));
