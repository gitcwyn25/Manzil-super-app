/**
 * Clerk appearance synced to the Vibrant Marketplace tokens (task C): primary
 * #0058bc, 8px control radius, the Hanken Grotesk / Golos Text stack, VM ink
 * and surface neutrals. Passed to the embedded <SignIn>/<SignUp> widgets so
 * they read as part of the SplitAuthShell instead of a foreign island.
 *
 * Values mirror apps/web/app/styles/_tokens.scss — update both together.
 */
export const vmClerkAppearance = {
  variables: {
    colorPrimary: "#0058bc",
    colorText: "#0b1c30",
    colorTextSecondary: "#414755",
    colorBackground: "#ffffff",
    colorInputBackground: "#ffffff",
    colorInputText: "#0b1c30",
    colorDanger: "#ba1a1a",
    borderRadius: "0.5rem",
    fontFamily: "var(--font-sans), var(--font-body), system-ui, sans-serif"
  }
};
