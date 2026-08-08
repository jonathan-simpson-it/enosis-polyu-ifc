import { createRequire } from "module";

const require = createRequire(import.meta.url);

const g = globalThis as unknown as Record<string, unknown>;

if (typeof g.DOMMatrix === "undefined") {
  const canvas = require("@napi-rs/canvas") as {
    DOMMatrix: unknown;
    ImageData: unknown;
    Path2D: unknown;
  };
  g.DOMMatrix = canvas.DOMMatrix;
  g.ImageData = canvas.ImageData;
  g.Path2D = canvas.Path2D;
}

// Turbopack's dev process shim lacks getBuiltinModule, which pdf.js and
// other Node-aware libraries rely on. Emulate it over the real module loader.
const proc = g.process as
  | { getBuiltinModule?: (name: string) => unknown }
  | undefined;
if (proc && typeof proc.getBuiltinModule !== "function") {
  const nodeModule = require("module") as {
    builtinModules?: string[];
    createRequire?: (filename: string | URL) => (name: string) => unknown;
  };
  const builtinRequire =
    typeof nodeModule.createRequire === "function"
      ? nodeModule.createRequire(import.meta.url)
      : require;
  const builtins = nodeModule.builtinModules || [];
  proc.getBuiltinModule = (name: string) => {
    if (builtins.includes(name.split("/")[0])) {
      return builtinRequire(name);
    }
    return undefined;
  };
}

export {};
