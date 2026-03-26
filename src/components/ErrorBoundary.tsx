import { Component, type ReactNode } from "react";
import { AlertTriangle, RefreshCw, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { reportClientError } from "@/lib/report-error";

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
    reportClientError("react-error-boundary", error, {
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
        <div
          className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-50 page-fade-in"
          role="alert"
        >
          <div className="max-w-md w-full text-center space-y-6">
            <div className="flex justify-center mb-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white p-2 shadow-sm border border-slate-200 overflow-hidden">
                <img
                  src="/bluprnt_logo.svg"
                  alt="BLUPRNT.AI logo"
                  className="h-full w-full object-contain"
                />
              </div>
            </div>

            <div className="rounded-2xl bg-amber-50 p-6 border border-amber-100">
              <AlertTriangle
                className="w-12 h-12 text-amber-600 mx-auto mb-4"
                aria-hidden
              />
              <h1 className="text-xl font-semibold text-slate-900 mb-2">
                Something went wrong
              </h1>
              <p className="text-sm text-slate-600 mb-6">
                We ran into an unexpected issue. Please try again or refresh the
                page.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button
                  onClick={this.handleRetry}
                  className="gap-2"
                  type="button"
                >
                  <RefreshCw className="w-4 h-4" aria-hidden />
                  Try again
                </Button>
                <Button
                  variant="outline"
                  onClick={() => window.location.reload()}
                  type="button"
                >
                  Refresh page
                </Button>
              </div>
            </div>

            <a
              href="mailto:connect@monarch-labs.com?subject=BLUPRNT%20Error%20Report"
              className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-indigo-600 transition-colors"
            >
              <Mail className="w-3.5 h-3.5" />
              Contact support
            </a>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
