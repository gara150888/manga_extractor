import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadTextToSpeech, loadVoiceStyle, writeWavFile } from "../tts/helper.js";
import { Timeline, getTtsOutputPath, TTS_DIR } from "./types.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export async function generateTts(data: Timeline) {
  console.log("[generate-tts] Loading TTS models...");
  fs.mkdirSync(TTS_DIR, { recursive: true });

  const tts = await loadTextToSpeech("C:\\Users\\vg312\\OneDrive\\Documents\\ultra\\assets\\onnx", false);
  const style = loadVoiceStyle(["C:\\Users\\vg312\\OneDrive\\Documents\\ultra\\assets\\voice_styles\\M1.json"], true);
  const beats = data.narration.beats;
  const sampleRate = tts.sampleRate;

  console.log(`[generate-tts] Generating ${beats.length} audio clips...`);

  for (let i = 0; i < beats.length; i++) {
    const beat = beats[i];
    const outPath = getTtsOutputPath(beat.beat_id);
    if (fs.existsSync(outPath)) {
      console.log(`[generate-tts] [${i + 1}/${beats.length}] ${beat.beat_id} already exists, skipping.`);
      beat.audio_path = outPath;
      continue;
    }

    console.log(`[generate-tts] [${i + 1}/${beats.length}] ${beat.beat_id}: "${beat.text.slice(0, 40)}..."`);
    const { wav, duration } = await tts.call(beat.text, "hi", style, 8, 1.05);
    const length = Math.floor(sampleRate * duration[0]);
    writeWavFile(outPath, wav.slice(0, length), sampleRate);
    beat.audio_path = outPath;
    console.log(`[generate-tts]   -> saved (${duration[0].toFixed(2)}s)`);
  }

  console.log("[generate-tts] Done.");
}
