export type AppToastType = "neutral" | "success" | "warning" | "error";

export type ShowAppToastOptions = {
  type?: AppToastType;
};

type ToastHandler = (message: string, options?: ShowAppToastOptions) => void;

let toastHandler: ToastHandler | null = null;

export function registerAppToastHandler(handler: ToastHandler | null) {
  toastHandler = handler;
}

export function showAppToast(message: string, options?: ShowAppToastOptions) {
  toastHandler?.(message, options);
}
