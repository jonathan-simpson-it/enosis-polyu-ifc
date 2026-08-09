import React from "react";
import {
  AbsoluteFill,
  Audio,
  Composition,
  Sequence,
  interpolate,
  staticFile,
} from "remotion";
import { COLORS, FPS } from "./theme";
import { NetflixCaption } from "./captions";
import { Scene1ColdOpen } from "./scenes/Scene1ColdOpen";
import { Scene2Stat } from "./scenes/Scene2Stat";
import { Scene3Paper } from "./scenes/Scene3Paper";
import { Scene4Unlock } from "./scenes/Scene4Unlock";
import { Scene5DragDrop } from "./scenes/Scene5DragDrop";
import { Scene6Montage } from "./scenes/Scene6Montage";
import { Scene7Engine } from "./scenes/Scene7Engine";
import { Scene8Json } from "./scenes/Scene8Json";
import { Scene9Logo } from "./scenes/Scene9Logo";
import { Scene10EndCard } from "./scenes/Scene10EndCard";

const DURATION = 60 * FPS;

const DIPS: { a: number; b: number; level: number }[] = [
  { a: 120, b: 240, level: 0.78 },
  { a: 420, b: 540, level: 0.78 },
  { a: 1560, b: 1710, level: 0.85 },
];

const envelope = (f: number): number => {
  const base = interpolate(f, [0, 26, 1758, DURATION - 1], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  let v = base;
  for (const { a, b, level } of DIPS) {
    if (f >= a && f < b) {
      const edge = 14;
      const ramp = Math.min(1, (f - a) / edge, (b - f) / edge);
      v *= 1 - (1 - level) * ramp;
    }
  }
  return v;
};

export const EnosisTrailer: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.black }}>
      <Sequence durationInFrames={120}>
        <Scene1ColdOpen />
      </Sequence>
      <Sequence from={120} durationInFrames={120}>
        <Scene2Stat />
      </Sequence>
      <Sequence from={240} durationInFrames={180}>
        <Scene3Paper />
      </Sequence>
      <Sequence from={420} durationInFrames={120}>
        <Scene4Unlock />
      </Sequence>
      <Sequence from={540} durationInFrames={300}>
        <Scene5DragDrop />
      </Sequence>
      <Sequence from={840} durationInFrames={180}>
        <Scene6Montage />
      </Sequence>
      <Sequence from={1020} durationInFrames={360}>
        <Scene7Engine />
      </Sequence>
      <Sequence from={1380} durationInFrames={180}>
        <Scene8Json />
      </Sequence>
      <Sequence from={1560} durationInFrames={150}>
        <Scene9Logo />
      </Sequence>
      <Sequence from={1710} durationInFrames={90}>
        <Scene10EndCard />
      </Sequence>

      <NetflixCaption />
      <Audio src={staticFile("music/track.mp3")} volume={envelope} />
    </AbsoluteFill>
  );
};

export const EnosisTrailerComposition: React.FC = () => {
  return (
    <Composition
      id="EnosisTrailer"
      component={EnosisTrailer}
      durationInFrames={DURATION}
      fps={FPS}
      width={1920}
      height={1080}
    />
  );
};
