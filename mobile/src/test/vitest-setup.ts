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

vi.mock("expo-crypto", () => ({
  randomUUID: vi.fn(() => "00000000-0000-0000-0000-000000000000"),
}));
