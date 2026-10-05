const rawRankings = [
  {
    tier: "S",
    rank: 1,
    id: "stepfun/step-3.7-flash:free",
    model: "StepFun: Step 3.7 Flash (free)",
    status: "Recommended",
    strengths: [
      "198B MoE architecture with dedicated 1.8B perception encoder",
      "High throughput and strong visual grounding",
      "Rich, fluent descriptive prose suited for storytelling",
    ],
    input_modalities: ["text", "image"],
    output_modalities: ["text"],
  },
  {
    tier: "A",
    rank: 2,
    id: "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free",
    model: "NVIDIA: Nemotron 3 Nano Omni (free)",
    status: "Recommended",
    strengths: [
      "Native omni-multimodal architecture",
      "Direct visual perception and spatial grounding",
      "Natural scene narration without visual pipeline degradation",
    ],
    input_modalities: ["text", "audio", "image", "video"],
    output_modalities: ["text"],
  },
  {
    tier: "B",
    rank: 3,
    id: "qwen/qwen3.8-27b:free",
    model: "Qwen: Qwen3.8 27B (free)",
    status: "Conditional",
    strengths: [
      "High parameter capacity for descriptive vocabulary and metaphors",
      "Only functional if the gateway routes to a Vision-Language (VL) checkpoint",
    ],
    input_modalities: ["text", "image", "video"],
    output_modalities: ["text"],
  },
  {
    tier: "B",
    rank: 4,
    id: "openrouter/free",
    model: "OpenRouter Free Models Router / Auto Free",
    status: "Conditional",
    strengths: [
      "Automated fallback routing",
      "Unpredictable output quality depending on whether a vision-capable model is selected",
    ],
    input_modalities: ["text", "image"],
    output_modalities: ["text"],
  },
  {
    tier: "C",
    rank: 5,
    id: "liquid/lfm-2.5-2.6b:free",
    model: "LiquidAI: LFM2.5-2.6B (free)",
    status: "Marginal",
    strengths: [
      "Fast response latency and low resource footprint",
      "Restricted to basic object tags and single-sentence captions rather than detailed narration",
    ],
    input_modalities: ["text"],
    output_modalities: ["text"],
  },
];

export const models = rawRankings.filter(m => m.rank <= 4).sort((a, b) => a.rank - b.rank);
export default rawRankings;
