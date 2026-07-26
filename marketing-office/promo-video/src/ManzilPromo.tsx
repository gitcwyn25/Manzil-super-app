import React from "react";
import { AbsoluteFill, Sequence, staticFile } from "remotion";
import { Audio } from "@remotion/media";
import { scene, dur } from "./beats";
import { Scene } from "./scenes/Scene";
import { Hook } from "./scenes/Hook";
import { Problem } from "./scenes/Problem";
import { Turn } from "./scenes/Turn";
import { Product } from "./scenes/Product";
import { WhyUs } from "./scenes/WhyUs";
import { Outro } from "./scenes/Outro";

const Sfx: React.FC<{ src: string; at: number; volume?: number }> = ({
  src,
  at,
  volume = 0.4,
}) => (
  <Sequence from={at} layout="none">
    <Audio src={staticFile(src)} volume={volume} />
  </Sequence>
);

export const ManzilPromo: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: "#0c0d0d" }}>
      {/* Scenes */}
      <Sequence from={scene.hook.start} durationInFrames={dur(scene.hook)}>
        <Scene dur={dur(scene.hook)} fadeIn={1}>
          <Hook dur={dur(scene.hook)} />
        </Scene>
      </Sequence>
      <Sequence from={scene.problem.start} durationInFrames={dur(scene.problem)}>
        <Scene dur={dur(scene.problem)}>
          <Problem dur={dur(scene.problem)} />
        </Scene>
      </Sequence>
      <Sequence from={scene.turn.start} durationInFrames={dur(scene.turn)}>
        <Scene dur={dur(scene.turn)}>
          <Turn dur={dur(scene.turn)} />
        </Scene>
      </Sequence>
      <Sequence from={scene.product.start} durationInFrames={dur(scene.product)}>
        <Scene dur={dur(scene.product)}>
          <Product dur={dur(scene.product)} />
        </Scene>
      </Sequence>
      <Sequence from={scene.whyus.start} durationInFrames={dur(scene.whyus)}>
        <Scene dur={dur(scene.whyus)}>
          <WhyUs dur={dur(scene.whyus)} />
        </Scene>
      </Sequence>
      <Sequence from={scene.outro.start} durationInFrames={dur(scene.outro)}>
        <Scene dur={dur(scene.outro)} fadeOut={2}>
          <Outro dur={dur(scene.outro)} />
        </Scene>
      </Sequence>

      {/* Voiceover (backbone) */}
      <Audio src={staticFile("vo/vo.mp3")} />

      {/* SFX — tasteful, under the VO */}
      <Sfx src="sfx/whoosh.wav" at={scene.problem.start - 3} volume={0.4} />
      <Sfx src="sfx/switch.wav" at={scene.turn.start - 3} volume={0.3} />
      <Sfx src="sfx/whoosh.wav" at={scene.product.start - 4} volume={0.5} />
      <Sfx src="sfx/ding.wav" at={scene.product.start + 100} volume={0.28} />
      <Sfx src="sfx/shutter-modern.wav" at={scene.product.start + 150} volume={0.32} />
      <Sfx src="sfx/whoosh.wav" at={scene.whyus.start - 3} volume={0.42} />
      <Sfx src="sfx/whoosh.wav" at={scene.outro.start - 4} volume={0.45} />
      <Sfx src="sfx/ding.wav" at={scene.outro.start + 12} volume={0.34} />
    </AbsoluteFill>
  );
};
