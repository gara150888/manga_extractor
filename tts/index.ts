import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import {
  loadTextToSpeech,
  loadVoiceStyle,
  writeWavFile
} from "./helper.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const resultDir = path.join(process.cwd(), "results");

export interface Arguments {
  text: string;
  language?: string;
}

export default async function tts(args: Arguments) {
  fs.mkdirSync(resultDir, { recursive: true });

  const files = fs.readdirSync(resultDir)
    .filter(f => /^\d+\.wav$/.test(f))
    .map(f => Number(path.basename(f, ".wav")));

  const nextNumber = files.length ? Math.max(...files) + 1 : 1;
  const output = path.join(resultDir, `${nextNumber}.wav`);

  const tts = await loadTextToSpeech(path.resolve(__dirname, "../assets/onnx"), false);
  const style = loadVoiceStyle([path.resolve(__dirname, "../assets/voice_styles/M4.json")], true);

  const { wav, duration } = await tts.call(args.text, args.language || "hi", style, 10, 0.95);
  const length = Math.floor(tts.sampleRate * duration[0]);

  writeWavFile(output, wav.slice(0, length), tts.sampleRate);

  console.log(`Saved: ${output}`);
}

// main().catch(console.error);