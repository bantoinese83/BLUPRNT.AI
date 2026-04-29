import { createContext, useContext } from "react";
import { type ConfirmModalProps } from "@/components/ui/ConfirmModal";

export type ConfirmOptions = Omit<
  ConfirmModalProps,
  "visible" | "onConfirm" | "onCancel" | "loading"
> & {
  onConfirm: () => void | Promise<void>;
  onCancel?: () => void;
};

export type ConfirmationContextType = {
  confirm: (options: ConfirmOptions) => void;
};

export const ConfirmationContext = createContext<
  ConfirmationContextType | undefined
>(undefined);

export function useConfirmation() {
  const context = useContext(ConfirmationContext);
  if (!context) {
    throw new Error(
      "useConfirmation must be used within a ConfirmationProvider",
    );
  }
  return context;
}
