import React, { useCallback } from "react";
import { Alert } from "react-native";
import { reportClientError } from "@/lib/sentry";
import { ConfirmationContext, type ConfirmOptions } from "./useConfirmation";

export function ConfirmationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const confirm = useCallback((options: ConfirmOptions) => {
    Alert.alert(
      options.title,
      options.message,
      [
        {
          text: options.cancelLabel || "Cancel",
          style: "cancel",
          onPress: () => {
            options.onCancel?.();
          },
        },
        {
          text: options.confirmLabel || "Confirm",
          style: options.variant === "destructive" ? "destructive" : "default",
          onPress: () => {
            void (async () => {
              try {
                await options.onConfirm();
              } catch (e) {
                console.error("[ConfirmationProvider] onConfirm failed:", e);
                reportClientError("confirmation_on_confirm", e, {
                  title: options.title,
                });
                const message =
                  e instanceof Error && e.message.trim().length > 0
                    ? e.message
                    : "Something went wrong. Please try again.";
                Alert.alert("Couldn’t complete action", message);
              }
            })();
          },
        },
      ],
      { cancelable: true, onDismiss: () => options.onCancel?.() },
    );
  }, []);

  return (
    <ConfirmationContext.Provider value={{ confirm }}>
      {children}
    </ConfirmationContext.Provider>
  );
}
