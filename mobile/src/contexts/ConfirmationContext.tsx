import React, { useState, useCallback, useRef } from "react";
import { Alert } from "react-native";
import {
  ConfirmModal,
  type ConfirmModalProps,
} from "@/components/ui/ConfirmModal";
import { reportClientError } from "@/lib/sentry";
import { ConfirmationContext, type ConfirmOptions } from "./useConfirmation";

export function ConfirmationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  /** Bumps on every `confirm()` so we do not close the modal when a handler opens a follow-up dialog. */
  const confirmGenerationRef = useRef(0);
  const [state, setState] = useState<
    ConfirmModalProps & { onConfirm: () => void | Promise<void> }
  >({
    visible: false,
    title: "",
    message: "",
    onConfirm: () => {},
    onCancel: () => {},
  });
  const [loading, setLoading] = useState(false);

  const confirm = useCallback((options: ConfirmOptions) => {
    confirmGenerationRef.current += 1;
    setState({
      ...options,
      visible: true,
      onCancel: () => {
        options.onCancel?.();
        setState((prev) => ({ ...prev, visible: false }));
      },
    });
  }, []);

  const handleConfirm = async () => {
    const generationWhenConfirmStarted = confirmGenerationRef.current;
    setLoading(true);
    try {
      await state.onConfirm();
      if (confirmGenerationRef.current !== generationWhenConfirmStarted) {
        return;
      }
      setState((prev) => ({ ...prev, visible: false }));
    } catch (e) {
      console.error("[ConfirmationProvider] onConfirm failed:", e);
      reportClientError("confirmation_on_confirm", e, {
        title: state.title,
      });
      const message =
        e instanceof Error && e.message.trim().length > 0
          ? e.message
          : "Something went wrong. Please try again.";
      Alert.alert("Couldn’t complete action", message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ConfirmationContext.Provider value={{ confirm }}>
      {children}
      <ConfirmModal {...state} loading={loading} onConfirm={handleConfirm} />
    </ConfirmationContext.Provider>
  );
}
