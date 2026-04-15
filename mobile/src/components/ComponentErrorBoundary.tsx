import React, { Component, type ReactNode } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { AlertCircle, RefreshCw } from "lucide-react-native";
import { Theme } from "@/constants/Theme";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  name?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Mobile feature-level Error Boundary for high-risk components (RevenueCat, AI, etc.)
 */
export class ComponentErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error(`[ErrorBoundary:${this.props.name || "Component"}]`, error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <View style={styles.errorContainer}>
          <View style={styles.iconBg}>
            <AlertCircle size={24} color={Theme.colors.status.error} />
          </View>
          <View style={styles.textContainer}>
            <Text style={styles.errorTitle}>
              {this.props.name || "This feature"} is unavailable
            </Text>
            <Text style={styles.errorDesc}>
              We hit a snag. Try again or check back soon.
            </Text>
          </View>
          <TouchableOpacity
            onPress={this.handleReset}
            style={styles.retryButton}
            activeOpacity={0.7}
          >
            <RefreshCw size={16} color="white" style={styles.retryIcon} />
            <Text style={styles.retryText}>Try again</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  errorContainer: {
    padding: 24,
    backgroundColor: "rgba(239, 68, 68, 0.05)",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.1)",
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 12,
  },
  iconBg: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  textContainer: {
    alignItems: "center",
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 16,
    fontFamily: Theme.typography.family.bold,
    color: Theme.colors.text.primary,
    marginBottom: 4,
  },
  errorDesc: {
    fontSize: 13,
    fontFamily: Theme.typography.family.regular,
    color: Theme.colors.text.secondary,
    textAlign: "center",
  },
  retryButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Theme.colors.status.error,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  retryIcon: {
    marginRight: 8,
  },
  retryText: {
    color: "white",
    fontSize: 14,
    fontFamily: Theme.typography.family.bold,
  },
});
