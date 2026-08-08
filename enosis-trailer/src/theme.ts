import { loadFont as loadArchivoBlack } from "@remotion/google-fonts/ArchivoBlack";
import { loadFont as loadInter } from "@remotion/google-fonts/Inter";
import { loadFont as loadIBMPlexMono } from "@remotion/google-fonts/IBMPlexMono";

const archivo = loadArchivoBlack();
const inter = loadInter("normal", { weights: ["400", "500", "600", "700"] });
const mono = loadIBMPlexMono("normal", { weights: ["400", "500", "600"] });

export const FONTS = {
  display: archivo.fontFamily,
  body: inter.fontFamily,
  mono: mono.fontFamily,
};

export const COLORS = {
  black: "#050505",
  white: "#ffffff",
  ink: "#161714",
  cream: "#f4f4ef",
  surface: "#ffffff",
  line: "#d6d8d1",
  muted: "#9a9d94",
  sage: "#80988f",
  sageBright: "#a8c3ba",
  sageSoft: "#e3e9e6",
  emerald: "#4ade80",
  amber: "#fbbf24",
  red: "#f87171",
  json: "#8be0b4",
};

export const FPS = 30;
