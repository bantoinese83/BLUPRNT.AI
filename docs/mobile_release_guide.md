# BLUPRNT.AI Mobile Release Workflow

This guide outlines the steps to build and submit new versions of the BLUPRNT mobile application to App Store Connect (TestFlight).

## 1. Prerequisites

Ensure you have the EAS CLI installed and you are logged into your Expo account.

```bash
# Install EAS CLI globally
npm install -g eas-cli

# Log in (if not already)
eas login
```

## 2. Increment version and build number

Before building, update the versioning in `mobile/app.json`.

- **`version`**: The user-facing marketing version (e.g., `1.0.1`).
- **`ios.buildNumber`**: The internal build number (e.g., `14`). This must be unique for every upload to App Store Connect.

```json
// mobile/app.json
{
  "expo": {
    "version": "1.0.0",
    "ios": {
      "buildNumber": "14"
    }
  }
}
```

> [!NOTE]
> Your `eas.json` is currently configured with `"autoIncrement": true`. This means the EAS servers will attempt to manage this number for you, but it is best practice to keep `app.json` synced locally.

## 3. Trigger the Build

Run the production build command. This sends your code to the Expo servers to generate the `.ipa` file.

```bash
cd mobile
eas build --platform ios --profile production
```

## 4. Submit to App Store Connect

Once the build is finished (you will see a green checkmark in the terminal), you must submit it to Apple so it appears in TestFlight.

```bash
cd mobile
eas submit --platform ios --profile production --latest
```

- `--latest`: Automatically picks the last successful build finished on EAS.
- You may be prompted to log into your Apple Developer account (use the same Apple ID as in `mobile/eas.json` → `submit.production.ios.appleId`, currently `monarchlabstech@gmail.com`).

## 5. RevenueCat MCP (Cursor)

To debug subscriptions and offerings from the IDE, configure the [RevenueCat MCP server](https://www.revenuecat.com/docs/tools/mcp/setup):

1. In [RevenueCat](https://app.revenuecat.com/) → **API keys**, create an **API v2 secret key** (read-only is enough for inspection; use write if you will change resources).
2. Export it in your environment (never commit it):

   ```bash
   export REVENUECAT_API_V2_SECRET_KEY="your_api_v2_secret_key"
   ```

3. Restart Cursor. Project config lives in `.cursor/mcp.json` (also mirrored at `.mcp.json`).

Cursor can use OAuth instead of an API key for RevenueCat MCP; if you prefer that, remove the `headers` block from the `revenuecat` entry and connect via **Settings → MCP**.

## 6. Summary of Common Commands

| Task                   | Command                                                   |
| :--------------------- | :-------------------------------------------------------- |
| **Check Login**        | `eas whoami`                                              |
| **Start Build**        | `eas build --platform ios --profile production`           |
| **Submit Build**       | `eas submit --platform ios --profile production --latest` |
| **View Build History** | `eas build:list`                                          |

---

_Last updated: May 15, 2026_
