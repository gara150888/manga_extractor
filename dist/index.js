import tts from "./tts";
const args = {
    text: "Hello, world!",
    language: "en",
};
async function main() {
    await tts(args);
}
main().catch(console.error);
