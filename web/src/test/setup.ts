import { afterEach, vi } from "vitest";
import "@testing-library/jest-dom/vitest";

/** Allow importing `supabase` client in tests when `.env` is absent (e.g. CI). */
process.env.VITE_SUPABASE_URL ??= "http://127.0.0.1:54321";
process.env.VITE_SUPABASE_ANON_KEY ??= "vitest-anon-key-placeholder";

/**
 * Automatically restore all spies after every test so mocked implementations
 * set in one test (e.g. localStorage.getItem returning null) cannot bleed
 * into subsequent tests that rely on the real implementation.
 */
afterEach(() => vi.restoreAllMocks());

/**
 * Web Storage polyfill for the vitest jsdom environment.
 *
 * KEY DESIGN: methods live on Storage.prototype (not as own properties on the
 * instance), so vi.spyOn(Storage.prototype, 'getItem') correctly intercepts
 * calls made by production code. Each instance owns its data via a WeakMap.
 */
const _stores = new WeakMap<object, Record<string, string>>();

function _getStore(s: object): Record<string, string> {
  if (!_stores.has(s)) _stores.set(s, {});
  return _stores.get(s)!;
}

// Patch Storage.prototype so every instance (including ours) goes through
// the prototype chain — exactly where vi.spyOn installs its interceptors.
Object.defineProperty(Storage.prototype, "length", {
  get(this: object) {
    return Object.keys(_getStore(this)).length;
  },
  configurable: true,
});

Storage.prototype.clear = function (this: object) {
  const s = _getStore(this);
  Object.keys(s).forEach((k) => delete s[k]);
};

Storage.prototype.getItem = function (this: object, key: string) {
  const s = _getStore(this);
  return key in s ? s[key] : null;
};

Storage.prototype.setItem = function (
  this: object,
  key: string,
  value: string,
) {
  _getStore(this)[key] = String(value);
};

Storage.prototype.removeItem = function (this: object, key: string) {
  delete _getStore(this)[key];
};

Storage.prototype.key = function (this: object, index: number) {
  return Object.keys(_getStore(this))[index] ?? null;
};

// Create bare Storage instances — all method lookups fall through to the
// prototype above, which means vi.spyOn intercepts them correctly.
const _localStorage = Object.create(Storage.prototype) as Storage;
const _sessionStorage = Object.create(Storage.prototype) as Storage;

Object.defineProperty(globalThis, "localStorage", {
  value: _localStorage,
  writable: true,
  configurable: true,
});
Object.defineProperty(globalThis, "sessionStorage", {
  value: _sessionStorage,
  writable: true,
  configurable: true,
});
