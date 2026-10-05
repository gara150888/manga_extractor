import fs from "node:fs";
import path from "node:path";
import { Timeline, saveTimeline } from "./types.js";

export function generateTimeline(data: Timeline): Timeline {
  console.log("[generate-timeline] Computing cumulative timings...");
  const beats = data.narration.beats;
  let currentTime = 0;

  const timeline: Array<{ beat_id: string; start: number; end: number; duration: number }> = [];

  for (const beat of beats) {
    const duration = beat.timing.actual_duration ?? beat.timing.estimated_duration;
    const start = currentTime;
    const end = currentTime + duration;

    beat.timing.start = start;
    beat.timing.end = end;
    beat.timing.status = "scheduled";

    timeline.push({ beat_id: beat.beat_id, start, end, duration });
    currentTime = end;
  }

  (data as unknown as { timeline: Array<Record<string, unknown>> }).timeline = timeline as Array<Record<string, unknown>>;
  console.log(`[generate-timeline] Total duration: ${currentTime.toFixed(2)}s (${timeline.length} beats)`);
  console.log("[generate-timeline] Done.");
  return data;
}
