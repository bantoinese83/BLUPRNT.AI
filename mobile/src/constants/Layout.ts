/**
 * Shared layout constants to avoid circular dependencies between components and app layouts.
 */

/** Nominal dock height (pill + labels; FAB sits inside pill). */
const TAB_BAR_HEIGHT = 90;
const TAB_BAR_MARGIN = 0;

/**
 * Extra space below scroll content when the floating tab bar is shown.
 * Covers safe-area variance, shadow bleed, and the center FAB so the last card is not obscured.
 */
const TAB_BAR_SCROLL_EXTRA = 28;

/** Scroll views & fixed docks: clearance above the floating tab bar. */
export const TAB_BAR_SCROLL_PADDING =
  TAB_BAR_HEIGHT + TAB_BAR_MARGIN + TAB_BAR_SCROLL_EXTRA;
