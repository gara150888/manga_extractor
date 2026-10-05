import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { loadTextToSpeech, loadVoiceStyle, writeWavFile } from "./helper.js";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const resultDir = path.join(process.cwd(), "results");
export default async function tts(args) {
    fs.mkdirSync(resultDir, { recursive: true });
    const files = fs.readdirSync(resultDir)
        .filter(f => /^\d+\.wav$/.test(f))
        .map(f => Number(path.basename(f, ".wav")));
    const nextNumber = files.length ? Math.max(...files) + 1 : 1;
    const output = path.join(resultDir, `${nextNumber}.wav`);
    const tts = await loadTextToSpeech(path.resolve(__dirname, "../assets/onnx"), false);
    const style = loadVoiceStyle([path.resolve(__dirname, "../assets/voice_styles/M1.json")], true);
    const { wav, duration } = await tts.call(args.text, args.language || "hi", style, 8, 1.05);
    const length = Math.floor(tts.sampleRate * duration[0]);
    writeWavFile(output, wav.slice(0, length), tts.sampleRate);
    console.log(`Saved: ${output}`);
}
// main().catch(console.error);
