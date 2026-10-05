import tts from "./tts";
import * as fs from "fs";

const text = fs.readFileSync("./script_one.txt", "utf-8");

const args = {
  text,
  language: "hi",
}

async function main() {
  await tts(args);
}

main().catch(console.error);