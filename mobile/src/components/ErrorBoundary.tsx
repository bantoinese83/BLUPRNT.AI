import React, { Component, type ReactNode } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Linking,
} from "react-native";
import { AlertTriangle, RefreshCcw, Mail } from "lucide-react-native";
import { Theme } from "@/constants/Theme";
import { reportClientError } from "@/lib/sentry";
import { PUBLIC_SUPPORT_PAGE_URL } from "@shared/constants/public-site";

import logoAsset from "@assets/images/icon.png";

type Props = {
  children: ReactNode;
  fallback?: ReactNode;
};

type State = {
  hasError: boolean;
  error: Error | null;
};

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    reportClientError("mobile-error-boundary", error, {
      componentStack: errorInfo.componentStack,
    });
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return (
        <View style={styles.container} accessibilityRole="alert">
          <View style={styles.content}>
            <View style={styles.logoContainer}>
              <Image
                source={logoAsset}
                style={styles.logo}
                resizeMode="contain"
              />
            </View>

            <View style={styles.card}>
              <AlertTriangle
                size={48}
                color={Theme.colors.status.warning}
                style={styles.icon}
              />
              <Text style={styles.title}>Something went wrong</Text>
              <Text style={styles.description}>
                We ran into an unexpected issue. Please try again or restart the
                app.
              </Text>

              <View style={styles.actions}>
                <TouchableOpacity
                  style={styles.primaryButton}
                  onPress={this.handleRetry}
                  accessibilityRole="button"
                  accessibilityLabel="Try again"
                >
                  <RefreshCcw size={20} color="white" />
                  <Text style={styles.primaryButtonText}>Try again</Text>
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              style={styles.supportLink}
              onPress={() => {
                void Linking.openURL(PUBLIC_SUPPORT_PAGE_URL);
              }}
              accessibilityRole="link"
              accessibilityLabel="Contact support, opens in browser"
            >
              <Mail size={14} color={Theme.colors.text.secondary} />
              <Text style={styles.supportText}>Contact support</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
    justifyContent: "center",
    padding: 24,
  },
  content: {
    alignItems: "center",
  },
  logoContainer: {
    marginBottom: 32,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  logo: {
    width: 64,
    height: 64,
    borderRadius: 16,
  },
  card: {
    width: "100%",
    backgroundColor: "rgba(251, 191, 36, 0.05)",
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: "rgba(251, 191, 36, 0.1)",
    alignItems: "center",
  },
  icon: {
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: Theme.colors.text.primary,
    marginBottom: 8,
    textAlign: "center",
  },
  description: {
    fontSize: 14,
    color: Theme.colors.text.secondary,
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 20,
  },
  actions: {
    width: "100%",
    gap: 12,
  },
  primaryButton: {
    flexDirection: "row",
    backgroundColor: Theme.colors.brand.primary,
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  primaryButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  supportLink: {
    marginTop: 32,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  supportText: {
    fontSize: 12,
    fontWeight: "600",
    color: Theme.colors.text.secondary,
  },
});
