import { parseServerSentEvents } from "parse-sse";
import { models } from "../models";
const KILO_API_URL = "https://api.kilo.ai/api/openrouter/chat/completions";
const KILO_API_KEY = process.env.KILO_API_KEY;
const req = async (messages, modelId) => await fetch(KILO_API_URL, {
    method: "POST",
    headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${KILO_API_KEY}`,
    },
    body: JSON.stringify({ model: modelId, messages, stream: true }),
});
const startThinking = () => {
    const frames = ["Thinking |", "Thinking /", "Thinking -", "Thinking \\"];
    let i = 0;
    const timer = setInterval(() => {
        process.stdout.write(`\r${frames[i++ % frames.length]}`);
    }, 300);
    return () => {
        clearInterval(timer);
        process.stdout.write("\r" + " ".repeat(20) + "\r");
    };
};
export default async function chat(messages) {
    for (const model of models) {
        try {
            console.log(`\n🧠 ${model.id} is now active...\n`);
            const stopThinking = startThinking();
            const response = await req(messages, model.id);
            if (!response.ok)
                throw Error(await response.text());
            let output = "";
            for await (const e of parseServerSentEvents(response))
                if (e.data !== "[DONE]")
                    try {
                        const t = JSON.parse(e.data).choices?.[0]?.delta?.content;
                        if (t)
                            process.stdout.write(t), output += t;
                    }
                    catch { }
            if (output) {
                stopThinking();
                return output;
            }
        }
        catch (err) {
            console.log(`\n❌ ${model.id} failed → trying next...`);
        }
    }
    throw Error("All AI models failed");
}
