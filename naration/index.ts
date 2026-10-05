import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { default as chat } from "../kilo";

const PAGE_DIR = path.join(process.cwd(), "input");
const OUTPUT_DIR = path.join(process.cwd(), "output");
const MASTER_PROMPT_PATH = path.join(process.cwd(), "ALIGNMENT_MASTER_PROMPT.md");

interface AlignmentPage {
  path: string;
  basename: string;
  width: number;
  height: number;
  jpeg: Buffer;
}

const SYSTEM_PROMPT = () => {
  return fs.readFileSync(MASTER_PROMPT_PATH, "utf8");
};

const NARRATION_USER_PROMPT = (pageCount: number) => `
मैंने आपको ${pageCount} मंगा पेज भेज रहा हूं।

कृपया ALIGNMENT_MASTER_PROMPT.md के अनुसार EXACT क्रम में पढ़ें और एक ही complete JSON रिटर्न करें।

नाररेशन आपको मंगा से ही जनरेट करना है। कोई बाहरी नाररेशन फाइल नहीं है।

केवल वैलिड JSON रिटर्न करें। कोई मार्कडाउन नहीं, कोई बाहरी टेक्स्ट नहीं।
`;

async function loadPages(): Promise<AlignmentPage[]> {

  if (!fs.existsSync(PAGE_DIR)) throw new Error(`Input directory not found: ${PAGE_DIR}`);

  const files = fs
    .readdirSync(PAGE_DIR)
    .filter((f) => /\.(jpg|jpeg|png|webp)$/i.test(f))
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

  if (files.length === 0) throw new Error(`No images found in ${PAGE_DIR}`);

  const results: AlignmentPage[] = [];

  for (const file of files) {
    const filePath = path.join(PAGE_DIR, file);
    const meta = await sharp(filePath).metadata();
    const jpeg = await sharp(filePath)
      .resize({ width: 2000, height: 2000, fit: "inside", withoutEnlargement: true })
      .jpeg({ quality: 90, mozjpeg: true })
      .toBuffer();

    results.push({
      path: filePath,
      basename: path.basename(file, path.extname(file)),
      width: meta.width ?? 0,
      height: meta.height ?? 0,
      jpeg,
    });
  }

  return results;
}

async function main() {

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  console.log("Loading pages...");

  const pages = await loadPages();
  console.log(`Found ${pages.length} pages.`);

  console.log("Loading master prompt...");
  const systemPrompt = SYSTEM_PROMPT();

  const messages = [
    {
      role: "system" as const,
      content: systemPrompt,
    },
    {
      role: "user" as const,
      content: [
        {
          type: "text",
          text: NARRATION_USER_PROMPT(pages.length),
        },
        ...pages.map((page) => ({
          type: "image_url",
          image_url: {
            url: `data:image/jpeg;base64,${page.jpeg.toString("base64")}`,
          },
        })),
      ],
    },
  ];

  console.log("Requesting alignment from Kilo...");

  const alignment = await chat(messages);

  if (!alignment || !alignment.trim()) throw new Error("Model returned empty alignment.");

  const outputPath = path.join(OUTPUT_DIR, "timeline.json");

  fs.writeFileSync(outputPath, alignment.trim(), "utf8");
  console.log(`Saved timeline JSON to: ${outputPath}`);

}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
