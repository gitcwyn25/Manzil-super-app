type ClassValue = string | false | null | undefined;

/**
 * Small shadcn-compatible class-name helper for the web app.
 *
 * The web workspace currently uses Sass rather than Tailwind's class compiler,
 * so a dependency-free join is sufficient for the component primitives here.
 */
export function cn(...inputs: ClassValue[]): string {
  return inputs.filter(Boolean).join(" ");
}
