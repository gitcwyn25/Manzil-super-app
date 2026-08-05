import "./index.css";
import { Composition } from "remotion";
import { ManzilPromo } from "./ManzilPromo";
import { VIDEO } from "./theme";
import { TOTAL, FPS } from "./beats";
import { ManzilReel, REEL_TOTAL } from "./reel/ManzilReel";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="ManzilPromo"
        component={ManzilPromo}
        durationInFrames={TOTAL}
        fps={FPS}
        width={VIDEO.width}
        height={VIDEO.height}
      />
      {/* 45s Instagram Reel built from real Playwright captures of the live
          site. Kept as a separate composition rather than replacing the promo:
          they target different brand systems and different lengths. */}
      <Composition
        id="ManzilReel"
        component={ManzilReel}
        durationInFrames={REEL_TOTAL}
        fps={30}
        width={1080}
        height={1920}
      />
    </>
  );
};
