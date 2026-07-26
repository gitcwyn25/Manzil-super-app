// Brand fonts, bundled + delayRender-safe via @remotion/google-fonts.
// Libre Caslon Display = heritage display serif (wordmark, brand lines)
// Geist = engineered UI sans (product numerals/labels)
// Inter = body / captions
import { loadFont as loadCaslon } from "@remotion/google-fonts/LibreCaslonDisplay";
import { loadFont as loadGeist } from "@remotion/google-fonts/Geist";
import { loadFont as loadInter } from "@remotion/google-fonts/Inter";

export const caslon = loadCaslon("normal", { weights: ["400"] }).fontFamily;
export const geist = loadGeist("normal", {
  weights: ["400", "500", "600", "700"],
}).fontFamily;
export const inter = loadInter("normal", {
  weights: ["400", "500", "600", "700"],
}).fontFamily;
