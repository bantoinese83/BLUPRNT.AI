import React, { useState, useCallback } from "react";
import {
  ConfirmModal,
  type ConfirmModalProps,
} from "@/components/ui/ConfirmModal";
import { ConfirmationContext, type ConfirmOptions } from "./useConfirmation";

export function ConfirmationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
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
    setLoading(true);
    try {
      await state.onConfirm();
    } finally {
      setLoading(false);
      setState((prev) => ({ ...prev, visible: false }));
    }
  };

  return (
    <ConfirmationContext.Provider value={{ confirm }}>
      {children}
      <ConfirmModal
        {...state}
        loading={loading}
        onConfirm={handleConfirm}
        onCancel={() => setState((prev) => ({ ...prev, visible: false }))}
      />
    </ConfirmationContext.Provider>
  );
}
