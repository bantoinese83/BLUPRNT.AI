const path = require("path");
const { getDefaultConfig } = require("expo/metro-config");
const { getSentryExpoConfig } = require("@sentry/react-native/metro");
const { withNativeWind } = require("nativewind/metro");

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, "..");

/**
 * Use `getSentryExpoConfig` (Sentry + Expo defaults + debug-id plugins) — do not wrap again
 * with `withSentryConfig`. That double-wraps the Metro serializer and breaks `expo export`
 * with NativeWind (`Cannot read properties of undefined (reading 'match')`).
 * @see https://github.com/getsentry/sentry-react-native/issues/5315
 */
let config = getSentryExpoConfig(projectRoot);
const expoDefaults = getDefaultConfig(projectRoot);
config.watchFolders = [
  ...new Set([
    ...(expoDefaults.watchFolders ?? []),
    ...(config.watchFolders ?? []),
    workspaceRoot,
  ]),
];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(workspaceRoot, "node_modules"),
];

config = withNativeWind(config, { input: "./global.css" });

module.exports = config;
