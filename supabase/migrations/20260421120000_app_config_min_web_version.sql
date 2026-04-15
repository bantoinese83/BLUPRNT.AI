-- Minimum web SPA semver (see web useWebVersionCheck + VITE_APP_VERSION); bump when clients must refresh.
INSERT INTO app_config (key, value, description)
VALUES (
  'min_supported_web_version',
  '"0.1.0"',
  'Minimum web client version; users below this see a refresh prompt.'
)
ON CONFLICT (key) DO NOTHING;
