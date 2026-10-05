import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Timeline, ensureDirs } from "./types.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function logStep(name: string) {
  console.log(`\n${"=".repeat(60)}`);
  console.log(`  STEP: ${name}`);
  console.log(`${"=".repeat(60)}`);
}

async function main() {
  ensureDirs();
  let data: Timeline;

  // Step 1: Validate JSON
  logStep("1. Validate JSON");
  const { validateJson } = await import("./validate-json.js");
  data = validateJson();

  // Step 2: Generate TTS
  logStep("2. Generate TTS");
  const { generateTts } = await import("./generate-tts.js");
  await generateTts(data);

  // Step 3: Extract durations
  logStep("3. Extract durations");
  const { extractDurations } = await import("./extract-durations.js");
  data = extractDurations(data);

  // Step 4: Generate timeline
  logStep("4. Generate timeline");
  const { generateTimeline } = await import("./generate-timeline.js");
  data = generateTimeline(data);

  // Step 5: Compute crops
  logStep("5. Compute crops");
  const { computeCrops } = await import("./compute-crops.js");
  data = computeCrops(data);

  // Step 6: Render beats
  logStep("6. Render beats");
  const { renderBeats } = await import("./render-beats.js");
  data = renderBeats(data);

  // Step 7: Merge
  logStep("7. Merge -> final.mp4");
  const { mergeClips } = await import("./merge.js");
  const finalPath = mergeClips(data);

  console.log(`\n${"=".repeat(60)}`);
  console.log("  ALL DONE");
  console.log(`  final.mp4 -> ${finalPath}`);
  console.log(`${"=".repeat(60)}`);
}

main().catch((err) => {
  console.error("\nPipeline failed:", err);
  process.exit(1);
});
