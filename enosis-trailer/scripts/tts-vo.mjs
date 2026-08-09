import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, "..");

function loadEnv() {
  const envPath = join(projectRoot, ".env");
  try {
    const raw = readFileSync(envPath, "utf8");
    for (const line of raw.split("\n")) {
      const m = line.match(/^([A-Z_]+)=(.*)$/);
      if (m) process.env[m[1]] = m[2].trim();
    }
  } catch {
    // .env missing — rely on process env
  }
}
loadEnv();

const API_KEY = process.env.ELEVENLABS_API_KEY;
const VOICE_ID = "cjVigY5qzO86Huf0OWal"; // Eric - Smooth, Trustworthy
const MODEL = process.env.ELEVENLABS_MODEL || "eleven_multilingual_v2";

if (!API_KEY) {
  console.error("ELEVENLABS_API_KEY missing — set it in enosis-trailer/.env");
  process.exit(1);
}

const CUES = [
  {
    file: "cue-1",
    text: "Around 80% of enterprise data is trapped in unstructured documents.",
  },
  {
    file: "cue-2",
    text: "Thirty years of paper. Thousands of documents.",
  },
  {
    file: "cue-3",
    text: "Introducing Enosis. Upload the documents you already have.",
  },
  {
    file: "cue-4",
    text: "Enosis extracts, validates, and structures. Automatically.",
  },
  {
    file: "cue-5",
    text: "Only review the exceptions.",
  },
  {
    file: "cue-6",
    text: "Structured data. Ready for any enterprise system.",
  },
];

const outDir = join(projectRoot, "public", "vo");
mkdirSync(outDir, { recursive: true });

async function synthesize(cue) {
  const res = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`,
    {
      method: "POST",
      headers: {
        "xi-api-key": API_KEY,
        "Content-Type": "application/json",
        Accept: "audio/mpeg",
      },
      body: JSON.stringify({
        text: cue.text,
        model_id: MODEL,
        voice_settings: {
          stability: 0.55,
          similarity_boost: 0.75,
          style: 0.2,
          use_speaker_boost: true,
        },
      }),
    },
  );
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`TTS ${res.status} for ${cue.file}: ${body.slice(0, 200)}`);
  }
  const buf = Buffer.from(await res.arrayBuffer());
  const out = join(outDir, `${cue.file}.mp3`);
  writeFileSync(out, buf);
  return { cue: cue.file, bytes: buf.length };
}

let failed = false;
for (const cue of CUES) {
  try {
    const { cue: name, bytes } = await synthesize(cue);
    console.log(`OK ${name}.mp3 (${(bytes / 1024).toFixed(0)} KB)`);
  } catch (err) {
    failed = true;
    console.error(err.message);
  }
}
process.exit(failed ? 1 : 0);
