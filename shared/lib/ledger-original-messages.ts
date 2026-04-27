/** User-facing strings for original-upload / signed URL flows (web + mobile). */
export const ledgerOriginalMessages = {
  network:
    "We couldn’t open the original file. Check your connection and try again.",
  noLinkedFile: "There’s no saved file for this record.",
  generic: "We couldn’t open the original file.",
  popupBlocked:
    "We opened the link, but your browser blocked the new tab. Allow pop-ups for this site or copy the link from your browser settings.",
  deviceCannotOpenLink: "This device can’t open that link.",
  openLinkFailed: "Something went wrong opening the link. Try again.",
} as const;

export function messageForLedgerOriginalApiError(errorBody: string): string {
  return errorBody.includes("No original")
    ? ledgerOriginalMessages.noLinkedFile
    : ledgerOriginalMessages.generic;
}
