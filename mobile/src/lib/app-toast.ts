type ToastHandler = (message: string) => void;

let toastHandler: ToastHandler | null = null;

export function registerAppToastHandler(handler: ToastHandler | null) {
  toastHandler = handler;
}

export function showAppToast(message: string) {
  toastHandler?.(message);
}
