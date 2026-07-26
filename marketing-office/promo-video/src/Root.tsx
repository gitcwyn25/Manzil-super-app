import "./index.css";
import { Composition } from "remotion";
import { ManzilPromo } from "./ManzilPromo";
import { VIDEO } from "./theme";
import { TOTAL, FPS } from "./beats";

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="ManzilPromo"
      component={ManzilPromo}
      durationInFrames={TOTAL}
      fps={FPS}
      width={VIDEO.width}
      height={VIDEO.height}
    />
  );
};
