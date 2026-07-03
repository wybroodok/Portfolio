// Colour tokens for labels/tags. Keys are stored in Label.color; values are the
// Tailwind classes used to render a chip in light/dark mode.
export const LABEL_COLORS: Record<string, string> = {
  neutral: "bg-neutral-200 text-neutral-700 dark:bg-neutral-700 dark:text-neutral-200",
  red: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300",
  amber: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  green: "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300",
  blue: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
  violet: "bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300",
};

export const LABEL_COLOR_KEYS = Object.keys(LABEL_COLORS);

export function labelClass(color: string): string {
  return LABEL_COLORS[color] ?? LABEL_COLORS.neutral;
}
