import { vi } from "vitest";

/** Shared mocks for assertions (Alert / Linking). */
export const alertMock = vi.fn();
export const canOpenURLMock = vi.fn();
export const openURLMock = vi.fn();

const Linking = {
  canOpenURL: (url: string) => canOpenURLMock(url),
  openURL: (url: string) => openURLMock(url),
};

const Alert = { alert: alertMock };

export const Platform = { OS: "ios" as const };

export const NativeModules = {};

export const TurboModuleRegistry = {
  getEnforcing: () => ({}),
  get: () => null,
};

export function requireNativeComponent() {
  return () => null;
}

export { Alert, Linking };
