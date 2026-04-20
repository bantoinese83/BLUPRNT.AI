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

## 5. Summary of Common Commands

| Task                   | Command                                                   |
| :--------------------- | :-------------------------------------------------------- |
| **Check Login**        | `eas whoami`                                              |
| **Start Build**        | `eas build --platform ios --profile production`           |
| **Submit Build**       | `eas submit --platform ios --profile production --latest` |
| **View Build History** | `eas build:list`                                          |

---

_Last updated: April 18, 2026_
