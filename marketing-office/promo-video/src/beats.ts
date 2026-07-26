// Frame-accurate timeline, locked to the generated VO (Sterling, 27.09s @ 30fps).
// Cut points sit inside the VO's sentence-end pauses (from silencedetect), so
// every scene change lands between spoken lines.

export const FPS = 30;
export const TOTAL = 813; // 27.09s

export type Beat = { start: number; end: number };
const b = (start: number, end: number): Beat => ({ start, end });

export const scene = {
  hook: b(0, 198), //   0.00–6.60  "Every day, thousands ... to eat, to shop, to trust."
  problem: b(198, 303), // 6.60–10.10 "But if they can't find you — they find someone else."
  turn: b(303, 368), //  10.10–12.27 "Manzil changes that."
  product: b(368, 588), //12.27–19.60 "Claim your business ... a profile you control."
  whyus: b(588, 733), // 19.60–24.43 "Not another gray directory ... built in Tashkent."
  outro: b(733, 813), // 24.43–27.09 "Manzil. Become the destination."
} as const;

export const dur = (s: Beat) => s.end - s.start;

// VO sub-beats (absolute frames) for caption + count-up cueing.
export const cue = {
  vEat: 89, // "search for a place..."
  vTrust: 165, // "to trust."
  vFindYou: 209, // "if they can't find you"
  vSomeoneElse: 257, // "they find someone else"
  vClaim: 380, // "Claim your business"
  vDestination: 430, // "become the destination"
  vReviews: 470, // "Real reviews."
  vCustomers: 505, // "Real customers."
  vControl: 545, // "a profile you control"
  vNotGray: 600, // "Not another gray directory"
  vHome: 655, // "A home for your business"
  vTashkent: 700, // "built in Tashkent"
  vManzil: 740, // "Manzil."
  vBecome: 762, // "Become the destination."
} as const;
