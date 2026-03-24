import { Link } from "react-router-dom";
import { Home, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";

interface AppSimpleHeaderProps {
  className?: string;
  showHome?: boolean;
  showSignIn?: boolean;
}

export function AppSimpleHeader({
  className,
  showHome = true,
  showSignIn = false,
}: AppSimpleHeaderProps) {
  const { user } = useAuth();
  return (
    <header
      className={cn(
        "w-full border-b border-slate-200/60 bg-white/80 backdrop-blur-md sticky top-0 z-50",
        className,
      )}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:h-[4.25rem] sm:px-6">
        <Link
          to="/"
          className="flex items-center gap-2.5 transition-opacity hover:opacity-90 sm:gap-3"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white p-1.5 shadow-sm ring-1 ring-slate-200 sm:h-10 sm:w-10 sm:rounded-2xl sm:p-2">
            <img
              src="/bluprnt_logo.svg"
              alt=""
              className="h-full w-full object-contain"
            />
          </div>
          <span className="text-lg font-black italic tracking-tighter text-slate-900 sm:text-xl">
            BLUPRNT<span className="text-indigo-600">.AI</span>
          </span>
        </Link>

        <nav className="flex items-center gap-2">
          {showSignIn && (
            <>
              {user ? (
                <Link to="/dashboard" className="hidden sm:block">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-2 font-bold text-indigo-600 hover:bg-indigo-50 hover:text-indigo-700"
                  >
                    <LayoutDashboard className="h-4 w-4" aria-hidden />
                    Dashboard
                  </Button>
                </Link>
              ) : (
                <Link to="/login" className="hidden sm:block">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="font-bold text-slate-600 hover:text-slate-900"
                  >
                    Sign in
                  </Button>
                </Link>
              )}
            </>
          )}

          {showHome && (
            <Link to="/">
              <Button
                variant="outline"
                size="sm"
                className="h-9 gap-1.5 rounded-xl border-slate-200 bg-white/50 text-xs font-bold text-slate-700 shadow-sm hover:bg-white sm:text-sm"
              >
                <Home className="h-3.5 w-3.5 text-slate-400" aria-hidden />
                <span className="hidden sm:inline">Back to Home</span>
                <span className="sm:hidden text-[10px]">Home</span>
              </Button>
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
